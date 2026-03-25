using Abp.Application.Services;
using System;
using System.Collections.Generic;
using Abp.Application.Services.Dto;
using Abp.Authorization;
using Abp.Domain.Repositories;
using Abp.Linq.Extensions;
using Abp.UI;
using Microsoft.EntityFrameworkCore;
using PMS.App;
using PMS.App.Rooms.Dto;
using PMS.Authorization;
using System.Linq;
using System.Linq.Dynamic.Core;
using System.Threading.Tasks;

namespace PMS.App.Rooms;

public interface IRoomTypeAppService : IApplicationService
{
    Task<RoomTypeDto> GetAsync(Guid id);
    Task<PagedResultDto<RoomTypeListDto>> GetAllAsync(GetRoomTypesInput input);
    Task<Guid> CreateAsync(CreateRoomTypeDto input);
    Task UpdateAsync(RoomTypeDto input);
    Task<List<RoomTypeListDto>> GetAllActiveAsync();
}

public interface IRoomAppService : IApplicationService
{
    Task<RoomDto> GetAsync(Guid id);
    Task<PagedResultDto<RoomListDto>> GetAllAsync(GetRoomsInput input);
    Task<Guid> CreateAsync(CreateRoomDto input);
    Task UpdateAsync(RoomDto input);
    Task UpdateHousekeepingStatusAsync(UpdateHousekeepingStatusDto input);
}

[AbpAuthorize]
public class RoomTypeAppService(
    IRepository<RoomType, Guid> roomTypeRepository
) : PMSAppServiceBase, IRoomTypeAppService
{
    [AbpAuthorize(PermissionNames.Pages_RoomTypes_Create)]
    public async Task<Guid> CreateAsync(CreateRoomTypeDto input)
    {
        var exists = await roomTypeRepository.GetAll().AnyAsync(r => r.Name == input.Name.Trim());
        if (exists) throw new UserFriendlyException(L("RoomTypeNameAlreadyExists"));

        var entity = ObjectMapper.Map<RoomType>(input);
        return await roomTypeRepository.InsertAndGetIdAsync(entity);
    }

    public async Task<RoomTypeDto> GetAsync(Guid id)
    {
        var entity = await roomTypeRepository.GetAsync(id);
        return ObjectMapper.Map<RoomTypeDto>(entity);
    }

    public async Task<List<RoomTypeListDto>> GetAllActiveAsync()
    {
        var list = await roomTypeRepository.GetAll()
            .Where(r => r.IsActive)
            .OrderBy(r => r.Name)
            .Select(r => new RoomTypeListDto
            {
                Id = r.Id,
                Name = r.Name,
                MaxAdults = r.MaxAdults,
                MaxChildren = r.MaxChildren,
                IsActive = r.IsActive,
                NumberOfRooms = r.Rooms.Count
            })
            .ToListAsync();
        return list;
    }

    public async Task<PagedResultDto<RoomTypeListDto>> GetAllAsync(GetRoomTypesInput input)
    {
        var query = roomTypeRepository.GetAll()
            .WhereIf(!string.IsNullOrWhiteSpace(input.Filter), r => r.Name.Contains(input.Filter))
            .WhereIf(input.IsActive.HasValue, r => r.IsActive == input.IsActive);

        var total = await query.CountAsync();
        var items = await query
            .OrderBy(input.Sorting ?? "Name")
            .PageBy(input)
            .Select(r => new RoomTypeListDto
            {
                Id = r.Id,
                Name = r.Name,
                MaxAdults = r.MaxAdults,
                MaxChildren = r.MaxChildren,
                IsActive = r.IsActive,
                NumberOfRooms = r.Rooms.Count
            })
            .ToListAsync();
        return new PagedResultDto<RoomTypeListDto>(total, items);
    }

    [AbpAuthorize(PermissionNames.Pages_RoomTypes_Edit)]
    public async Task UpdateAsync(RoomTypeDto input)
    {
        var entity = await roomTypeRepository.GetAsync(input.Id);
        ObjectMapper.Map(input, entity);
        await roomTypeRepository.UpdateAsync(entity);
    }
}

[AbpAuthorize]
public class RoomAppService(
    IRepository<Room, Guid> roomRepository,
    IRepository<RoomStatusLog, Guid> roomStatusLogRepository,
    IRepository<HousekeepingLog, Guid> housekeepingLogRepository
) : PMSAppServiceBase, IRoomAppService
{
    [AbpAuthorize(PermissionNames.Pages_Rooms_Create)]
    public async Task<Guid> CreateAsync(CreateRoomDto input)
    {
        var exists = await roomRepository.GetAll().AnyAsync(r => r.RoomNumber == input.RoomNumber.Trim().ToUpper());
        if (exists) throw new UserFriendlyException(L("RoomNumberAlreadyExists"));

        var entity = ObjectMapper.Map<Room>(input);
        entity.RoomNumber = input.RoomNumber.Trim().ToUpper();
        return await roomRepository.InsertAndGetIdAsync(entity);
    }

    public async Task<RoomDto> GetAsync(Guid id)
    {
        var entity = await roomRepository.GetAll()
            .Include(r => r.RoomType)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (entity == null) throw new UserFriendlyException(L("RoomNotFound"));
        return ObjectMapper.Map<RoomDto>(entity);
    }

    public async Task<PagedResultDto<RoomListDto>> GetAllAsync(GetRoomsInput input)
    {
        var query = roomRepository.GetAll()
            .Include(r => r.RoomType)
            .WhereIf(!string.IsNullOrWhiteSpace(input.Filter),
                r => r.RoomNumber.Contains(input.Filter) || r.RoomType.Name.Contains(input.Filter))
            .WhereIf(input.HousekeepingStatus.HasValue, r => r.HousekeepingStatus == input.HousekeepingStatus)
            .WhereIf(input.RoomTypeId.HasValue, r => r.RoomTypeId == input.RoomTypeId)
            .WhereIf(input.IsActive.HasValue, r => r.IsActive == input.IsActive);

        var total = await query.CountAsync();
        var items = await query.OrderBy(input.Sorting ?? "RoomNumber").PageBy(input).ToListAsync();
        return new PagedResultDto<RoomListDto>(total, ObjectMapper.Map<System.Collections.Generic.List<RoomListDto>>(items));
    }

    [AbpAuthorize(PermissionNames.Pages_Rooms_Edit)]
    public async Task UpdateAsync(RoomDto input)
    {
        var entity = await roomRepository.GetAsync(input.Id);
        var originalHousekeepingStatus = entity.HousekeepingStatus;
        ObjectMapper.Map(input, entity);
        entity.HousekeepingStatus = originalHousekeepingStatus;
        await roomRepository.UpdateAsync(entity);
    }

    public async Task UpdateHousekeepingStatusAsync(UpdateHousekeepingStatusDto input)
    {
        var room = await roomRepository.GetAsync(input.RoomId);
        var oldStatus = room.HousekeepingStatus;
        room.HousekeepingStatus = input.HousekeepingStatus;
        await roomRepository.UpdateAsync(room);

        await roomStatusLogRepository.InsertAsync(new RoomStatusLog
        {
            RoomId = input.RoomId,
            HousekeepingStatus = input.HousekeepingStatus,
            Remarks = input.Remarks ?? string.Empty,
            ChangedAt = Abp.Timing.Clock.Now
        });

        await housekeepingLogRepository.InsertAsync(new HousekeepingLog
        {
            RoomId = input.RoomId,
            OldStatus = oldStatus,
            NewStatus = input.HousekeepingStatus,
            StaffId = input.StaffId,
            Remarks = input.Remarks,
        });
    }
}
