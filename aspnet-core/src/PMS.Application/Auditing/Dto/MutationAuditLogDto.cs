using System;

namespace PMS.Auditing.Dto;

public class MutationAuditLogDto
{
    public long Id { get; set; }
    public string EntityType { get; set; } = string.Empty;
    public string EntityId { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public string OldValueJson { get; set; } = string.Empty;
    public string NewValueJson { get; set; } = string.Empty;
    public long? UserId { get; set; }
    public DateTime ExecutionTime { get; set; }
    public string MethodName { get; set; } = string.Empty;
    public string Extra { get; set; } = string.Empty;
}
