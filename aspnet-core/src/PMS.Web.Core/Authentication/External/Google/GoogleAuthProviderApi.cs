using System;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text.Json;
using System.Threading.Tasks;

namespace PMS.Authentication.External.Google
{
    public class GoogleAuthProviderApi : ExternalAuthProviderApiBase
    {
        public const string Name = "Google";

        public override async Task<ExternalAuthUserInfo> GetUserInfo(string accessCode)
        {
            var text = ProviderInfo.AdditionalParams["UserInfoEndpoint"];
            if (string.IsNullOrEmpty(text))
            {
                throw new ApplicationException("Authentication:Google:UserInfoEndpoint configuration is required.");
            }

            using var client = new HttpClient();
            client.DefaultRequestHeaders.UserAgent.ParseAdd("Microsoft ASP.NET Core OAuth middleware");
            client.DefaultRequestHeaders.Accept.ParseAdd("application/json");
            client.Timeout = TimeSpan.FromSeconds(30.0);
            client.MaxResponseContentBufferSize = 10485760L;
            var httpRequestMessage = new HttpRequestMessage(HttpMethod.Get, text);
            httpRequestMessage.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessCode);
            var obj = await client.SendAsync(httpRequestMessage);
            obj.EnsureSuccessStatusCode();
            JsonDocument user = JsonDocument.Parse(await obj.Content.ReadAsStringAsync());
            return new ExternalAuthUserInfo
            {
                Name = GoogleHelper.GetGivenName(user),
                EmailAddress = GoogleHelper.GetEmail(user),
                Surname = GoogleHelper.GetFamilyName(user),
                ProviderKey = GoogleHelper.GetId(user),
                Provider = "Google"
            };
        }
    }
}





