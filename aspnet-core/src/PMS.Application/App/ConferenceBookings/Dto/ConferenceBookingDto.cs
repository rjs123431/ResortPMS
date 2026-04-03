using Abp.Application.Services.Dto;
using Abp.AutoMapper;
using Abp.Runtime.Validation;
using PMS.Dto;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace PMS.App.ConferenceBookings.Dto;

[AutoMapFrom(typeof(ConferenceBooking))]
public class ConferenceBookingDto : EntityDto<Guid>
{
    public string BookingNo { get; set; }
    public Guid VenueId { get; set; }
    public string VenueName { get; set; }
    public Guid? GuestId { get; set; }
    public Guid? ConferenceCompanyId { get; set; }
    public Guid? EventTypeId { get; set; }
    public string ConferenceCompanyName { get; set; }
    public DateTime BookingDate { get; set; }
    public string EventName { get; set; }
    public string EventType { get; set; }
    public ConferenceOrganizerType OrganizerType { get; set; }
    public string OrganizerName { get; set; }
    public string CompanyName { get; set; }
    public string ContactPerson { get; set; }
    public string Phone { get; set; }
    public string Email { get; set; }
    public DateTime StartDateTime { get; set; }
    public DateTime EndDateTime { get; set; }
    public int AttendeeCount { get; set; }
    public ConferencePricingType PricingType { get; set; }
    public decimal BaseAmount { get; set; }
    public decimal AddOnAmount { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal DepositRequired { get; set; }
    public decimal DepositPaid { get; set; }
    public int SetupBufferMinutes { get; set; }
    public int TeardownBufferMinutes { get; set; }
    public ConferenceBookingStatus Status { get; set; }
    public string Notes { get; set; }
    public string SpecialRequests { get; set; }
    public List<ConferenceBookingAddOnDto> AddOns { get; set; } = [];
    public List<ConferenceBookingPaymentDto> Payments { get; set; } = [];
}

public class ConferenceBookingListDto : EntityDto<Guid>
{
    public string BookingNo { get; set; }
    public Guid VenueId { get; set; }
    public string VenueName { get; set; }
    public Guid? ConferenceCompanyId { get; set; }
    public Guid? EventTypeId { get; set; }
    public string ConferenceCompanyName { get; set; }
    public string EventName { get; set; }
    public string EventType { get; set; }
    public string OrganizerName { get; set; }
    public string CompanyName { get; set; }
    public DateTime StartDateTime { get; set; }
    public DateTime EndDateTime { get; set; }
    public ConferenceBookingStatus Status { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal DepositRequired { get; set; }
    public decimal DepositPaid { get; set; }
    public int AttendeeCount { get; set; }
    public DateTime CreationTime { get; set; }
}

public class ConferenceBookingAddOnDto : EntityDto<Guid>
{
    public string Name { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal Amount { get; set; }
}

public class CreateConferenceBookingAddOnDto
{
    [Required]
    [StringLength(ConferenceBookingAddOn.MaxNameLength)]
    public string Name { get; set; }

    [Range(1, int.MaxValue)]
    public int Quantity { get; set; } = 1;

    [Range(0, double.MaxValue)]
    public decimal UnitPrice { get; set; }
}

public class ConferenceBookingPaymentDto : EntityDto<Guid>
{
    public Guid PaymentMethodId { get; set; }
    public string PaymentMethodName { get; set; }
    public decimal Amount { get; set; }
    public DateTime PaidDate { get; set; }
    public string ReferenceNo { get; set; }
}

public class CreateConferenceBookingDto : IValidatableObject
{
    [Required]
    public Guid VenueId { get; set; }

    public Guid? GuestId { get; set; }
    public Guid? ConferenceCompanyId { get; set; }
    public Guid? EventTypeId { get; set; }

    [Required]
    [StringLength(ConferenceBooking.MaxEventNameLength)]
    public string EventName { get; set; }

    [StringLength(ConferenceBooking.MaxEventTypeLength)]
    public string EventType { get; set; }

