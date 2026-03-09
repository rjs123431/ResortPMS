using Abp.Dapper;
using Abp.EntityFrameworkCore;
using Abp.Modules;
using Abp.Reflection.Extensions;

namespace PMS.EntityFrameworkCore
{
    [DependsOn(
    typeof(AbpEntityFrameworkCoreModule),
    typeof(AbpDapperModule)
   )]
    public class PMSDapperModule : AbpModule
    {
        public override void Initialize()
        {
            IocManager.RegisterAssemblyByConvention(typeof(PMSDapperModule).GetAssembly());
        }
    }
}




