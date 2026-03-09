using System.Linq;
using System.Threading.Tasks;
using PMS.Configuration.Dto;

namespace PMS.Configuration
{
    public class CustomUserConfigurationAppService : PMSAppServiceBase, ICustomUserConfigurationAppService
    {
        private readonly IAppConfigurationAccessor _configurationAccessor;

        public CustomUserConfigurationAppService(
            IAppConfigurationAccessor configurationAccessor)
        {
            _configurationAccessor = configurationAccessor;
        }

        public async Task<CustomUserConfigurationDto> GetCustomConfiguration()
        {
            var siteIdStr = _configurationAccessor.Configuration["App:SiteId"];
            
            // Parse siteId as int
            int? siteId = null;
            if (!string.IsNullOrWhiteSpace(siteIdStr) && int.TryParse(siteIdStr, out var parsedSiteId))
            {
                siteId = parsedSiteId;
            }
            
            // isSite is true only if siteId is set and not equal to 1
            var isSite = siteId.HasValue && siteId.Value != 1;

            var config = new CustomUserConfigurationDto
            {
                IsSite = isSite,
                SiteId = siteId,
                SiteCode = _configurationAccessor.Configuration["App:SiteCode"] ?? string.Empty,
                SiteName = _configurationAccessor.Configuration["App:SiteName"] ?? string.Empty,
                CentralOfficeBaseUrl = _configurationAccessor.Configuration["App:CentralOfficeBaseUrl"] ?? string.Empty,
                HasOngoingPhysicalCount = false,
                OngoingPhysicalCountDocNo = string.Empty,
                OngoingPhysicalCountWarehouseId = null,
                OngoingPhysicalCountWarehouseName = string.Empty,
                PayrollDatabaseName = _configurationAccessor.Configuration["App:PayrollDatabaseName"] ?? string.Empty,
            };

            return config;
        }
    }
}

