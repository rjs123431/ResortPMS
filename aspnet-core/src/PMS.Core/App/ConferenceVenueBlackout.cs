using Abp.Domain.Entities.Auditing;
using System;

namespace PMS.App;

public class ConferenceVenueBlackout : FullAuditedEntity<Guid>
{
    public const int MaxTitleLength = 128;
    public const int MaxNotesLength = 2048;

    public Guid VenueId { get; set; }
    public string Title { get; set; } = string.Empty;
    public DateTime StartDateTime { get; set; }
    public DateTime EndDateTime { get; set; }
    public string Notes { get; set; } = string.Empty;

    public virtual ConferenceVenue Venue { get; set; }
}