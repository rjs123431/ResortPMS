using Abp.Application.Services;
using PMS.Configuration.Tenants.Dto;
using System.Threading.Tasks;

namespace PMS.Configuration.Tenants
{
    public interface ITenantSettingsAppService : IApplicationService
    {
        Task<TenantSettingsEditDto> GetAllSettings();

        Task UpdateAllSettings(TenantSettingsEditDto input);
    }
}





