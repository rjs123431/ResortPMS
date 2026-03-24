using Abp.TestBase;

namespace PMS.Tests;

public abstract class PMSTestBase : AbpIntegratedTestBase<PMSTestModule>
{
    protected PMSTestBase()
    {
        SeedTestData();
    }

    protected virtual void SeedTestData() { }
}
