using System;
using System.Threading.Tasks;

namespace PMS.Auditing;

/// <summary>
/// Records financial events (folio transactions, payments, adjustments) for compliance trail.
/// Does not replace or change the existing ABP auditing store.
/// </summary>
public interface IFinancialAuditService
{
    Task RecordTransactionCreatedAsync(Guid referenceId, Guid folioId, Guid? stayId, decimal amount, string description, object? details = null);
    Task RecordTransactionVoidedAsync(Guid referenceId, Guid folioId, Guid? stayId, decimal amount, string reason, object? details = null);
    Task RecordPaymentCreatedAsync(Guid referenceId, Guid folioId, Guid? stayId, decimal amount, string description, object? details = null);
    Task RecordPaymentVoidedAsync(Guid referenceId, Guid folioId, Guid? stayId, decimal amount, string reason, object? details = null);
    Task RecordAdjustmentCreatedAsync(Guid referenceId, Guid folioId, Guid? stayId, decimal amount, string description, object? details = null);
}
