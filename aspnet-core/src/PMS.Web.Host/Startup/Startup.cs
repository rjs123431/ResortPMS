using Abp.AspNetCore;
using Abp.AspNetCore.Mvc.Antiforgery;
using Abp.AspNetCore.SignalR.Hubs;
using Abp.Castle.Logging.Log4Net;
using Abp.Extensions;
using Abp.Timing;
using Castle.Facilities.Logging;
using Hangfire;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.OpenApi.Models;
using PMS.Authentication.JwtBearer;
using PMS.Authorization;
using PMS.Common;
using PMS.Configuration;
using PMS.Identity;
using PMS.Services;
using PMS.Swagger;
using System;
using System.IO;
using System.Linq;
using System.Reflection;
using PMS.Application.Hubs;

namespace PMS.Web.Host.Startup
{
    public class Startup
    {
        private const string _defaultCorsPolicyName = "localhost";

        private const string _apiVersion = "v1";

        private readonly IConfigurationRoot _appConfiguration;
        private readonly IWebHostEnvironment _hostingEnvironment;

        public Startup(IWebHostEnvironment env)
        {
            _hostingEnvironment = env;
            _appConfiguration = env.GetAppConfiguration();
            EnvironmentHelper.WebHostEnvironment = env;
        }

        public IServiceProvider ConfigureServices(IServiceCollection services)
        {
            //MVC
            services.AddControllersWithViews(
                options =>
                {
                    options.Filters.Add(new AbpAutoValidateAntiforgeryTokenAttribute());
                }
            );
            services.AddRazorPages();
            services.AddTransient<IViewRenderService, ViewRenderService>();

            IdentityRegistrar.Register(services);
            AuthConfigurer.Configure(services, _appConfiguration);

            services.AddSignalR();

            // Configure CORS for angular2 UI
            services.AddCors(
                options => options.AddPolicy(
                    _defaultCorsPolicyName,
                    builder => builder
                        .WithOrigins(
                            // App:CorsOrigins in appsettings.json can contain more than one address separated by comma.
                            _appConfiguration["App:CorsOrigins"]
                                .Split(",", StringSplitOptions.RemoveEmptyEntries)
                                .Select(o => o.RemovePostFix("/"))
                                .ToArray()
                        )
                        .AllowAnyHeader()
                        .AllowAnyMethod()
                        .AllowCredentials()
                )
            );

            // Swagger - Enable this line and the related lines in Configure method to enable swagger UI
            ConfigureSwagger(services);



            if (WebConsts.HangfireDashboardEnabled)
            {
                //Hangfire(Enable to use Hangfire instead of default job manager)
                services.AddHangfire(config =>
                {
                    config.UseSqlServerStorage(_appConfiguration.GetConnectionString("Hangfire"));
                });

                services.AddHangfireServer();
            }

            // Set up log directory for production BEFORE log4net is configured
            if (!_hostingEnvironment.IsDevelopment())
            {
                var logDirectory = Path.Combine(_hostingEnvironment.ContentRootPath, "App_Data", "Logs");
                if (!Directory.Exists(logDirectory))
                {
                    Directory.CreateDirectory(logDirectory);
                }
            }

            // Configure Abp and Dependency Injection
            return services.AddAbp<PMSWebHostModule>(
                // Configure Log4Net logging
                options => options.IocManager.IocContainer.AddFacility<LoggingFacility>(
                    f => f.UseAbpLog4Net().WithConfig(_hostingEnvironment.IsDevelopment()
                            ? "log4net.config"
                            : "log4net.Production.config"
                        )
                )
            );
        }

