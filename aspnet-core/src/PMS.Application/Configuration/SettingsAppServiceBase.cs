using Abp.Net.Mail;
using PMS.Configuration.Dto;
using System.Threading.Tasks;

namespace PMS.Configuration
{
    public class SettingsAppServiceBase : PMSAppServiceBase
    {
        private readonly IEmailSender _emailSender;
        private readonly IAppConfigurationAccessor _configurationAccessor;

        protected SettingsAppServiceBase(
            IEmailSender emailSender,
            IAppConfigurationAccessor configurationAccessor)
        {
            _emailSender = emailSender;
            _configurationAccessor = configurationAccessor;
        }

        public async Task SendTestEmail(SendTestEmailInput input)
        {
            await _emailSender.SendAsync(
                input.EmailAddress,
                L("TestEmail_Subject"),
                L("TestEmail_Body")
            );
        }
    }
}





