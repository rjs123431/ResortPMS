using Abp.Dependency;
using Abp.Extensions;
using Abp.MultiTenancy;

namespace PMS.Url
{
    public abstract class AppUrlServiceBase : IAppUrlService, ITransientDependency
    {
        public abstract string EmailActivationRoute { get; }

        public abstract string PasswordResetRoute { get; }

        public abstract string InviteEmailRoute { get; }

        protected readonly IWebUrlService WebUrlService;
        protected readonly ITenantCache TenantCache;

        protected AppUrlServiceBase(IWebUrlService webUrlService, ITenantCache tenantCache)
        {
            WebUrlService = webUrlService;
            TenantCache = tenantCache;
        }

        public string CreateEmailActivationUrlFormat(int? tenantId)
        {
            return CreateEmailActivationUrlFormat(GetTenancyName(tenantId));
        }

        public string CreatePasswordResetUrlFormat(int? tenantId)
        {
            return CreatePasswordResetUrlFormat(GetTenancyName(tenantId));
        }

        public string CreateEmailActivationUrlFormat(string tenancyName)
        {
            var activationLink = WebUrlService.GetSiteRootAddress(tenancyName).EnsureEndsWith('/') + EmailActivationRoute + "?userId={userId}&confirmationCode={confirmationCode}";

            if (tenancyName != null)
            {
                activationLink = activationLink + "&tenantId={tenantId}";
            }

            return activationLink;
        }

        public string CreatePasswordResetUrlFormat(string tenancyName)
        {
            var resetLink = WebUrlService.GetSiteRootAddress(tenancyName).EnsureEndsWith('/') + PasswordResetRoute + "?userId={userId}&resetCode={resetCode}";

            if (tenancyName != null)
            {
                resetLink = resetLink + "&tenantId={tenantId}";
            }

            return resetLink;
        }

        public string CreateEmailInviteUrlFormat(int? tenantId)
        {
            return CreateEmailInviteUrlFormat(GetTenancyName(tenantId));
        }

        public string CreateEmailInviteUrlFormat(string tenancyName)
        {
            var inviteLink = WebUrlService.GetSiteRootAddress(tenancyName).EnsureEndsWith('/') + InviteEmailRoute + "?eid={eid}&inviteCode={inviteCode}";
            if (tenancyName != null)
            {
                inviteLink = inviteLink + "&tenantId={tenantId}";
            }
            return inviteLink;
        }

        private string GetTenancyName(int? tenantId)
        {
            return tenantId.HasValue ? TenantCache.Get(tenantId.Value).TenancyName : null;
        }

        public string CreateTenantUrlFormat(int? tenantId)
        {
            return WebUrlService.GetSiteRootAddress(GetTenancyName(tenantId));
        }
    }
}





