using Abp.Application.Services;
using Abp.Application.Services.Dto;
using PMS.Auditing.Dto;
using System;
using System.Threading.Tasks;

namespace PMS.Auditing;

public interface IAuditTrailAppService : IApplicationService
{
    Task<PagedResultDto<MutationAuditLogDto>> GetMutationAuditPagedAsync(GetMutationAuditLogInput input);
    Task<PagedResultDto<FinancialAuditLogDto>> GetFinancialAuditPagedAsync(GetFinancialAuditLogInput input);
}
