using Abp.Domain.Entities.Auditing;
using Abp.Timing;
using System;
using System.Collections.Generic;

namespace PMS.App;

public class Quotation : FullAuditedEntity<Guid>
{
    public string QuotationNo { get; set; } = string.Empty;
    public Guid? GuestId { get; set; }
    public DateTime QuotationDate { get; set; } = Clock.Now;
    public DateTime ArrivalDate { get; set; }
    public DateTime DepartureDate { get; set; }
    public int Nights { get; set; }
    public int Adults { get; set; } = 1;
    public int Children { get; set; } = 0;
    public QuotationStatus Status { get; set; } = QuotationStatus.Draft;
    public decimal TotalAmount { get; set; }
    public string Notes { get; set; } = string.Empty;
    public string SpecialRequests { get; set; } = string.Empty;
    public DateTime? ExpiresAt { get; set; }

    public string GuestName { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;

    public virtual Guest Guest { get; set; }
    public virtual ICollection<QuotationRoom> Rooms { get; set; } = [];
    public virtual ICollection<QuotationExtraBed> ExtraBeds { get; set; } = [];
}

public class QuotationRoom : CreationAuditedEntity<Guid>
{
    public Guid QuotationId { get; set; }
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

    public virtual Quotation Quotation { get; set; }
    public virtual RoomType RoomType { get; set; }
    public virtual Room Room { get; set; }
}

public class QuotationExtraBed : CreationAuditedEntity<Guid>
{
    public Guid QuotationId { get; set; }
    public Guid? ExtraBedTypeId { get; set; }
    public int Quantity { get; set; } = 1;
    public decimal RatePerNight { get; set; }
    public int NumberOfNights { get; set; }
    public decimal Amount { get; set; }

    public string ExtraBedTypeName { get; set; } = string.Empty;

    public virtual Quotation Quotation { get; set; }
    public virtual ExtraBedType ExtraBedType { get; set; }
}
