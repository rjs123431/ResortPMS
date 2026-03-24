using Microsoft.EntityFrameworkCore;
using PMS.App;
using PMS.EntityFrameworkCore;
using Shouldly;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Xunit;

namespace PMS.Tests.Domain;

/// <summary>
/// Tests the RoomDailyInventory state machine (Vacant → Reserved → InHouse)
/// using EF Core InMemory database directly (no ABP IoC required).
/// </summary>
public class RoomInventoryStateMachineTests : IDisposable
{
    private readonly PMSDbContext _context;
    private readonly Guid _roomId = Guid.NewGuid();
    private readonly Guid _reservationId = Guid.NewGuid();
    private readonly Guid _stayId = Guid.NewGuid();
    private readonly DateTime _arrival = DateTime.Today.AddDays(1);
    private readonly DateTime _departure = DateTime.Today.AddDays(4); // 3 nights

    public RoomInventoryStateMachineTests()
    {
        var options = new DbContextOptionsBuilder<PMSDbContext>()
            .UseInMemoryDatabase("Inventory_" + Guid.NewGuid())
            .Options;
        _context = new PMSDbContext(options);

        // Seed three Vacant rows (nights: arrival, arrival+1, arrival+2)
        var rows = new List<RoomDailyInventory>();
        for (var d = _arrival.Date; d < _departure.Date; d = d.AddDays(1))
        {
            rows.Add(new RoomDailyInventory
            {
                Id = Guid.NewGuid(),
                RoomId = _roomId,
                InventoryDate = d,
                Status = RoomDailyInventoryStatus.Vacant,
                IsSellable = true
            });
        }
        _context.Set<RoomDailyInventory>().AddRange(rows);
        _context.SaveChanges();
    }

    public void Dispose() => _context.Dispose();

    private async Task<int> CountByStatusAsync(RoomDailyInventoryStatus status)
        => await _context.Set<RoomDailyInventory>()
            .CountAsync(r => r.RoomId == _roomId && r.Status == status);

    [Fact]
    public void InitialState_AllNightsAreVacant()
    {
        var count = _context.Set<RoomDailyInventory>()
            .Count(r => r.RoomId == _roomId && r.Status == RoomDailyInventoryStatus.Vacant);
        count.ShouldBe(3);
    }

    [Fact]
    public async Task Reserve_FlipsVacantToReserved()
    {
        var nights = await _context.Set<RoomDailyInventory>()
            .Where(r => r.RoomId == _roomId
                     && r.InventoryDate >= _arrival.Date
                     && r.InventoryDate < _departure.Date)
            .ToListAsync();

        foreach (var night in nights)
        {
            night.Status = RoomDailyInventoryStatus.Reserved;
            night.ReservationId = _reservationId;
        }
        await _context.SaveChangesAsync();

        (await CountByStatusAsync(RoomDailyInventoryStatus.Reserved)).ShouldBe(3);
        (await CountByStatusAsync(RoomDailyInventoryStatus.Vacant)).ShouldBe(0);
    }

    [Fact]
    public async Task SetInHouse_FlipsReservedToInHouse_WhenReservationMatches()
    {
        // First reserve
        var nights = await _context.Set<RoomDailyInventory>()
            .Where(r => r.RoomId == _roomId
                     && r.InventoryDate >= _arrival.Date
                     && r.InventoryDate < _departure.Date)
            .ToListAsync();
        foreach (var n in nights)
        {
            n.Status = RoomDailyInventoryStatus.Reserved;
            n.ReservationId = _reservationId;
        }
        await _context.SaveChangesAsync();

        // Then check in
        var reserved = await _context.Set<RoomDailyInventory>()
            .Where(r => r.RoomId == _roomId
                     && r.Status == RoomDailyInventoryStatus.Reserved
                     && r.ReservationId == _reservationId)
            .ToListAsync();
        foreach (var n in reserved)
        {
            n.Status = RoomDailyInventoryStatus.InHouse;
            n.StayId = _stayId;
        }
        await _context.SaveChangesAsync();

        (await CountByStatusAsync(RoomDailyInventoryStatus.InHouse)).ShouldBe(3);
    }

    [Fact]
    public async Task SetInHouse_OnlyAffectsMatchingReservation()
    {
        var otherReservation = Guid.NewGuid();

        // Reserve with a different reservation
        var nights = await _context.Set<RoomDailyInventory>()
            .Where(r => r.RoomId == _roomId
                     && r.InventoryDate >= _arrival.Date
                     && r.InventoryDate < _departure.Date)
            .ToListAsync();
        foreach (var n in nights)
        {
            n.Status = RoomDailyInventoryStatus.Reserved;
            n.ReservationId = otherReservation;
        }
        await _context.SaveChangesAsync();

        // Try to claim nights under _reservationId — should find 0
        var claimable = await _context.Set<RoomDailyInventory>()
            .Where(r => r.RoomId == _roomId
                     && r.InventoryDate >= _arrival.Date
                     && r.InventoryDate < _departure.Date
                     && (r.Status == RoomDailyInventoryStatus.Vacant ||
                         (r.Status == RoomDailyInventoryStatus.Reserved && r.ReservationId == _reservationId)))
            .ToListAsync();

        claimable.Count.ShouldBe(0);
    }
}
