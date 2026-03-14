using Abp.Application.Services;
using Abp.Authorization;
using Abp.Domain.Repositories;
using Microsoft.EntityFrameworkCore;
using PMS.App;
using PMS.Application.App.RoomDailyInventory;
using PMS.Application.App.RoomRack.Dto;
using PMS.App.Rooms.Dto;
using PMS.Authorization;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace PMS.Application.App.RoomRack;

public interface IRoomRackAppService : IApplicationService
{
    /// <summary>
    /// Gets room rack data for the date range: rooms list and daily inventory cells (status, reservation/stay display info).
    /// Uses RoomDailyInventory; ensures inventory exists for the range before querying.
    /// </summary>
    Task<GetRoomRackResultDto> GetRoomInfoAsync(GetRoomRackInput input);
}

[AbpAuthorize(PermissionNames.Pages_Reservations)]
public class RoomRackAppService(
    IRepository<Room, Guid> roomRepository,
    IRepository<PMS.App.RoomDailyInventory, Guid> inventoryRepository,
    IRepository<Reservation, Guid> reservationRepository,
    IRepository<Stay, Guid> stayRepository,
    IRepository<ReservationRoom, Guid> reservationRoomRepository,
    IRepository<StayRoom, Guid> stayRoomRepository,
    IRoomDailyInventoryService roomDailyInventoryService
) : PMSAppServiceBase, IRoomRackAppService
{
    public async Task<GetRoomRackResultDto> GetRoomInfoAsync(GetRoomRackInput input)
    {
        var start = input.StartDate.Date;
        var end = input.EndDate.Date;
        if (start >= end)
            return new GetRoomRackResultDto();

        var rooms = await roomRepository.GetAll()
            .AsNoTracking()
            .Include(r => r.RoomType)
            .Where(r => r.IsActive)
            .OrderBy(r => r.RoomType.Name)
            .ThenBy(r => r.RoomNumber)
            .ToListAsync();

        if (rooms.Count == 0)
            return new GetRoomRackResultDto();

        var roomIds = rooms.Select(r => r.Id).ToList();
        await roomDailyInventoryService.EnsureInventoryForDateRangeAsync(roomIds, start, end);

        var inventory = await inventoryRepository.GetAll()
            .AsNoTracking()
            .Where(i => roomIds.Contains(i.RoomId) && i.InventoryDate >= start && i.InventoryDate < end)
            .ToListAsync();

        var resIds = inventory.Select(i => i.ReservationId).Where(x => x.HasValue).Select(x => x!.Value).Distinct().ToList();
        var stayIds = inventory.Select(i => i.StayId).Where(x => x.HasValue).Select(x => x!.Value).Distinct().ToList();

        var resRoomsDepInRange = await reservationRoomRepository.GetAll()
            .AsNoTracking()
            .Where(rr => rr.RoomId.HasValue && roomIds.Contains(rr.RoomId.Value) && rr.DepartureDate >= start && rr.DepartureDate < end)
            .Select(rr => new { rr.ReservationId, rr.RoomId, rr.DepartureDate })
            .ToListAsync();
        var stayRoomsDepInRange = await stayRoomRepository.GetAll()
            .AsNoTracking()
            .Where(sr => roomIds.Contains(sr.RoomId) && sr.DepartureDate >= start && sr.DepartureDate < end)
            .Select(sr => new { sr.StayId, sr.RoomId, sr.DepartureDate })
            .ToListAsync();

        var resIdsDep = resRoomsDepInRange.Select(x => x.ReservationId).Distinct().ToList();
        var stayIdsDep = stayRoomsDepInRange.Select(x => x.StayId).Distinct().ToList();
        var allResIds = resIds.Union(resIdsDep).Distinct().ToList();
        var allStayIds = stayIds.Union(stayIdsDep).Distinct().ToList();

        var reservationList = await reservationRepository.GetAll()
            .AsNoTracking()
            .Where(r => allResIds.Contains(r.Id))
            .Select(r => new { r.Id, r.ReservationNo, r.GuestName, r.Status })
            .ToListAsync();

        var stayList = await stayRepository.GetAll()
            .AsNoTracking()
            .Where(s => allStayIds.Contains(s.Id))
            .Select(s => new { s.Id, s.StayNo, s.GuestName })
            .ToListAsync();

        var resMap = reservationList.ToDictionary(x => x.Id, x => (x.ReservationNo ?? string.Empty, x.GuestName ?? string.Empty, (int)x.Status));
        var stayMap = stayList.ToDictionary(x => x.Id, x => (x.StayNo ?? string.Empty, x.GuestName ?? string.Empty));
        var roomById = rooms.ToDictionary(r => r.Id);

        var departureByRoomAndDate = new Dictionary<(Guid RoomId, DateTime Date), (Guid? StayId, Guid? ResId, string GuestName, string StayNo, string ResNo, int Status)>();
        foreach (var sr in stayRoomsDepInRange)
        {
            var key = (sr.RoomId, sr.DepartureDate.Date);
            if (departureByRoomAndDate.ContainsKey(key)) continue;
            stayMap.TryGetValue(sr.StayId, out var st);
            departureByRoomAndDate[key] = (sr.StayId, null, st.Item2 ?? string.Empty, st.Item1 ?? string.Empty, string.Empty, (int)RoomDailyInventoryStatus.InHouse);
        }
        foreach (var rr in resRoomsDepInRange)
        {
            var key = (rr.RoomId!.Value, rr.DepartureDate.Date);
            if (departureByRoomAndDate.ContainsKey(key)) continue;
            resMap.TryGetValue(rr.ReservationId, out var res);
            departureByRoomAndDate[key] = (null, rr.ReservationId, res.Item2 ?? string.Empty, string.Empty, res.Item1 ?? string.Empty, (int)RoomDailyInventoryStatus.Reserved);
        }

        var resRoomDates = await reservationRoomRepository.GetAll()
            .AsNoTracking()
            .Where(rr => allResIds.Contains(rr.ReservationId) && rr.RoomId.HasValue)
            .Select(rr => new { rr.ReservationId, rr.RoomId, rr.ArrivalDate, rr.DepartureDate })
            .ToListAsync();
        var resDateByResAndRoom = resRoomDates.ToDictionary(x => (x.ReservationId, x.RoomId!.Value), x => (x.ArrivalDate.Date, x.DepartureDate.Date));

        var stayRoomDates = await stayRoomRepository.GetAll()
            .AsNoTracking()
            .Where(sr => allStayIds.Contains(sr.StayId))
            .Select(sr => new { sr.StayId, sr.RoomId, sr.ArrivalDate, sr.DepartureDate })
            .ToListAsync();
        var stayDateByStayAndRoom = stayRoomDates.ToDictionary(x => (x.StayId, x.RoomId), x => (x.ArrivalDate.Date, x.DepartureDate.Date));

        var roomListDtos = rooms.Select(r => MapToRoomListDto(r)).ToList();
        var cells = inventory.Select(i =>
        {
            roomById.TryGetValue(i.RoomId, out var room);
            var roomNumber = room?.RoomNumber ?? string.Empty;
            string resNo = string.Empty, stayNo = string.Empty, guestName = string.Empty;
            int? resStatus = null;
            var status = (int)i.Status;
            Guid? reservationId = i.ReservationId;
            Guid? stayId = i.StayId;

            if (i.ReservationId.HasValue && resMap.TryGetValue(i.ReservationId.Value, out var res))
            {
                (resNo, guestName, resStatus) = (res.Item1, res.Item2, res.Item3);
            }
            if (i.StayId.HasValue && stayMap.TryGetValue(i.StayId.Value, out var st))
            {
                stayNo = st.Item1;
                if (string.IsNullOrEmpty(guestName)) guestName = st.Item2;
            }

            var invDate = i.InventoryDate.Date;
            bool isArrival = false, isDeparture = false;

            if (i.Status == RoomDailyInventoryStatus.Vacant && departureByRoomAndDate.TryGetValue((i.RoomId, invDate), out var dep))
            {
                stayId = dep.StayId;
                reservationId = dep.ResId;
                guestName = dep.GuestName;
                stayNo = dep.StayNo;
                resNo = dep.ResNo;
                status = dep.Status;
                isDeparture = true;
                if (dep.ResId.HasValue && resMap.TryGetValue(dep.ResId.Value, out var resVal))
                    resStatus = resVal.Item3;
            }
            else if (i.ReservationId.HasValue && i.Status == RoomDailyInventoryStatus.Reserved && resDateByResAndRoom.TryGetValue((i.ReservationId.Value, i.RoomId), out var resDates))
            {
                isArrival = invDate == resDates.Item1;
                isDeparture = invDate == resDates.Item2;
            }
            else if (i.StayId.HasValue && i.Status == RoomDailyInventoryStatus.InHouse && stayDateByStayAndRoom.TryGetValue((i.StayId.Value, i.RoomId), out var stayDates))
            {
                isArrival = invDate == stayDates.Item1;
                isDeparture = invDate == stayDates.Item2;
            }

            return new RoomRackDayCellDto
            {
                RoomId = i.RoomId,
                RoomNumber = roomNumber,
                InventoryDate = i.InventoryDate,
                Status = status,
                ReservationId = reservationId,
                StayId = stayId,
                ReservationNo = resNo,
                StayNo = stayNo,
                GuestName = guestName,
                ReservationStatus = resStatus,
                IsArrivalDate = isArrival,
                IsDepartureDate = isDeparture,
            };
        }).ToList();

        return new GetRoomRackResultDto { Rooms = roomListDtos, Cells = cells };
    }

    private static RoomListDto MapToRoomListDto(Room room)
    {
        var rt = room.RoomType;
        return new RoomListDto
        {
            Id = room.Id,
            RoomNumber = room.RoomNumber ?? string.Empty,
            RoomTypeId = room.RoomTypeId,
            RoomTypeName = rt?.Name ?? string.Empty,
            RoomTypeDescription = rt?.Description ?? string.Empty,
            BedTypeSummary = string.Empty,
            FeatureTags = [],
            AmenityItems = [],
            MaxAdults = rt?.MaxAdults ?? 0,
            MaxChildren = rt?.MaxChildren ?? 0,
            BaseRate = rt?.BaseRate ?? 0,
            Floor = room.Floor ?? string.Empty,
            HousekeepingStatus = room.HousekeepingStatus,
            IsActive = room.IsActive,
        };
    }
}
