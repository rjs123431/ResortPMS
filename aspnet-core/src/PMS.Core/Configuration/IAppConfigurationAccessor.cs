using Microsoft.Extensions.Configuration;

namespace PMS.Configuration
{
    public interface IAppConfigurationAccessor
    {
        IConfigurationRoot Configuration { get; }
    }
}





