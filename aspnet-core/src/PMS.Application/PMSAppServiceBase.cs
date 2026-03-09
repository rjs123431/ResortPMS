using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;
using Abp.Application.Services;
using Abp.IdentityFramework;
using Abp.Runtime.Session;
using Abp.Timing;
using PMS.App;
using PMS.Authorization.Users;
using PMS.Configuration;
using PMS.MultiTenancy;
using PMS.Application.App.Services;

namespace PMS
{
    /// <summary>
    /// Derive your application services from this class.
    /// </summary>
    public abstract class PMSAppServiceBase : ApplicationService
    {
        public TenantManager TenantManager { get; set; }

        public UserManager UserManager { get; set; }

        protected PMSAppServiceBase()
        {
            LocalizationSourceName = PMSConsts.LocalizationSourceName;
        }

        protected virtual async Task<User> GetCurrentUserAsync()
        {
            var user = await UserManager.FindByIdAsync(AbpSession.GetUserId().ToString());
            if (user == null)
            {
                throw new Exception("There is no current user!");
            }

            return user;
        }

        protected virtual Task<Tenant> GetCurrentTenantAsync()
        {
            return TenantManager.GetByIdAsync(AbpSession.GetTenantId());
        }

        protected virtual void CheckErrors(IdentityResult identityResult)
        {
            identityResult.CheckErrors(LocalizationManager);
        }

        /// <summary>
        /// Determines if the current application instance is a site (not central office).
        /// A site is identified by having a SiteId configured and it not being equal to 1.
        /// </summary>
        /// <param name="configurationAccessor">Configuration accessor to read SiteId</param>
        /// <returns>True if this is a site, false otherwise</returns>
        protected bool IsSite(IAppConfigurationAccessor configurationAccessor)
        {
            var siteIdStr = configurationAccessor.Configuration["App:SiteId"];
            int? siteId = null;
            if (!string.IsNullOrWhiteSpace(siteIdStr) && int.TryParse(siteIdStr, out var parsedSiteId))
            {
                siteId = parsedSiteId;
            }
            return siteId.HasValue && siteId.Value != 1;
        }

        /// <summary>
        /// Generates a document number using the document number service with fallback to timestamp-based generation.
        /// </summary>
        /// <param name="documentType">The type of document (e.g., "STOCK_IN", "STOCK_OUT")</param>
        /// <param name="documentPrefix">The prefix for the document number (e.g., "I-", "O-")</param>
        /// <param name="documentNumberService">The document number service</param>
        /// <param name="configurationAccessor">Configuration accessor to read SiteCode</param>
        /// <returns>The generated document number</returns>
        protected async Task<string> GenerateDocumentNumberAsync(
            string documentType,
            string documentPrefix,
            IDocumentNumberService documentNumberService,
            IAppConfigurationAccessor configurationAccessor)
        {
            try
            {
                var siteCode = configurationAccessor.Configuration["App:SiteCode"] ?? string.Empty;
                return await documentNumberService.GenerateNextDocumentNumberAsync(documentType, documentPrefix, siteCode);
            }
            catch (Exception ex)
            {
                Logger.Error("Failed to generate document number", ex);
                // Fallback to timestamp-based number if service fails
                var siteCode = configurationAccessor.Configuration["App:SiteCode"] ?? string.Empty;
                var yearSuffix = Clock.Now.Year % 100;
                var timestamp = Clock.Now.ToString("HHmmss");
                var cleanPrefix = documentPrefix.TrimEnd('-');
                if (!string.IsNullOrWhiteSpace(siteCode))
                {
                    return $"{siteCode}-{cleanPrefix}{timestamp}-{yearSuffix:D2}";
                }
                else
                {
                    return $"{cleanPrefix}{timestamp}-{yearSuffix:D2}";
                }
            }
        }

    }
}





