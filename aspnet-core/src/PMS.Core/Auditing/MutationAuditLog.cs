using Abp.Domain.Entities;
using System;

namespace PMS.Auditing;

/// <summary>
/// Records create/update/delete on key entities for full mutation trail.
/// Separate from ABP's default audit; do not modify the existing auditing store.
/// </summary>
public class MutationAuditLog : Entity<long>
{
    public int? TenantId { get; set; }
    public string EntityType { get; set; } = string.Empty;
    public string EntityId { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty; // Created, Updated, Deleted
    public string OldValueJson { get; set; }
    public string NewValueJson { get; set; }
    public long? UserId { get; set; }
    public long? ImpersonatorUserId { get; set; }
    public DateTime ExecutionTime { get; set; }
    public string CorrelationId { get; set; }
    public string MethodName { get; set; }
    public string Extra { get; set; }
}
