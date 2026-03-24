using Abp.Application.Services.Dto;
using Abp.Runtime.Validation;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace PMS.App.ExtraBeds.Dto;

/// <summary>Represents one date-effective pricing row for an extra-bed type.</summary>
public class ExtraBedPriceDto : EntityDto<Guid>
{
    public Guid ExtraBedTypeId { get; set; }
    public string ExtraBedTypeName { get; set; }

    [Range(0.01, double.MaxValue)]
    public decimal RatePerNight { get; set; }

    public DateTime EffectiveFrom { get; set; }
    public DateTime? EffectiveTo { get; set; }
    public bool IsActive { get; set; }
}

/// <summary>Current (date-resolved) rate per extra-bed type, keyed by ExtraBedTypeId.</summary>
public class ExtraBedCurrentPriceDto
{
    public Guid ExtraBedTypeId { get; set; }
    public string ExtraBedTypeName { get; set; }
    public decimal RatePerNight { get; set; }
}

public class GetExtraBedPricesByTypeInput
{
    [Required]
    public Guid ExtraBedTypeId { get; set; }
}

public class GetCurrentExtraBedPricesInput
{
    /// <summary>Date for which to resolve the effective rate (defaults to today when null).</summary>
    public DateTime? AsOfDate { get; set; }
}

public class CreateExtraBedPriceDto
{
    [Required]
    public Guid ExtraBedTypeId { get; set; }

    [Range(0.01, double.MaxValue)]
    public decimal RatePerNight { get; set; }

    [Required]
    public DateTime EffectiveFrom { get; set; }

    public DateTime? EffectiveTo { get; set; }
}

public class UpdateExtraBedPriceDto : CreateExtraBedPriceDto
{
    [Required]
    public Guid Id { get; set; }

    public bool IsActive { get; set; }
}
