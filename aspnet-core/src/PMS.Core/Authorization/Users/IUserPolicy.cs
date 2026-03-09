using Abp.Domain.Policies;
using System.Threading.Tasks;

namespace PMS.Authorization.Users
{
    public interface IUserPolicy : IPolicy
    {
        Task CheckMaxUserCountAsync(int tenantId);
    }
}





