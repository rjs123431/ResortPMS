using Abp.Application.Services;
using Abp.Application.Services.Dto;
using Abp.Authorization;
using Abp.Domain.Repositories;
using Abp.UI;
using Microsoft.EntityFrameworkCore;
using PMS.Authorization;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace PMS.App.Maintenance;

public class RoomMaintenanceTypeDto : EntityDto<Guid>
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public bool IsActive { get; set; }
}

public class CreateUpdateRoomMaintenanceTypeDto
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
}

public interface IRoomMaintenanceTypeAppService : IApplicationService
{
    Task<List<RoomMaintenanceTypeDto>> GetAllAsync();
    Task<RoomMaintenanceTypeDto> CreateAsync(CreateUpdateRoomMaintenanceTypeDto input);
    Task<RoomMaintenanceTypeDto> UpdateAsync(Guid id, CreateUpdateRoomMaintenanceTypeDto input);
    Task DeleteAsync(EntityDto<Guid> input);
}

[AbpAuthorize(PermissionNames.Pages_Maintenance)]
public class RoomMaintenanceTypeAppService(
    IRepository<RoomMaintenanceType, Guid> typeRepository
) : PMSAppServiceBase, IRoomMaintenanceTypeAppService
{
    public async Task<List<RoomMaintenanceTypeDto>> GetAllAsync()
    {
        var items = await typeRepository.GetAll()
            .AsNoTracking()
            .OrderBy(x => x.Name)
            .ToListAsync();

        return items.Select(t => new RoomMaintenanceTypeDto
        {
            Id = t.Id,
            Name = t.Name,
            Description = t.Description,
            IsActive = t.IsActive,
        }).ToList();
    }

    public async Task<RoomMaintenanceTypeDto> CreateAsync(CreateUpdateRoomMaintenanceTypeDto input)
    {
        var name = (input.Name ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(name))
            throw new UserFriendlyException("Maintenance type name is required.");

        var exists = await typeRepository.GetAll().AnyAsync(t => t.Name == name);
        if (exists)
            throw new UserFriendlyException($"A maintenance type named '{name}' already exists.");

        var entity = new RoomMaintenanceType
        {
            Id = Guid.NewGuid(),
            Name = name,
            Description = (input.Description ?? string.Empty).Trim(),
            IsActive = input.IsActive,
        };

        await typeRepository.InsertAsync(entity);
        return new RoomMaintenanceTypeDto { Id = entity.Id, Name = entity.Name, Description = entity.Description, IsActive = entity.IsActive };
    }

    public async Task<RoomMaintenanceTypeDto> UpdateAsync(Guid id, CreateUpdateRoomMaintenanceTypeDto input)
    {
        var entity = await typeRepository.GetAsync(id);

        var name = (input.Name ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(name))
            throw new UserFriendlyException("Maintenance type name is required.");

        var exists = await typeRepository.GetAll().AnyAsync(t => t.Name == name && t.Id != id);
        if (exists)
            throw new UserFriendlyException($"A maintenance type named '{name}' already exists.");

        entity.Name = name;
        entity.Description = (input.Description ?? string.Empty).Trim();
        entity.IsActive = input.IsActive;

        await typeRepository.UpdateAsync(entity);
        return new RoomMaintenanceTypeDto { Id = entity.Id, Name = entity.Name, Description = entity.Description, IsActive = entity.IsActive };
    }

    public async Task DeleteAsync(EntityDto<Guid> input)
    {
        await typeRepository.DeleteAsync(input.Id);
    }
}
