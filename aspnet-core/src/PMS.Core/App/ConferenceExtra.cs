using Abp.Domain.Entities;
using Abp.Domain.Entities.Auditing;
using System;

namespace PMS.App;

public class ConferenceExtra : AuditedEntity<Guid>, IPassivable
{
    public const int MaxCodeLength = 32;
    public const int MaxNameLength = 128;
    public const int MaxCategoryLength = 64;
    public const int MaxUnitLabelLength = 32;

    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string UnitLabel { get; set; } = string.Empty;
    public decimal DefaultPrice { get; set; }
    public int SortOrder { get; set; }
    public bool IsActive { get; set; } = true;
}