    public ConferenceOrganizerType OrganizerType { get; set; } = ConferenceOrganizerType.Individual;

    [Required]
    [StringLength(ConferenceBooking.MaxOrganizerNameLength)]
    public string OrganizerName { get; set; }

    [StringLength(ConferenceBooking.MaxCompanyNameLength)]
    public string CompanyName { get; set; }

    [StringLength(ConferenceBooking.MaxContactPersonLength)]
    public string ContactPerson { get; set; }

    [StringLength(ConferenceBooking.MaxPhoneLength)]
    public string Phone { get; set; }

    [StringLength(ConferenceBooking.MaxEmailLength)]
    public string Email { get; set; }

    [Required]
    public DateTime StartDateTime { get; set; }

    [Required]
    public DateTime EndDateTime { get; set; }

    [Range(1, 100000)]
    public int AttendeeCount { get; set; }

    public ConferencePricingType PricingType { get; set; } = ConferencePricingType.Hourly;

    [Range(0, double.MaxValue)]
    public decimal? CustomBaseAmount { get; set; }

    [Range(0, double.MaxValue)]
    public decimal DepositRequired { get; set; }

    [Range(0, 1440)]
    public int? SetupBufferMinutes { get; set; }

    [Range(0, 1440)]
    public int? TeardownBufferMinutes { get; set; }

    public ConferenceBookingStatus Status { get; set; } = ConferenceBookingStatus.Inquiry;

    [StringLength(ConferenceBooking.MaxNotesLength)]
    public string Notes { get; set; }

    [StringLength(ConferenceBooking.MaxSpecialRequestsLength)]
    public string SpecialRequests { get; set; }

    public List<CreateConferenceBookingAddOnDto> AddOns { get; set; } = [];

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (EndDateTime <= StartDateTime)
            yield return new ValidationResult("EndDateTime must be after StartDateTime.", [nameof(EndDateTime)]);

        if (OrganizerType == ConferenceOrganizerType.Company && string.IsNullOrWhiteSpace(CompanyName))
            yield return new ValidationResult("CompanyName is required for company bookings.", [nameof(CompanyName)]);
    }
}

public class UpdateConferenceBookingDto : CreateConferenceBookingDto
{
    [Required]
    public Guid Id { get; set; }
}

public class RecordConferenceBookingPaymentDto
{
    [Required]
    public Guid ConferenceBookingId { get; set; }

    [Required]
    public Guid PaymentMethodId { get; set; }

    [Range(0.01, double.MaxValue)]
    public decimal Amount { get; set; }

    [Required]
    public DateTime PaidDate { get; set; }

    [StringLength(ConferenceBookingPayment.MaxReferenceNoLength)]
    public string ReferenceNo { get; set; }
}

public class GetConferenceBookingsInput : PagedResultFilterRequestDto, IShouldNormalize
{
    public ConferenceBookingStatus? Status { get; set; }
    public Guid? VenueId { get; set; }
    public DateTime? StartFrom { get; set; }
    public DateTime? EndTo { get; set; }
    public Guid? ExcludeBookingId { get; set; }

    public void Normalize()
    {
        Sorting ??= "StartDateTime desc";
    }
}

public class CheckConferenceBookingAvailabilityInput : IValidatableObject
{
    [Required]
    public Guid VenueId { get; set; }

    [Required]
    public DateTime StartDateTime { get; set; }

    [Required]
    public DateTime EndDateTime { get; set; }

    public Guid? BookingId { get; set; }

    [Range(0, 1440)]
    public int? SetupBufferMinutes { get; set; }

    [Range(0, 1440)]
    public int? TeardownBufferMinutes { get; set; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (EndDateTime <= StartDateTime)
            yield return new ValidationResult("EndDateTime must be after StartDateTime.", [nameof(EndDateTime)]);
    }
}

public class ConferenceBookingAvailabilityDto
{
    public bool IsAvailable { get; set; }
    public Guid? ConflictingBookingId { get; set; }
    public string ConflictingBookingNo { get; set; }
    public string Message { get; set; }
}