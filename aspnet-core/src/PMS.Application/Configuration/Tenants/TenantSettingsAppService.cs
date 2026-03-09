using Abp.Configuration;
using Abp.Configuration.Startup;
using Abp.Extensions;
using Abp.Net.Mail;
using Abp.Runtime.Security;
using Abp.Runtime.Session;
using Abp.Timing;
using PMS.Configuration.Dto;
using PMS.Configuration.Tenants.Dto;
using PMS.Timing;
using System.Globalization;
using System.Threading.Tasks;
using Abp.Authorization;
using PMS.Authorization;

namespace PMS.Configuration.Tenants
{
    [AbpAuthorize]
    public class TenantSettingsAppService : SettingsAppServiceBase, ITenantSettingsAppService
    {

        private readonly IMultiTenancyConfig _multiTenancyConfig;
        private readonly ITimeZoneService _timeZoneService;

        public TenantSettingsAppService(
            IMultiTenancyConfig multiTenancyConfig,
            ITimeZoneService timeZoneService,
            IEmailSender emailSender,
            IAppConfigurationAccessor configurationAccessor
            ) : base(emailSender, configurationAccessor)
        {
            _multiTenancyConfig = multiTenancyConfig;
            _timeZoneService = timeZoneService;
        }

        #region Get Settings

        [AbpAuthorize(PermissionNames.Pages_Admin_Settings)]
        public async Task<TenantSettingsEditDto> GetAllSettings()
        {
            var settings = new TenantSettingsEditDto
            {
                Email = await GetEmailSettingsAsync(),
            };

            if (!_multiTenancyConfig.IsEnabled || Clock.SupportsMultipleTimezone)
            {
                settings.General = await GetGeneralSettingsAsync();
            }

            return settings;
        }

        private async Task<TenantEmailSettingsEditDto> GetEmailSettingsAsync()
        {
            var useHostDefaultEmailSettings = await SettingManager.GetSettingValueForTenantAsync<bool>(AppSettingNames.Email.UseHostDefaultEmailSettings, AbpSession.GetTenantId());

            if (useHostDefaultEmailSettings)
            {
                return new TenantEmailSettingsEditDto
                {
                    UseHostDefaultEmailSettings = true
                };
            }

            var smtpPassword = await SettingManager.GetSettingValueForTenantAsync(EmailSettingNames.Smtp.Password, AbpSession.GetTenantId());

            return new TenantEmailSettingsEditDto
            {
                UseHostDefaultEmailSettings = false,
                DefaultFromAddress = await SettingManager.GetSettingValueForTenantAsync(EmailSettingNames.DefaultFromAddress, AbpSession.GetTenantId()),
                DefaultFromDisplayName = await SettingManager.GetSettingValueForTenantAsync(EmailSettingNames.DefaultFromDisplayName, AbpSession.GetTenantId()),
                SmtpHost = await SettingManager.GetSettingValueForTenantAsync(EmailSettingNames.Smtp.Host, AbpSession.GetTenantId()),
                SmtpPort = await SettingManager.GetSettingValueForTenantAsync<int>(EmailSettingNames.Smtp.Port, AbpSession.GetTenantId()),
                SmtpUserName = await SettingManager.GetSettingValueForTenantAsync(EmailSettingNames.Smtp.UserName, AbpSession.GetTenantId()),
                SmtpPassword = SimpleStringCipher.Instance.Decrypt(smtpPassword),
                SmtpDomain = await SettingManager.GetSettingValueForTenantAsync(EmailSettingNames.Smtp.Domain, AbpSession.GetTenantId()),
                SmtpEnableSsl = await SettingManager.GetSettingValueForTenantAsync<bool>(EmailSettingNames.Smtp.EnableSsl, AbpSession.GetTenantId()),
                SmtpUseDefaultCredentials = await SettingManager.GetSettingValueForTenantAsync<bool>(EmailSettingNames.Smtp.UseDefaultCredentials, AbpSession.GetTenantId())
            };
        }

        private async Task<GeneralSettingsEditDto> GetGeneralSettingsAsync()
        {
            var settings = new GeneralSettingsEditDto();

            if (Clock.SupportsMultipleTimezone)
            {
                var timezone = await SettingManager.GetSettingValueForTenantAsync(TimingSettingNames.TimeZone, AbpSession.GetTenantId());

                settings.Timezone = timezone;
                settings.TimezoneForComparison = timezone;
            }

            var defaultTimeZoneId = await _timeZoneService.GetDefaultTimezoneAsync(SettingScopes.Tenant, AbpSession.TenantId);

            if (settings.Timezone == defaultTimeZoneId)
            {
                settings.Timezone = string.Empty;
            }

            return settings;
        }

        #endregion

        #region Update Settings
        
