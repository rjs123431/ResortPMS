using Abp.Domain.Entities;
using System;

namespace PMS.Auditing;

/// <summary>
/// Immutable log of financial events (folio transactions, payments, adjustments) for compliance.
/// Separate from ABP's default audit; do not modify the existing auditing store.
/// </summary>
public class FinancialAuditLog : Entity<Guid>
{
    public int? TenantId { get; set; }
    public string EventType { get; set; } = string.Empty; // e.g. TransactionCreated, PaymentCreated, TransactionVoided
    public string ReferenceType { get; set; } = string.Empty; // FolioTransaction, FolioPayment, FolioAdjustment
    public Guid ReferenceId { get; set; }
    public Guid FolioId { get; set; }
    public Guid? StayId { get; set; }
    public decimal Amount { get; set; }
    public string Currency { get; set; }
    public string Description { get; set; } = string.Empty;
    public string DetailsJson { get; set; }
    public long? UserId { get; set; }
    public DateTime ExecutionTime { get; set; }
    public string CorrelationId { get; set; }
}
