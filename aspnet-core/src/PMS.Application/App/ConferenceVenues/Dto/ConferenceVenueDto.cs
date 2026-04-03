using Abp.Application.Services.Dto;
using Abp.AutoMapper;
using Abp.Runtime.Validation;
using PMS.Dto;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace PMS.App.ConferenceVenues.Dto;

[AutoMapFrom(typeof(ConferenceVenue))]
public class ConferenceVenueDto : EntityDto<Guid>
{
    public string Code { get; set; }
    public string Name { get; set; }
    public string Category { get; set; }
    public int Capacity { get; set; }
    public decimal HourlyRate { get; set; }
    public decimal HalfDayRate { get; set; }
    public decimal FullDayRate { get; set; }
    public int SetupBufferMinutes { get; set; }
    public int TeardownBufferMinutes { get; set; }
    public string Description { get; set; }
    public bool IsActive { get; set; }
}

[AutoMapFrom(typeof(ConferenceVenue))]
public class ConferenceVenueListDto : EntityDto<Guid>
{
    public string Code { get; set; }
    public string Name { get; set; }
    public string Category { get; set; }
    public int Capacity { get; set; }
    public decimal HourlyRate { get; set; }
    public decimal HalfDayRate { get; set; }
    public decimal FullDayRate { get; set; }
    public bool IsActive { get; set; }
}

public class CreateConferenceVenueDto
{
    [Required]
    [StringLength(ConferenceVenue.MaxCodeLength)]
    public string Code { get; set; }

    [Required]
    [StringLength(ConferenceVenue.MaxNameLength)]
    public string Name { get; set; }

    [StringLength(ConferenceVenue.MaxCategoryLength)]
    public string Category { get; set; }

    [Range(1, 5000)]
    public int Capacity { get; set; }

    [Range(0, double.MaxValue)]
    public decimal HourlyRate { get; set; }

    [Range(0, double.MaxValue)]
    public decimal HalfDayRate { get; set; }

    [Range(0, double.MaxValue)]
    public decimal FullDayRate { get; set; }

    [Range(0, 1440)]
    public int SetupBufferMinutes { get; set; }

    [Range(0, 1440)]
    public int TeardownBufferMinutes { get; set; }

    [StringLength(ConferenceVenue.MaxDescriptionLength)]
    public string Description { get; set; }

    public bool IsActive { get; set; } = true;
}

public class UpdateConferenceVenueDto : CreateConferenceVenueDto
{
    [Required]
    public Guid Id { get; set; }
}

public class GetConferenceVenuesInput : PagedResultFilterRequestDto
{
}

public class GetAvailableConferenceVenuesInput : IValidatableObject
{
    [Required]
    public DateTime StartDateTime { get; set; }

    [Required]
    public DateTime EndDateTime { get; set; }

    [Range(1, 5000)]
    public int? AttendeeCount { get; set; }

    public Guid? ExcludeBookingId { get; set; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (EndDateTime <= StartDateTime)
            yield return new ValidationResult("EndDateTime must be after StartDateTime.", new[] { nameof(EndDateTime) });
    }
}

public class ConferenceVenueAvailabilityDto : EntityDto<Guid>
{
    public string Code { get; set; }
    public string Name { get; set; }
    public string Category { get; set; }
    public int Capacity { get; set; }
    public decimal HourlyRate { get; set; }
    public decimal HalfDayRate { get; set; }
    public decimal FullDayRate { get; set; }
    public bool IsAvailable { get; set; }
    public Guid? ConflictingBookingId { get; set; }
    public string ConflictingBookingNo { get; set; }
    public string Message { get; set; }
}