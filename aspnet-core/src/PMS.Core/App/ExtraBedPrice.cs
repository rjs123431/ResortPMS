using Abp.Domain.Entities;
using Abp.Domain.Entities.Auditing;
using System;

namespace PMS.App;

/// <summary>
/// Date-effective pricing row for an extra-bed type.
/// The active rate for a given date is the record whose EffectiveFrom &lt;= date
/// and (EffectiveTo is null OR EffectiveTo > date).
/// </summary>
public class ExtraBedPrice : AuditedEntity<Guid>, IPassivable
{
    public Guid ExtraBedTypeId { get; set; }
    public ExtraBedType ExtraBedType { get; set; }

    /// <summary>Rate per night charged for one extra bed of this type.</summary>
    public decimal RatePerNight { get; set; }

    /// <summary>Inclusive start date this rate is effective from.</summary>
    public DateTime EffectiveFrom { get; set; }

    /// <summary>Exclusive end date (null = open-ended / currently active).</summary>
    public DateTime? EffectiveTo { get; set; }

    public bool IsActive { get; set; } = true;
}
