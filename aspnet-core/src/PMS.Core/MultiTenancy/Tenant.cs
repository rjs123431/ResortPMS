using Abp.MultiTenancy;
using PMS.Authorization.Users;

namespace PMS.MultiTenancy;

public class Tenant : AbpTenant<User>
{
    public const string DefaultTenancyName = "Default";

    public Tenant()
    {
    }

    public Tenant(string tenancyName, string name)
        : base(tenancyName, name)
    {
    }

    //public string CompanyName { get; set; }
    //public string Address { get; set; }
    //public string Phone { get; set; }
    //public string Fax { get; set; }
    //public string Email { get; set; }
    //public Guid? LogoBinaryObjectId { get; set; }
}