        [AbpAuthorize(PermissionNames.Pages_Admin_Settings)]
        public async Task UpdateAllSettings(TenantSettingsEditDto input)
        {
            await UpdateEmailSettingsAsync(input.Email);

            //Time Zone
            if (Clock.SupportsMultipleTimezone)
            {
                if (input.General.Timezone.IsNullOrEmpty())
                {
                    var defaultValue = await _timeZoneService.GetDefaultTimezoneAsync(SettingScopes.Tenant, AbpSession.TenantId);
                    await SettingManager.ChangeSettingForTenantAsync(AbpSession.GetTenantId(), TimingSettingNames.TimeZone, defaultValue);
                }
                else
                {
                    await SettingManager.ChangeSettingForTenantAsync(AbpSession.GetTenantId(), TimingSettingNames.TimeZone, input.General.Timezone);
                }
            }
        }

        private async Task UpdateEmailSettingsAsync(TenantEmailSettingsEditDto input)
        {
            if (_multiTenancyConfig.IsEnabled && !PMSConsts.AllowTenantsToChangeEmailSettings)
            {
                return;
            }

            var useHostDefaultEmailSettings = _multiTenancyConfig.IsEnabled && input.UseHostDefaultEmailSettings;

            if (useHostDefaultEmailSettings)
            {
                var smtpPassword = await SettingManager.GetSettingValueForApplicationAsync(EmailSettingNames.Smtp.Password);

                input = new TenantEmailSettingsEditDto
                {
                    UseHostDefaultEmailSettings = true,
                    DefaultFromAddress = await SettingManager.GetSettingValueForApplicationAsync(EmailSettingNames.DefaultFromAddress),
                    DefaultFromDisplayName = await SettingManager.GetSettingValueForApplicationAsync(EmailSettingNames.DefaultFromDisplayName),
                    SmtpHost = await SettingManager.GetSettingValueForApplicationAsync(EmailSettingNames.Smtp.Host),
                    SmtpPort = await SettingManager.GetSettingValueForApplicationAsync<int>(EmailSettingNames.Smtp.Port),
                    SmtpUserName = await SettingManager.GetSettingValueForApplicationAsync(EmailSettingNames.Smtp.UserName),
                    SmtpPassword = SimpleStringCipher.Instance.Decrypt(smtpPassword),
                    SmtpDomain = await SettingManager.GetSettingValueForApplicationAsync(EmailSettingNames.Smtp.Domain),
                    SmtpEnableSsl = await SettingManager.GetSettingValueForApplicationAsync<bool>(EmailSettingNames.Smtp.EnableSsl),
                    SmtpUseDefaultCredentials = await SettingManager.GetSettingValueForApplicationAsync<bool>(EmailSettingNames.Smtp.UseDefaultCredentials)
                };
            }

            await SettingManager.ChangeSettingForTenantAsync(AbpSession.GetTenantId(), AppSettingNames.Email.UseHostDefaultEmailSettings, useHostDefaultEmailSettings.ToString().ToLowerInvariant());
            await SettingManager.ChangeSettingForTenantAsync(AbpSession.GetTenantId(), EmailSettingNames.DefaultFromAddress, input.DefaultFromAddress);
            await SettingManager.ChangeSettingForTenantAsync(AbpSession.GetTenantId(), EmailSettingNames.DefaultFromDisplayName, input.DefaultFromDisplayName);
            await SettingManager.ChangeSettingForTenantAsync(AbpSession.GetTenantId(), EmailSettingNames.Smtp.Host, input.SmtpHost);
            await SettingManager.ChangeSettingForTenantAsync(AbpSession.GetTenantId(), EmailSettingNames.Smtp.Port, input.SmtpPort.ToString(CultureInfo.InvariantCulture));
            await SettingManager.ChangeSettingForTenantAsync(AbpSession.GetTenantId(), EmailSettingNames.Smtp.UserName, input.SmtpUserName);
            await SettingManager.ChangeSettingForTenantAsync(AbpSession.GetTenantId(), EmailSettingNames.Smtp.Password, SimpleStringCipher.Instance.Encrypt(input.SmtpPassword));
            await SettingManager.ChangeSettingForTenantAsync(AbpSession.GetTenantId(), EmailSettingNames.Smtp.Domain, input.SmtpDomain);
            await SettingManager.ChangeSettingForTenantAsync(AbpSession.GetTenantId(), EmailSettingNames.Smtp.EnableSsl, input.SmtpEnableSsl.ToString().ToLowerInvariant());
            await SettingManager.ChangeSettingForTenantAsync(AbpSession.GetTenantId(), EmailSettingNames.Smtp.UseDefaultCredentials, input.SmtpUseDefaultCredentials.ToString().ToLowerInvariant());
        }

        #endregion
    }
}





