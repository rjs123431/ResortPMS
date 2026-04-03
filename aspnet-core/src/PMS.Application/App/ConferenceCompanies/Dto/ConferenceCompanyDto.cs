using Abp.Application.Services.Dto;
using Abp.AutoMapper;
using Abp.Runtime.Validation;
using PMS.Dto;
using System;
using System.ComponentModel.DataAnnotations;

namespace PMS.App.ConferenceCompanies.Dto;

[AutoMapFrom(typeof(ConferenceCompany))]
public class ConferenceCompanyDto : EntityDto<Guid>
{
    public string Name { get; set; }
    public string ContactPerson { get; set; }
    public string Phone { get; set; }
    public string Email { get; set; }
    public string Notes { get; set; }
    public bool IsActive { get; set; }
}

[AutoMapFrom(typeof(ConferenceCompany))]
public class ConferenceCompanyListDto : EntityDto<Guid>
{
    public string Name { get; set; }
    public string ContactPerson { get; set; }
    public string Phone { get; set; }
    public string Email { get; set; }
    public bool IsActive { get; set; }
}

public class CreateConferenceCompanyDto
{
    [Required]
    [StringLength(ConferenceCompany.MaxNameLength)]
    public string Name { get; set; }

    [StringLength(ConferenceCompany.MaxContactPersonLength)]
    public string ContactPerson { get; set; }

    [StringLength(ConferenceCompany.MaxPhoneLength)]
    public string Phone { get; set; }

    [StringLength(ConferenceCompany.MaxEmailLength)]
    public string Email { get; set; }

    [StringLength(ConferenceCompany.MaxNotesLength)]
    public string Notes { get; set; }

    public bool IsActive { get; set; } = true;
}

public class UpdateConferenceCompanyDto : CreateConferenceCompanyDto
{
    [Required]
    public Guid Id { get; set; }
}

public class GetConferenceCompaniesInput : PagedResultFilterRequestDto, IShouldNormalize
{
    public void Normalize()
    {
        Sorting ??= "Name asc";
    }
}