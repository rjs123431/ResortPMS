using Abp.Application.Services;
using Abp.Authorization;
using Abp.Domain.Repositories;
using Abp.Timing;
using Microsoft.EntityFrameworkCore;
using PMS.App.FrontDesk.Dto;
using PMS.Authorization;
using PMS.Reporting;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace PMS.App.FrontDesk;

public interface IFrontDeskDashboardAppService : IApplicationService
{
    Task<FrontDeskDashboardDto> GetSummaryAsync();
    Task<FrontDeskArrivalRowDto[]> GetArrivalsTodayAsync();
    Task<FrontDeskDepartureRowDto[]> GetDeparturesTodayAsync();
}

[AbpAuthorize(
    PermissionNames.Pages_Rooms,
    PermissionNames.Pages_CheckIn,
    PermissionNames.Pages_Stays,
    PermissionNames.Pages_CheckOut
)]
public class FrontDeskDashboardAppService(
    IReportingAppService reportingAppService,
    IRepository<Room, Guid> roomRepository,
    IRepository<RoomDailyInventory, Guid> roomDailyInventoryRepository,
    IRepository<Stay, Guid> stayRepository,
    IRepository<StayRoom, Guid> stayRoomRepository,
    IRepository<Folio, Guid> folioRepository
) : ApplicationService, IFrontDeskDashboardAppService
{
    public async Task<FrontDeskDashboardDto> GetSummaryAsync()
    {
        var today = Clock.Now.Date;

        // Re-use existing dashboard KPIs for arrivals/departures and occupancy counts.
        var kpis = await reportingAppService.GetDashboardKpisAsync(today);

        var totalRooms = kpis.TotalRooms;
        var occupiedRooms = kpis.InHouseRooms;
        var vacantRooms = Math.Max(0, totalRooms - occupiedRooms);

        // Housekeeping: dirty rooms (active rooms only).
        var roomsDirty = await roomRepository.GetAll()
            .Where(r => r.IsActive && r.HousekeepingStatus == HousekeepingStatus.Dirty)
            .CountAsync();

        // Out-of-order rooms for today from room daily inventory.
        var roomsOutOfOrder = await roomDailyInventoryRepository.GetAll()
            .Where(i => i.InventoryDate == today && i.Status == RoomDailyInventoryStatus.OutOfOrder)
            .Select(i => i.RoomId)
            .Distinct()
            .CountAsync();

        return new FrontDeskDashboardDto
        {
            AsOfDate = today,
            ArrivalsToday = kpis.ArrivalsToday,
            DeparturesToday = kpis.DeparturesToday,
            OccupiedRooms = occupiedRooms,
            VacantRooms = vacantRooms,
            RoomsDirty = roomsDirty,
            RoomsOutOfOrder = roomsOutOfOrder,
        };
    }

    public async Task<FrontDeskArrivalRowDto[]> GetArrivalsTodayAsync()
    {
        var today = Clock.Now.Date;
        var startOfDay = today;
        var endOfDay = today.AddDays(1);

        var stays = await stayRepository.GetAll()
            .Include(s => s.Rooms).ThenInclude(sr => sr.Room)
            .Where(s => s.CheckInDateTime >= startOfDay && s.CheckInDateTime < endOfDay)
            .ToListAsync();

        var rows = stays
            .Select(stay =>
            {
                var activeRooms = stay.Rooms?
                    .Where(sr => sr.Room != null &&
                                 sr.ArrivalDate < endOfDay &&
                                 sr.DepartureDate > startOfDay)
                    .Select(sr => sr.Room!.RoomNumber)
                    .Where(n => !string.IsNullOrWhiteSpace(n))
                    .ToList() ?? [];

                return new FrontDeskArrivalRowDto
                {
                    StayId = stay.Id,
                    StayNo = stay.StayNo,
                    GuestName = stay.GuestName,
                    RoomNumber = string.Join(", ", activeRooms),
                    EstimatedArrivalTime = stay.CheckInDateTime,
                };
            })
            .OrderBy(r => r.EstimatedArrivalTime ?? today)
            .ThenBy(r => r.GuestName)
            .ToArray();

        return rows;
    }

    public async Task<FrontDeskDepartureRowDto[]> GetDeparturesTodayAsync()
    {
        var today = Clock.Now.Date;
        var startOfDay = today;
        var endOfDay = today.AddDays(1);

        var stays = await stayRepository.GetAll()
            .Include(s => s.Rooms).ThenInclude(sr => sr.Room)
            .Where(s =>  s.ExpectedCheckOutDateTime >= startOfDay &&
                        s.ExpectedCheckOutDateTime < endOfDay)
            .ToListAsync();

        var stayIds = stays.Select(s => s.Id).ToList();
        var folios = await folioRepository.GetAll()
            .Where(f => stayIds.Contains(f.StayId))
            .ToListAsync();

        var rows = stays
            .Select(stay =>
            {
                var folio = folios.FirstOrDefault(f => f.StayId == stay.Id);

                var activeRooms = stay.Rooms?
                    .Where(sr => sr.Room != null &&
                                 sr.ArrivalDate < endOfDay &&
                                 sr.DepartureDate > startOfDay)
                    .Select(sr => sr.Room!.RoomNumber)
                    .Where(n => !string.IsNullOrWhiteSpace(n))
                    .ToList() ?? [];

                return new FrontDeskDepartureRowDto
                {
                    StayId = stay.Id,
                    StayNo = stay.StayNo,
                    GuestName = stay.GuestName,
                    RoomNumber = string.Join(", ", activeRooms),
                    EstimatedDepartureTime = stay.ActualCheckOutDateTime,
                    Balance = folio?.Balance,
                };
            })
            .OrderBy(r => r.EstimatedDepartureTime ?? today)
            .ThenBy(r => r.GuestName)
            .ToArray();

        return rows;
    }
}

