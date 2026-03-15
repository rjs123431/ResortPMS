using Abp.Dependency;
using Abp.Domain.Repositories;
using Abp.Runtime.Session;
using Abp.Timing;
using System;
using System.Text.Json;
using System.Threading.Tasks;

namespace PMS.Auditing;

public class MutationAuditService : IMutationAuditService, ITransientDependency
{
    private readonly IRepository<MutationAuditLog, long> _repository;
    private readonly IAbpSession _session;

    public MutationAuditService(
        IRepository<MutationAuditLog, long> repository,
        IAbpSession session)
    {
        _repository = repository;
        _session = session;
    }

    public async Task RecordAsync(
        string entityType,
        string entityId,
        string action,
        object? oldValue = null,
        object? newValue = null,
        string? methodName = null,
        string? extra = null)
    {
        var log = new MutationAuditLog
        {
            TenantId = _session.TenantId,
            EntityType = entityType,
            EntityId = entityId,
            Action = action,
            OldValueJson = oldValue != null ? JsonSerializer.Serialize(oldValue) : string.Empty,
            NewValueJson = newValue != null ? JsonSerializer.Serialize(newValue) : string.Empty,
            UserId = _session.UserId,
            ImpersonatorUserId = _session.ImpersonatorUserId,
            ExecutionTime = Clock.Now,
            MethodName = methodName,
            Extra = extra != null && extra.Length > 512 ? extra.Substring(0, 512) : (extra ?? string.Empty)
        };
        await _repository.InsertAsync(log);
    }
}
