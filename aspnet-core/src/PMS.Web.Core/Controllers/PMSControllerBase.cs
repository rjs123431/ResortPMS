using Abp;
using Abp.AspNetCore.Mvc.Controllers;
using Abp.IdentityFramework;
using JetBrains.Annotations;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using PuppeteerSharp;
using PuppeteerSharp.Media;
using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace PMS.Controllers
{
    public abstract class PMSControllerBase : AbpController
    {
        private readonly IWebHostEnvironment _env;

        protected PMSControllerBase()
        {
            _env = EnvironmentHelper.WebHostEnvironment;
            LocalizationSourceName = PMSConsts.LocalizationSourceName;
        }

        protected void CheckErrors(IdentityResult identityResult)
        {
            identityResult.CheckErrors(LocalizationManager);
        }

        protected async Task<Stream> StreamViewToPdf(string action, string controller, [CanBeNull] object values, bool isLong = false, bool? landscape = false)
        {
            try
            {
                var baseUrl = $"{HttpContext.Request.Scheme}://{HttpContext.Request.Host}";
                var actionUrl = Url.Action(action, controller, values);
                var url = $"{baseUrl}{actionUrl}";

                var exePath = Path.Combine(_env.WebRootPath, "chrome-win\\chrome.exe");
                Logger.Error(exePath);
                await using var browser = await Puppeteer.LaunchAsync(new LaunchOptions
                {
                    Headless = true,
                    ExecutablePath = exePath
                });
                await using var page = await browser.NewPageAsync();
                await page.GoToAsync(url, WaitUntilNavigation.Networkidle0); // Wait until the network is idle
                await page.EvaluateExpressionHandleAsync("document.fonts.ready"); // Wait for fonts to be loaded

                // Set PDF options to landscape
                var pdfOptions = new PdfOptions
                {
                    Format = isLong ? PaperFormat.Legal : PaperFormat.A4,
                    Landscape = landscape ?? false,
                    MarginOptions = new MarginOptions
                    {
                        Top = "0.5in",
                        Bottom = "0.5in",
                        Left = "0.5in",
                        Right = "0.5in"
                    }
                };

                var stream = await page.PdfStreamAsync(pdfOptions);
                return stream;
            }
            catch (Exception ex)
            {
                // Handle exceptions as needed
                throw new InvalidOperationException("Failed to generate PDF.", ex);
            }
        }

        protected async Task<Stream> StreamViewToPdf(string html, bool isLong = false, bool? landscape = false)
        {
            try
            {
                var exePath = Path.Combine(_env.WebRootPath, "chrome-win\\chrome.exe");
                await using var browser = await Puppeteer.LaunchAsync(new LaunchOptions
                {
                    Headless = true,
                    ExecutablePath = exePath
                });
                await using var page = await browser.NewPageAsync();

                await page.SetContentAsync(html);

                // Set PDF options to landscape
                var pdfOptions = new PdfOptions
                {
                    Format = isLong ? PaperFormat.Legal : PaperFormat.A4,
                    Landscape = landscape ?? false,
                    MarginOptions = new MarginOptions
                    {
                        Top = "0.5in",
                        Bottom = "0.5in",
                        Left = "0.5in",
                        Right = "0.5in"
                    }
                };

                var stream = await page.PdfStreamAsync(pdfOptions);
                return stream;
            }
            catch (Exception ex)
            {
                // Handle exceptions as needed
                throw new InvalidOperationException("Failed to generate PDF.", ex);
            }
        }

        protected async Task<bool> HasPermissionAsync(string permissionName)
        {
            var token = HttpContext.Request.Cookies["SS.Authtoken"];
            if (string.IsNullOrEmpty(token))
                return false;

            var tokenValues = GetValuesFromToken(token);
            var userId = tokenValues["sub"];
            var user = new UserIdentifier(1, Convert.ToInt64(userId));

            return await PermissionChecker.IsGrantedAsync(user, permissionName);

        }

        protected Dictionary<string, string> GetValuesFromToken(string token)
        {
            var handler = new JwtSecurityTokenHandler();

            // Validate if the token is in a readable format
            if (!handler.CanReadToken(token))
            {
                throw new ArgumentException("Invalid token format.");
            }

            // Read the token
            var jwtToken = handler.ReadJwtToken(token);

            // Extract claims
            var claims = jwtToken.Claims;

            // Convert claims to a dictionary
            var values = claims.ToDictionary(c => c.Type, c => c.Value);

            return values;
        }
    }
}

