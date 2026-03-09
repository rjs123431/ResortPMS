using Abp.AutoMapper;
using PMS.Authentication.External;

namespace PMS.Models.TokenAuth
{
    [AutoMapFrom(typeof(ExternalLoginProviderInfo))]
    public class ExternalLoginProviderInfoModel
    {
        public string Name { get; set; }

        public string ClientId { get; set; }

        public string Icon { get; set; }
    }
}





