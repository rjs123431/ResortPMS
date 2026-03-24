using Abp.Dependency;
using Abp.Domain.Repositories;
using Abp.Timing;
using Microsoft.EntityFrameworkCore;
using PMS.App;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

using RoomDailyInventoryEntity = PMS.App.RoomDailyInventory;

namespace PMS.Application.App.RoomDailyInventory;

public class RoomDailyInventoryService : IRoomDailyInventoryService, ITransientDependency
{
    private readonly IRepository<RoomDailyInventoryEntity, Guid> _inventoryRepository;
    private readonly IRepository<Room, Guid> _roomRepository;
    private readonly HashSet<(Guid RoomId, DateTime InventoryDate)> _pendingInventoryKeys = [];

    private const int MaxDaysToEnsure = 365;

    public RoomDailyInventoryService(
        IRepository<RoomDailyInventoryEntity, Guid> inventoryRepository,
        IRepository<Room, Guid> roomRepository)
    {
        _inventoryRepository = inventoryRepository;
        _roomRepository = roomRepository;
    }

    public async Task EnsureInventoryForDateRangeAsync(IReadOnlyList<Guid> roomIds, DateTime startDate, DateTime endDate)
    {
        if (roomIds == null || roomIds.Count == 0) return;

        var start = startDate.Date;
        var end = endDate.Date;
        if (start >= end) return;

        var existing = await _inventoryRepository.GetAll()
            .AsNoTracking()
            .Where(i => roomIds.Contains(i.RoomId) && i.InventoryDate >= start && i.InventoryDate < end)
            .Select(i => new { i.RoomId, i.InventoryDate })
            .ToListAsync();

        var existingSet = existing.Select(x => (x.RoomId, x.InventoryDate)).ToHashSet();
        existingSet.UnionWith(_pendingInventoryKeys.Where(k => roomIds.Contains(k.RoomId) && k.InventoryDate >= start && k.InventoryDate < end));

        var toAdd = new List<RoomDailyInventoryEntity>();
        for (var d = start; d < end; d = d.AddDays(1))
        {
            foreach (var roomId in roomIds)
            {
                if (existingSet.Contains((roomId, d))) continue;
                toAdd.Add(new RoomDailyInventoryEntity
                {
                    Id = Guid.NewGuid(),
                    RoomId = roomId,
                    InventoryDate = d,
                    Status = RoomDailyInventoryStatus.Vacant,
                    ReservationId = null,
                    StayId = null,
                    MaintenanceRequestId = null,
                    IsSellable = true,
                    IsBlocked = false,
                    IsOutOfOrder = false,
                });
                existingSet.Add((roomId, d));
                _pendingInventoryKeys.Add((roomId, d));
            }
        }

        if (toAdd.Count > 0)
        {
            foreach (var item in toAdd)
            {
                await _inventoryRepository.InsertAsync(item);
            }
        }
    }

    public async Task SetReservedAsync(Guid roomId, DateTime arrivalDate, DateTime departureDate, Guid reservationId)
    {
        var start = arrivalDate.Date;
        var end = departureDate.Date;
        if (start >= end) return;

        await EnsureInventoryForDateRangeAsync([roomId], start, end);

        var rows = await _inventoryRepository.GetAll()
            .Where(i => i.RoomId == roomId && i.InventoryDate >= start && i.InventoryDate < end)
            .ToListAsync();

        foreach (var row in rows)
        {
            row.Status = RoomDailyInventoryStatus.Reserved;
            row.ReservationId = reservationId;
            row.StayId = null;
            row.MaintenanceRequestId = null;
            await _inventoryRepository.UpdateAsync(row);
        }
    }

