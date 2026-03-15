using Abp.Dependency;
using Abp.Domain.Repositories;
using Abp.Runtime.Session;
using Abp.Timing;
using System;
using System.Text.Json;
using System.Threading.Tasks;

namespace PMS.Auditing;

public class FinancialAuditService : IFinancialAuditService, ITransientDependency
{
    private const string RefTypeTransaction = "FolioTransaction";
    private const string RefTypePayment = "FolioPayment";
    private const string RefTypeAdjustment = "FolioAdjustment";

    private readonly IRepository<FinancialAuditLog, Guid> _repository;
    private readonly IAbpSession _session;

    public FinancialAuditService(
        IRepository<FinancialAuditLog, Guid> repository,
        IAbpSession session)
    {
        _repository = repository;
        _session = session;
    }

    public async Task RecordTransactionCreatedAsync(Guid referenceId, Guid folioId, Guid? stayId, decimal amount, string description, object? details = null)
    {
        await RecordAsync("TransactionCreated", RefTypeTransaction, referenceId, folioId, stayId, amount, description, details);
    }

    public async Task RecordTransactionVoidedAsync(Guid referenceId, Guid folioId, Guid? stayId, decimal amount, string reason, object? details = null)
    {
        await RecordAsync("TransactionVoided", RefTypeTransaction, referenceId, folioId, stayId, amount, reason, details);
    }

    public async Task RecordPaymentCreatedAsync(Guid referenceId, Guid folioId, Guid? stayId, decimal amount, string description, object? details = null)
    {
        await RecordAsync("PaymentCreated", RefTypePayment, referenceId, folioId, stayId, amount, description, details);
    }

    public async Task RecordPaymentVoidedAsync(Guid referenceId, Guid folioId, Guid? stayId, decimal amount, string reason, object? details = null)
    {
        await RecordAsync("PaymentVoided", RefTypePayment, referenceId, folioId, stayId, amount, reason, details);
    }

    public async Task RecordAdjustmentCreatedAsync(Guid referenceId, Guid folioId, Guid? stayId, decimal amount, string description, object? details = null)
    {
        await RecordAsync("AdjustmentCreated", RefTypeAdjustment, referenceId, folioId, stayId, amount, description, details);
    }

    private async Task RecordAsync(string eventType, string referenceType, Guid referenceId, Guid folioId, Guid? stayId, decimal amount, string description, object? details)
    {
        var log = new FinancialAuditLog
        {
            Id = Guid.NewGuid(),
            TenantId = _session.TenantId,
            EventType = eventType,
            ReferenceType = referenceType,
            ReferenceId = referenceId,
            FolioId = folioId,
            StayId = stayId,
            Amount = amount,
            Description = description.Length > 512 ? description.Substring(0, 512) : description,
            DetailsJson = details != null ? JsonSerializer.Serialize(details) : string.Empty,
            UserId = _session.UserId,
            ExecutionTime = Clock.Now
        };
        await _repository.InsertAsync(log);
    }
}
