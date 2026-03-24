using Abp.Domain.Entities;
using System;
using System.ComponentModel.DataAnnotations;

namespace PMS.App;

/// <summary>Daily inventory status for a room (date-based availability).</summary>
public enum RoomDailyInventoryStatus
{
    Vacant = 1,
    Reserved = 2,
    InHouse = 3,
    OutOfOrder = 4,
    Blocked = 5,
    HouseUse = 6,
}

/// <summary>One row per room per calendar day for availability and booking state.</summary>
public class RoomDailyInventory : Entity<Guid>
{
    public Guid RoomId { get; set; }
    public DateTime InventoryDate { get; set; }
    public RoomDailyInventoryStatus Status { get; set; } = RoomDailyInventoryStatus.Vacant;
    public Guid? ReservationId { get; set; }
    public Guid? StayId { get; set; }
    public bool IsSellable { get; set; } = true;
    public bool IsBlocked { get; set; } = false;
    public bool IsOutOfOrder { get; set; } = false;

    /// <summary>SQL Server rowversion — EF Core optimistic concurrency token.</summary>
    [Timestamp]
    public byte[] RowVersion { get; set; }

    public virtual Room Room { get; set; }
}
