using Abp.Runtime.Validation;
using PMS.Dto;

namespace PMS.Auditing.Dto;

public class GetAuditLogsInput : PagedResultFilterRequestDto, IShouldNormalize
{
    public long? UserId { get; set; }
    public bool? HasException { get; set; }

    public void Normalize()
    {
        Sorting += "Id desc";
    }
}

