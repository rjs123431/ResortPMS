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
}

public class Room : AuditedEntity<Guid>, IPassivable
{
    public string RoomNumber { get; set; } = string.Empty;
    public Guid RoomTypeId { get; set; }
    public string Floor { get; set; } = string.Empty;
    public RoomOperationalStatus OperationalStatus { get; set; } = RoomOperationalStatus.Vacant;
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
    public HousekeepingTaskType TaskType { get; set; }
    public HousekeepingTaskStatus Status { get; set; } = HousekeepingTaskStatus.Pending;
    public Guid? AssignedToUserId { get; set; }
    public DateTime? StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public string Remarks { get; set; } = string.Empty;
    public DateTime TaskDate { get; set; } = Clock.Now;

    public virtual Room Room { get; set; }
}
