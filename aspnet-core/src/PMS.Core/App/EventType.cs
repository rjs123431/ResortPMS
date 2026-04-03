using Abp.Domain.Entities;
using Abp.Domain.Entities.Auditing;
using System;

namespace PMS.App;

public class EventType : AuditedEntity<Guid>, IPassivable
{
    public const int MaxCodeLength = 32;
    public const int MaxNameLength = 128;

    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public int SortOrder { get; set; }
    public bool IsActive { get; set; } = true;
}