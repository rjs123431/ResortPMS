using System.Threading.Tasks;
using Abp.Authorization;
using Abp.Runtime.Session;
using PMS.Configuration.Dto;

namespace PMS.Configuration
{
    [AbpAuthorize]
    public class ConfigurationAppService : PMSAppServiceBase, IConfigurationAppService
    {
        public async Task ChangeUiTheme(ChangeUiThemeInput input)
        {
            await SettingManager.ChangeSettingForUserAsync(AbpSession.ToUserIdentifier(), AppSettingNames.UiTheme, input.Theme);
        }
    }
}





