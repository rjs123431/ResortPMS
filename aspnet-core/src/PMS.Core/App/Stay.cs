using Abp.Domain.Entities.Auditing;
using Abp.Timing;
using System;
using System.Collections.Generic;
using Abp.UI;

namespace PMS.App;

public class Stay : FullAuditedEntity<Guid>
{
    public string StayNo { get; set; } = string.Empty;
    public Guid? ReservationId { get; set; }
    public Guid? ChannelId { get; set; }
    public Guid? GuestId { get; set; }
    public DateTime CheckInDateTime { get; set; } = Clock.Now;
    public DateTime ExpectedCheckOutDateTime { get; set; }
    public DateTime? ActualCheckOutDateTime { get; set; }
    public StayStatus Status { get; set; } = StayStatus.CheckedIn;

    // Snapshot: guest info at check-in time (used when GuestId is null or for display)
    public string GuestName { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;

    public virtual Reservation Reservation { get; set; }
    public virtual Channel Channel { get; set; }
    public virtual Guest Guest { get; set; }
    public virtual Room AssignedRoom { get; set; }
    public virtual ICollection<StayGuest> Guests { get; set; } = [];
    public virtual ICollection<StayRoom> Rooms { get; set; } = [];
    public virtual ICollection<RoomTransfer> RoomTransfers { get; set; } = [];
    public virtual ICollection<StayExtension> Extensions { get; set; } = [];
    public virtual ICollection<RoomChangeRequest> RoomChangeRequests { get; set; } = [];
    public virtual ICollection<GuestRequest> GuestRequests { get; set; } = [];
    public virtual ICollection<Incident> Incidents { get; set; } = [];
    /// <summary>Marks as CheckedOut and records actual check-out time.</summary>
    public void CompleteCheckOut(DateTime? checkOutTime = null)
    {
        if (Status == StayStatus.CheckedOut) return;
        if (Status != StayStatus.CheckedIn && Status != StayStatus.InHouse)
            throw new UserFriendlyException($"Cannot check out a stay that is '{Status}'.");
        Status = StayStatus.CheckedOut;
        ActualCheckOutDateTime = checkOutTime ?? Clock.Now;
    }
}

public class StayGuest : CreationAuditedEntity<Guid>
{
    public Guid StayId { get; set; }
    public Guid GuestId { get; set; }
    public bool IsPrimary { get; set; } = false;

    public virtual Stay Stay { get; set; }
    public virtual Guest Guest { get; set; }
}

public class StayRoom : CreationAuditedEntity<Guid>
{
    public Guid StayId { get; set; }
    public Guid RoomTypeId { get; set; }
    public Guid RoomId { get; set; }
    public DateTime AssignedAt { get; set; } = Clock.Now;
    public DateTime? ReleasedAt { get; set; }

    /// <summary>Date the guest arrived in this room (same semantics as ReservationRoom.ArrivalDate).</summary>
    public DateTime ArrivalDate { get; set; }
    /// <summary>Date the guest departs this room (same semantics as ReservationRoom.DepartureDate).</summary>
    public DateTime DepartureDate { get; set; }

    public bool IsCleared { get; set; } = false;
    public DateTime? ClearedAt { get; set; }
    public Guid? ClearedByStaffId { get; set; }

    // Original assignment (before any transfers)
    public Guid OriginalRoomTypeId { get; set; }
    public Guid OriginalRoomId { get; set; }

    public virtual Stay Stay { get; set; }
    public virtual RoomType RoomType { get; set; }
    public virtual Room Room { get; set; }
    public virtual RoomType OriginalRoomType { get; set; }
    public virtual Room OriginalRoom { get; set; }
    public virtual Staff ClearedByStaff { get; set; }
    public virtual ICollection<StayRoomTransfer> Transfers { get; set; } = [];
}

public class StayRoomTransfer : CreationAuditedEntity<Guid>
{
    public Guid StayRoomId { get; set; }
    public Guid FromRoomTypeId { get; set; }
    public Guid FromRoomId { get; set; }
    public Guid ToRoomTypeId { get; set; }
    public Guid ToRoomId { get; set; }
    public DateTime TransferredAt { get; set; } = Clock.Now;
    public string Reason { get; set; } = string.Empty;

    public virtual StayRoom StayRoom { get; set; }
    public virtual RoomType FromRoomType { get; set; }
    public virtual Room FromRoom { get; set; }
    public virtual RoomType ToRoomType { get; set; }
    public virtual Room ToRoom { get; set; }
}

public class RoomTransfer : FullAuditedEntity<Guid>
{
    public Guid StayId { get; set; }
    public Guid FromRoomId { get; set; }
    public Guid ToRoomId { get; set; }
    public DateTime TransferDate { get; set; } = Clock.Now;
    public string Reason { get; set; } = string.Empty;

    public virtual Stay Stay { get; set; }
    public virtual Room FromRoom { get; set; }
    public virtual Room ToRoom { get; set; }
}

public class StayExtension : FullAuditedEntity<Guid>
{
    public Guid StayId { get; set; }
    public DateTime OldDepartureDate { get; set; }
    public DateTime NewDepartureDate { get; set; }
    public string ApprovedBy { get; set; } = string.Empty;
    public string Reason { get; set; } = string.Empty;

    public virtual Stay Stay { get; set; }
}

public enum RoomChangeSource
{
    GuestRequest = 1,
    Internal = 2,
    Maintenance = 3,
    Upgrade = 4,
    Downgrade = 5,
}

public enum RoomChangeReason
{
    GuestPreference = 1,
    RoomIssue = 2,
    Maintenance = 3,
    Noise = 4,
    ViewChange = 5,
    Accessibility = 6,
    FamilyReunion = 7,
    Upgrade = 8,
    Downgrade = 9,
    Overbooking = 10,
    Other = 99,
}

public enum RoomChangeRequestStatus
{
    Pending = 1,
    Approved = 2,
    InProgress = 3,
    Completed = 4,
    Cancelled = 5,
    Rejected = 6,
}

public class RoomChangeRequest : FullAuditedEntity<Guid>
{
    public Guid StayId { get; set; }
    public Guid StayRoomId { get; set; }

    public RoomChangeSource Source { get; set; }
    public RoomChangeReason Reason { get; set; }
    public string ReasonDetails { get; set; } = string.Empty;

    public Guid FromRoomTypeId { get; set; }
    public Guid FromRoomId { get; set; }
    public Guid? PreferredRoomTypeId { get; set; }
    public Guid? ToRoomTypeId { get; set; }
    public Guid? ToRoomId { get; set; }

    public RoomChangeRequestStatus Status { get; set; } = RoomChangeRequestStatus.Pending;
    public DateTime RequestedAt { get; set; } = Clock.Now;
    public string RequestedBy { get; set; } = string.Empty;
    public DateTime? ApprovedAt { get; set; }
    public string ApprovedBy { get; set; } = string.Empty;
    public DateTime? CompletedAt { get; set; }
    public string CompletedBy { get; set; } = string.Empty;
    public string CancellationReason { get; set; } = string.Empty;

    public virtual Stay Stay { get; set; }
    public virtual StayRoom StayRoom { get; set; }
    public virtual RoomType FromRoomType { get; set; }
    public virtual Room FromRoom { get; set; }
    public virtual RoomType PreferredRoomType { get; set; }
    public virtual RoomType ToRoomType { get; set; }
    public virtual Room ToRoom { get; set; }
}
