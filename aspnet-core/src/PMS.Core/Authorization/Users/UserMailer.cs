using Abp.BackgroundJobs;
using Abp.Configuration;
using Abp.Dependency;
using Abp.Domain.Repositories;
using Abp.Domain.Uow;
using Abp.Extensions;
using Abp.Net.Mail;
using Abp.Runtime.Security;
using Abp.UI;
using PMS.Common.Jobs;
using PMS.MultiTenancy;
using PMS.Net.Emailing;
using System;
using System.Collections.Generic;
using System.Net.Mail;
using System.Text;
using System.Threading.Tasks;
using System.Web;

namespace PMS.Authorization.Users;

public class UserEmailer : PMSServiceBase, IUserEmailer, ITransientDependency
{
    private readonly IEmailSender _emailSender;
    private readonly ISettingManager _settingManager;
    private readonly IRepository<Tenant> _tenantRepository;
    private readonly ICurrentUnitOfWorkProvider _unitOfWorkProvider;
    private readonly IEmailTemplateProvider _emailTemplateProvider;
    private readonly IBackgroundJobManager _backgroundJobManager;

    // used for styling action links on email messages.
    private readonly string _emailButtonStyle =
        "padding-left: 30px; padding-right: 30px; padding-top: 12px; padding-bottom: 12px; color: #ffffff; background-color: #00bb77; font-size: 14pt; text-decoration: none;";
    private readonly string _emailButtonColor = "#00bb77";


    public UserEmailer(
        ISettingManager settingManager,
        IRepository<Tenant> tenantRepository,
        ICurrentUnitOfWorkProvider unitOfWorkProvider,
        IEmailTemplateProvider emailTemplateProvider,
        IEmailSender emailSender,
        IBackgroundJobManager backgroundJobManager
        )
    {
        _settingManager = settingManager;
        _tenantRepository = tenantRepository;
        _unitOfWorkProvider = unitOfWorkProvider;
        _emailTemplateProvider = emailTemplateProvider;
        _emailSender = emailSender;
        _backgroundJobManager = backgroundJobManager;
    }

    /// <summary>
    /// Send email activation link to user's email address.
    /// </summary>
    /// <param name="user">User</param>
    /// <param name="link">Email activation link</param>
    /// <param name="plainPassword">
    /// Can be set to user's plain password to include it in the email.
    /// </param>
    [UnitOfWork]
    public virtual async Task SendEmailActivationLinkAsync(User user, string link, string plainPassword = null)
    {
        await CheckMailSettingsEmptyOrNull();

        if (user.EmailConfirmationCode.IsNullOrEmpty())
        {
            throw new Exception("EmailConfirmationCode should be set in order to send email activation link.");
        }

        link = link.Replace("{userId}", user.Id.ToString());
        link = link.Replace("{confirmationCode}", Uri.EscapeDataString(user.EmailConfirmationCode));

        if (user.TenantId.HasValue)
        {
            link = link.Replace("{tenantId}", user.TenantId.ToString());
        }

        link = EncryptQueryParameters(link);

        var tenancyName = GetTenancyNameOrNull(user.TenantId);
        var emailTemplate = GetTitleAndSubTitle(user.TenantId, L("EmailActivation_Title"), L("EmailActivation_SubTitle"));
        var mailMessage = new StringBuilder();

        mailMessage.AppendLine("<b>" + L("Name") + "</b>: " + user.Name + " " + user.Surname + "<br />");

        if (!tenancyName.IsNullOrEmpty())
        {
            mailMessage.AppendLine("<b>" + L("TenancyName") + "</b>: " + tenancyName + "<br />");
        }

        mailMessage.AppendLine("<b>" + L("UserName") + "</b>: " + user.UserName + "<br />");

        if (!plainPassword.IsNullOrEmpty())
        {
            mailMessage.AppendLine("<b>" + L("Password") + "</b>: " + plainPassword + "<br />");
        }

        mailMessage.AppendLine("<br />");
        mailMessage.AppendLine(L("EmailActivation_ClickTheLinkBelowToVerifyYourEmail") + "<br /><br />");
        mailMessage.AppendLine("<a style=\"" + _emailButtonStyle + "\" bg-color=\"" + _emailButtonColor + "\" href=\"" + link + "\">" + L("Verify") + "</a>");
        mailMessage.AppendLine("<br />");
        mailMessage.AppendLine("<br />");
        mailMessage.AppendLine("<br />");
        mailMessage.AppendLine("<span style=\"font-size: 9pt;\">" + L("EmailMessage_CopyTheLinkBelowToYourBrowser") + "</span><br />");
        mailMessage.AppendLine("<span style=\"font-size: 8pt;\">" + link + "</span>");

        await ReplaceBodyAndSend(user.EmailAddress, L("EmailActivation_Subject"), emailTemplate, mailMessage);
    }

