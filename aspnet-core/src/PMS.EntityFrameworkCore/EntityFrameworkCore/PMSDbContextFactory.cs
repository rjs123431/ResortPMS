using PMS.Configuration;
using PMS.Web;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;
using System;

namespace PMS.EntityFrameworkCore
{
    /* This class is needed to run "dotnet ef ..." commands from command line on development. Not used anywhere else */
    public class PMSDbContextFactory : IDesignTimeDbContextFactory<PMSDbContext>
    {
        public PMSDbContext CreateDbContext(string[] args)
        {
            var builder = new DbContextOptionsBuilder<PMSDbContext>();
            var configuration = AppConfigurations.Get(WebContentDirectoryFinder.CalculateContentRootFolder(), Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT"));

            PMSDbContextConfigurer.Configure(builder, configuration.GetConnectionString(PMSConsts.ConnectionStringName));

            return new PMSDbContext(builder.Options);
        }
    }
}





