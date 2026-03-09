using Abp.Application.Services.Dto;
using Abp.Authorization;
using Abp.BackgroundJobs;
using Abp.Domain.Repositories;
using Abp.Domain.Uow;
using Abp.Extensions;
using Abp.MultiTenancy;
using Abp.Runtime.Security;
using Abp.UI;
using PMS.Authorization.Accounts.Dto;
using PMS.Authorization.Impersonation;
using PMS.Authorization.Roles;
using PMS.Authorization.Users;
using PMS.Common.Jobs;
using PMS.Editions;
using PMS.MultiTenancy;
using PMS.MultiTenancy.Dto;
using PMS.Url;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Web;

namespace PMS.Authorization.Accounts;

public class AccountAppService : PMSAppServiceBase, IAccountAppService
{
    // from: http://regexlib.com/REDetails.aspx?regexp_id=1923
    public const string PasswordRegex = "(?=^.{8,}$)(?=.*\\d)(?=.*[a-z])(?=.*[A-Z])(?!.*\\s)[0-9a-zA-Z!@#$%^&*()]*$";

    private readonly UserRegistrationManager _userRegistrationManager;
    private readonly TenantManager _tenantManager;
    private readonly EditionManager _editionManager;
    private readonly RoleManager _roleManager;
    private readonly UserManager _userManager;
    private readonly IAbpZeroDbMigrator _abpZeroDbMigrator;
    private readonly IUserEmailer _userEmailer;
    private readonly IUnitOfWorkManager _unitOfWorkManager;
    private readonly IBackgroundJobManager _backgroundJobManager;
    private readonly IRepository<Tenant> _tenantRepository;
    private readonly IRepository<User, long> _userRepository;
    private readonly IImpersonationManager _impersonationManager;

    public IAppUrlService AppUrlService { get; set; }

    public AccountAppService(
        UserRegistrationManager userRegistrationManager,
        TenantManager tenantManager,
        EditionManager editionManager,
        RoleManager roleManager,
        UserManager userManager,
        IAbpZeroDbMigrator abpZeroDbMigrator,
        IUserEmailer userEmailer,
        IUnitOfWorkManager unitOfWorkManager,
        IBackgroundJobManager backgroundJobManager,
        IRepository<Tenant> tenantRepository,
        IRepository<User, long> userRepository,
        IImpersonationManager impersonationManager
        )
    {
        _userRegistrationManager = userRegistrationManager;
        _tenantManager = tenantManager;
        _editionManager = editionManager;
        _roleManager = roleManager;
        _userManager = userManager;
        _abpZeroDbMigrator = abpZeroDbMigrator;
        _userEmailer = userEmailer;
        _unitOfWorkManager = unitOfWorkManager;
        _backgroundJobManager = backgroundJobManager;

        _tenantRepository = tenantRepository;
        _userRepository = userRepository;

        _impersonationManager = impersonationManager;

        AppUrlService = NullAppUrlService.Instance;
    }

    public async Task<IsTenantAvailableOutput> IsTenantAvailable(IsTenantAvailableInput input)
    {
        var tenant = await TenantManager.FindByTenancyNameAsync(input.TenancyName);
        if (tenant == null)
        {
            return new IsTenantAvailableOutput(TenantAvailabilityState.NotFound);
        }

        if (!tenant.IsActive)
        {
            return new IsTenantAvailableOutput(TenantAvailabilityState.InActive);
        }

        return new IsTenantAvailableOutput(TenantAvailabilityState.Available, tenant.Id);
    }

