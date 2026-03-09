using System.Security.Claims;
using PMS.Authorization.Users;

namespace PMS.Authorization.Impersonation;

public class UserAndIdentity(User user, ClaimsIdentity identity)
{
    public User User { get; set; } = user;

    public ClaimsIdentity Identity { get; set; } = identity;
}

