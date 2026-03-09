CREATE OR ALTER PROCEDURE GetStockCardSummary
    @WarehouseId INT,
    @DateFrom DATE,
    @DateTo DATE,
    @ItemId INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    -- Stock In Aggregation
    SELECT 
        sii.ItemId,
        SUM(CASE WHEN si.DocDate < @DateFrom THEN sii.Quantity ELSE 0 END) AS StockInBefore,
        SUM(CASE WHEN si.DocDate BETWEEN @DateFrom AND @DateTo THEN sii.Quantity ELSE 0 END) AS StockInDuring
    INTO #StockInAgg
    FROM StockIn si
    INNER JOIN StockIn_Items sii ON si.Id = sii.StockInId
    WHERE si.WarehouseId = @WarehouseId
      AND (@ItemId IS NULL OR sii.ItemId = @ItemId)
    GROUP BY sii.ItemId;

    -- Stock Out Aggregation
    SELECT 
        soi.ItemId,
        SUM(CASE WHEN so.DocDate < @DateFrom THEN soi.Quantity ELSE 0 END) AS StockOutBefore,
        SUM(CASE WHEN so.DocDate BETWEEN @DateFrom AND @DateTo THEN soi.Quantity ELSE 0 END) AS StockOutDuring
    INTO #StockOutAgg
    FROM StockOut so
    INNER JOIN StockOut_Items soi ON so.Id = soi.StockOutId
    WHERE so.WarehouseId = @WarehouseId
      AND (@ItemId IS NULL OR soi.ItemId = @ItemId)
    GROUP BY soi.ItemId;

    -- Stock Adjustment Aggregation
    SELECT 
        sai.ItemId,
        SUM(CASE WHEN sa.DocDate < @DateFrom THEN sai.Quantity ELSE 0 END) AS AdjBefore,
        SUM(CASE WHEN sa.DocDate BETWEEN @DateFrom AND @DateTo THEN sai.Quantity ELSE 0 END) AS AdjDuring
    INTO #AdjustmentAgg
    FROM StockAdjustment sa
    INNER JOIN StockAdjustment_Items sai ON sa.Id = sai.StockAdjustmentId
    WHERE sa.WarehouseId = @WarehouseId
      AND (@ItemId IS NULL OR sai.ItemId = @ItemId)
    GROUP BY sai.ItemId;

	-- Reorder Level
    SELECT 
        stock.ItemId,
		stock.ReorderLevel
    INTO #ReorderLevelAgg
    FROM Items_Stocks stock
    WHERE stock.WarehouseId = @WarehouseId
      AND (@ItemId IS NULL OR stock.ItemId = @ItemId);

    -- Final join and calculation
    SELECT 
		i.Id,
        i.Code AS ItemCode,
        i.Name AS ItemName,
        i.UnitCost,
		i.PMSUOM,
        ISNULL(si.StockInBefore, 0) 
        - ISNULL(so.StockOutBefore, 0) 
        + ISNULL(sa.AdjBefore, 0) AS BeginningStock,

        ISNULL(si.StockInDuring, 0) AS StockIn,
        ISNULL(so.StockOutDuring, 0) AS StockOut,
        ISNULL(sa.AdjDuring, 0) AS Adjustment,

        (
            ISNULL(si.StockInBefore, 0) 
            - ISNULL(so.StockOutBefore, 0) 
            + ISNULL(sa.AdjBefore, 0)
            + ISNULL(si.StockInDuring, 0) 
            - ISNULL(so.StockOutDuring, 0)
            + ISNULL(sa.AdjDuring, 0)
        ) AS EndingStock,
		ISNULL(rl.ReorderLevel, 0) AS ReorderLevel
    FROM Items i
    LEFT JOIN #StockInAgg si ON i.Id = si.ItemId
    LEFT JOIN #StockOutAgg so ON i.Id = so.ItemId
    LEFT JOIN #AdjustmentAgg sa ON i.Id = sa.ItemId
	LEFT JOIN #ReorderLevelAgg rl ON i.Id = rl.ItemId

	WHERE (@ItemId IS NULL OR i.Id = @ItemId);

    DROP TABLE #StockInAgg;
    DROP TABLE #StockOutAgg;
    DROP TABLE #AdjustmentAgg;
	DROP TABLE #ReorderLevelAgg;
END