    public async Task<SignUpOutput> SignUp(SignUpInput input)
    {
        var result = new SignUpOutput();

        input.TenancyName = input.TenancyName.Trim().ToLower();

        // reserved tenancyNames
        if (input.TenancyName == "app" || input.TenancyName == "host" || input.TenancyName == "api")
        {
            throw new UserFriendlyException(L("InvalidSubdomainName", input.TenancyName));
        }

        var tenant = new Tenant()
        {
            TenancyName = input.TenancyName,
            Name = input.CompanyName,
            IsActive = true
        };

        tenant.ConnectionString = null; // set to null

        var defaultEdition = await _editionManager.FindByNameAsync(EditionManager.DefaultEditionName);
        if (defaultEdition != null)
        {
            tenant.EditionId = defaultEdition.Id;
        }

        await _tenantManager.CreateAsync(tenant);
        await CurrentUnitOfWork.SaveChangesAsync(); // To get new tenant's id.

        // Create tenant database
        _abpZeroDbMigrator.CreateOrMigrateForTenant(tenant);

        // We are working entities of new tenant, so changing tenant filter
        using (CurrentUnitOfWork.SetTenantId(tenant.Id))
        {
            // Create static roles for new tenant
            CheckErrors(await _roleManager.CreateStaticRoles(tenant.Id));

            await CurrentUnitOfWork.SaveChangesAsync(); // To get static role ids

            // Grant all permissions to admin role
            var adminRole = _roleManager.Roles.Single(r => r.Name == StaticRoleNames.Tenants.Admin);
            await _roleManager.GrantAllPermissionsAsync(adminRole);

            // Create admin user for the tenant
            var adminUser = User.CreateTenantAdminUser(tenant.Id, input.EmailAddress, input.UserName);
            adminUser.Name = input.FirstName;
            adminUser.Surname = input.LastName;
            await _userManager.InitializeOptionsAsync(tenant.Id);
            CheckErrors(await _userManager.CreateAsync(adminUser, input.Password));
            await CurrentUnitOfWork.SaveChangesAsync(); // To get admin user's id

            // Assign admin user to role!
            CheckErrors(await _userManager.AddToRoleAsync(adminUser, adminRole.Name));
            await CurrentUnitOfWork.SaveChangesAsync();

            var url = AppUrlService.CreateTenantUrlFormat(tenant.Id);
            // result.Url = url;

            // email welcome message
            await _userEmailer.SendWelcomeTenantLinkAsync(adminUser, tenant, url);

            // TODO: seed Data
        }

        return result;
    }

    public async Task SendPasswordResetCode(SendPasswordResetCodeInput input)
    {
        var user = await GetUserByChecking(input.EmailAddress);
        user.SetNewPasswordResetCode();
        await _userEmailer.SendPasswordResetLinkAsync(
            user,
            AppUrlService.CreatePasswordResetUrlFormat(AbpSession.TenantId)
            );
    }

    public async Task SendUserCompanies(SendUserCompaniesInput input)
    {
        var user = new User();
        var links = new Dictionary<string, string>();

        using (_unitOfWorkManager.Current.DisableFilter(AbpDataFilters.MayHaveTenant))
        {
            var users = await UserManager.Users.Where(u => u.EmailAddress == input.EmailAddress).ToListAsync();

            if (users.Count == 0)
                return;

            user = users.FirstOrDefault();

            foreach (var u in users)
            {
                if (u.TenantId.HasValue == false)
                    continue;

                var tenant = TenantManager.GetById(u.TenantId.Value);
                if (tenant.IsActive == false)
                    continue;

                links.Add(tenant.Name, tenant.IsActive ? AppUrlService.CreateTenantUrlFormat(u.TenantId.Value) : "Deactivated");
            }
        }

        if (links.Count > 0)
            await _userEmailer.SendCompanyUrls(user, links);
    }

    private async Task<User> GetUserByChecking(string inputEmailAddress)
    {
        var user = await UserManager.FindByEmailAsync(inputEmailAddress);
        if (user == null)
        {
            throw new UserFriendlyException(L("InvalidEmailAddress"));
        }

        return user;
    }

    public async Task<ResetPasswordOutput> ResetPassword(ResetPasswordInput input)
    {
        var user = await UserManager.GetUserByIdAsync(input.UserId);
        if (user == null || user.PasswordResetCode.IsNullOrEmpty() || user.PasswordResetCode != input.ResetCode)
        {
            throw new UserFriendlyException(L("InvalidPasswordResetCode"), L("InvalidPasswordResetCode_Detail"));
        }

        await UserManager.InitializeOptionsAsync(AbpSession.TenantId);
        CheckErrors(await UserManager.ChangePasswordAsync(user, input.Password));
        user.PasswordResetCode = null;
        user.IsEmailConfirmed = true;

        await UserManager.UpdateAsync(user);

        return new ResetPasswordOutput
        {
            CanLogin = user.IsActive,
            UserName = user.UserName
        };
    }

