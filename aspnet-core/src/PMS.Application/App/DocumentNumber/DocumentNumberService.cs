using Abp.Dependency;
using Abp.Domain.Repositories;
using Abp.Domain.Uow;
using Abp.EntityFrameworkCore;
using Abp.Runtime.Session;
using Abp.Timing;
using PMS.App;
using PMS.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace PMS.Application.App.Services;

public interface IDocumentNumberService : ITransientDependency
{
    /// <summary>
    /// Generates the next document number for the specified document type
    /// </summary>
    /// <param name="documentType">The type of document (e.g., "STOCK_IN", "STOCK_OUT")</param>
    /// <param name="prefix">The prefix for the document number (e.g., "I-", "O-", "A-", "C-", "D-")</param>
    /// <param name="siteCode">The site code to include in the document number (e.g., "01")</param>
    /// <returns>The generated document number</returns>
    Task<string> GenerateNextDocumentNumberAsync(string documentType, string prefix = "", string siteCode = "");
}

public class DocumentNumberService : IDocumentNumberService
{
    private readonly IRepository<DocumentSequence, int> _documentSequenceRepository;
    private readonly IAbpSession _abpSession;
    private readonly IUnitOfWorkManager _unitOfWorkManager;
    private readonly IDbContextProvider<PMSDbContext> _dbContextProvider;

    public DocumentNumberService(
        IRepository<DocumentSequence, int> documentSequenceRepository,
        IAbpSession abpSession,
        IUnitOfWorkManager unitOfWorkManager,
        IDbContextProvider<PMSDbContext> dbContextProvider)
    {
        _documentSequenceRepository = documentSequenceRepository;
        _abpSession = abpSession;
        _unitOfWorkManager = unitOfWorkManager;
        _dbContextProvider = dbContextProvider;
    }