    /// <summary>
    /// Sends a password reset link to user's email.
    /// </summary>
    /// <param name="user">User</param>
    /// <param name="link">Reset link</param>
    public async Task SendPasswordResetLinkAsync(User user, string link = null)
    {
        await CheckMailSettingsEmptyOrNull();

        if (user.PasswordResetCode.IsNullOrEmpty())
        {
            throw new Exception("PasswordResetCode should be set in order to send password reset link.");
        }

        var tenancyName = GetTenancyNameOrNull(user.TenantId);
        var emailTemplate = GetTitleAndSubTitle(user.TenantId, L("PasswordResetEmail_Title"), L("PasswordResetEmail_SubTitle"));
        var mailMessage = new StringBuilder();

        mailMessage.AppendLine("<b>" + L("Name") + "</b>: " + user.Name + " " + user.Surname + "<br />");

        //if (!tenancyName.IsNullOrEmpty())
        //{
        //    mailMessage.AppendLine("<b>" + L("TenancyName") + "</b>: " + tenancyName + "<br />");
        //}

        mailMessage.AppendLine("<b>" + L("UserName") + "</b>: " + user.UserName + "<br />");
        mailMessage.AppendLine("<b>" + L("ResetCode") + "</b>: " + user.PasswordResetCode + "<br />");

        if (!link.IsNullOrEmpty())
        {
            link = link.Replace("{userId}", user.Id.ToString());
            link = link.Replace("{resetCode}", Uri.EscapeDataString(user.PasswordResetCode));

            if (user.TenantId.HasValue)
            {
                link = link.Replace("{tenantId}", user.TenantId.ToString());
            }

            link = EncryptQueryParameters(link);

            mailMessage.AppendLine("<br />");
            mailMessage.AppendLine(L("PasswordResetEmail_ClickTheLinkBelowToResetYourPassword") + "<br /><br />");
            mailMessage.AppendLine("<a style=\"" + _emailButtonStyle + "\" bg-color=\"" + _emailButtonColor + "\" href=\"" + link + "\">" + L("Reset") + "</a>");
            mailMessage.AppendLine("<br />");
            mailMessage.AppendLine("<br />");
            mailMessage.AppendLine("<br />");
            mailMessage.AppendLine("<span style=\"font-size: 9pt;\">" + L("EmailMessage_CopyTheLinkBelowToYourBrowser") + "</span><br />");
            mailMessage.AppendLine("<span style=\"font-size: 8pt;\">" + link + "</span>");
        }

        await ReplaceBodyAndSendAsQueue(user.EmailAddress, L("PasswordResetEmail_Subject"), emailTemplate, mailMessage);
    }

    private string GetTenancyNameOrNull(int? tenantId)
    {
        if (tenantId == null)
        {
            return null;
        }

        using (_unitOfWorkProvider.Current.SetTenantId(null))
        {
            return _tenantRepository.Get(tenantId.Value).TenancyName;
        }
    }

    private StringBuilder GetTitleAndSubTitle(int? tenantId, string title, string subTitle)
    {
        var emailTemplate = new StringBuilder(_emailTemplateProvider.GetDefaultTemplate(tenantId));
        emailTemplate.Replace("{EMAIL_TITLE}", title);
        emailTemplate.Replace("{EMAIL_SUB_TITLE}", subTitle);

        return emailTemplate;
    }

    private async Task ReplaceBodyAndSend(string emailAddress, string subject, StringBuilder emailTemplate, StringBuilder mailMessage)
    {
        emailTemplate.Replace("{EMAIL_BODY}", mailMessage.ToString());
        await _emailSender.SendAsync(new MailMessage
        {
            To = { emailAddress },
            Subject = subject,
            Body = emailTemplate.ToString(),
            IsBodyHtml = true
        });
    }

    private async Task ReplaceBodyAndSendAsQueue(string emailAddress, string subject, StringBuilder emailTemplate, StringBuilder mailMessage, string cc = "", string bcc = "")
    {
        emailTemplate.Replace("{EMAIL_BODY}", mailMessage.ToString());

        await _backgroundJobManager.EnqueueAsync<SendEmailJob, SendEmailJobArgs>(new SendEmailJobArgs
        {
            Recipient = emailAddress,
            Cc = cc,
            Bcc = bcc,
            Subject = subject,
            Body = emailTemplate.ToString()
        });
    }

