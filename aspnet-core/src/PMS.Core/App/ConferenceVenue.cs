using Abp.Domain.Entities;
using Abp.Domain.Entities.Auditing;
using System;

namespace PMS.App;

public class ConferenceVenue : AuditedEntity<Guid>, IPassivable
{
    public const int MaxCodeLength = 32;
    public const int MaxNameLength = 128;
    public const int MaxCategoryLength = 64;
    public const int MaxDescriptionLength = 2048;

    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public int Capacity { get; set; }
    public decimal HourlyRate { get; set; }
    public decimal HalfDayRate { get; set; }
    public decimal FullDayRate { get; set; }
    public int SetupBufferMinutes { get; set; }
    public int TeardownBufferMinutes { get; set; }
    public string Description { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
}