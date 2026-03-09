using Abp.Application.Services;
using Abp.Application.Services.Dto;
using Abp.Auditing;
using Abp.Authorization;
using Abp.Collections.Extensions;
using Abp.Domain.Repositories;
using Abp.Linq.Extensions;
using Microsoft.EntityFrameworkCore;
using PMS.Auditing.Dto;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Dynamic.Core;
using System.Threading.Tasks;

namespace PMS.Auditing;

public interface IAuditLogAppService : IApplicationService
{
    Task<PagedResultDto<AuditLogDto>> GetAllAsync(GetAuditLogsInput input);
}

[AbpAuthorize]
public class AuditLogAppService(
    IRepository<AuditLog, long> auditLogRepository
) : PMSAppServiceBase, IAuditLogAppService
{
    public async Task<PagedResultDto<AuditLogDto>> GetAllAsync(GetAuditLogsInput input)
    {
        var query = auditLogRepository.GetAll().AsNoTracking()
                .WhereIf(!input.Filter.IsNullOrEmpty(), x => x.ServiceName.Contains(input.Filter))
                .WhereIf(input.HasException.HasValue && input.HasException.Value, x => x.Exception != null)
                .WhereIf(input.UserId.HasValue, x => x.UserId == input.UserId)
            ;

        var count = query.Count();

        var data = await query
            .OrderBy(input.Sorting)
            .PageBy(input)
            .ToListAsync();

        var result = ObjectMapper.Map<List<AuditLogDto>>(data);

        return new PagedResultDto<AuditLogDto>(count, result);
    }
}

