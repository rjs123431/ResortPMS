/*
    CRITICAL INDEXES REQUIRED FOR PERFORMANCE:
    
    -- Indexes on transaction header tables (filter by warehouse first)
    CREATE NONCLUSTERED INDEX IX_StockIn_WarehouseId ON StockIn(WarehouseId) INCLUDE (Id);
    CREATE NONCLUSTERED INDEX IX_StockOut_WarehouseId ON StockOut(WarehouseId) INCLUDE (Id);
    CREATE NONCLUSTERED INDEX IX_StockAdjustment_WarehouseId ON StockAdjustment(WarehouseId) INCLUDE (Id);
    
    -- Indexes on transaction item tables (for joining and filtering by ItemId)
    CREATE NONCLUSTERED INDEX IX_StockIn_Items_StockInId_ItemId ON StockIn_Items(StockInId, ItemId) INCLUDE (Quantity);
    CREATE NONCLUSTERED INDEX IX_StockOut_Items_StockOutId_ItemId ON StockOut_Items(StockOutId, ItemId) INCLUDE (Quantity);
    CREATE NONCLUSTERED INDEX IX_StockAdjustment_Items_StockAdjustmentId_ItemId ON StockAdjustment_Items(StockAdjustmentId, ItemId) INCLUDE (Quantity);
    
    -- Index on Items_Stocks for UPDATE/INSERT operations
    CREATE UNIQUE NONCLUSTERED INDEX IX_Items_Stocks_ItemId_WarehouseId ON Items_Stocks(ItemId, WarehouseId) INCLUDE (StockOnHand);
    
    DIAGNOSTIC QUERIES (run on the database that times out):
    
    -- Check if indexes exist
    SELECT 
        OBJECT_NAME(object_id) AS TableName,
        name AS IndexName,
        type_desc AS IndexType
    FROM sys.indexes
    WHERE name IN (
        'IX_StockIn_WarehouseId', 'IX_StockOut_WarehouseId', 'IX_StockAdjustment_WarehouseId',
        'IX_StockIn_Items_StockInId_ItemId', 'IX_StockOut_Items_StockOutId_ItemId', 
        'IX_StockAdjustment_Items_StockAdjustmentId_ItemId', 'IX_Items_Stocks_ItemId_WarehouseId'
    )
    ORDER BY TableName, IndexName;
    
    -- Check table row counts (to identify data volume differences)
    SELECT 
        'StockIn' AS TableName, COUNT(*) AS RowCount FROM StockIn
    UNION ALL
    SELECT 'StockOut', COUNT(*) FROM StockOut
    UNION ALL
    SELECT 'StockAdjustment', COUNT(*) FROM StockAdjustment
    UNION ALL
    SELECT 'StockIn_Items', COUNT(*) FROM StockIn_Items
    UNION ALL
    SELECT 'StockOut_Items', COUNT(*) FROM StockOut_Items
    UNION ALL
    SELECT 'StockAdjustment_Items', COUNT(*) FROM StockAdjustment_Items;
    
    -- Update statistics if query plans are stale
    UPDATE STATISTICS StockIn WITH FULLSCAN;
    UPDATE STATISTICS StockOut WITH FULLSCAN;
    UPDATE STATISTICS StockAdjustment WITH FULLSCAN;
    UPDATE STATISTICS StockIn_Items WITH FULLSCAN;
    UPDATE STATISTICS StockOut_Items WITH FULLSCAN;
    UPDATE STATISTICS StockAdjustment_Items WITH FULLSCAN;
    UPDATE STATISTICS Items_Stocks WITH FULLSCAN;
*/

IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'UpdateStockOnHand')
    DROP PROCEDURE [UpdateStockOnHand]
GO

IF EXISTS (SELECT * FROM sys.types WHERE name = 'ItemIdListTableType' AND is_table_type = 1)
    DROP TYPE [ItemIdListTableType]
GO

CREATE TYPE dbo.ItemIdListTableType AS TABLE
(
    ItemId INT
)

GO

