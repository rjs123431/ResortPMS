using System.Threading.Tasks;
using Abp.Application.Services;
using PMS.Sessions.Dto;

namespace PMS.Sessions
{
    public interface ISessionAppService : IApplicationService
    {
        Task<GetCurrentLoginInformationsOutput> GetCurrentLoginInformations();
    }
}





