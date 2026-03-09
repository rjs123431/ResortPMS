using Abp.Application.Services;
using Abp.Application.Services.Dto;
using PMS.Authorization.Accounts.Dto;
using PMS.MultiTenancy.Dto;
using System.Threading.Tasks;

namespace PMS.Authorization.Accounts;

public interface IAccountAppService : IApplicationService
{
    Task<IsTenantAvailableOutput> IsTenantAvailable(IsTenantAvailableInput input);

    Task<int?> ResolveTenantId(ResolveTenantIdInput input);

    Task<SignUpOutput> SignUp(SignUpInput input);

    Task SendPasswordResetCode(SendPasswordResetCodeInput input);

    Task<ResetPasswordOutput> ResetPassword(ResetPasswordInput input);

    Task SendUserCompanies(SendUserCompaniesInput input);
    Task<ListResultDto<TenantDto>> GetTenantByUser(string input);
    Task<ListResultDto<TenantDto>> GetDefaultTenant(int tenantId);
    Task<ListResultDto<TenantDto>> GetTenants();

    Task<ImpersonateOutput> Impersonate(ImpersonateInput input);
    Task<ImpersonateOutput> BackToImpersonator();

}





