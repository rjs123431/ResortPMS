using Microsoft.AspNetCore;
using Microsoft.AspNetCore.Hosting;
using Serilog;
using Serilog.Events;
using Serilog.Formatting.Compact;
using System;
using System.IO;
using System.Linq;

namespace PMS.Web.Host.Startup
{
    public class Program
    {
        public static void Main(string[] args)
        {
            Log.Logger = new LoggerConfiguration()
                .MinimumLevel.Information()
                .MinimumLevel.Override("Microsoft", LogEventLevel.Warning)
                .MinimumLevel.Override("Abp", LogEventLevel.Warning)
                .Enrich.FromLogContext()
                .Enrich.WithThreadId()
                .WriteTo.Console()
                .WriteTo.File(
                    new CompactJsonFormatter(),
                    Path.Combine("App_Data", "Logs", "pms-.json"),
                    rollingInterval: RollingInterval.Day,
                    retainedFileCountLimit: 31)
                .CreateBootstrapLogger();

            try
            {
                if (args.Contains("--seed"))
                {
                    Log.Information("Running database seed...");
                    PMSWebHostModule.RunSeedOnStartup = true;
                    var host = BuildWebHost(args.Where(a => a != "--seed").ToArray());
                    Log.Information("Database seed completed successfully.");
                    return;
                }

                BuildWebHost(args).Run();
            }
            catch (Exception ex)
            {
                Log.Fatal(ex, "Host terminated unexpectedly");
            }
            finally
            {
                Log.CloseAndFlush();
            }
        }

        public static IWebHost BuildWebHost(string[] args)
        {
            return WebHost.CreateDefaultBuilder(args)
                .UseStartup<Startup>()
                .Build();
        }
    }
}
