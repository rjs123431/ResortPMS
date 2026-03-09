using System.Linq;
using Microsoft.EntityFrameworkCore;
using Abp.MultiTenancy;
using PMS.Editions;
using PMS.MultiTenancy;

namespace PMS.EntityFrameworkCore.Seed.Tenants
{
    public class DefaultTenantBuilder
    {
        private readonly PMSDbContext _context;

        public DefaultTenantBuilder(PMSDbContext context)
        {
            _context = context;
        }

        public void Create()
        {
            CreateDefaultTenant();
        }

        private void CreateDefaultTenant()
        {
            // Default tenant

            var defaultTenant = _context.Tenants.IgnoreQueryFilters().FirstOrDefault(t => t.TenancyName == Tenant.DefaultTenancyName);
            if (defaultTenant == null)
            {
                defaultTenant = new Tenant(Tenant.DefaultTenancyName, $"{Tenant.DefaultTenancyName} Company");

                var defaultEdition = _context.Editions.IgnoreQueryFilters().FirstOrDefault(e => e.Name == EditionManager.DefaultEditionName);
                if (defaultEdition != null)
                {
                    defaultTenant.EditionId = defaultEdition.Id;
                }

                _context.Tenants.Add(defaultTenant);
                _context.SaveChanges();
            }
        }
    }
}





