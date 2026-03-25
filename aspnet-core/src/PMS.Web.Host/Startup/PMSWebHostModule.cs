using Abp.Configuration.Startup;
using Abp.Modules;
using Abp.Reflection.Extensions;
using Abp.Threading.BackgroundWorkers;
using Hangfire;
using PMS.Authentication.External;
using PMS.Authentication.External.Google;
using PMS.Common;
using PMS.Configuration;
using PMS.EntityFrameworkCore;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using System.Collections.Generic;

namespace PMS.Web.Host.Startup;

[DependsOn(
   typeof(PMSWebCoreModule))]
public class PMSWebHostModule : AbpModule
{
    private readonly IConfigurationRoot _appConfiguration;

    public PMSWebHostModule(IWebHostEnvironment env, PMSEntityFrameworkModule efModule)
    {
        _appConfiguration = env.GetAppConfiguration();
    }

    public override void PreInitialize()
    {
        Configuration.Modules.AbpWebCommon().MultiTenancy.DomainFormat = _appConfiguration["App:ServerRootAddress"] ?? "http://localhost:22357/";
    }

    public override void Initialize()
    {
        IocManager.RegisterAssemblyByConvention(typeof(PMSWebHostModule).GetAssembly());
    }

    public override void PostInitialize()
    {
        base.PostInitialize();

        if (WebConsts.HangfireDashboardEnabled)
        {
            IocManager.Resolve<IBackgroundWorkerManager>();
            IocManager.Resolve<JobStorage>();
        }

        ConfigureExternalAuthProviders();
    }

    private void ConfigureExternalAuthProviders()
    {
        var externalAuthConfiguration = IocManager.Resolve<ExternalAuthConfiguration>();

        var googleLoginEnabled = _appConfiguration["Authentication:Google:IsEnabled"];
        if (googleLoginEnabled != null && bool.Parse(googleLoginEnabled))
        {
            externalAuthConfiguration.Providers.Add(
                new ExternalLoginProviderInfo(
                    GoogleAuthProviderApi.Name,
                    _appConfiguration["Authentication:Google:ClientId"],
                    _appConfiguration["Authentication:Google:ClientSecret"],
                    typeof(GoogleAuthProviderApi),
                    "google-plus-g",
                    new Dictionary<string, string>
                    {
                        {"UserInfoEndpoint", _appConfiguration["Authentication:Google:UserInfoEndpoint"]}
                    }
                )
            );
        }
    }
}





