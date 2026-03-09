using Abp.Authorization;
using PMS.Authorization.Roles;
using PMS.Authorization.Users;

namespace PMS.Authorization
{
    public class PermissionChecker : PermissionChecker<Role, User>
    {
        public PermissionChecker(UserManager userManager)
            : base(userManager)
        {
        }
    }
}





