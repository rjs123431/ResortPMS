using Abp.Application.Services.Dto;
using Abp.AutoMapper;
using Abp.Runtime.Validation;
using PMS.Dto;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace PMS.App.ConferenceVenueBlackouts.Dto;

[AutoMapFrom(typeof(ConferenceVenueBlackout))]
public class ConferenceVenueBlackoutDto : EntityDto<Guid>
{
    public Guid VenueId { get; set; }
    public string VenueName { get; set; }
    public string Title { get; set; }
    public DateTime StartDateTime { get; set; }
    public DateTime EndDateTime { get; set; }
    public string Notes { get; set; }
}

[AutoMapFrom(typeof(ConferenceVenueBlackout))]
public class ConferenceVenueBlackoutListDto : EntityDto<Guid>
{
    public Guid VenueId { get; set; }
    public string VenueName { get; set; }
    public string Title { get; set; }
    public DateTime StartDateTime { get; set; }
    public DateTime EndDateTime { get; set; }
    public string Notes { get; set; }
}

public class CreateConferenceVenueBlackoutDto : IValidatableObject
{
    [Required]
    public Guid VenueId { get; set; }

    [Required]
    [StringLength(ConferenceVenueBlackout.MaxTitleLength)]
    public string Title { get; set; }

    [Required]
    public DateTime StartDateTime { get; set; }

    [Required]
    public DateTime EndDateTime { get; set; }

    [StringLength(ConferenceVenueBlackout.MaxNotesLength)]
    public string Notes { get; set; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (EndDateTime <= StartDateTime)
            yield return new ValidationResult("EndDateTime must be after StartDateTime.", [nameof(EndDateTime)]);
    }
}

public class UpdateConferenceVenueBlackoutDto : CreateConferenceVenueBlackoutDto
{
    [Required]
    public Guid Id { get; set; }
}

public class GetConferenceVenueBlackoutsInput : PagedResultFilterRequestDto, IShouldNormalize
{
    public Guid? VenueId { get; set; }
    public DateTime? StartFrom { get; set; }
    public DateTime? EndTo { get; set; }

    public void Normalize()
    {
        Sorting ??= "StartDateTime asc";
    }
}