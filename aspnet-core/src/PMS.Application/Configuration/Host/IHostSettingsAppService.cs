using Abp.Application.Services;
using PMS.Configuration.Host.Dto;
using System.Threading.Tasks;

namespace PMS.Configuration.Host
{
    public interface IHostSettingsAppService : IApplicationService
    {
        Task<HostSettingsEditDto> GetAllSettings();

        Task UpdateAllSettings(HostSettingsEditDto input);
    }
}




