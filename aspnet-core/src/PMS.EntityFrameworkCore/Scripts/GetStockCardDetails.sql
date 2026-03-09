CREATE OR ALTER PROCEDURE GetStockCardDetails
    @WarehouseId INT,
    @DateFrom DATE,
    @DateTo DATE,
    @ItemId INT
AS
BEGIN
    SET NOCOUNT ON;

    -- Stock In transactions
    SELECT 
        si.DocDate AS TransactionDate,
        'Stock In' AS TransactionType,
        si.TransactionTypeId AS TransactionTypeId,
        tt.Name AS TransactionTypeName,
        si.DocNo AS ReferenceNo,
        si.SourceName AS SourceName,
        sii.Quantity,
        si.CreationTime
    FROM StockIn si
    INNER JOIN StockIn_Items sii ON si.Id = sii.StockInId
    LEFT JOIN TransactionTypes tt ON si.TransactionTypeId = tt.Id
    WHERE si.WarehouseId = @WarehouseId
      AND sii.ItemId = @ItemId
      AND si.DocDate BETWEEN @DateFrom AND @DateTo

    UNION ALL

    -- Stock Out transactions (quantity shown as negative for clarity)
    SELECT 
        so.DocDate AS TransactionDate,
        'Stock Out' AS TransactionType,
        so.TransactionTypeId AS TransactionTypeId,
        tt.Name AS TransactionTypeName,
        so.DocNo AS ReferenceNo,
        so.DestinationName AS SourceName,
        -soi.Quantity AS Quantity,
        so.CreationTime
    FROM StockOut so
    INNER JOIN StockOut_Items soi ON so.Id = soi.StockOutId
    LEFT JOIN TransactionTypes tt ON so.TransactionTypeId = tt.Id
    WHERE so.WarehouseId = @WarehouseId
      AND soi.ItemId = @ItemId
      AND so.DocDate BETWEEN @DateFrom AND @DateTo

    UNION ALL

    -- Stock Adjustment transactions (could be + or -)
    SELECT 
        sa.DocDate AS TransactionDate,
        'Adjustment' AS TransactionType,
        sa.TransactionTypeId AS TransactionTypeId,
        tt.Name AS TransactionTypeName,
        sa.DocNo AS ReferenceNo,
        '' AS SourceName,
        sai.Quantity,
        sa.CreationTime
    FROM StockAdjustment sa
    INNER JOIN StockAdjustment_Items sai ON sa.Id = sai.StockAdjustmentId
    LEFT JOIN TransactionTypes tt ON sa.TransactionTypeId = tt.Id
    WHERE sa.WarehouseId = @WarehouseId
      AND sai.ItemId = @ItemId
      AND sa.DocDate BETWEEN @DateFrom AND @DateTo

    ORDER BY TransactionDate, CreationTime, ReferenceNo;
END