    /// <inheritdoc />
    public async Task<bool> TryReserveInventoryAsync(Guid roomId, DateTime arrivalDate, DateTime departureDate, Guid reservationId)
    {
        var start = arrivalDate.Date;
        var end = departureDate.Date;
        if (start >= end) return false;

        var expectedNights = (int)(end - start).TotalDays;
        await EnsureInventoryForDateRangeAsync([roomId], start, end);

        var rows = await _inventoryRepository.GetAll()
            .Where(i => i.RoomId == roomId && i.InventoryDate >= start && i.InventoryDate < end && i.Status == RoomDailyInventoryStatus.Vacant)
            .ToListAsync();

        if (rows.Count != expectedNights) return false;

        foreach (var row in rows)
        {
            row.Status = RoomDailyInventoryStatus.Reserved;
            row.ReservationId = reservationId;
            row.StayId = null;
            row.MaintenanceRequestId = null;
            await _inventoryRepository.UpdateAsync(row);
        }

        return true;
    }

    public async Task SetInHouseAsync(Guid roomId, DateTime arrivalDate, DateTime departureDate, Guid stayId)
    {
        var start = arrivalDate.Date;
        var end = departureDate.Date;
        if (start >= end) return;

        await EnsureInventoryForDateRangeAsync([roomId], start, end);

        var rows = await _inventoryRepository.GetAll()
            .Where(i => i.RoomId == roomId && i.InventoryDate >= start && i.InventoryDate < end)
            .ToListAsync();

        foreach (var row in rows)
        {
            row.Status = RoomDailyInventoryStatus.InHouse;
            row.ReservationId = null;
            row.StayId = stayId;
            row.MaintenanceRequestId = null;
            await _inventoryRepository.UpdateAsync(row);
        }
    }

    public async Task<bool> TrySetInHouseAsync(Guid roomId, DateTime arrivalDate, DateTime departureDate, Guid stayId, Guid? reservationId)
    {
        var start = arrivalDate.Date;
        var end = departureDate.Date;
        if (start > end) return false;

        // Normalize to an exclusive end date so same-day check-in/check-out still occupies one inventory day.
        var endExclusive = start == end ? end.AddDays(1) : end;
        var expectedNights = (int)(endExclusive - start).TotalDays;
        await EnsureInventoryForDateRangeAsync([roomId], start, endExclusive);

        var rows = await _inventoryRepository.GetAll()
            .Where(i => i.RoomId == roomId && i.InventoryDate >= start && i.InventoryDate < endExclusive)
            .ToListAsync();

        // Filter for valid rows based on reservation
        List<RoomDailyInventoryEntity> validRows;
        if (reservationId.HasValue)
        {
            // Check-in from reservation: accept nights that are Vacant OR Reserved under this reservation.
            validRows = rows
                .Where(r => r.Status == RoomDailyInventoryStatus.Vacant || 
                           (r.Status == RoomDailyInventoryStatus.Reserved && r.ReservationId == reservationId.Value))
                .ToList();
        }
        else
        {
            // Walk-in: only Vacant nights are eligible.
            validRows = rows.Where(r => r.Status == RoomDailyInventoryStatus.Vacant).ToList();
        }

        if (validRows.Count != expectedNights) return false;

        foreach (var row in validRows)
        {
            row.Status = RoomDailyInventoryStatus.InHouse;
            row.ReservationId = null;
            row.StayId = stayId;
            row.MaintenanceRequestId = null;
            await _inventoryRepository.UpdateAsync(row);
        }

        return true;
    }

    public async Task SetVacantAsync(Guid roomId, DateTime fromDate, DateTime toDate)
    {
        var start = fromDate.Date;
        var end = toDate.Date;
        if (start >= end) return;

        var rows = await _inventoryRepository.GetAll()
            .Where(i => i.RoomId == roomId && i.InventoryDate >= start && i.InventoryDate < end)
            .Where(i => !i.IsOutOfOrder && !i.IsBlocked && i.MaintenanceRequestId == null)
            .ToListAsync();

        foreach (var row in rows)
        {
            row.Status = RoomDailyInventoryStatus.Vacant;
            row.ReservationId = null;
            row.StayId = null;
            await _inventoryRepository.UpdateAsync(row);
        }
    }

