using System.Threading.Tasks;
using PMS.Configuration.Dto;

namespace PMS.Configuration
{
    public interface IConfigurationAppService
    {
        Task ChangeUiTheme(ChangeUiThemeInput input);
    }
}





