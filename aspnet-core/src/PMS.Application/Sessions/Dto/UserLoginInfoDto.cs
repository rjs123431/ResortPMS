using Abp.Application.Services.Dto;
using Abp.AutoMapper;
using PMS.Authorization.Users;
using System;

namespace PMS.Sessions.Dto;

[AutoMapFrom(typeof(User))]
public class UserLoginInfoDto : EntityDto<long>
{
    public string Name { get; set; }

    public string Surname { get; set; }

    public string UserName { get; set; }

    public string EmailAddress { get; set; }

    public long? EmployeeId { get; set; }

    public Guid? ProfilePictureFileObjectId { get; set; }
}

