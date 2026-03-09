using System;
using System.Collections.Generic;

namespace PMS.Authentication.External
{
    public class ExternalLoginProviderInfo
    {
        public string Name { get; set; }

        public string ClientId { get; set; }

        public string ClientSecret { get; set; }

        public Type ProviderApiType { get; set; }

        public string Icon { get; set; }

        public Dictionary<string, string> AdditionalParams { get; set; }

        public ExternalLoginProviderInfo(string name, string clientId, string clientSecret, Type providerApiType, string icon, Dictionary<string, string> additionalParams = null)
        {
            Name = name;
            ClientId = clientId;
            ClientSecret = clientSecret;
            ProviderApiType = providerApiType;
            Icon = icon;
            AdditionalParams = (additionalParams ?? new Dictionary<string, string>());
        }
    }
}





