using Abp.Application.Services.Dto;
using System;

namespace PMS.Auditing.Dto;

public class GetMutationAuditLogInput : PagedResultRequestDto
{
    public string EntityType { get; set; } = string.Empty;
    public string EntityId { get; set; } = string.Empty;
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
}
