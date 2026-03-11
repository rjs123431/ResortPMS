using Abp.Application.Services;
using Abp.Application.Services.Dto;
using Abp.Authorization;
using Abp.Domain.Repositories;
using Abp.Linq.Extensions;
using Abp.Timing;
using Abp.UI;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using PMS.Application.Hubs;
using PMS.App.Rooms.Dto;
using PMS.Authorization;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Dynamic.Core;
using System.Threading.Tasks;

namespace PMS.App.Housekeeping;

public interface IHousekeepingAppService : IApplicationService
{
    Task<List<CleaningBoardRoomDto>> GetCleaningBoardAsync(DateTime? date);
    Task<PagedResultDto<HousekeepingTaskDto>> GetTasksAsync(GetHousekeepingTasksInput input);
    Task<PagedResultDto<HousekeepingLogDto>> GetLogsAsync(GetHousekeepingLogsInput input);
    Task<Guid> CreateTaskAsync(CreateHousekeepingTaskDto input);
    Task UpdateTaskStatusAsync(UpdateHousekeepingTaskStatusDto input);
    Task UpdateHousekeepingStatusAsync(UpdateHousekeepingStatusDto input);
}

[AbpAuthorize(PermissionNames.Pages_Rooms)]
public class HousekeepingAppService(
    IRepository<Room, Guid> roomRepository,
    IRepository<RoomStatusLog, Guid> roomStatusLogRepository,
    IRepository<HousekeepingLog, Guid> housekeepingLogRepository,
    IRepository<HousekeepingTask, Guid> housekeepingTaskRepository,
    IRepository<StayRoom, Guid> stayRoomRepository,
    IRepository<Staff, Guid> staffRepository,
    IHubContext<PhysicalCountHub> physicalCountHubContext
) : PMSAppServiceBase, IHousekeepingAppService
{
    private const string HousekeepingTaskStatusChangedEvent = "housekeepingTaskStatusChanged";

    /// <summary>
    /// Returns all rooms that need attention today based on operational and housekeeping status.
    /// Includes: Vacant+Dirty, Occupied (stayover), rooms with pending/in-progress tasks.
    /// </summary>
    public async Task<List<CleaningBoardRoomDto>> GetCleaningBoardAsync(DateTime? date)
    {
        var targetDate = (date ?? Clock.Now).Date;
        var nextDay = targetDate.AddDays(1);

        var rooms = await roomRepository.GetAll()
            .AsNoTracking()
            .Include(r => r.RoomType)
            .Where(r => r.IsActive)
            .Where(r => r.OperationalStatus != RoomOperationalStatus.OutOfOrder &&
                        r.OperationalStatus != RoomOperationalStatus.OutOfService)
            .ToListAsync();

        // Get pending/in-progress tasks for today
        var pendingTasks = await housekeepingTaskRepository.GetAll()
            .AsNoTracking()
            .Where(t => t.TaskDate >= targetDate && t.TaskDate < nextDay)
            .Where(t => t.Status == HousekeepingTaskStatus.Pending || t.Status == HousekeepingTaskStatus.InProgress)
            .ToListAsync();

        var pendingTaskByRoom = pendingTasks
            .GroupBy(t => t.RoomId)
            .ToDictionary(g => g.Key, g => g.First());

        // Active stays for occupancy info
        var activeStayStatuses = new[] { StayStatus.InHouse, StayStatus.CheckedIn };
        var occupiedRoomIds = new HashSet<Guid>(
            await stayRoomRepository.GetAll()
                .AsNoTracking()
                .Where(sr => sr.ReleasedAt == null)
                .Where(sr => activeStayStatuses.Contains(sr.Stay.Status))
                .Select(sr => sr.RoomId)
                .ToListAsync()
        );

        var result = new List<CleaningBoardRoomDto>();

        foreach (var room in rooms.OrderBy(r => r.RoomNumber))
        {
            pendingTaskByRoom.TryGetValue(room.Id, out var task);

            string cleaningType = null;

            if (room.OperationalStatus == RoomOperationalStatus.Vacant && room.HousekeepingStatus == HousekeepingStatus.Dirty)
                cleaningType = task?.TaskType == HousekeepingTaskType.CheckoutCleaning
                    ? "Checkout Cleaning" : "Checkout Cleaning";
            else if (room.OperationalStatus == RoomOperationalStatus.Occupied || occupiedRoomIds.Contains(room.Id))
                cleaningType = "Stayover Cleaning";
            else if (room.HousekeepingStatus == HousekeepingStatus.Pickup)
                cleaningType = "Pickup Cleaning";
            else if (task != null)
                cleaningType = task.TaskType switch
                {
                    HousekeepingTaskType.Inspection => "Inspection",
                    HousekeepingTaskType.PickupCleaning => "Pickup Cleaning",
                    _ => task.TaskType.ToString()
                };

            if (cleaningType == null) continue;

            result.Add(new CleaningBoardRoomDto
            {
                RoomId = room.Id,
                RoomNumber = room.RoomNumber,
                RoomTypeName = room.RoomType?.Name ?? string.Empty,
                Floor = room.Floor,
                OperationalStatus = room.OperationalStatus,
                HousekeepingStatus = room.HousekeepingStatus,
                CleaningType = cleaningType,
                PendingTaskId = task?.Id,
            });
        }

        return result;
    }

    public async Task<PagedResultDto<HousekeepingTaskDto>> GetTasksAsync(GetHousekeepingTasksInput input)
    {
        var query = housekeepingTaskRepository.GetAll()
            .Include(t => t.Room).ThenInclude(r => r.RoomType)
            .Include(t => t.AssignedToStaff)
            .WhereIf(input.Status.HasValue, t => t.Status == input.Status)
            .WhereIf(input.TaskType.HasValue, t => t.TaskType == input.TaskType)
            .WhereIf(input.RoomId.HasValue, t => t.RoomId == input.RoomId)
            .WhereIf(input.AssignedToStaffId.HasValue, t => t.AssignedToStaffId == input.AssignedToStaffId)
            .WhereIf(input.IsUnassigned == true, t => t.AssignedToStaffId == null)
            .WhereIf(input.TaskDate.HasValue, t => t.TaskDate.Date == input.TaskDate!.Value.Date);

        var total = await query.CountAsync();
        var items = await query.OrderBy(input.Sorting ?? "TaskDate descending").PageBy(input).ToListAsync();

        return new PagedResultDto<HousekeepingTaskDto>(total, items.Select(t => new HousekeepingTaskDto
        {
            Id = t.Id,
            RoomId = t.RoomId,
            RoomNumber = t.Room?.RoomNumber ?? string.Empty,
            RoomTypeName = t.Room?.RoomType?.Name ?? string.Empty,
            TaskType = t.TaskType,
            Status = t.Status,
            AssignedToStaffId = t.AssignedToStaffId,
            AssignedToStaffName = t.AssignedToStaff != null ? t.AssignedToStaff.FullName : string.Empty,
            StartedAt = t.StartedAt,
            CompletedAt = t.CompletedAt,
            Remarks = t.Remarks,
            TaskDate = t.TaskDate,
        }).ToList());
    }

    public async Task<PagedResultDto<HousekeepingLogDto>> GetLogsAsync(GetHousekeepingLogsInput input)
    {
        var query = housekeepingLogRepository.GetAll()
            .AsNoTracking()
            .Include(x => x.Room)
            .Include(x => x.Staff)
            .WhereIf(input.RoomId.HasValue, x => x.RoomId == input.RoomId)
            .WhereIf(input.FromDate.HasValue, x => x.CreationTime >= input.FromDate!.Value.Date)
            .WhereIf(input.ToDate.HasValue, x => x.CreationTime < input.ToDate!.Value.Date.AddDays(1));

        var total = await query.CountAsync();
        var items = await query.OrderBy(input.Sorting ?? "CreationTime desc").PageBy(input).ToListAsync();

        return new PagedResultDto<HousekeepingLogDto>(total, items.Select(x => new HousekeepingLogDto
        {
            Id = x.Id,
            RoomId = x.RoomId,
            RoomNumber = x.Room?.RoomNumber ?? string.Empty,
            OldStatus = x.OldStatus,
            NewStatus = x.NewStatus,
            StaffId = x.StaffId,
            HousekeepingTaskId = x.HousekeepingTaskId,
            CheckOutRecordId = x.CheckOutRecordId,
            StaffName = x.Staff?.FullName ?? "System",
            Remarks = x.Remarks ?? string.Empty,
            LoggedAt = x.CreationTime,
        }).ToList());
    }

    public async Task<Guid> CreateTaskAsync(CreateHousekeepingTaskDto input)
    {
        var room = await roomRepository.FirstOrDefaultAsync(input.RoomId);
        if (room == null) throw new UserFriendlyException(L("RoomNotFound"));

        if (input.AssignedToStaffId.HasValue)
        {
            var assignedStaff = await staffRepository.FirstOrDefaultAsync(input.AssignedToStaffId.Value);
            if (assignedStaff == null || !assignedStaff.IsActive)
                throw new UserFriendlyException("Selected staff is invalid or inactive.");
        }

        var task = new HousekeepingTask
        {
            RoomId = input.RoomId,
            TaskType = input.TaskType,
            Status = HousekeepingTaskStatus.Pending,
            AssignedToStaffId = input.AssignedToStaffId,
            Remarks = input.Remarks ?? string.Empty,
            TaskDate = input.TaskDate?.Date ?? Clock.Now.Date,
        };

        return await housekeepingTaskRepository.InsertAndGetIdAsync(task);
    }

    public async Task UpdateTaskStatusAsync(UpdateHousekeepingTaskStatusDto input)
    {
        var task = await housekeepingTaskRepository.GetAll()
            .Include(t => t.Room)
            .FirstOrDefaultAsync(t => t.Id == input.TaskId);

        if (task == null)
            throw new UserFriendlyException("Task not found.");

        if (input.AssignedToStaffId.HasValue)
        {
            var assignedStaff = await staffRepository.FirstOrDefaultAsync(input.AssignedToStaffId.Value);
            if (assignedStaff == null || !assignedStaff.IsActive)
                throw new UserFriendlyException("Selected staff is invalid or inactive.");

            task.AssignedToStaffId = input.AssignedToStaffId;
        }

        task.Status = input.Status;
        if (!string.IsNullOrWhiteSpace(input.Remarks))
            task.Remarks = input.Remarks;

        if (input.Status == HousekeepingTaskStatus.InProgress && task.StartedAt == null)
            task.StartedAt = Clock.Now;

        if (input.Status == HousekeepingTaskStatus.Completed)
        {
            task.CompletedAt = Clock.Now;

            if (task.Room != null)
            {
                var oldStatus = task.Room.HousekeepingStatus;
                var newStatus = task.TaskType == HousekeepingTaskType.Inspection
                    ? HousekeepingStatus.Inspected
                    : HousekeepingStatus.Clean;

                task.Room.HousekeepingStatus = newStatus;
                await roomRepository.UpdateAsync(task.Room);

                await roomStatusLogRepository.InsertAsync(new RoomStatusLog
                {
                    RoomId = task.RoomId,
                    HousekeepingStatus = newStatus,
                    Remarks = task.Remarks ?? string.Empty,
                    ChangedAt = Clock.Now,
                });

                await housekeepingLogRepository.InsertAsync(new HousekeepingLog
                {
                    RoomId = task.RoomId,
                    OldStatus = oldStatus,
                    NewStatus = newStatus,
                    StaffId = task.AssignedToStaffId,
                    HousekeepingTaskId = task.Id,
                    Remarks = task.Remarks,
                });
            }
        }

        await housekeepingTaskRepository.UpdateAsync(task);

        await physicalCountHubContext.Clients.All.SendAsync(HousekeepingTaskStatusChangedEvent, new
        {
            taskId = task.Id,
            roomId = task.RoomId,
            guestRequestId = task.GuestRequestId,
            status = (int)task.Status,
        });
    }

    public async Task UpdateHousekeepingStatusAsync(UpdateHousekeepingStatusDto input)
    {
        var room = await roomRepository.GetAsync(input.RoomId);
        var oldStatus = room.HousekeepingStatus;

        if (input.StaffId.HasValue)
        {
            var staff = await staffRepository.FirstOrDefaultAsync(input.StaffId.Value);
            if (staff == null || !staff.IsActive)
                throw new UserFriendlyException("Selected staff is invalid or inactive.");
        }

        room.HousekeepingStatus = input.HousekeepingStatus;
        await roomRepository.UpdateAsync(room);

        await roomStatusLogRepository.InsertAsync(new RoomStatusLog
        {
            RoomId = input.RoomId,
            HousekeepingStatus = input.HousekeepingStatus,
            Remarks = input.Remarks ?? string.Empty,
            ChangedAt = Clock.Now,
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
