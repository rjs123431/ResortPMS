using Abp.Application.Services.Dto;
using Abp.AutoMapper;
using Abp.Runtime.Validation;
using PMS.App;
using PMS.Dto;
using System;
using System.ComponentModel.DataAnnotations;

namespace PMS.App.ConferenceExtras.Dto;

[AutoMapFrom(typeof(ConferenceExtra))]
public class ConferenceExtraDto : EntityDto<Guid>
{
    public string Code { get; set; }
    public string Name { get; set; }
    public string Category { get; set; }
    public string UnitLabel { get; set; }
    public decimal DefaultPrice { get; set; }
    public int SortOrder { get; set; }
    public bool IsActive { get; set; }
}

[AutoMapFrom(typeof(ConferenceExtra))]
public class ConferenceExtraListDto : EntityDto<Guid>
{
    public string Code { get; set; }
    public string Name { get; set; }
    public string Category { get; set; }
    public string UnitLabel { get; set; }
    public decimal DefaultPrice { get; set; }
    public int SortOrder { get; set; }
    public bool IsActive { get; set; }
}

[AutoMapTo(typeof(ConferenceExtra))]
public class CreateConferenceExtraDto
{
    [Required]
    [StringLength(ConferenceExtra.MaxCodeLength)]
    public string Code { get; set; }

    [Required]
    [StringLength(ConferenceExtra.MaxNameLength)]
    public string Name { get; set; }

    [StringLength(ConferenceExtra.MaxCategoryLength)]
    public string Category { get; set; }

    [StringLength(ConferenceExtra.MaxUnitLabelLength)]
    public string UnitLabel { get; set; }

    [Range(0, double.MaxValue)]
    public decimal DefaultPrice { get; set; }

    public int SortOrder { get; set; }

    public bool IsActive { get; set; } = true;
}

public class UpdateConferenceExtraDto : CreateConferenceExtraDto
{
    [Required]
    public Guid Id { get; set; }
}

public class GetConferenceExtrasInput : PagedResultFilterRequestDto, IShouldNormalize
{
    public void Normalize()
    {
        Sorting ??= "Category asc, SortOrder asc, Name asc";
    }
}