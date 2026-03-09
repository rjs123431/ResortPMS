using Abp.Auditing;
using Abp.Configuration.Startup;
using Abp.Dependency;
using Abp.Localization;
using Abp.MailKit;
using Abp.Modules;
using Abp.Net.Mail;
using Abp.Net.Mail.Smtp;
using Abp.Notifications;
using Abp.Reflection.Extensions;
using Abp.Timing;
using Abp.Zero;
using Abp.Zero.Configuration;
using Castle.MicroKernel.Registration;
using MailKit.Security;
using PMS.Auditing;
using PMS.Authorization.Roles;
using PMS.Authorization.Users;
using PMS.Configuration;
using PMS.Debugging;
using PMS.Features;
using PMS.Localization;
using PMS.MultiTenancy;
using PMS.Net.Emailing;
using PMS.Timing;
using System.Configuration;

namespace PMS
{
    [DependsOn(typeof(AbpZeroCoreModule)
        , typeof(AbpMailKitModule)
        )]
    public class PMSCoreModule : AbpModule
    {
        public override void PreInitialize()
        {
            // Enable auditing but only for errors/exceptions
            Configuration.Auditing.IsEnabled = true;
            Configuration.Auditing.IsEnabledForAnonymousUsers = true;
            
            // Replace the default auditing store with error-only store
            Configuration.ReplaceService<IAuditingStore, ErrorOnlyAuditingStore>(DependencyLifeStyle.Transient);

            // Declare entity types
            Configuration.Modules.Zero().EntityTypes.Tenant = typeof(Tenant);
            Configuration.Modules.Zero().EntityTypes.Role = typeof(Role);
            Configuration.Modules.Zero().EntityTypes.User = typeof(User);

            PMSLocalizationConfigurer.Configure(Configuration.Localization);

            // Enable this line to create a multi-tenant application.
            Configuration.MultiTenancy.IsEnabled = PMSConsts.MultiTenancyEnabled;
            Configuration.MultiTenancy.TenantIdResolveKey = DebugHelper.IsDebug 
                ? PMSConsts.DefaultTenantIdCookieName 
                : ConfigurationManager.AppSettings["TenantIdCookieName"] ?? PMSConsts.DefaultTenantIdCookieName;

            // MailKit configuration
            Configuration.Modules.AbpMailKit().SecureSocketOption = SecureSocketOptions.Auto;
            Configuration.ReplaceService<IMailKitSmtpBuilder, PMSMailKitSmtpBuilder>(DependencyLifeStyle.Transient);

            // Configure roles
            AppRoleConfig.Configure(Configuration.Modules.Zero().RoleManagement);

            if (DebugHelper.IsDebug)
            {
                // Disabling email sending in debug mode
                //Configuration.ReplaceService<IEmailSender, NullEmailSender>(DependencyLifeStyle.Transient);
            }

            Configuration.ReplaceService(typeof(IEmailSenderConfiguration), () =>
            {
                // replace config so we can decrypt smtp password
                Configuration.IocManager.IocContainer.Register(
                    Component.For<IEmailSenderConfiguration, ISmtpEmailSenderConfiguration>()
                             .ImplementedBy<PMSSmtpEmailSenderConfiguration>()
                             .LifestyleTransient()
                );
            });

            //Adding feature providers
            Configuration.Features.Providers.Add<AppFeatureProvider>();

            Configuration.Settings.Providers.Add<AppSettingProvider>();

            Configuration.ReplaceService<INotificationStore, NotificationStore>();

            Configuration.Localization.Languages.Add(new LanguageInfo("fa", "فارسی", "famfamfam-flags ir"));
        }

        public override void Initialize()
        {
            IocManager.RegisterAssemblyByConvention(typeof(PMSCoreModule).GetAssembly());
        }

        public override void PostInitialize()
        {
            IocManager.Resolve<AppTimes>().StartupTime = Clock.Now;
        }
    }
}