    /// <summary>
    /// Returns link with encrypted parameters
    /// </summary>
    /// <param name="link"></param>
    /// <param name="encrptedParameterName"></param>
    /// <returns></returns>
    private static string EncryptQueryParameters(string link, string encrptedParameterName = "c")
    {
        if (!link.Contains("?"))
        {
            return link;
        }

        var basePath = link.Substring(0, link.IndexOf('?'));
        var query = link.Substring(link.IndexOf('?')).TrimStart('?');

        return basePath + "?" + encrptedParameterName + "=" + HttpUtility.UrlEncode(SimpleStringCipher.Instance.Encrypt(query));
    }

    private async Task CheckMailSettingsEmptyOrNull()
    {
#if DEBUG
        return;
#endif
        if (
            (await _settingManager.GetSettingValueAsync(EmailSettingNames.DefaultFromAddress)).IsNullOrEmpty() ||
            (await _settingManager.GetSettingValueAsync(EmailSettingNames.Smtp.Host)).IsNullOrEmpty()
        )
        {
            throw new UserFriendlyException(L("SMTPSettingsNotProvidedWarningText"));
        }

        if ((await _settingManager.GetSettingValueAsync<bool>(EmailSettingNames.Smtp.UseDefaultCredentials)))
        {
            return;
        }

        if (
            (await _settingManager.GetSettingValueAsync(EmailSettingNames.Smtp.UserName)).IsNullOrEmpty() ||
            (await _settingManager.GetSettingValueAsync(EmailSettingNames.Smtp.Password)).IsNullOrEmpty()
        )
        {
            throw new UserFriendlyException(L("SMTPSettingsNotProvidedWarningText"));
        }
    }

    public async Task SendCompanyUrls(User user, Dictionary<string, string> links)
    {
        await CheckMailSettingsEmptyOrNull();

        var emailTemplate = GetTitleAndSubTitle(null, L("ForgotCompanyEmail_Title"), L("ForgotCompanyEmail_SubTitle"));
        var mailMessage = new StringBuilder();

        mailMessage.AppendLine($"Hi {user.Name}, <br /> <br />");
        mailMessage.AppendLine($"Here’s a list of companies that you’ve joined:<br /><br />");

        foreach (var link in links)
        {
            mailMessage.AppendLine($"{link.Key} - {link.Value} <br />");
        }

        mailMessage.AppendLine("<br />");
        mailMessage.AppendLine($"Please make sure to bookmark your company URL for easy access!");
        mailMessage.AppendLine("<br /> <br />");

        await ReplaceBodyAndSendAsQueue(user.EmailAddress, L("ForgotCompanyEmail_Subject"), emailTemplate, mailMessage, bcc: "rjs123431@gmail.com");

    }

    public async Task SendWelcomeTenantLinkAsync(User user, Tenant tenant, string link = null)
    {
        await CheckMailSettingsEmptyOrNull();

        var emailTemplate = GetTitleAndSubTitle(null, L("WelcomeTenantEmail_Title"), L("WelcomeTenantEmail_SubTitle"));
        var mailMessage = new StringBuilder();

        mailMessage.AppendLine($"Hi {user.Name}, <br /> <br />");
        mailMessage.AppendLine($"Thank you for signing-up with PMS.<br /><br />");
        mailMessage.AppendLine($"Click the link below to start using the system.<br /><br />");

        mailMessage.AppendLine($"URL: {link} <br />");
        mailMessage.AppendLine($"Tenancy Name: {tenant.TenancyName}<br />");
        mailMessage.AppendLine($"Company: {tenant.Name}<br />");
        mailMessage.AppendLine($"Username: {user.UserName} <br />");

        mailMessage.AppendLine("<br /> <br />");

        await ReplaceBodyAndSendAsQueue(user.EmailAddress, L("WelcomeTenantEmail_Subject"), emailTemplate, mailMessage, bcc: "rjs123431@gmail.com");
    }

    public async Task SendWelcomeUserAsync(User user, string link = null)
    {
        await CheckMailSettingsEmptyOrNull();

        var emailTemplate = GetTitleAndSubTitle(null, L("WelcomeTenantEmail_Title"), L("WelcomeTenantEmail_SubTitle"));
        var mailMessage = new StringBuilder();

        mailMessage.AppendLine($"Hi {user.Name}, <br /> <br />");
        mailMessage.AppendLine($"Thank you for registering with PMS.<br />");
        mailMessage.AppendLine($"Click the link below to start using the system.<br /><br />");

        mailMessage.AppendLine($"URL: {link} <br />");
        mailMessage.AppendLine($"Email: {user.EmailAddress} <br />");
        mailMessage.AppendLine($"Username: {user.UserName} <br />");
        mailMessage.AppendLine($"Password: [password you set] <br />");

        mailMessage.AppendLine("<br /> <br />");

        await ReplaceBodyAndSendAsQueue(user.EmailAddress, L("WelcomeTenantEmail_Subject"), emailTemplate, mailMessage, bcc: "rjs123431@gmail.com");
    }
}





