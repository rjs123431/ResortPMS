using Abp.Auditing;
using Abp.Authorization.Users;
using System.ComponentModel.DataAnnotations;

namespace PMS.Authorization.Accounts.Dto;

public class RegisterInput
{
    [Required]
    [StringLength(AbpUserBase.MaxNameLength)]
    public string FirstName { get; set; }

    [Required]
    [StringLength(AbpUserBase.MaxSurnameLength)]
    public string LastName { get; set; }

    [Required]
    [StringLength(AbpUserBase.MaxUserNameLength)]
    public string SssNumber { get; set; }

    [Required]
    [EmailAddress]
    [StringLength(AbpUserBase.MaxEmailAddressLength)]
    public string EmailAddress { get; set; }

    [Required]
    [StringLength(AbpUserBase.MaxPlainPasswordLength)]
    [DisableAuditing]
    public string Password { get; set; }
}