    public Task<int?> ResolveTenantId(ResolveTenantIdInput input)
    {
        if (string.IsNullOrEmpty(input.c))
        {
            return Task.FromResult(AbpSession.TenantId);
        }

        var parameters = SimpleStringCipher.Instance.Decrypt(input.c);
        var query = HttpUtility.ParseQueryString(parameters);

        if (query["tenantId"] == null)
        {
            return Task.FromResult<int?>(null);
        }

        var tenantId = Convert.ToInt32(query["tenantId"]) as int?;
        return Task.FromResult(tenantId);
    }

    [AbpAllowAnonymous]
    public async Task<ListResultDto<TenantDto>> GetTenantByUser(string input)
    {
        var userLit = new List<User>();

        using (_unitOfWorkManager.Current.DisableFilter(AbpDataFilters.MayHaveTenant))
        {
            userLit = await _userRepository.GetAll().AsNoTracking()
                .Where(x => x.UserName == input).ToListAsync();
        }

        var tenants = await _tenantRepository.GetAllListAsync();

        var list = tenants.Where(x => userLit.Any(u => u.TenantId == x.Id)).ToList();

        var result = ObjectMapper.Map<List<TenantDto>>(list);

        return new ListResultDto<TenantDto>(result);
    }

    [AbpAllowAnonymous]
    public async Task<ListResultDto<TenantDto>> GetTenants()
    {
        var tenants = await _tenantRepository.GetAll()
            .AsNoTracking()
            .Where(x => x.IsActive)
            .ToListAsync();

        var result = ObjectMapper.Map<List<TenantDto>>(tenants);

        return new ListResultDto<TenantDto>(result);
    }

    public async Task<ImpersonateOutput> Impersonate(ImpersonateInput input)
    {
        return new ImpersonateOutput
        {
            ImpersonationToken = await _impersonationManager.GetImpersonationToken(input.UserId, input.TenantId),
            TenancyName = await GetTenancyNameOrNullAsync(input.TenantId)
        };
    }

    public virtual async Task<ImpersonateOutput> BackToImpersonator()
    {
        return new ImpersonateOutput
        {
            ImpersonationToken = await _impersonationManager.GetBackToImpersonatorToken(),
            TenancyName = await GetTenancyNameOrNullAsync(AbpSession.ImpersonatorTenantId)
        };
    }

    private async Task<string> GetTenancyNameOrNullAsync(int? tenantId)
    {
        return tenantId.HasValue ? (await GetActiveTenantAsync(tenantId.Value)).TenancyName : null;
    }

    private async Task<Tenant> GetActiveTenantAsync(int tenantId)
    {
        var tenant = await TenantManager.FindByIdAsync(tenantId);
        if (tenant == null)
        {
            throw new UserFriendlyException(L("UnknownTenantId{0}", tenantId));
        }

        if (!tenant.IsActive)
        {
            throw new UserFriendlyException(L("TenantIdIsNotActive{0}", tenantId));
        }

        return tenant;
    }

    public async Task<ListResultDto<TenantDto>> GetDefaultTenant(int tenantId)
    {
        var list = new List<Tenant>();

        var tenant = await _tenantRepository.FirstOrDefaultAsync(x => x.Id == tenantId);

        if (tenant != null)
        {
            list.Add(tenant);
        }

        var result = ObjectMapper.Map<List<TenantDto>>(list);

        return new ListResultDto<TenantDto>(result);
    }

    [AbpAllowAnonymous]
    public async Task ReportAsync(string message)
    {
        await _backgroundJobManager.EnqueueAsync<SendEmailJob, SendEmailJobArgs>(new SendEmailJobArgs
        {
            Recipient = "rjs123431@gmail.com",
            Subject = "EPortal Report",
            Body = message
        });
    }
}





