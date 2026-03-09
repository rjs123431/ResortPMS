using Abp.Domain.Services;

namespace PMS
{
    public class PMSDomainServiceBase : DomainService
    {
        /* Add your common members for all your domain services. */

        public PMSDomainServiceBase()
        {
            LocalizationSourceName = PMSConsts.LocalizationSourceName;
        }
    }
}





