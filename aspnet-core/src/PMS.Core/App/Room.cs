using Abp.Domain.Entities;
using Abp.Domain.Entities.Auditing;
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
    public RoomStatus Status { get; set; } = RoomStatus.VacantClean;
    public bool IsActive { get; set; } = true;

    public virtual RoomType RoomType { get; set; }
    public virtual ICollection<RoomStatusLog> StatusLogs { get; set; } = [];
}

public class RoomStatusLog : CreationAuditedEntity<Guid>
{
    public Guid RoomId { get; set; }
    public RoomStatus Status { get; set; }
    public string Remarks { get; set; } = string.Empty;
    public DateTime ChangedAt { get; set; }

    public virtual Room Room { get; set; }
}
