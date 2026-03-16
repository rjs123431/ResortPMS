using Abp.Configuration;
using Abp.Net.Mail;
using Microsoft.Extensions.Configuration;
using System.Collections.Generic;

namespace PMS.Configuration
{
    public class AppSettingProvider : SettingProvider
    {
        private readonly IConfigurationRoot _appConfiguration;

        public AppSettingProvider(IAppConfigurationAccessor configurationAccessor)
        {
            _appConfiguration = configurationAccessor.Configuration;
        }

        public override IEnumerable<SettingDefinition> GetSettingDefinitions(SettingDefinitionProviderContext context)
        {
            // Change scope of Email settings
            ChangeEmailSettingScopes(context);

            return GetTenantSettings();
        }

        private IEnumerable<SettingDefinition> GetTenantSettings()
        {
            return new[]
            {
                new SettingDefinition(AppSettingNames.Email.UseHostDefaultEmailSettings,
                    GetFromAppSettings(AppSettingNames.Email.UseHostDefaultEmailSettings,
                    PMSConsts.MultiTenancyEnabled? "true":"false"),
                    scopes: SettingScopes.Tenant),
                new SettingDefinition(AppSettingNames.PublicApiKey,"1234"),

                new SettingDefinition(AppSettingNames.FrontDesk_RoomRack.DateRangeDays, "14", scopes: SettingScopes.Tenant),
                new SettingDefinition(AppSettingNames.FrontDesk_RoomRack.ColorInHouse, "#DBEAFE", scopes: SettingScopes.Tenant),
                new SettingDefinition(AppSettingNames.FrontDesk_RoomRack.ColorInHouseDark, "#1E3A8A", scopes: SettingScopes.Tenant),
                new SettingDefinition(AppSettingNames.FrontDesk_RoomRack.ColorPendingReservation, "#FEF3C7", scopes: SettingScopes.Tenant),
                new SettingDefinition(AppSettingNames.FrontDesk_RoomRack.ColorPendingReservationDark, "#713F12", scopes: SettingScopes.Tenant),
                new SettingDefinition(AppSettingNames.FrontDesk_RoomRack.ColorConfirmedReservation, "#D1FAE5", scopes: SettingScopes.Tenant),
                new SettingDefinition(AppSettingNames.FrontDesk_RoomRack.ColorConfirmedReservationDark, "#14532D", scopes: SettingScopes.Tenant),
                new SettingDefinition(AppSettingNames.FrontDesk_RoomRack.ColorCheckoutToday, "#BFDBFE", scopes: SettingScopes.Tenant),
                new SettingDefinition(AppSettingNames.FrontDesk_RoomRack.ColorCheckoutTodayDark, "#1E40AF", scopes: SettingScopes.Tenant),
                new SettingDefinition(AppSettingNames.FrontDesk_RoomRack.ColorOnHoldRoom, "#E2E8F0", scopes: SettingScopes.Tenant),
                new SettingDefinition(AppSettingNames.FrontDesk_RoomRack.ColorOnHoldRoomDark, "#475569", scopes: SettingScopes.Tenant),
            };
        }

        private void ChangeEmailSettingScopes(SettingDefinitionProviderContext context)
        {
            if (!PMSConsts.AllowTenantsToChangeEmailSettings)
            {
                context.Manager.GetSettingDefinition(EmailSettingNames.Smtp.Host).Scopes = SettingScopes.Application;
                context.Manager.GetSettingDefinition(EmailSettingNames.Smtp.Port).Scopes = SettingScopes.Application;
                context.Manager.GetSettingDefinition(EmailSettingNames.Smtp.UserName).Scopes = SettingScopes.Application;
                context.Manager.GetSettingDefinition(EmailSettingNames.Smtp.Password).Scopes = SettingScopes.Application;
                context.Manager.GetSettingDefinition(EmailSettingNames.Smtp.Domain).Scopes = SettingScopes.Application;
                context.Manager.GetSettingDefinition(EmailSettingNames.Smtp.EnableSsl).Scopes = SettingScopes.Application;
                context.Manager.GetSettingDefinition(EmailSettingNames.Smtp.UseDefaultCredentials).Scopes = SettingScopes.Application;
                context.Manager.GetSettingDefinition(EmailSettingNames.DefaultFromAddress).Scopes = SettingScopes.Application;
                context.Manager.GetSettingDefinition(EmailSettingNames.DefaultFromDisplayName).Scopes = SettingScopes.Application;
            }
        }

        private string GetFromAppSettings(string name, string defaultValue = null)
        {
            return GetFromSettings("App:" + name, defaultValue);
        }

        private string GetFromSettings(string name, string defaultValue = null)
        {
            return _appConfiguration[name] ?? defaultValue;
        }
    }
}





