using Abp.Domain.Entities;
using Abp.Domain.Entities.Auditing;
using System;

namespace PMS.App;

public class ConferenceCompany : AuditedEntity<Guid>, IPassivable
{
    public const int MaxNameLength = 256;
    public const int MaxContactPersonLength = 128;
    public const int MaxPhoneLength = 64;
    public const int MaxEmailLength = 256;
    public const int MaxNotesLength = 2048;

    public string Name { get; set; } = string.Empty;
    public string ContactPerson { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Notes { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
}