namespace PMS.Url
{
    public interface IAppUrlService
    {
        string CreateEmailActivationUrlFormat(int? tenantId);

        string CreatePasswordResetUrlFormat(int? tenantId);

        string CreateEmailActivationUrlFormat(string tenancyName);

        string CreatePasswordResetUrlFormat(string tenancyName);

        string CreateTenantUrlFormat(int? tenantId);

        string CreateEmailInviteUrlFormat(int? tenantId);

        string CreateEmailInviteUrlFormat(string tenancyName);
    }
}