    /// <summary>
    /// Generates the next document number for the specified document type.
    /// IMPORTANT: This method does NOT have [UnitOfWork] attribute to ensure it joins the parent transaction.
    /// This means if the parent operation (e.g., StockIn creation) fails, the sequence increment will rollback.
    /// All database operations (UPDATE/INSERT) are executed within the parent transaction context.
    /// Sequences are reset to 1 at the start of each new year.
    /// </summary>
    public virtual async Task<string> GenerateNextDocumentNumberAsync(string documentType, string prefix = "", string siteCode = "")
    {
        var tenantId = _abpSession.TenantId;
        var currentYear = Clock.Now.Year;
        
        // Retry logic to handle concurrent access
        const int maxRetries = 5;
        int retryCount = 0;
        var random = new Random();
        
        while (retryCount < maxRetries)
        {
            try
            {
                // Use database-level atomic operation to increment the sequence
                // This approach is safer than read-modify-write pattern
                // NOTE: Raw SQL executes within the current transaction context (from parent [UnitOfWork])
                // If parent transaction fails, this will rollback automatically
                var dbContext = _dbContextProvider.GetDbContext();
                
                // Try to update existing sequence atomically using raw SQL
                // This UPDATE is part of the parent transaction and will rollback if parent fails
                // Include Year in the WHERE clause to ensure we're updating the sequence for the current year
                var rowsAffected = await dbContext.Database.ExecuteSqlRawAsync(
                    @"UPDATE DocumentSequence 
                      SET CurrentNumber = CurrentNumber + 1 
                      WHERE DocumentType = {0} AND Year = {1} AND TenantId = {2}",
                    documentType, currentYear, tenantId ?? (object)DBNull.Value);

                int currentNumber;
                
                if (rowsAffected > 0)
                {
                    // Sequence existed and was updated - get the new value
                    var sequence = await _documentSequenceRepository.GetAll()
                        .FirstOrDefaultAsync(x => x.DocumentType == documentType && x.Year == currentYear && x.TenantId == tenantId);
                    
                    if (sequence == null)
                    {
                        // Race condition: sequence was deleted between update and read
                        retryCount++;
                        await Task.Delay(random.Next(50, 200));
                        continue;
                    }
                    
                    currentNumber = sequence.CurrentNumber;
                }
                else
                {
                    // Sequence doesn't exist for this year - try to create it
                    // Use raw SQL INSERT to ensure it's part of the same transaction
                    // This INSERT is part of the parent transaction and will rollback if parent fails
                    try
                    {
                        await dbContext.Database.ExecuteSqlRawAsync(
                            @"INSERT INTO DocumentSequence (DocumentType, Prefix, CurrentNumber, Year, TenantId, CreationTime, CreatorUserId)
                              VALUES ({0}, {1}, 1, {2}, {3}, GETUTCDATE(), NULL)",
                            documentType, prefix, currentYear, tenantId ?? (object)DBNull.Value);
                        
                        // After insert, the sequence exists with CurrentNumber = 1
                        // This is the first document number for this sequence in the current year
                        currentNumber = 1;
                    }
                    catch (DbUpdateException ex) when (ex.InnerException?.Message?.Contains("IX_DocumentSequence_DocumentType_Year_TenantId") == true)
                    {
                        // Another thread created the sequence - retry the update
                        retryCount++;
                        if (retryCount >= maxRetries)
                        {
                            throw new InvalidOperationException(
                                $"Failed to generate document number for {documentType} after {maxRetries} retries due to concurrent sequence creation.");
                        }
                        
                        await Task.Delay(random.Next(50, 200));
                        continue;
                    }
                }

                // Generate the document number (includes year in the format)
                var documentNumber = GenerateDocumentNumber(prefix, currentNumber, currentYear, siteCode);
                
                return documentNumber;
            }
            catch (DbUpdateConcurrencyException)
            {
                // Handle concurrency conflict by retrying
                retryCount++;
                if (retryCount >= maxRetries)
                {
                    throw new InvalidOperationException(
                        $"Failed to generate document number for {documentType} after {maxRetries} retries due to concurrency conflicts.");
                }
                
                // Wait a small random time before retrying
                await Task.Delay(random.Next(50, 200));
            }
            catch (DbUpdateException ex) when (ex.InnerException?.Message?.Contains("IX_DocumentSequence_DocumentType_Year_TenantId") == true)
            {
                // Unique constraint violation - another thread created the sequence
                retryCount++;
                if (retryCount >= maxRetries)
                {
                    throw new InvalidOperationException(
                        $"Failed to generate document number for {documentType} after {maxRetries} retries due to concurrent sequence creation.");
                }
                
                await Task.Delay(random.Next(50, 200));
            }
        }
        
        throw new InvalidOperationException($"Failed to generate document number for {documentType} after {maxRetries} retries.");
    }

    private static string GenerateDocumentNumber(string prefix, int currentNumber, int year, string siteCode = "")
    {
        var yearSuffix = year % 100; // Last 2 digits of year (e.g., 26 for 2026, 25 for 2025)
        
        // Remove trailing dash from prefix if present (prefixes are defined as "I-", "O-", etc.)
        var cleanPrefix = prefix?.TrimEnd('-') ?? string.Empty;
        
        if (string.IsNullOrEmpty(cleanPrefix))
        {
            // Fallback format if prefix is missing
            if (!string.IsNullOrWhiteSpace(siteCode))
            {
                return $"{siteCode}-{yearSuffix:D2}-{currentNumber:D5}";
            }
            return $"{yearSuffix:D2}-{currentNumber:D5}";
        }

        // Format: HO-26-N00001 (siteCode-yearSuffix-typeSequence)
        // where typeSequence is prefix (without dash) + sequence
        if (!string.IsNullOrWhiteSpace(siteCode))
        {
            return $"{siteCode}-{yearSuffix:D2}-{cleanPrefix}{currentNumber:D5}";
        }

        // Format: 26-N00001 (yearSuffix-typeSequence) when siteCode is not provided
        return $"{yearSuffix:D2}-{cleanPrefix}{currentNumber:D5}";
    }
}
