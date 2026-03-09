using Abp.Dependency;
using Abp.EntityFrameworkCore.Configuration;
using Abp.Modules;
using Abp.Reflection.Extensions;
using Abp.Zero.EntityFrameworkCore;
using PMS.EntityFrameworkCore.Seed;

namespace PMS.EntityFrameworkCore
{
    [DependsOn(
        typeof(PMSCoreModule),
        typeof(AbpZeroCoreEntityFrameworkCoreModule))]
    public class PMSEntityFrameworkModule : AbpModule
    {
        /* Used it tests to skip dbcontext registration, in order to use in-memory database of EF Core */
        public bool SkipDbContextRegistration { get; set; }

        public bool SkipDbSeed { get; set; }

        public override void PreInitialize()
        {
            if (!SkipDbContextRegistration)
            {
                Configuration.Modules.AbpEfCore().AddDbContext<PMSDbContext>(options =>
                {
                    if (options.ExistingConnection != null)
                    {
                        PMSDbContextConfigurer.Configure(options.DbContextOptions, options.ExistingConnection);
                    }
                    else
                    {
                        PMSDbContextConfigurer.Configure(options.DbContextOptions, options.ConnectionString);
                    }
                });
            }
        }

        public override void Initialize()
        {
            IocManager.RegisterAssemblyByConvention(typeof(PMSEntityFrameworkModule).GetAssembly());
        }

        public override void PostInitialize()
        {
            if (!SkipDbSeed)
            {
                SeedHelper.SeedHostDb(IocManager);
            }
        }

        private void EnsureMigrated()
        {
            using (var migrateExecuter = IocManager.ResolveAsDisposable<MultiTenantMigrateExecuter>())
            {
                migrateExecuter.Object.Run(true);
            }
        }
    }
}





