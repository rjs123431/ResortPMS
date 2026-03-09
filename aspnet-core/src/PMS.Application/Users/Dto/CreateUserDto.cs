using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using Abp.Application.Services.Dto;
using Abp.Auditing;
using Abp.Authorization.Users;
using Abp.AutoMapper;
using Abp.Runtime.Validation;
using PMS.Authorization.Users;

namespace PMS.Users.Dto
{
    [AutoMapTo(typeof(User))]
    public class CreateUserDto :EntityDto<long>, IShouldNormalize
    {
        public CreateUserDto()
        {
            Employees = new List<AppUserAccountEmployeeDto>();
        }
        [Required]
        [StringLength(AbpUserBase.MaxUserNameLength)]
        public string UserName { get; set; }

        [Required]
        [StringLength(AbpUserBase.MaxNameLength)]
        public string Name { get; set; }

        [Required]
        [StringLength(AbpUserBase.MaxSurnameLength)]
        public string Surname { get; set; }

        [Required]
        [EmailAddress]
        [StringLength(AbpUserBase.MaxEmailAddressLength)]
        public string EmailAddress { get; set; }

        public long? TeamId { get; set; }

        public bool IsActive { get; set; }

        public string[] RoleNames { get; set; }

        [Required]
        [StringLength(AbpUserBase.MaxPlainPasswordLength)]
        [DisableAuditing]
        public string Password { get; set; }

        public long? EmployeeId { get; set; }

        public void Normalize()
        {
            if (RoleNames == null)
            {
                RoleNames = new string[0];
            }
        }
        public List<AppUserAccountEmployeeDto> Employees { get; set; }
    }
    public class AppUserAccountEmployeeDto : EntityDto<long>
    {
        public long UserId { get; set; }
        public long EmployeeId { get; set; }
        public string EmployeeName { get; set; }

    }
}





