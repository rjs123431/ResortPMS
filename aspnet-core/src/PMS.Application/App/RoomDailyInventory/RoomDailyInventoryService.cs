using Abp.Dependency;
using Abp.Domain.Repositories;
using Abp.EntityFrameworkCore;
using Abp.Timing;
using Microsoft.EntityFrameworkCore;
using PMS.App;
using PMS.EntityFrameworkCore;
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
    private readonly IDbContextProvider<PMSDbContext> _dbContextProvider;

    private const int MaxDaysToEnsure = 365;

    public RoomDailyInventoryService(
        IRepository<RoomDailyInventoryEntity, Guid> inventoryRepository,
        IRepository<Room, Guid> roomRepository,
        IDbContextProvider<PMSDbContext> dbContextProvider)
    {
        _inventoryRepository = inventoryRepository;
        _roomRepository = roomRepository;
        _dbContextProvider = dbContextProvider;
    }

    public async Task EnsureInventoryForDateRangeAsync(IReadOnlyList<Guid> roomIds, DateTime startDate, DateTime endDate)
    {
        if (roomIds == null || roomIds.Count == 0) return;

        var start = startDate.Date;
        var end = endDate.Date;
        if (start >= end) return;

        var ctx = await _dbContextProvider.GetDbContextAsync();
        var existing = await ctx.RoomDailyInventories
            .AsNoTracking()
            .Where(i => roomIds.Contains(i.RoomId) && i.InventoryDate >= start && i.InventoryDate < end)
            .Select(i => new { i.RoomId, i.InventoryDate })
            .ToListAsync();

        var existingSet = existing.Select(x => (x.RoomId, x.InventoryDate)).ToHashSet();

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
                    IsSellable = true,
                    IsBlocked = false,
                    IsOutOfOrder = false,
                });
                existingSet.Add((roomId, d));
            }
        }

        if (toAdd.Count > 0)
            await ctx.RoomDailyInventories.AddRangeAsync(toAdd);
    }

    public async Task SetReservedAsync(Guid roomId, DateTime arrivalDate, DateTime departureDate, Guid reservationId)
    {
        var start = arrivalDate.Date;
        var end = departureDate.Date;
        if (start >= end) return;

        await EnsureInventoryForDateRangeAsync([roomId], start, end);

        var ctx = await _dbContextProvider.GetDbContextAsync();
        var rows = await ctx.RoomDailyInventories
            .Where(i => i.RoomId == roomId && i.InventoryDate >= start && i.InventoryDate < end)
            .ToListAsync();

        foreach (var row in rows)
        {
            row.Status = RoomDailyInventoryStatus.Reserved;
            row.ReservationId = reservationId;
            row.StayId = null;
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

        var ctx = await _dbContextProvider.GetDbContextAsync();
        var vacant = (int)RoomDailyInventoryStatus.Vacant;
        var reserved = (int)RoomDailyInventoryStatus.Reserved;

        var rowsAffected = await ctx.Database.ExecuteSqlRawAsync(
            @"UPDATE RoomDailyInventory SET Status = {0}, ReservationId = {1}, StayId = NULL
              WHERE RoomId = {2} AND InventoryDate >= {3} AND InventoryDate < {4} AND Status = {5}",
            reserved, reservationId, roomId, start, end, vacant);

        return rowsAffected == expectedNights;
    }

    public async Task SetInHouseAsync(Guid roomId, DateTime arrivalDate, DateTime departureDate, Guid stayId)
    {
        var start = arrivalDate.Date;
        var end = departureDate.Date;
        if (start >= end) return;

        await EnsureInventoryForDateRangeAsync([roomId], start, end);

        var ctx = await _dbContextProvider.GetDbContextAsync();
        var rows = await ctx.RoomDailyInventories
            .Where(i => i.RoomId == roomId && i.InventoryDate >= start && i.InventoryDate < end)
            .ToListAsync();

        foreach (var row in rows)
        {
            row.Status = RoomDailyInventoryStatus.InHouse;
            row.ReservationId = null;
            row.StayId = stayId;
        }
    }

        public async Task<bool> TrySetInHouseAsync(Guid roomId, DateTime arrivalDate, DateTime departureDate, Guid stayId, Guid? reservationId)
        {
            var start = arrivalDate.Date;
            var end = departureDate.Date;
            if (start >= end) return false;

            var expectedNights = (int)(end - start).TotalDays;
            await EnsureInventoryForDateRangeAsync([roomId], start, end);

            var ctx = await _dbContextProvider.GetDbContextAsync();
            var inHouse = (int)RoomDailyInventoryStatus.InHouse;
            var vacant = (int)RoomDailyInventoryStatus.Vacant;
            var reserved = (int)RoomDailyInventoryStatus.Reserved;

            int rowsAffected;
            if (reservationId.HasValue)
            {
                // Check-in from reservation: accept nights that are Vacant OR Reserved under this reservation.
                rowsAffected = await ctx.Database.ExecuteSqlRawAsync(
                    @"UPDATE RoomDailyInventory SET Status = {0}, ReservationId = NULL, StayId = {1}
                      WHERE RoomId = {2} AND InventoryDate >= {3} AND InventoryDate < {4}
                        AND (Status = {5} OR (Status = {6} AND ReservationId = {7}))",
                    inHouse, stayId, roomId, start, end, vacant, reserved, reservationId.Value);
            }
            else
            {
                // Walk-in: only Vacant nights are eligible.
                rowsAffected = await ctx.Database.ExecuteSqlRawAsync(
                    @"UPDATE RoomDailyInventory SET Status = {0}, ReservationId = NULL, StayId = {1}
                      WHERE RoomId = {2} AND InventoryDate >= {3} AND InventoryDate < {4}
                        AND Status = {5}",
                    inHouse, stayId, roomId, start, end, vacant);
            }

            return rowsAffected == expectedNights;
        }

    public async Task SetVacantAsync(Guid roomId, DateTime fromDate, DateTime toDate)
    {
        var start = fromDate.Date;
        var end = toDate.Date;
        if (start >= end) return;

        var ctx = await _dbContextProvider.GetDbContextAsync();
        var rows = await ctx.RoomDailyInventories
            .Where(i => i.RoomId == roomId && i.InventoryDate >= start && i.InventoryDate < end)
            .ToListAsync();

        foreach (var row in rows)
        {
            row.Status = RoomDailyInventoryStatus.Vacant;
            row.ReservationId = null;
            row.StayId = null;
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

        var ctx = await _dbContextProvider.GetDbContextAsync();
        var rows = await ctx.RoomDailyInventories
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
