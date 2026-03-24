using Abp.Domain.Entities.Auditing;
using Abp.Timing;
using System;
using System.Collections.Generic;

namespace PMS.App;

public class PreCheckIn : FullAuditedEntity<Guid>
{
    public string PreCheckInNo { get; set; } = string.Empty;
    public Guid? ReservationId { get; set; }
    public Guid? GuestId { get; set; }
    public DateTime PreCheckInDate { get; set; } = Clock.Now;
    public DateTime ArrivalDate { get; set; }
    public DateTime DepartureDate { get; set; }
    public int Nights { get; set; } 
    public int Adults { get; set; } = 1;
    public int Children { get; set; } = 0;
    public PreCheckInStatus Status { get; set; } = PreCheckInStatus.Pending;
    public decimal TotalAmount { get; set; }
    public string Notes { get; set; } = string.Empty;
    public string SpecialRequests { get; set; } = string.Empty;
    public DateTime? ExpiresAt { get; set; }

    public string GuestName { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;

    public virtual Reservation Reservation { get; set; }
    public virtual Guest Guest { get; set; }
    public virtual ICollection<PreCheckInRoom> Rooms { get; set; } = [];
    public virtual ICollection<PreCheckInExtraBed> ExtraBeds { get; set; } = [];
}

public class PreCheckInRoom : CreationAuditedEntity<Guid>
{
    public Guid PreCheckInId { get; set; }
    public Guid? ReservationRoomId { get; set; }
    public Guid RoomTypeId { get; set; }
    public Guid? RoomId { get; set; }
    public decimal RatePerNight { get; set; }
    public int NumberOfNights { get; set; }
    public decimal Amount { get; set; }
    public int SeniorCitizenCount { get; set; }
    public decimal SeniorCitizenDiscountAmount { get; set; }
    public decimal NetAmount { get; set; }

    public string RoomTypeName { get; set; } = string.Empty;
    public string RoomNumber { get; set; } = string.Empty;

    public virtual PreCheckIn PreCheckIn { get; set; }
    public virtual ReservationRoom ReservationRoom { get; set; }
    public virtual RoomType RoomType { get; set; }
    public virtual Room Room { get; set; }
}

public class PreCheckInExtraBed : CreationAuditedEntity<Guid>
{
    public Guid PreCheckInId { get; set; }
    public Guid? ExtraBedTypeId { get; set; }
    public int Quantity { get; set; } = 1;
    public decimal RatePerNight { get; set; }
    public int NumberOfNights { get; set; }
    public decimal Amount { get; set; }

    public string ExtraBedTypeName { get; set; } = string.Empty;

    public virtual PreCheckIn PreCheckIn { get; set; }
    public virtual ExtraBedType ExtraBedType { get; set; }
}
