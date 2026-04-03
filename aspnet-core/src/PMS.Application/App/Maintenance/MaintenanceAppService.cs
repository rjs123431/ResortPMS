using Abp.Application.Services;
using Abp.Application.Services.Dto;
using Abp.Authorization;
using Abp.Domain.Repositories;
using Abp.Linq.Extensions;
using Abp.Timing;
using Abp.UI;
using Microsoft.EntityFrameworkCore;
using PMS.Application.App.RoomDailyInventory;
using PMS.Application.Hubs;
using PMS.Authorization;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Dynamic.Core;
using System.Threading.Tasks;

namespace PMS.App.Maintenance;

public interface IRoomMaintenanceAppService : IApplicationService
{
    Task<PagedResultDto<RoomMaintenanceRequestDto>> GetListAsync(GetRoomMaintenanceInput input);
    Task<RoomMaintenanceRequestDto> GetAsync(EntityDto<Guid> input);
    Task<Guid> CreateAsync(CreateRoomMaintenanceRequestDto input);
    Task AssignAsync(AssignRoomMaintenanceRequestDto input);
    Task StartAsync(EntityDto<Guid> input);
    Task CompleteAsync(EntityDto<Guid> input);
    Task CancelAsync(CancelRoomMaintenanceRequestDto input);
}

public class GetRoomMaintenanceInput : PagedAndSortedResultRequestDto
{
    public Guid? RoomId { get; set; }
    public Guid? AssignedStaffId { get; set; }
    public RoomMaintenanceStatus? Status { get; set; }
    public MaintenanceCategory? Category { get; set; }
    public DateTime? StartDateFrom { get; set; }
    public DateTime? EndDateTo { get; set; }
    public string Filter { get; set; }
}

