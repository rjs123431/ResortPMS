using Abp.Modules;
using Abp.Reflection.Extensions;
using Abp.EntityFrameworkCore.Configuration;
using Microsoft.EntityFrameworkCore;
using PMS.EntityFrameworkCore;
using System;

namespace PMS.Tests;

[DependsOn(
    typeof(PMSApplicationModule),
    typeof(PMSEntityFrameworkModule))]
public class PMSTestModule : AbpModule
{
    public PMSTestModule(PMSEntityFrameworkModule entityFrameworkModule)
    {
        entityFrameworkModule.SkipDbContextRegistration = true;
        entityFrameworkModule.SkipDbSeed = true;
    }

    public override void PreInitialize()
    {
        // Override DbContext registration to use InMemory
        Configuration.Modules.AbpEfCore().AddDbContext<PMSDbContext>(options =>
        {
            options.DbContextOptions.UseInMemoryDatabase("PmsTestDb_" + Guid.NewGuid());
        });

        Configuration.UnitOfWork.IsTransactional = false;
        Configuration.BackgroundJobs.IsJobExecutionEnabled = false;
    }

    public override void Initialize()
    {
        IocManager.RegisterAssemblyByConvention(typeof(PMSTestModule).GetAssembly());
    }
}
