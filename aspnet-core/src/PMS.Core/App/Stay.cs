using Abp.Domain.Entities.Auditing;
using Abp.Timing;
using System;
using System.Collections.Generic;

namespace PMS.App;

public class Stay : FullAuditedEntity<Guid>
{
    public string StayNo { get; set; } = string.Empty;
    public Guid? ReservationId { get; set; }
    public Guid GuestId { get; set; }
    public DateTime CheckInDateTime { get; set; } = Clock.Now;
    public DateTime ExpectedCheckOutDateTime { get; set; }
    public DateTime? ActualCheckOutDateTime { get; set; }
    public StayStatus Status { get; set; } = StayStatus.CheckedIn;
    public Guid AssignedRoomId { get; set; }

    // Snapshot: guest name at check-in time
    public string GuestName { get; set; } = string.Empty;
    // Snapshot: room number at check-in time
    public string RoomNumber { get; set; } = string.Empty;

    public virtual Reservation Reservation { get; set; }
    public virtual Guest Guest { get; set; }
    public virtual Room AssignedRoom { get; set; }
    public virtual ICollection<StayGuest> Guests { get; set; } = [];
    public virtual ICollection<StayRoom> Rooms { get; set; } = [];
    public virtual ICollection<RoomTransfer> RoomTransfers { get; set; } = [];
    public virtual ICollection<StayExtension> Extensions { get; set; } = [];
    public virtual ICollection<GuestRequest> GuestRequests { get; set; } = [];
    public virtual ICollection<Incident> Incidents { get; set; } = [];
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
    public Guid RoomId { get; set; }
    public DateTime AssignedAt { get; set; } = Clock.Now;
    public DateTime? ReleasedAt { get; set; }

    public virtual Stay Stay { get; set; }
    public virtual Room Room { get; set; }
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
