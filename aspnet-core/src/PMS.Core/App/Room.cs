using Abp.Domain.Entities;
using Abp.Domain.Entities.Auditing;
using Abp.Timing;
using System;
using System.Collections.Generic;

namespace PMS.App;

public class RoomType : AuditedEntity<Guid>, IPassivable
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int MaxAdults { get; set; } = 2;
    public int MaxChildren { get; set; } = 0;
    public decimal BaseRate { get; set; }
    public bool IsActive { get; set; } = true;

    public virtual ICollection<Room> Rooms { get; set; } = [];
    public virtual ICollection<RoomRatePlan> RatePlans { get; set; } = [];
}

// ── Room rate plan pricing ─────────────────────────────────────────────────

public class RoomRatePlan : AuditedEntity<Guid>, IPassivable
{
    public Guid RoomTypeId { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public int Priority { get; set; }
    public bool IsDefault { get; set; }
    public bool IsActive { get; set; } = true;
    /// <summary>Check-in time (e.g. 14:00 = 2 PM). Used when saving reservations and stays.</summary>
    public TimeSpan CheckInTime { get; set; } = new TimeSpan(14, 0, 0);
    /// <summary>Check-out time (e.g. 12:00 = 12 noon). Used when saving reservations and stays.</summary>
    public TimeSpan CheckOutTime { get; set; } = new TimeSpan(12, 0, 0);

    public virtual RoomType RoomType { get; set; }
    public virtual ICollection<RoomRatePlanDay> DayRates { get; set; } = [];
    public virtual ICollection<RatePlanDateOverride> DateOverrides { get; set; } = [];
}

public class RoomRatePlanDay : AuditedEntity<Guid>
{
    public Guid RoomRatePlanId { get; set; }
    public DayOfWeek DayOfWeek { get; set; }
    public decimal BasePrice { get; set; }

    public virtual RoomRatePlan RoomRatePlan { get; set; }
}

public class RatePlanDateOverride : AuditedEntity<Guid>
{
    public Guid RoomRatePlanId { get; set; }
    public DateTime RateDate { get; set; }
    public decimal OverridePrice { get; set; }
    public string Description { get; set; } = string.Empty;

    public virtual RoomRatePlan RoomRatePlan { get; set; }
}

public class Room : AuditedEntity<Guid>, IPassivable
{
    public string RoomNumber { get; set; } = string.Empty;
    public Guid RoomTypeId { get; set; }
    public string Floor { get; set; } = string.Empty;
    public HousekeepingStatus HousekeepingStatus { get; set; } = HousekeepingStatus.Clean;
    public bool IsActive { get; set; } = true;

    public virtual RoomType RoomType { get; set; }
    public virtual ICollection<RoomStatusLog> StatusLogs { get; set; } = [];
    public virtual ICollection<HousekeepingTask> HousekeepingTasks { get; set; } = [];
}

public class RoomStatusLog : CreationAuditedEntity<Guid>
{
    public Guid RoomId { get; set; }
    public RoomOperationalStatus? OperationalStatus { get; set; }
    public HousekeepingStatus? HousekeepingStatus { get; set; }
    public string Remarks { get; set; } = string.Empty;
    public DateTime ChangedAt { get; set; }

    public virtual Room Room { get; set; }
}

public class HousekeepingTask : CreationAuditedEntity<Guid>
{
    public Guid RoomId { get; set; }
    public Guid? GuestRequestId { get; set; }
    public HousekeepingTaskType TaskType { get; set; }
    public HousekeepingTaskStatus Status { get; set; } = HousekeepingTaskStatus.Pending;
    public Guid? AssignedToStaffId { get; set; }
    public DateTime? StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public string Remarks { get; set; } = string.Empty;
    public DateTime TaskDate { get; set; } = Clock.Now;

    public virtual Room Room { get; set; }
    public virtual GuestRequest? GuestRequest { get; set; }
    public virtual Staff? AssignedToStaff { get; set; }
}
