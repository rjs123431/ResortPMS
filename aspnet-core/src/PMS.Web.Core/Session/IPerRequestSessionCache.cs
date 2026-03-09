using PMS.Sessions.Dto;
using System.Threading.Tasks;

namespace PMS.Session
{
    public interface IPerRequestSessionCache
    {
        Task<GetCurrentLoginInformationsOutput> GetCurrentLoginInformationsAsync();
    }
}





