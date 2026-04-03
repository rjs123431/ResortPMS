using Abp.Application.Services;
using Abp.Application.Services.Dto;
using Abp.Authorization;
using Abp.Domain.Repositories;
using Abp.Linq.Extensions;
using Abp.Timing;
using Abp.UI;
using Microsoft.EntityFrameworkCore;
using PMS.Authorization;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;

namespace PMS.App.Incidents;

public interface IIncidentAppService : IApplicationService
{
    Task<PagedResultDto<IncidentListDto>> GetListAsync(GetIncidentsInput input);
    Task<IncidentDto> GetAsync(EntityDto<Guid> input);
    Task<Guid> CreateAsync(CreateIncidentDto input);
    Task UpdateAsync(UpdateIncidentDto input);
    Task ResolveAsync(ResolveIncidentDto input);
    Task CloseAsync(EntityDto<Guid> input);
    Task DeleteAsync(EntityDto<Guid> input);
}

public class GetIncidentsInput : PagedAndSortedResultRequestDto
{
    public string Filter { get; set; }
    public IncidentStatus? Status { get; set; }
    public IncidentSeverity? Severity { get; set; }
    public Guid? StayId { get; set; }
}

public class IncidentListDto : EntityDto<Guid>
{
    public Guid StayId { get; set; }
    public string StayNo { get; set; } = string.Empty;
    public string GuestName { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public IncidentSeverity Severity { get; set; }
    public IncidentStatus Status { get; set; }
    public string Category { get; set; } = string.Empty;
    public string ReportedByName { get; set; } = string.Empty;
    public DateTime ReportedAt { get; set; }
    public DateTime? ResolvedAt { get; set; }
    public DateTime CreationTime { get; set; }
}

public class IncidentDto : IncidentListDto
{
    public string Resolution { get; set; } = string.Empty;
}

public class CreateIncidentDto
{
    [Required] public Guid StayId { get; set; }
    [Required][StringLength(256)] public string Title { get; set; } = string.Empty;
    [Required][StringLength(2048)] public string Description { get; set; } = string.Empty;
    public IncidentSeverity Severity { get; set; } = IncidentSeverity.Medium;
    [StringLength(64)] public string Category { get; set; } = string.Empty;
    [StringLength(128)] public string ReportedByName { get; set; } = string.Empty;
}

public class UpdateIncidentDto : CreateIncidentDto
{
    [Required] public Guid Id { get; set; }
}

public class ResolveIncidentDto
{
    [Required] public Guid Id { get; set; }
    [Required][StringLength(2048)] public string Resolution { get; set; } = string.Empty;
}

[AbpAuthorize(PermissionNames.Pages_Incidents)]
public class IncidentAppService(
    IRepository<Incident, Guid> incidentRepository,
    IRepository<Stay, Guid> stayRepository
) : PMSAppServiceBase, IIncidentAppService
{
    public async Task<PagedResultDto<IncidentListDto>> GetListAsync(GetIncidentsInput input)
    {
        var query = incidentRepository.GetAll()
            .Include(i => i.Stay)
            .WhereIf(!string.IsNullOrWhiteSpace(input.Filter),
                i => i.Title.Contains(input.Filter) ||
                     i.Description.Contains(input.Filter) ||
                     i.Stay.GuestName.Contains(input.Filter) ||
                     i.Stay.StayNo.Contains(input.Filter))
            .WhereIf(input.Status.HasValue, i => i.Status == input.Status.Value)
            .WhereIf(input.Severity.HasValue, i => i.Severity == input.Severity.Value)
            .WhereIf(input.StayId.HasValue, i => i.StayId == input.StayId.Value);

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(i => i.CreationTime)
            .Skip(input.SkipCount)
            .Take(input.MaxResultCount)
            .ToListAsync();

        return new PagedResultDto<IncidentListDto>(total, items.Select(MapToListDto).ToList());
    }

    public async Task<IncidentDto> GetAsync(EntityDto<Guid> input)
    {
        var incident = await incidentRepository.GetAll()
            .Include(i => i.Stay)
            .FirstOrDefaultAsync(i => i.Id == input.Id);

        if (incident == null)
            throw new UserFriendlyException("Incident not found.");

        return MapToDto(incident);
    }

    public async Task<Guid> CreateAsync(CreateIncidentDto input)
    {
        var stay = await stayRepository.FirstOrDefaultAsync(input.StayId);
        if (stay == null)
            throw new UserFriendlyException(L("StayNotFound"));

        var incident = new Incident
        {
            StayId = input.StayId,
            Title = input.Title,
            Description = input.Description,
            Severity = input.Severity,
            Category = input.Category ?? string.Empty,
            ReportedByName = input.ReportedByName ?? string.Empty,
            ReportedAt = Clock.Now,
            Status = IncidentStatus.Open,
        };

        return await incidentRepository.InsertAndGetIdAsync(incident);
    }

    public async Task UpdateAsync(UpdateIncidentDto input)
    {
        var incident = await incidentRepository.FirstOrDefaultAsync(input.Id);
        if (incident == null)
            throw new UserFriendlyException("Incident not found.");

        if (incident.Status == IncidentStatus.Closed)
            throw new UserFriendlyException("Cannot edit a closed incident.");

        incident.Title = input.Title;
        incident.Description = input.Description;
        incident.Severity = input.Severity;
        incident.Category = input.Category ?? string.Empty;
        incident.ReportedByName = input.ReportedByName ?? string.Empty;

        await incidentRepository.UpdateAsync(incident);
    }

    public async Task ResolveAsync(ResolveIncidentDto input)
    {
        var incident = await incidentRepository.FirstOrDefaultAsync(input.Id);
        if (incident == null)
            throw new UserFriendlyException("Incident not found.");

        if (incident.Status == IncidentStatus.Closed)
            throw new UserFriendlyException("Incident is already closed.");

        incident.Resolution = input.Resolution;
        incident.Status = IncidentStatus.Resolved;
        incident.ResolvedAt = Clock.Now;

        await incidentRepository.UpdateAsync(incident);
    }

    public async Task CloseAsync(EntityDto<Guid> input)
    {
        var incident = await incidentRepository.FirstOrDefaultAsync(input.Id);
        if (incident == null)
            throw new UserFriendlyException("Incident not found.");

        if (incident.Status == IncidentStatus.Closed)
            throw new UserFriendlyException("Incident is already closed.");

        incident.Status = IncidentStatus.Closed;

        await incidentRepository.UpdateAsync(incident);
    }

    public async Task DeleteAsync(EntityDto<Guid> input)
    {
        await incidentRepository.DeleteAsync(input.Id);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private static IncidentListDto MapToListDto(Incident i) => new()
    {
        Id = i.Id,
        StayId = i.StayId,
        StayNo = i.Stay?.StayNo ?? string.Empty,
        GuestName = i.Stay?.GuestName ?? string.Empty,
        Title = i.Title,
        Description = i.Description,
        Severity = i.Severity,
        Status = i.Status,
        Category = i.Category,
        ReportedByName = i.ReportedByName,
        ReportedAt = i.ReportedAt,
        ResolvedAt = i.ResolvedAt,
        CreationTime = i.CreationTime,
    };

    private static IncidentDto MapToDto(Incident i) => new()
    {
        Id = i.Id,
        StayId = i.StayId,
        StayNo = i.Stay?.StayNo ?? string.Empty,
        GuestName = i.Stay?.GuestName ?? string.Empty,
        Title = i.Title,
        Description = i.Description,
        Severity = i.Severity,
        Status = i.Status,
        Category = i.Category,
        ReportedByName = i.ReportedByName,
        ReportedAt = i.ReportedAt,
        ResolvedAt = i.ResolvedAt,
        Resolution = i.Resolution,
        CreationTime = i.CreationTime,
    };
}
