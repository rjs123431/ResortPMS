using System;

namespace PMS.Url
{
    public class NullAppUrlService : IAppUrlService
    {
        public static IAppUrlService Instance { get; } = new NullAppUrlService();

        private NullAppUrlService()
        {

        }

        public string CreateEmailActivationUrlFormat(int? tenantId)
        {
            throw new NotImplementedException();
        }

        public string CreatePasswordResetUrlFormat(int? tenantId)
        {
            throw new NotImplementedException();
        }

        public string CreateEmailActivationUrlFormat(string tenancyName)
        {
            throw new NotImplementedException();
        }

        public string CreatePasswordResetUrlFormat(string tenancyName)
        {
            throw new NotImplementedException();
        }

        public string CreateTenantUrlFormat(int? tenantId)
        {
            throw new NotImplementedException();
        }

        public string CreateEmailInviteUrlFormat(int? tenantId)
        {
            throw new NotImplementedException();
        }

        public string CreateEmailInviteUrlFormat(string tenancyName)
        {
            throw new NotImplementedException();
        }
    }
}





