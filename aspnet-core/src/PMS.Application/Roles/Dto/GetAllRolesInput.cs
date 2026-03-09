using Abp.Runtime.Validation;
using PMS.Dto;

namespace PMS.Roles.Dto
{
    public class GetAllRolesInput : PagedResultFilterRequestDto, IShouldNormalize
    {
        public void Normalize()
        {
            Sorting ??= "Name";
        }
    }
}




