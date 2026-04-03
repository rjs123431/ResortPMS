using Abp.Domain.Entities;
using Abp.Domain.Entities.Auditing;
using System;
using System.Collections.Generic;

namespace PMS.App;

public enum DayUseOfferType
{
    EntranceFee = 0,
    Activity = 1,
}

public enum DayUseGuestContext
{
    WalkIn = 0,
    InHouse = 1,
}

public enum DayUseGuestCategory
{
    General = 0,
    Adult = 1,
    Kid = 2,
    SeniorPwd = 3,
    ChildBelowFour = 4,
}

public enum DayUseStatus
{
    Open = 0,
    Completed = 1,
    Cancelled = 2,
}

public class DayUseOffer : AuditedEntity<Guid>, IPassivable
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string VariantName { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DayUseOfferType OfferType { get; set; }
    public DayUseGuestContext GuestContext { get; set; }
    public DayUseGuestCategory? GuestCategory { get; set; }
    public int? DurationMinutes { get; set; }
    public Guid ChargeTypeId { get; set; }
    public decimal Amount { get; set; }
    public int SortOrder { get; set; }
    public bool IsActive { get; set; } = true;

    public virtual ChargeType ChargeType { get; set; }
}

public class DayUseVisit : FullAuditedEntity<Guid>
{
    public string VisitNo { get; set; } = string.Empty;
    public Guid GuestId { get; set; }
    public Guid? StayId { get; set; }
    public Guid? RoomId { get; set; }
    public DateTime VisitDate { get; set; }
    public TimeSpan AccessStartTime { get; set; }
    public TimeSpan AccessEndTime { get; set; }
    public DayUseGuestContext GuestContext { get; set; }
    public DayUseStatus Status { get; set; } = DayUseStatus.Open;
    public string GuestName { get; set; } = string.Empty;
    public string Remarks { get; set; } = string.Empty;
    public decimal TotalAmount { get; set; }
    public decimal PaidAmount { get; set; }
    public decimal BalanceAmount { get; set; }

    public virtual Guest Guest { get; set; }
    public virtual Stay? Stay { get; set; }
    public virtual Room? Room { get; set; }
    public virtual ICollection<DayUseVisitLine> Lines { get; set; } = [];
    public virtual ICollection<DayUsePayment> Payments { get; set; } = [];
}

public class DayUseVisitLine : Entity<Guid>
{
    public Guid DayUseVisitId { get; set; }
    public Guid DayUseOfferId { get; set; }
    public Guid ChargeTypeId { get; set; }
    public DayUseOfferType OfferType { get; set; }
    public DayUseGuestContext GuestContext { get; set; }
    public DayUseGuestCategory? GuestCategory { get; set; }
    public string OfferCode { get; set; } = string.Empty;
    public string OfferName { get; set; } = string.Empty;
    public string VariantName { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int? DurationMinutes { get; set; }
    public decimal Quantity { get; set; } = 1;
    public decimal UnitPrice { get; set; }
    public decimal Amount { get; set; }

    public virtual DayUseVisit DayUseVisit { get; set; }
    public virtual DayUseOffer DayUseOffer { get; set; }
    public virtual ChargeType ChargeType { get; set; }
}

public class DayUsePayment : Entity<Guid>
{
    public Guid DayUseVisitId { get; set; }
    public Guid PaymentMethodId { get; set; }
    public decimal Amount { get; set; }
    public DateTime PaidAt { get; set; }
    public string ReferenceNo { get; set; } = string.Empty;
    public string Notes { get; set; } = string.Empty;

    public virtual DayUseVisit DayUseVisit { get; set; }
    public virtual PaymentMethod PaymentMethod { get; set; }
}