    public async Task<bool> TryBlockForMaintenanceAsync(Guid roomId, DateTime startDate, DateTime endDate, Guid maintenanceRequestId)
    {
        var start = startDate.Date;
        var end = endDate.Date;
        if (start >= end) return false;

        var expectedNights = (int)(end - start).TotalDays;
        await EnsureInventoryForDateRangeAsync([roomId], start, end);

        var rows = await _inventoryRepository.GetAll()
            .Where(i => i.RoomId == roomId && i.InventoryDate >= start && i.InventoryDate < end &&
                       i.Status == RoomDailyInventoryStatus.Vacant && !i.IsBlocked && !i.IsOutOfOrder)
            .ToListAsync();

        if (rows.Count != expectedNights) return false;

        foreach (var row in rows)
        {
            row.Status = RoomDailyInventoryStatus.OutOfOrder;
            row.MaintenanceRequestId = maintenanceRequestId;
            row.ReservationId = null;
            row.StayId = null;
            row.IsOutOfOrder = true;
            row.IsSellable = false;
            await _inventoryRepository.UpdateAsync(row);
        }

        return true;
    }

    public async Task ReleaseMaintenanceBlockAsync(Guid roomId, DateTime startDate, DateTime endDate, Guid maintenanceRequestId)
    {
        var start = startDate.Date;
        var end = endDate.Date;
        if (start >= end) return;

        var rows = await _inventoryRepository.GetAll()
            .Where(i => i.RoomId == roomId && i.InventoryDate >= start && i.InventoryDate < end && 
                       i.MaintenanceRequestId == maintenanceRequestId)
            .ToListAsync();

        foreach (var row in rows)
        {
            row.Status = RoomDailyInventoryStatus.Vacant;
            row.ReservationId = null;
            row.StayId = null;
            row.MaintenanceRequestId = null;
            row.IsOutOfOrder = false;
            row.IsSellable = true;
            await _inventoryRepository.UpdateAsync(row);
        }
    }

    public async Task<bool> IsRoomAvailableForDatesAsync(
        Guid roomId,
        DateTime arrivalDate,
        DateTime departureDate,
        Guid? excludeReservationId = null,
        Guid? excludeStayId = null)
    {
        var room = await _roomRepository.FirstOrDefaultAsync(roomId);
        if (room == null) return false;

        var start = arrivalDate.Date;
        var end = departureDate.Date;
        if (start >= end) return true;

        await EnsureInventoryForDateRangeAsync(
            [roomId],
            start,
            end > Clock.Now.Date.AddDays(MaxDaysToEnsure) ? Clock.Now.Date.AddDays(MaxDaysToEnsure) : end);

        var rows = await _inventoryRepository.GetAll()
            .AsNoTracking()
            .Where(i => i.RoomId == roomId && i.InventoryDate >= start && i.InventoryDate < end)
            .ToListAsync();

        foreach (var row in rows)
        {
            if (row.Status == RoomDailyInventoryStatus.Vacant) continue;
            if (row.Status == RoomDailyInventoryStatus.Reserved && excludeReservationId.HasValue && row.ReservationId == excludeReservationId)
                continue;
            if (row.Status == RoomDailyInventoryStatus.InHouse && excludeStayId.HasValue && row.StayId == excludeStayId)
                continue;
            if (row.IsBlocked || row.IsOutOfOrder || !row.IsSellable)
                return false;
            return false;
        }

        return true;
    }

    /// <summary>
    /// Ensures 365 days of inventory from today for the given rooms. Call before availability checks or updates.
    /// </summary>
    public async Task Ensure365DaysFromTodayAsync(IReadOnlyList<Guid> roomIds)
    {
        var today = Clock.Now.Date;
        await EnsureInventoryForDateRangeAsync(roomIds, today, today.AddDays(MaxDaysToEnsure));
    }
}
