using Abp.Application.Services;
using Abp.Application.Services.Dto;
using Abp.Authorization;
using Abp.Domain.Repositories;
using Abp.Linq.Extensions;
using Microsoft.EntityFrameworkCore;
using PMS.Auditing.Dto;
using PMS.Authorization;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace PMS.Auditing;

[AbpAuthorize(PermissionNames.Pages_Admin_AuditTrail)]
public class AuditTrailAppService(
    IRepository<MutationAuditLog, long> mutationRepository,
    IRepository<FinancialAuditLog, Guid> financialRepository
) : ApplicationService, IAuditTrailAppService
{
    public async Task<PagedResultDto<MutationAuditLogDto>> GetMutationAuditPagedAsync(GetMutationAuditLogInput input)
    {
        var query = mutationRepository.GetAll()
            .OrderByDescending(x => x.ExecutionTime)
            .WhereIf(!string.IsNullOrWhiteSpace(input.EntityType), x => x.EntityType == input.EntityType)
            .WhereIf(!string.IsNullOrWhiteSpace(input.EntityId), x => x.EntityId == input.EntityId)
            .WhereIf(input.FromDate.HasValue, x => x.ExecutionTime >= input.FromDate.Value)
            .WhereIf(input.ToDate.HasValue, x => x.ExecutionTime < input.ToDate.Value.Date.AddDays(1));

        var total = await query.CountAsync();
        var items = await query
            .Skip(input.SkipCount)
            .Take(input.MaxResultCount)
            .Select(x => new MutationAuditLogDto
            {
                Id = x.Id,
                EntityType = x.EntityType,
                EntityId = x.EntityId,
                Action = x.Action,
                OldValueJson = x.OldValueJson ?? string.Empty,
                NewValueJson = x.NewValueJson ?? string.Empty,
                UserId = x.UserId,
                ExecutionTime = x.ExecutionTime,
                MethodName = x.MethodName ?? string.Empty,
                Extra = x.Extra ?? string.Empty,
            })
            .ToListAsync();

        return new PagedResultDto<MutationAuditLogDto>(total, items);
    }

    public async Task<PagedResultDto<FinancialAuditLogDto>> GetFinancialAuditPagedAsync(GetFinancialAuditLogInput input)
    {
        var query = financialRepository.GetAll()
            .OrderByDescending(x => x.ExecutionTime)
            .WhereIf(!string.IsNullOrWhiteSpace(input.EventType), x => x.EventType == input.EventType)
            .WhereIf(input.FolioId.HasValue, x => x.FolioId == input.FolioId)
            .WhereIf(input.StayId.HasValue, x => x.StayId == input.StayId)
            .WhereIf(input.FromDate.HasValue, x => x.ExecutionTime >= input.FromDate.Value)
            .WhereIf(input.ToDate.HasValue, x => x.ExecutionTime < input.ToDate.Value.Date.AddDays(1));

        var total = await query.CountAsync();
        var items = await query
            .Skip(input.SkipCount)
            .Take(input.MaxResultCount)
            .Select(x => new FinancialAuditLogDto
            {
                Id = x.Id,
                EventType = x.EventType,
                ReferenceType = x.ReferenceType,
                ReferenceId = x.ReferenceId,
                FolioId = x.FolioId,
                StayId = x.StayId,
                Amount = x.Amount,
                Description = x.Description,
                UserId = x.UserId,
                ExecutionTime = x.ExecutionTime,
            })
            .ToListAsync();

        return new PagedResultDto<FinancialAuditLogDto>(total, items);
    }
}
