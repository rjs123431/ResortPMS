using System;

namespace PMS.Auditing.Dto;

public class FinancialAuditLogDto
{
    public Guid Id { get; set; }
    public string EventType { get; set; } = string.Empty;
    public string ReferenceType { get; set; } = string.Empty;
    public Guid ReferenceId { get; set; }
    public Guid FolioId { get; set; }
    public Guid? StayId { get; set; }
    public decimal Amount { get; set; }
    public string Description { get; set; } = string.Empty;
    public long? UserId { get; set; }
    public DateTime ExecutionTime { get; set; }
}
