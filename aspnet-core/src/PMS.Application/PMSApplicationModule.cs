using Abp.AutoMapper;
using Abp.Dependency;
using Abp.Modules;
using Abp.Reflection.Extensions;
using Castle.MicroKernel.Registration;
using PMS.Application.Hubs;
using PMS.Authorization;
using PMS.DataExporting.Csv;

namespace PMS
{
    [DependsOn(
        typeof(PMSCoreModule),
        typeof(AbpAutoMapperModule))]
    public class PMSApplicationModule : AbpModule
    {
        public override void PreInitialize()
        {
            Configuration.Authorization.Providers.Add<PMSAuthorizationProvider>();

            //Adding custom AutoMapper configuration
            Configuration.Modules.AbpAutoMapper().Configurators.Add(CustomDtoMapper.CreateMappings);

            Configuration.IocManager.IocContainer.Register(Component.For(typeof(ICsvExporter<>))
                .ImplementedBy(typeof(CsvExporter<>)).LifestyleTransient());

        }

        public override void Initialize()
        {
            var thisAssembly = typeof(PMSApplicationModule).GetAssembly();

            IocManager.RegisterAssemblyByConvention(thisAssembly);
            IocManager.Register(typeof(IPosHubBroadcaster), typeof(PosHubBroadcaster), DependencyLifeStyle.Singleton);

            Configuration.Modules.AbpAutoMapper().Configurators.Add(
                // Scan the assembly for classes which inherit from AutoMapper.Profile
                cfg => cfg.AddMaps(thisAssembly)
            );
        }
    }
}





