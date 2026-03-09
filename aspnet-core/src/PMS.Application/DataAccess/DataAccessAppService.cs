using Abp.Application.Services;
using Abp.Authorization;
using Abp.UI;
using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Threading.Tasks;

namespace PMS.DataAccess;

public interface IDataAccessAppService : IApplicationService
{
    Task<List<dynamic>> CreateQueryAsync(string sql);
    void RunMigration();
}

[AbpAuthorize]
public class DataAccessAppService(
    IDynamicRepository dynamicRepository,
    IConfiguration appConfiguration
    ) : PMSAppServiceBase, IDataAccessAppService
{
    public async Task<List<dynamic>> CreateQueryAsync(string sql)
    {
        try
        {
            if (AbpSession.UserId != 2)
            {
                throw new UserFriendlyException("Unauthorized.");
            }
            return await dynamicRepository.ExecuteSqlAsync(sql);
        }
        catch (Exception ex)
        {
            throw new UserFriendlyException(ex.Message);
        }
    }

    [AbpAllowAnonymous]
    public void RunMigration()
    {
        try
        {
            var appPath = appConfiguration["App:MigrationPath"];
            if (string.IsNullOrEmpty(appPath))
            {
                appPath = @"D:\PORTAL\PMS\Migrator\PMS.Migrator.exe";
            }
            Process.Start(appPath, "-q");
        }
        catch (Exception)
        { }
    }
}

