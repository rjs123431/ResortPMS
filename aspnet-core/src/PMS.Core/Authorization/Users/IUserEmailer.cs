using PMS.MultiTenancy;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace PMS.Authorization.Users;

public interface IUserEmailer
{
    /// <summary>
    /// Send email activation link to user's email address.
    /// </summary>
    /// <param name="user">User</param>
    /// <param name="link">Email activation link</param>
    /// <param name="plainPassword">
    /// Can be set to user's plain password to include it in the email.
    /// </param>
    Task SendEmailActivationLinkAsync(User user, string link, string plainPassword = null);

    /// <summary>
    /// Sends a password reset link to user's email.
    /// </summary>
    /// <param name="user">User</param>
    /// <param name="link">Password reset link (optional)</param>
    Task SendPasswordResetLinkAsync(User user, string link = null);

    /// <summary>
    /// Sends links of companies for an email
    /// </summary>
    /// <param name="email"></param>
    /// <param name="links"></param>
    /// <returns></returns>
    Task SendCompanyUrls(User user, Dictionary<string, string> links);

    /// <summary>
    /// Sends welcome email
    /// </summary>
    /// <param name="user"></param>
    /// <param name="tenantName"></param>
    /// <param name="link"></param>
    /// <returns></returns>
    Task SendWelcomeTenantLinkAsync(User user, Tenant tenant, string link = null);


    Task SendWelcomeUserAsync(User user, string link = null);

}