CREATE PROCEDURE dbo.UpdateStockOnHand
    @ItemIds dbo.ItemIdListTableType READONLY,
    @WarehouseId INT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    SET LOCK_TIMEOUT 30000; -- 30 second timeout to prevent indefinite blocking
    SET ARITHABORT ON; -- Better query optimization

    -- Early exit if no items provided
    IF NOT EXISTS (SELECT 1 FROM @ItemIds)
    BEGIN
        RETURN;
    END

    -- Create temporary table for item IDs with clustered index for better performance
    CREATE TABLE #ItemIds (
        ItemId INT PRIMARY KEY CLUSTERED
    );
    INSERT INTO #ItemIds (ItemId) 
    SELECT DISTINCT ItemId 
    FROM @ItemIds;
    
    -- Early exit if no valid items after deduplication
    IF NOT EXISTS (SELECT 1 FROM #ItemIds)
    BEGIN
        DROP TABLE #ItemIds;
        RETURN;
    END

    -- Create temp tables for aggregated data with proper indexes
    CREATE TABLE #StockInData (
        ItemId INT PRIMARY KEY,
        StockInQty DECIMAL(18,2) NOT NULL DEFAULT 0
    );

    CREATE TABLE #StockOutData (
        ItemId INT PRIMARY KEY,
        StockOutQty DECIMAL(18,2) NOT NULL DEFAULT 0
    );

    CREATE TABLE #AdjustmentData (
        ItemId INT PRIMARY KEY,
        AdjustmentQty DECIMAL(18,2) NOT NULL DEFAULT 0
    );

    -- Optimize: First get transaction IDs for this warehouse, then join to items
    -- This reduces the join size significantly for large databases (central office)
    -- Filter warehouse first to minimize rows before joining to item tables
    
    -- Calculate StockIns - filter warehouse first, then items
    -- Use OPTION (RECOMPILE) to get fresh execution plan based on actual parameters
    INSERT INTO #StockInData (ItemId, StockInQty)
    SELECT si.ItemId, SUM(si.Quantity) AS StockInQty
    FROM (
        SELECT Id 
        FROM StockIn WITH (NOLOCK)
        WHERE WarehouseId = @WarehouseId
    ) s
    INNER JOIN StockIn_Items si WITH (NOLOCK) ON si.StockInId = s.Id
    INNER JOIN #ItemIds i ON i.ItemId = si.ItemId
    GROUP BY si.ItemId
    OPTION (RECOMPILE);

    -- Calculate StockOuts - same optimization
    INSERT INTO #StockOutData (ItemId, StockOutQty)
    SELECT so.ItemId, SUM(so.Quantity) AS StockOutQty
    FROM (
        SELECT Id 
        FROM StockOut WITH (NOLOCK)
        WHERE WarehouseId = @WarehouseId
    ) s
    INNER JOIN StockOut_Items so WITH (NOLOCK) ON so.StockOutId = s.Id
    INNER JOIN #ItemIds i ON i.ItemId = so.ItemId
    GROUP BY so.ItemId
    OPTION (RECOMPILE);

    -- Calculate Adjustments - same optimization
    INSERT INTO #AdjustmentData (ItemId, AdjustmentQty)
    SELECT sa.ItemId, SUM(sa.Quantity) AS AdjustmentQty
    FROM (
        SELECT Id 
        FROM StockAdjustment WITH (NOLOCK)
        WHERE WarehouseId = @WarehouseId
    ) s
    INNER JOIN StockAdjustment_Items sa WITH (NOLOCK) ON sa.StockAdjustmentId = s.Id
    INNER JOIN #ItemIds i ON i.ItemId = sa.ItemId
    GROUP BY sa.ItemId
    OPTION (RECOMPILE);

    -- Use separate UPDATE and INSERT instead of MERGE to reduce lock contention
    -- This is more efficient for concurrent operations (central office has more concurrent calls)
    -- Calculate stock on hand once and reuse
    CREATE TABLE #StockData (
        ItemId INT PRIMARY KEY,
        StockOnHand DECIMAL(18,2) NOT NULL
    );
    
    INSERT INTO #StockData (ItemId, StockOnHand)
    SELECT 
        i.ItemId,
        ISNULL(si.StockInQty, 0) - ISNULL(so.StockOutQty, 0) + ISNULL(sa.AdjustmentQty, 0) AS StockOnHand
    FROM #ItemIds i
    LEFT JOIN #StockInData si ON si.ItemId = i.ItemId
    LEFT JOIN #StockOutData so ON so.ItemId = i.ItemId
    LEFT JOIN #AdjustmentData sa ON sa.ItemId = i.ItemId;
    
    -- First, update existing records - only update rows that actually changed
    -- Use OPTIMIZE FOR UNKNOWN to prevent parameter sniffing issues
    UPDATE target
    SET target.StockOnHand = source.StockOnHand
    FROM Items_Stocks target WITH (READCOMMITTEDLOCK)
    INNER JOIN #StockData source ON target.ItemId = source.ItemId AND target.WarehouseId = @WarehouseId
    WHERE ABS(target.StockOnHand - source.StockOnHand) > 0.01 -- Use ABS to handle decimal precision
    OPTION (OPTIMIZE FOR UNKNOWN);

    -- Then, insert new records (only those that don't exist)
    -- Use LEFT JOIN with NULL check instead of NOT EXISTS for better performance on large tables
    INSERT INTO Items_Stocks (ItemId, WarehouseId, StockOnHand, CreationTime)
    SELECT 
        source.ItemId,
        @WarehouseId,
        source.StockOnHand,
        GETDATE()
    FROM #StockData source
    LEFT JOIN Items_Stocks target WITH (READCOMMITTEDLOCK) 
        ON target.ItemId = source.ItemId AND target.WarehouseId = @WarehouseId
    WHERE target.ItemId IS NULL
    OPTION (OPTIMIZE FOR UNKNOWN);

    -- Clean up temporary tables
    DROP TABLE #ItemIds;
    DROP TABLE #StockInData;
    DROP TABLE #StockOutData;
    DROP TABLE #AdjustmentData;
    DROP TABLE #StockData;
END
