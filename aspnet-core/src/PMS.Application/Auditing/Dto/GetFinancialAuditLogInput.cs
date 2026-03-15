using Abp.Application.Services.Dto;
using System;

namespace PMS.Auditing.Dto;

public class GetFinancialAuditLogInput : PagedResultRequestDto
{
    public string EventType { get; set; } = string.Empty;
    public Guid? FolioId { get; set; }
    public Guid? StayId { get; set; }
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
}
