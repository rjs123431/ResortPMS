using Abp.Configuration;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using PMS.Configuration;
using System;

namespace PMS.Api.Filters;

[AttributeUsage(AttributeTargets.Method | AttributeTargets.Class)]
internal class ApiKeyAuthorizationAttribute : Attribute, IAuthorizationFilter
{
    public const string Header = "ApiKey";

    public void OnAuthorization(AuthorizationFilterContext context)
    {
        if (!context.HttpContext.Request.Headers.TryGetValue(Header, out var apiKey))
        {
            context.Result = Unauthorized();
            return;
        }

        if (context.HttpContext.RequestServices.GetService(typeof(ISettingManager)) is not SettingManager settingManager) return;

        var configApiKey = settingManager.GetSettingValue(AppSettingNames.PublicApiKey);

        if (!string.Equals(apiKey, configApiKey, StringComparison.OrdinalIgnoreCase))
        {
            context.Result = Unauthorized();
        }
    }

    private static UnauthorizedObjectResult Unauthorized()
    {
        return new UnauthorizedObjectResult(new
        {
            Error = new { Message = "Unauthorized" }
        });
    }
}