public class RoomMaintenanceRequestDto : EntityDto<Guid>
{
    public Guid RoomId { get; set; }
    public string RoomNumber { get; set; } = string.Empty;
    public Guid? AssignedStaffId { get; set; }
    public string AssignedStaffName { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public RoomMaintenancePriority Priority { get; set; }
    public RoomMaintenanceStatus Status { get; set; }
    public MaintenanceCategory Category { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public DateTime OpenedAt { get; set; }
    public DateTime? AssignedAt { get; set; }
    public DateTime? StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public DateTime? CancelledAt { get; set; }
    public string CancellationReason { get; set; } = string.Empty;
    public List<Guid> TypeIds { get; set; } = new();
    public List<string> TypeNames { get; set; } = new();
}

public class CreateRoomMaintenanceRequestDto
{
    public Guid RoomId { get; set; }
    public Guid? AssignedStaffId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public RoomMaintenancePriority Priority { get; set; } = RoomMaintenancePriority.Medium;
    public MaintenanceCategory Category { get; set; } = MaintenanceCategory.Reactive;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public List<Guid> TypeIds { get; set; } = new();
}

public class AssignRoomMaintenanceRequestDto
{
    public Guid Id { get; set; }
    public Guid StaffId { get; set; }
}

public class CancelRoomMaintenanceRequestDto
{
    public Guid Id { get; set; }
    public string Reason { get; set; } = string.Empty;
}

[AbpAuthorize(PermissionNames.Pages_Maintenance)]
public class RoomMaintenanceAppService(
    IRepository<RoomMaintenanceRequest, Guid> maintenanceRepository,
    IRepository<RoomMaintenanceType, Guid> maintenanceTypeRepository,
    IRepository<RoomStatusLog, Guid> roomStatusLogRepository,
    IRepository<Room, Guid> roomRepository,
    IRepository<Staff, Guid> staffRepository,
    IRepository<ReservationRoom, Guid> reservationRoomRepository,
    IRepository<StayRoom, Guid> stayRoomRepository,
    IRoomDailyInventoryService roomDailyInventoryService,
    IRoomStatusHubBroadcaster roomStatusHubBroadcaster
) : PMSAppServiceBase, IRoomMaintenanceAppService
{
    public async Task<PagedResultDto<RoomMaintenanceRequestDto>> GetListAsync(GetRoomMaintenanceInput input)
    {
        var query = maintenanceRepository.GetAll()
            .AsNoTracking()
            .Include(x => x.Room)
            .Include(x => x.AssignedStaff)
            .Include(x => x.MaintenanceTypes).ThenInclude(mt => mt.Type)
            .WhereIf(input.RoomId.HasValue, x => x.RoomId == input.RoomId)
            .WhereIf(input.AssignedStaffId.HasValue, x => x.AssignedStaffId == input.AssignedStaffId)
            .WhereIf(input.Status.HasValue, x => x.Status == input.Status)
            .WhereIf(input.Category.HasValue, x => x.Category == input.Category)
            .WhereIf(input.StartDateFrom.HasValue, x => x.StartDate >= input.StartDateFrom!.Value.Date)
            .WhereIf(input.EndDateTo.HasValue, x => x.EndDate <= input.EndDateTo!.Value.Date)
            .WhereIf(!string.IsNullOrWhiteSpace(input.Filter), x => x.Title.Contains(input.Filter!) || x.Description.Contains(input.Filter!));

        var total = await query.CountAsync();
        var items = await query
            .OrderBy(input.Sorting ?? "CreationTime desc")
            .PageBy(input)
            .ToListAsync();

        return new PagedResultDto<RoomMaintenanceRequestDto>(total, items.Select(MapToDto).ToList());
    }

    public async Task<RoomMaintenanceRequestDto> GetAsync(EntityDto<Guid> input)
    {
        var item = await maintenanceRepository.GetAll()
            .AsNoTracking()
            .Include(x => x.Room)
            .Include(x => x.AssignedStaff)
            .Include(x => x.MaintenanceTypes).ThenInclude(mt => mt.Type)
            .FirstOrDefaultAsync(x => x.Id == input.Id);

        if (item == null)
            throw new UserFriendlyException("Maintenance request not found.");

        return MapToDto(item);
    }

    public async Task<Guid> CreateAsync(CreateRoomMaintenanceRequestDto input)
    {
        var title = (input.Title ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(title))
            throw new UserFriendlyException("Maintenance title is required.");

        var startDate = input.StartDate.Date;
        var endDate = input.EndDate.Date;
        if (endDate < startDate)
            throw new UserFriendlyException("Maintenance end date must be on or after start date.");

        // Maintenance input dates are inclusive (same start/end means a 1-day work order).
        // Inventory and overlap checks use end-exclusive ranges.
        var endDateExclusive = endDate.AddDays(1);

        var room = await roomRepository.FirstOrDefaultAsync(input.RoomId);
        if (room == null || !room.IsActive)
            throw new UserFriendlyException("Room is invalid or inactive.");

        if (await HasActiveStayConflictAsync(input.RoomId, startDate, endDateExclusive))
            throw new UserFriendlyException("Maintenance cannot overlap with an active stay.");

        if (await HasReservationConflictAsync(input.RoomId, startDate, endDateExclusive))
            throw new UserFriendlyException("Maintenance conflicts with an active reservation for this room.");

        var request = new RoomMaintenanceRequest
        {
            Id = Guid.NewGuid(),
            RoomId = input.RoomId,
            Title = title,
            Description = (input.Description ?? string.Empty).Trim(),
            Priority = input.Priority,
            Category = input.Category,
            Status = RoomMaintenanceStatus.Open,
            StartDate = startDate,
            EndDate = endDate,
            OpenedAt = Clock.Now,
        };

        if (input.AssignedStaffId.HasValue)
        {
            await ValidateStaffAsync(input.AssignedStaffId.Value);
            request.Assign(input.AssignedStaffId.Value);
        }

        var blocked = await roomDailyInventoryService.TryBlockForMaintenanceAsync(
            request.RoomId,
            request.StartDate,
            endDateExclusive,
            request.Id);

        if (!blocked)
            throw new UserFriendlyException("Unable to block room for maintenance. Dates are no longer available.");

        await maintenanceRepository.InsertAsync(request);

        // Add maintenance types via navigation property
        if (input.TypeIds?.Count > 0)
        {
            var validTypes = await maintenanceTypeRepository.GetAll()
                .Where(t => input.TypeIds.Contains(t.Id) && t.IsActive)
                .ToListAsync();

            foreach (var type in validTypes)
            {
                request.MaintenanceTypes.Add(new RoomMaintenanceRequestType { TypeId = type.Id });
            }

            await maintenanceRepository.UpdateAsync(request);
        }

        // Log room status change to OutOfOrder
        var roomStatusLog = new RoomStatusLog
        {
            Id = Guid.NewGuid(),
            RoomId = request.RoomId,
            OperationalStatus = RoomOperationalStatus.OutOfOrder,
            Remarks = $"Maintenance work order created: {request.Title}",
            ChangedAt = Clock.Now
        };
        await roomStatusLogRepository.InsertAsync(roomStatusLog);

        await roomStatusHubBroadcaster.NotifyRoomStatusChangedAsync(request.RoomId, (int)RoomOperationalStatus.OutOfOrder);

        return request.Id;
    }

    public async Task AssignAsync(AssignRoomMaintenanceRequestDto input)
    {
        var request = await maintenanceRepository.GetAsync(input.Id);
        await ValidateStaffAsync(input.StaffId);
        request.Assign(input.StaffId);
        await maintenanceRepository.UpdateAsync(request);
    }

    public async Task StartAsync(EntityDto<Guid> input)
    {
        var request = await maintenanceRepository.GetAsync(input.Id);
        request.Start();
        await maintenanceRepository.UpdateAsync(request);
    }

    public async Task CompleteAsync(EntityDto<Guid> input)
    {
        var request = await maintenanceRepository.GetAsync(input.Id);
        request.Complete();
        await maintenanceRepository.UpdateAsync(request);

        await roomDailyInventoryService.ReleaseMaintenanceBlockAsync(
            request.RoomId,
            request.StartDate,
            request.EndDate.Date.AddDays(1),
            request.Id);

        // Log room status change back to Vacant
        var roomStatusLog = new RoomStatusLog
        {
            Id = Guid.NewGuid(),
            RoomId = request.RoomId,
            OperationalStatus = RoomOperationalStatus.Vacant,
            Remarks = $"Maintenance work order completed: {request.Title}",
            ChangedAt = Clock.Now
        };
        await roomStatusLogRepository.InsertAsync(roomStatusLog);

        await roomStatusHubBroadcaster.NotifyRoomStatusChangedAsync(request.RoomId, (int)RoomOperationalStatus.Vacant);
    }

    public async Task CancelAsync(CancelRoomMaintenanceRequestDto input)
    {
        var request = await maintenanceRepository.GetAsync(input.Id);
        request.Cancel(input.Reason);
        await maintenanceRepository.UpdateAsync(request);

        await roomDailyInventoryService.ReleaseMaintenanceBlockAsync(
            request.RoomId,
            request.StartDate,
            request.EndDate.Date.AddDays(1),
            request.Id);

        // Log room status - may already be Vacant or need to revert from OutOfOrder
        var lastLog = await roomStatusLogRepository.GetAll()
            .Where(l => l.RoomId == request.RoomId)
            .OrderByDescending(l => l.ChangedAt)
            .FirstOrDefaultAsync();

        var statusToRevert = lastLog?.OperationalStatus ?? RoomOperationalStatus.Vacant;
        if (statusToRevert == RoomOperationalStatus.OutOfOrder)
        {
            statusToRevert = RoomOperationalStatus.Vacant;
        }

        var roomStatusLog = new RoomStatusLog
        {
            Id = Guid.NewGuid(),
            RoomId = request.RoomId,
            OperationalStatus = statusToRevert,
            Remarks = $"Maintenance work order cancelled: {request.Title}",
            ChangedAt = Clock.Now
        };
        await roomStatusLogRepository.InsertAsync(roomStatusLog);

        await roomStatusHubBroadcaster.NotifyRoomStatusChangedAsync(request.RoomId, (int)statusToRevert);
    }

    private async Task ValidateStaffAsync(Guid staffId)
    {
        var staff = await staffRepository.FirstOrDefaultAsync(staffId);
        if (staff == null || !staff.IsActive)
            throw new UserFriendlyException("Selected staff is invalid or inactive.");
    }

    private async Task<bool> HasActiveStayConflictAsync(Guid roomId, DateTime startDate, DateTime endDate)
    {
        return await stayRoomRepository.GetAll()
            .Where(sr => sr.RoomId == roomId && !sr.ReleasedAt.HasValue)
            .Where(sr => sr.Stay.Status == StayStatus.CheckedIn || sr.Stay.Status == StayStatus.InHouse)
            .Where(sr => sr.ArrivalDate < endDate && sr.DepartureDate > startDate)
            .AnyAsync();
    }

    private async Task<bool> HasReservationConflictAsync(Guid roomId, DateTime startDate, DateTime endDate)
    {
        return await reservationRoomRepository.GetAll()
            .Where(rr => rr.RoomId == roomId)
            .Where(rr => rr.Reservation.Status == ReservationStatus.Pending
                || rr.Reservation.Status == ReservationStatus.Confirmed)
            .Where(rr => rr.ArrivalDate < endDate && rr.DepartureDate > startDate)
            .AnyAsync();
    }

    private static RoomMaintenanceRequestDto MapToDto(RoomMaintenanceRequest item)
    {
        return new RoomMaintenanceRequestDto
        {
            Id = item.Id,
            RoomId = item.RoomId,
            RoomNumber = item.Room?.RoomNumber ?? string.Empty,
            AssignedStaffId = item.AssignedStaffId,
            AssignedStaffName = item.AssignedStaff?.FullName ?? string.Empty,
            Title = item.Title,
            Description = item.Description,
            Priority = item.Priority,
            Status = item.Status,
            Category = item.Category,
            StartDate = item.StartDate,
            EndDate = item.EndDate,
            OpenedAt = item.OpenedAt,
            AssignedAt = item.AssignedAt,
            StartedAt = item.StartedAt,
            CompletedAt = item.CompletedAt,
            CancelledAt = item.CancelledAt,
            CancellationReason = item.CancellationReason,
            TypeIds = item.MaintenanceTypes.Select(mt => mt.TypeId).ToList(),
            TypeNames = item.MaintenanceTypes.Where(mt => mt.Type != null).Select(mt => mt.Type.Name).ToList(),
        };
    }
}
