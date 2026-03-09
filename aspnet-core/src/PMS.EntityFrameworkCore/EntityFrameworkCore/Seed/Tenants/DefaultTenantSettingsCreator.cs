using Abp.Configuration;
using PMS.Configuration;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace PMS.EntityFrameworkCore.Seed.Tenants
{
    public class DefaultTenantSettingsCreator
    {
        private readonly PMSDbContext _context;
        private readonly int _tenantId;

        public DefaultTenantSettingsCreator(PMSDbContext context, int tenantId)
        {
            _context = context;
            _tenantId = tenantId;
        }

        public void Create()
        {
            new ResortSetupDataCreator(_context, _tenantId).Create();
        }

        private void AddSettingIfNotExists(string name, string value, int? tenantId = null)
        {
            if (_context.Settings.IgnoreQueryFilters().Any(s => s.Name == name && s.TenantId == tenantId && s.UserId == null))
            {
                return;
            }

            _context.Settings.Add(new Setting(tenantId, null, name, value));
            _context.SaveChanges();
        }
    }
}




