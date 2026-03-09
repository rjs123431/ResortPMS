using Abp.Authorization.Users;
using Abp.Extensions;
using System;
using System.Collections.Generic;

namespace PMS.Authorization.Users;

public class User : AbpUser<User>
{
    public const string DefaultPassword = "Simple01";

    public override string FullName => Surname + ", " + Name;

    public bool AccessAnywhere { get; set; } = false;

    public static string CreateRandomPassword(int length = 16)
    {
        return Guid.NewGuid().ToString("N").Truncate(length);
    }

    public static User CreateTenantAdminUser(int tenantId, string emailAddress, string adminUsername = "admin")
    {
        var user = new User
        {
            TenantId = tenantId,
            UserName = adminUsername,
            Name = adminUsername,
            Surname = adminUsername,
            EmailAddress = emailAddress,
            Roles = new List<UserRole>()
        };

        user.SetNormalizedNames();

        return user;
    }

    public static User CreateNewUser(int tenantId, string emailAddress, string username)
    {
        var user = new User
        {
            TenantId = tenantId,
            UserName = username,
            EmailAddress = emailAddress,
            Roles = new List<UserRole>()
        };

        user.SetNormalizedNames();

        return user;
    }

}





