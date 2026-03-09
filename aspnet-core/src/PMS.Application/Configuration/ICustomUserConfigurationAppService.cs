using System.Threading.Tasks;
using PMS.Configuration.Dto;

namespace PMS.Configuration
{
    public interface ICustomUserConfigurationAppService
    {
        Task<CustomUserConfigurationDto> GetCustomConfiguration();
    }
}

