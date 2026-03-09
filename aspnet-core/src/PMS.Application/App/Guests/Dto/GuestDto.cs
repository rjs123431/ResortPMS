using Abp.Application.Services.Dto;
using Abp.AutoMapper;
using PMS.App;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace PMS.App.Guests.Dto;

[AutoMapFrom(typeof(Guest))]
[AutoMapTo(typeof(Guest))]
public class GuestDto : EntityDto<Guid>
{
    [Required]
    [StringLength(32)]
    public string GuestCode { get; set; }
    [Required][StringLength(128)] public string FirstName { get; set; }
    [Required][StringLength(128)] public string LastName { get; set; }
    [StringLength(128)] public string MiddleName { get; set; }
    public DateTime? DateOfBirth { get; set; }
    [StringLength(16)] public string Gender { get; set; }
    [StringLength(256)] public string Email { get; set; }
    [StringLength(32)] public string Phone { get; set; }
    [StringLength(64)] public string Nationality { get; set; }
    [StringLength(1024)] public string Notes { get; set; }
    public bool IsActive { get; set; }
    public List<GuestIdentificationDto> Identifications { get; set; } = [];
}

[AutoMapFrom(typeof(Guest))]
public class GuestListDto : EntityDto<Guid>
{
    public string GuestCode { get; set; }
    public string FirstName { get; set; }
    public string LastName { get; set; }
    public string Email { get; set; }
    public string Phone { get; set; }
    public string Nationality { get; set; }
    public bool IsActive { get; set; }
    public string FullName => $"{FirstName} {LastName}".Trim();
}

[AutoMapTo(typeof(Guest))]
public class CreateGuestDto
{
    [Required][StringLength(32)] public string GuestCode { get; set; }
    [Required][StringLength(128)] public string FirstName { get; set; }
    [Required][StringLength(128)] public string LastName { get; set; }
    [StringLength(128)] public string MiddleName { get; set; }
    public DateTime? DateOfBirth { get; set; }
    [StringLength(16)] public string Gender { get; set; }
    [StringLength(256)][EmailAddress] public string Email { get; set; }
    [StringLength(32)] public string Phone { get; set; }
    [StringLength(64)] public string Nationality { get; set; }
    [StringLength(1024)] public string Notes { get; set; }
}

[AutoMapFrom(typeof(GuestIdentification))]
[AutoMapTo(typeof(GuestIdentification))]
public class GuestIdentificationDto : EntityDto<Guid>
{
    public Guid GuestId { get; set; }
    [Required][StringLength(64)] public string IdentificationType { get; set; }
    [Required][StringLength(64)] public string IdentificationNumber { get; set; }
    public DateTime? ExpiryDate { get; set; }
    public DateTime? IssuedDate { get; set; }
}