        public void Configure(IApplicationBuilder app, ILoggerFactory loggerFactory)
        {
            app.UseAbp(options => { options.UseAbpRequestLocalization = false; }); // Initializes ABP framework.

            app.UseCors(_defaultCorsPolicyName); // Enable CORS!

            app.Use(async (context, next) =>
            {
                if (context.Request.Path.Value.Contains("/file/view") 
                || context.Request.Path.Value.ToLower().Contains("paysliphtml"))
                {
                    // Remove the X-Frame-Options header
                    context.Response.Headers.Remove("X-Frame-Options");
                }
                await next();
                if (context.Request.Path.Value != null
                    && context.Response.StatusCode == 404
                    && !Path.HasExtension(context.Request.Path.Value)
                    && !context.Request.Path.Value.StartsWith("/api/services", StringComparison.InvariantCultureIgnoreCase)
                    )
                {
                    context.Request.Path = "/index.html";
                    await next();
                }
            });

            //// Custom middleware to remove X-Frame-Options header for a specific route
            //app.Use(async (context, next) =>
            //{
            //    await next();

            //    // Check if the request path matches the specific route
            //    if (context.Request.Path.Value.Contains("/file/view"))
            //    {
            //        // Remove the X-Frame-Options header
            //        context.Response.Headers.Remove("X-Frame-Options");
            //    }
            //});

            app.UseStaticFiles();

            app.UseRouting();

            app.UseAuthentication();

            app.UseJwtTokenMiddleware();

            app.UseAbpRequestLocalization();

            app.UseAuthorization();

            app.UseEndpoints(endpoints =>
            {
                endpoints.MapHub<AbpCommonHub>("/signalr");
                endpoints.MapHub<PMS.Application.Hubs.PhysicalCountHub>("/signalr-physicalcount");
                endpoints.MapControllerRoute("default", _hostingEnvironment.IsDevelopment() ? "{controller=UI}/{action=Index}/{id?}" : "{controller=Home}/{action=Index}/{id?}");
                endpoints.MapControllerRoute("defaultWithArea", "{area}/{controller=Home}/{action=Index}/{id?}");
            });

            if (WebConsts.SwaggerUiEnabled)
            {
                // Enable middleware to serve generated Swagger as a JSON endpoint
                app.UseSwagger(c => { c.RouteTemplate = "swagger/{documentName}/swagger.json"; });

                // Enable middleware to serve swagger-ui assets (HTML, JS, CSS etc.)
                app.UseSwaggerUI(options =>
                {
                    // specifying the Swagger JSON endpoint.
                    options.SwaggerEndpoint($"/swagger/{_apiVersion}/swagger.json", $"PMS API {_apiVersion}");
                    options.IndexStream = () => Assembly.GetExecutingAssembly()
                        .GetManifestResourceStream("PMS.Web.Host.wwwroot.swagger.ui.index.html");
                    options.DisplayRequestDuration(); // Controls the display of the request duration (in milliseconds) for "Try it out" requests.
                }); // URL: /swagger
            }

            if (WebConsts.HangfireDashboardEnabled)
            {
                //Hangfire dashboard &server(Enable to use Hangfire instead of default job manager)
                app.UseHangfireDashboard(WebConsts.HangfireDashboardEndPoint, new DashboardOptions
                {
                    Authorization = new[] { new Abp.Hangfire.AbpHangfireAuthorizationFilter(PermissionNames.Pages_HangfireDasboard) }
                });
            }

            Clock.Provider = ClockProviders.Local;
        }

        public void ConfigureSwagger(IServiceCollection services)
        {
            if (WebConsts.SwaggerUiEnabled)
            {
                // Swagger - Enable this line and the related lines in Configure method to enable swagger UI
                services.AddSwaggerGen(options =>
                {
                    options.SwaggerDoc(_apiVersion, new OpenApiInfo
                    {
                        Version = _apiVersion,
                        Title = "PMS API"
                    });
                    options.DocInclusionPredicate((docName, description) => true);
                    options.ParameterFilter<SwaggerEnumParameterFilter>();
                    options.SchemaFilter<SwaggerEnumSchemaFilter>();

                    // Define the BearerAuth scheme that's in use
                    options.AddSecurityDefinition("bearerAuth", new OpenApiSecurityScheme()
                    {
                        Description = "JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\"",
                        Name = "Authorization",
                        In = ParameterLocation.Header,
                        Type = SecuritySchemeType.ApiKey
                    });

                    //add summaries to swagger
                    var canShowSummaries = _appConfiguration.GetValue<bool>("Swagger:ShowSummaries");
                    if (!canShowSummaries) return;

                    var hostXmlFile = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
                    var hostXmlPath = Path.Combine(AppContext.BaseDirectory, hostXmlFile);
                    options.IncludeXmlComments(hostXmlPath);

                    var applicationXml = $"PMS.Application.xml";
                    var applicationXmlPath = Path.Combine(AppContext.BaseDirectory, applicationXml);
                    options.IncludeXmlComments(applicationXmlPath);

                    var webCoreXmlFile = $"PMS.Web.Core.xml";
                    var webCoreXmlPath = Path.Combine(AppContext.BaseDirectory, webCoreXmlFile);
                    options.IncludeXmlComments(webCoreXmlPath);
                });
            }
        }
    }
}



