-- =============================================
-- Script to Import Items from Another Database
-- =============================================
-- This script copies all items from a source database to the current database.
-- Designed for new databases - simple INSERT only.
-- 
-- IMPORTANT: 
-- 1. Update @SourceDatabaseName with your source database name
-- 2. Ensure CategoryId values exist in the target database
-- 3. Run this script in a transaction and review before committing
-- =============================================

-- Configuration Variables
DECLARE @SourceDatabaseName NVARCHAR(128) = 'PMSDb-clmc'; -- CHANGE THIS to your source database name

-- Validate source database exists
IF NOT EXISTS (SELECT 1 FROM sys.databases WHERE name = @SourceDatabaseName)
BEGIN
    RAISERROR('Source database "%s" does not exist.', 16, 1, @SourceDatabaseName);
    RETURN;
END

BEGIN TRANSACTION;

BEGIN TRY
    -- =============================================
    -- Import Items
    -- =============================================
    DECLARE @Sql NVARCHAR(MAX);
    
    SET @Sql = N'
    INSERT INTO [Items] (
        [Id],
        [Code],
        [Name],
        [Description],
        [PMSUOM],
        [UnitCost],
        [CategoryId],
        [IsActive],
        [BinaryObjectId],
        [CreationTime],
        [CreatorUserId],
        [LastModificationTime],
        [LastModifierUserId]
    )
    SELECT 
        src.[Id],
        src.[Code],
        src.[Name],
        src.[Description],
        src.[PMSUOM],
        src.[UnitCost],
        1, -- CategoryId set to 1 for all items
        src.[IsActive],
        src.[BinaryObjectId],
        src.[CreationTime], -- Preserve original creation time
        NULL, -- CreatorUserId set to NULL
        NULL, -- LastModificationTime set to NULL
        NULL  -- LastModifierUserId set to NULL
    FROM ' + QUOTENAME(@SourceDatabaseName) + '.[dbo].[Items] src;';
    
    EXEC sp_executesql @Sql;
    
    DECLARE @ItemsInserted INT = @@ROWCOUNT;
    PRINT 'Inserted ' + CAST(@ItemsInserted AS VARCHAR(10)) + ' items.';

    -- =============================================
    -- Import Item Unit Costs
    -- =============================================
    SET @Sql = N'
    INSERT INTO [Items_UnitCosts] (
        [ItemId],
        [UnitCost],
        [EffectiveDate],
        [Remarks],
        [CreationTime],
        [CreatorUserId],
        [LastModificationTime],
        [LastModifierUserId]
    )
    SELECT 
        src.[Id] AS [ItemId],
        src.[UnitCost],
        src.[CreationTime] AS [EffectiveDate], -- Use item creation time as effective date
        '''' AS [Remarks], -- Empty string for remarks ('' escaped as '''' in dynamic SQL)
        src.[CreationTime], -- Preserve original creation time
        NULL, -- CreatorUserId set to NULL
        NULL, -- LastModificationTime set to NULL
        NULL  -- LastModifierUserId set to NULL
    FROM ' + QUOTENAME(@SourceDatabaseName) + '.[dbo].[Items] src
    WHERE src.[UnitCost] > 0;'; -- Only insert if UnitCost is greater than 0
    
    EXEC sp_executesql @Sql;
    
    DECLARE @UnitCostsInserted INT = @@ROWCOUNT;
    PRINT 'Inserted ' + CAST(@UnitCostsInserted AS VARCHAR(10)) + ' item unit costs.';

    -- =============================================
    -- Validation: Check if CategoryId 1 exists
    -- =============================================
    IF NOT EXISTS (SELECT 1 FROM [Categories] WHERE [Id] = 1)
    BEGIN
        PRINT 'WARNING: CategoryId 1 does not exist in Categories table. Please ensure Category with Id = 1 exists.';
    END
    ELSE
    BEGIN
        PRINT 'CategoryId 1 exists in Categories table.';
    END

    -- =============================================
    -- Summary
    -- =============================================
    DECLARE @TotalItems INT;
    DECLARE @TotalUnitCosts INT;
    SELECT @TotalItems = COUNT(*) FROM [Items];
    SELECT @TotalUnitCosts = COUNT(*) FROM [Items_UnitCosts];
    PRINT '========================================';
    PRINT 'Import Summary:';
    PRINT 'Total items in target database: ' + CAST(@TotalItems AS VARCHAR(10));
    PRINT 'Total item unit costs in target database: ' + CAST(@TotalUnitCosts AS VARCHAR(10));
    PRINT '========================================';

    -- Uncomment the line below to commit the transaction
    COMMIT TRANSACTION;
    
    -- For safety, the transaction is left open for review
    -- Review the results, then run: COMMIT TRANSACTION; or ROLLBACK TRANSACTION;

END TRY
BEGIN CATCH
    DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();
    
    ROLLBACK TRANSACTION;
    
    RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
END CATCH;

-- =============================================
-- Usage Instructions:
-- =============================================
-- 1. Replace @SourceDatabaseName with your actual source database name
-- 2. Ensure Category with Id = 1 exists in the target database
-- 3. Run the script
-- 4. Review the results
-- 5. If satisfied, uncomment COMMIT TRANSACTION and run it
-- 6. If not satisfied, run ROLLBACK TRANSACTION
-- 
-- Note: All items will be assigned CategoryId = 1
-- Item Unit Costs will be created based on the UnitCost from source Items table
-- =============================================
