using Abp.Domain.Entities.Auditing;
using Abp.Timing;
using System;

namespace PMS.App;

public class GuestRequest : FullAuditedEntity<Guid>
{
    public Guid StayId { get; set; }
    public GuestRequestType RequestTypes { get; set; } = GuestRequestType.None;
    public string Description { get; set; } = string.Empty;
    public string Status { get; set; } = "Pending";
    public DateTime RequestedAt { get; set; } = Clock.Now;
    public DateTime? CompletedAt { get; set; }

    public virtual Stay Stay { get; set; }
}

public class Incident : FullAuditedEntity<Guid>
{
    public Guid StayId { get; set; }
    public string Description { get; set; } = string.Empty;
    public DateTime ReportedAt { get; set; } = Clock.Now;
    public string Resolution { get; set; } = string.Empty;

    public virtual Stay Stay { get; set; }
}

public class HousekeepingLog : CreationAuditedEntity<Guid>
{
    public Guid RoomId { get; set; }
    public HousekeepingStatus OldStatus { get; set; }
    public HousekeepingStatus NewStatus { get; set; }
    public Guid? StaffId { get; set; }
    public Guid? HousekeepingTaskId { get; set; }
    public Guid? CheckOutRecordId { get; set; }
    public string? Remarks { get; set; }

    public virtual Room Room { get; set; }
    public virtual Staff? Staff { get; set; }
    public virtual HousekeepingTask? HousekeepingTask { get; set; }
    public virtual CheckOutRecord? CheckOutRecord { get; set; }
}
