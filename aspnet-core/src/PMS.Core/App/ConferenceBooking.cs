using Abp.Domain.Entities.Auditing;
using Abp.Timing;
using Abp.UI;
using System;
using System.Collections.Generic;

namespace PMS.App;

public enum ConferenceBookingStatus
{
    Inquiry = 0,
    Tentative = 1,
    Confirmed = 2,
    InProgress = 3,
    Completed = 4,
    Cancelled = 5,
}

public enum ConferenceOrganizerType
{
    Individual = 0,
    Company = 1,
}

public enum ConferencePricingType
{
    Hourly = 0,
    HalfDay = 1,
    FullDay = 2,
    Custom = 3,
}

public class ConferenceBooking : FullAuditedEntity<Guid>
{
    public const int MaxBookingNoLength = 32;
    public const int MaxEventNameLength = 256;
    public const int MaxEventTypeLength = 64;
    public const int MaxOrganizerNameLength = 256;
    public const int MaxCompanyNameLength = 256;
    public const int MaxContactPersonLength = 128;
    public const int MaxPhoneLength = 64;
    public const int MaxEmailLength = 256;
    public const int MaxNotesLength = 2048;
    public const int MaxSpecialRequestsLength = 2048;

    public string BookingNo { get; set; } = string.Empty;
    public Guid VenueId { get; set; }
    public Guid? GuestId { get; set; }
    public Guid? ConferenceCompanyId { get; set; }
    public Guid? EventTypeId { get; set; }
    public DateTime BookingDate { get; set; } = Clock.Now;
    public string EventName { get; set; } = string.Empty;
    public string EventType { get; set; } = string.Empty;
    public ConferenceOrganizerType OrganizerType { get; set; } = ConferenceOrganizerType.Individual;
    public string OrganizerName { get; set; } = string.Empty;
    public string CompanyName { get; set; } = string.Empty;
    public string ContactPerson { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public DateTime StartDateTime { get; set; }
    public DateTime EndDateTime { get; set; }
    public int AttendeeCount { get; set; }
    public ConferencePricingType PricingType { get; set; } = ConferencePricingType.Hourly;
    public decimal BaseAmount { get; set; }
    public decimal AddOnAmount { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal DepositRequired { get; set; }
    public decimal DepositPaid { get; set; }
    public int SetupBufferMinutes { get; set; }
    public int TeardownBufferMinutes { get; set; }
    public ConferenceBookingStatus Status { get; set; } = ConferenceBookingStatus.Inquiry;
    public string Notes { get; set; } = string.Empty;
    public string SpecialRequests { get; set; } = string.Empty;

    public virtual ConferenceVenue Venue { get; set; }
    public virtual Guest Guest { get; set; }
    public virtual ConferenceCompany ConferenceCompany { get; set; }
    public virtual EventType EventTypeLookup { get; set; }
    public virtual ICollection<ConferenceBookingAddOn> AddOns { get; set; } = [];
    public virtual ICollection<ConferenceBookingPayment> Payments { get; set; } = [];

    public void SetTentative()
    {
        if (Status == ConferenceBookingStatus.Cancelled || Status == ConferenceBookingStatus.Completed)
            throw new UserFriendlyException($"Cannot set booking to tentative from '{Status}'.");

        Status = ConferenceBookingStatus.Tentative;
    }

    public void Confirm()
    {
        if (Status == ConferenceBookingStatus.Cancelled || Status == ConferenceBookingStatus.Completed)
            throw new UserFriendlyException($"Cannot confirm a booking in '{Status}' status.");

        Status = ConferenceBookingStatus.Confirmed;
    }

    public void StartEvent()
    {
        if (Status != ConferenceBookingStatus.Confirmed)
            throw new UserFriendlyException($"Only confirmed bookings can start (current: '{Status}').");

        Status = ConferenceBookingStatus.InProgress;
    }

    public void Complete()
    {
        if (Status != ConferenceBookingStatus.Confirmed && Status != ConferenceBookingStatus.InProgress)
            throw new UserFriendlyException($"Only confirmed or in-progress bookings can be completed (current: '{Status}').");

        Status = ConferenceBookingStatus.Completed;
    }

    public void Cancel(string reason = null)
    {
        if (Status == ConferenceBookingStatus.Completed)
            throw new UserFriendlyException("Completed bookings cannot be cancelled.");

        Status = ConferenceBookingStatus.Cancelled;
        if (!string.IsNullOrWhiteSpace(reason))
            Notes = string.IsNullOrWhiteSpace(Notes) ? reason : $"{Notes}\nCancelled: {reason}";
    }
}

public class ConferenceBookingAddOn : CreationAuditedEntity<Guid>
{
    public const int MaxNameLength = 128;

    public Guid ConferenceBookingId { get; set; }
    public string Name { get; set; } = string.Empty;
    public int Quantity { get; set; } = 1;
    public decimal UnitPrice { get; set; }
    public decimal Amount { get; set; }

    public virtual ConferenceBooking ConferenceBooking { get; set; }
}

public class ConferenceBookingPayment : FullAuditedEntity<Guid>
{
    public const int MaxReferenceNoLength = 64;

    public Guid ConferenceBookingId { get; set; }
    public Guid PaymentMethodId { get; set; }
    public decimal Amount { get; set; }
    public DateTime PaidDate { get; set; }
    public string ReferenceNo { get; set; } = string.Empty;

    public virtual ConferenceBooking ConferenceBooking { get; set; }
    public virtual PaymentMethod PaymentMethod { get; set; }
}