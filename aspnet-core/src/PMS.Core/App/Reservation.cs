using Abp.Domain.Entities.Auditing;
using Abp.Timing;
using System;
using System.Collections.Generic;

namespace PMS.App;

public class Reservation : FullAuditedEntity<Guid>
{
    public string ReservationNo { get; set; } = string.Empty;
    public Guid GuestId { get; set; }
    public DateTime ReservationDate { get; set; } = Clock.Now;
    public DateTime ArrivalDate { get; set; }
    public DateTime DepartureDate { get; set; }
    public int Nights { get; set; }
    public int Adults { get; set; } = 1;
    public int Children { get; set; } = 0;
    public ReservationStatus Status { get; set; } = ReservationStatus.Draft;
    public decimal TotalAmount { get; set; }
    public decimal DepositPercentage { get; set; }
    public decimal DepositRequired { get; set; }
    public decimal DepositPaid { get; set; }
    public string Notes { get; set; } = string.Empty;

    // Snapshot: guest name at reservation time for quick display
    public string GuestName { get; set; } = string.Empty;

    public virtual Guest Guest { get; set; }
    public virtual ICollection<ReservationRoom> Rooms { get; set; } = [];
    public virtual ICollection<ReservationExtraBed> ExtraBeds { get; set; } = [];
    public virtual ICollection<ReservationGuest> Guests { get; set; } = [];
    public virtual ICollection<ReservationDeposit> Deposits { get; set; } = [];
}

public class ReservationExtraBed : CreationAuditedEntity<Guid>
{
    public Guid ReservationId { get; set; }
    public Guid? ExtraBedTypeId { get; set; }
    public DateTime ArrivalDate { get; set; }
    public DateTime DepartureDate { get; set; }
    public int Quantity { get; set; } = 1;
    public decimal RatePerNight { get; set; }
    public int NumberOfNights { get; set; }
    public decimal Amount { get; set; }
    public decimal DiscountPercent { get; set; }
    public decimal DiscountAmount { get; set; }
    public int SeniorCitizenCount { get; set; }
    public decimal SeniorCitizenPercent { get; set; } = 20m;
    public decimal SeniorCitizenDiscountAmount { get; set; }
    public decimal NetAmount { get; set; }

    public virtual Reservation Reservation { get; set; }
    public virtual ExtraBedType ExtraBedType { get; set; }
}

public class ReservationRoom : CreationAuditedEntity<Guid>
{
    public Guid ReservationId { get; set; }
    public Guid RoomTypeId { get; set; }
    public Guid? RoomId { get; set; }
    public DateTime ArrivalDate { get; set; }
    public DateTime DepartureDate { get; set; }
    public decimal RatePerNight { get; set; }
    public int NumberOfNights { get; set; }
    public decimal Amount { get; set; }
    public decimal DiscountPercent { get; set; }
    public decimal DiscountAmount { get; set; }
    public int SeniorCitizenCount { get; set; }
    public decimal SeniorCitizenPercent { get; set; } = 20m;
    public decimal SeniorCitizenDiscountAmount { get; set; }
    public decimal NetAmount { get; set; }

    // Snapshot
    public string RoomTypeName { get; set; } = string.Empty;
    public string RoomNumber { get; set; } = string.Empty;

    public virtual Reservation Reservation { get; set; }
    public virtual RoomType RoomType { get; set; }
    public virtual Room Room { get; set; }
    public virtual ICollection<ReservationDailyRate> DailyRates { get; set; } = [];
}

public class ReservationGuest : CreationAuditedEntity<Guid>
{
    public Guid ReservationId { get; set; }
    public Guid GuestId { get; set; }
    public int Age { get; set; }
    public bool IsPrimary { get; set; } = false;

    public virtual Reservation Reservation { get; set; }
    public virtual Guest Guest { get; set; }
}

public class ReservationDailyRate : CreationAuditedEntity<Guid>
{
    public Guid ReservationRoomId { get; set; }
    public DateTime StayDate { get; set; }
    public decimal Rate { get; set; }
    public decimal Tax { get; set; }
    public decimal Discount { get; set; }

    public virtual ReservationRoom ReservationRoom { get; set; }
}

public class ReservationDeposit : FullAuditedEntity<Guid>
{
    public Guid ReservationId { get; set; }
    public decimal Amount { get; set; }
    public Guid PaymentMethodId { get; set; }
    public DateTime PaidDate { get; set; }
    public string ReferenceNo { get; set; } = string.Empty;

    public virtual Reservation Reservation { get; set; }
    public virtual PaymentMethod PaymentMethod { get; set; }
}
