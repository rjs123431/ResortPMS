using Abp.Application.Services;
using Abp.Application.Services.Dto;
using PMS.MultiTenancy.Dto;
using System.Threading.Tasks;

namespace PMS.MultiTenancy
{
    public interface ITenantAppService : IAsyncCrudAppService<TenantDto, int, PagedTenantResultRequestDto, CreateTenantDto, TenantDto>
    {
    }
}






