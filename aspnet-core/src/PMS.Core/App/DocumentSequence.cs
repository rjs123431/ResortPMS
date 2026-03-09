using Abp.Domain.Entities.Auditing;

namespace PMS.App;

/// <summary>
/// Manages document numbering sequences for different document types
/// </summary>
public class DocumentSequence : AuditedEntity<int>
{
    public string DocumentType { get; set; } = string.Empty;
    public string Prefix { get; set; } = string.Empty;
    public int CurrentNumber { get; set; }
    public int Year { get; set; }
    public int? TenantId { get; set; }
}