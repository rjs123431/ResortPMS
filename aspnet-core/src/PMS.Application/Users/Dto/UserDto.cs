using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using Abp.Application.Services.Dto;
using Abp.Authorization.Users;
using Abp.AutoMapper;
using PMS.Authorization.Users;

namespace PMS.Users.Dto
{
    [AutoMapFrom(typeof(User))]
    public class UserDto : EntityDto<long>
    {
        public UserDto()
        {
            Employees = new List<AppUserCreateAccountEmployeeDto>();
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

        public string FullName { get; set; }

        public DateTime? LastLoginTime { get; set; }

        public DateTime CreationTime { get; set; }

        public string[] RoleNames { get; set; }

        public long? EmployeeId { get; set; }
        public bool AccessAnywhere { get; set; } = false;
        public List<AppUserCreateAccountEmployeeDto> Employees { get; set; }
    }
    public class AppUserCreateAccountEmployeeDto : EntityDto<long>
    {
        public long UserId { get; set; }
        public long EmployeeId { get; set; }
        public string EmployeeName { get; set; }

    }
}





