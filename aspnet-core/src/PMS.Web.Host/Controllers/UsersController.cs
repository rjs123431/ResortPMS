using Abp.AspNetCore.Mvc.Authorization;
using Abp.BackgroundJobs;
using PMS.Authorization;
using PMS.Controllers;
using PMS.Storage;

namespace PMS.Web.Host.Controllers
{
    [AbpMvcAuthorize(PermissionNames.Pages_Admin_Users)]
    public class UsersController : UsersControllerBase
    {
        public UsersController(IBinaryObjectManager binaryObjectManager, IBackgroundJobManager backgroundJobManager)
            : base(binaryObjectManager, backgroundJobManager)
        {
        }
    }
}





