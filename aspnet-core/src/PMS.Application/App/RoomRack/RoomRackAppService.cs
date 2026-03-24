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
    IRoomDailyInventoryService roomDailyInventoryService,
    IRepository<RoomMaintenanceRequest, Guid> maintenanceRepository
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

        // Current room status (VC/VD/OC/OD/OOO) per room, based on today's daily inventory + housekeeping.
        var today = Abp.Timing.Clock.Now.Date;
        var todayInventoryByRoom = inventory
            .Where(i => i.InventoryDate.Date == today)
            .GroupBy(i => i.RoomId)
            .ToDictionary(g => g.Key, g => g.First().Status);

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

        var stayList = await stayRepository.GetAll()
            .AsNoTracking()
            .Where(s => allStayIds.Contains(s.Id))
            .Select(s => new { s.Id, s.StayNo, s.GuestName, s.Status, s.ReservationId })
            .ToListAsync();

        var stayReservationIds = stayList
            .Where(s => s.ReservationId.HasValue)
            .Select(s => s.ReservationId!.Value)
            .Distinct()
            .ToList();

        allResIds = allResIds.Union(stayReservationIds).Distinct().ToList();

        var reservationList = await reservationRepository.GetAll()
            .AsNoTracking()
            .Where(r => allResIds.Contains(r.Id))
            .Select(r => new { r.Id, r.ReservationNo, r.GuestName, r.Status, r.ChannelId, ChannelName = r.Channel != null ? r.Channel.Name : string.Empty, ChannelIcon = r.Channel != null ? r.Channel.Icon : string.Empty })
            .ToListAsync();

        var resMap = reservationList.ToDictionary(x => x.Id, x => (x.ReservationNo ?? string.Empty, x.GuestName ?? string.Empty, (int)x.Status, x.ChannelId, x.ChannelName ?? string.Empty, x.ChannelIcon ?? string.Empty));

        var checkedOutStayIds = stayList
            .Where(s => s.Status == StayStatus.CheckedOut)
            .Select(s => s.Id)
            .ToHashSet();
        var stayMap = stayList.ToDictionary(x => x.Id, x => (x.StayNo ?? string.Empty, x.GuestName ?? string.Empty, x.ReservationId));
        var roomById = rooms.ToDictionary(r => r.Id);

        var departureByRoomAndDate = new Dictionary<(Guid RoomId, DateTime Date), (Guid? StayId, Guid? ResId, string GuestName, string StayNo, string ResNo, int Status)>();
        foreach (var sr in stayRoomsDepInRange)
        {
            if (checkedOutStayIds.Contains(sr.StayId)) continue;
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

        var roomTypeIds = rooms.Select(r => r.RoomTypeId).Distinct().ToList();
        var roomTypeIdToName = rooms.GroupBy(r => r.RoomTypeId).ToDictionary(g => g.Key, g => g.First().RoomType?.Name ?? string.Empty);

        // Fetch active maintenance requests for rooms currently out of order
        var activeMaintenanceByRoom = await maintenanceRepository.GetAll()
            .AsNoTracking()
            .Where(m => roomIds.Contains(m.RoomId) && 
                       m.Status != RoomMaintenanceStatus.Completed && 
                       m.Status != RoomMaintenanceStatus.Cancelled &&
                       m.StartDate <= today && m.EndDate >= today)
            .ToDictionaryAsync(m => m.RoomId, m => (Title: m.Title ?? string.Empty, Reason: m.Description ?? string.Empty));

        var bookingStatuses = new[] { (int)PMS.App.ReservationStatus.Draft, (int)PMS.App.ReservationStatus.Pending, (int)PMS.App.ReservationStatus.Confirmed };

        var unassignedRooms = await reservationRoomRepository.GetAll()
            .AsNoTracking()
            .Where(rr => rr.RoomId == null && roomTypeIds.Contains(rr.RoomTypeId) && rr.ArrivalDate < end && rr.DepartureDate > start)
            .Select(rr => new { rr.ReservationId, rr.RoomTypeId, rr.ArrivalDate, rr.DepartureDate })
            .ToListAsync();
        var unassignedResIds = unassignedRooms.Select(x => x.ReservationId).Distinct().ToList();
        List<(Guid Id, string ReservationNo, string GuestName, int Status, string ChannelName, string ChannelIcon)> unassignedResList = [];
        if (unassignedResIds.Count > 0)
        {
            var raw = await reservationRepository.GetAll()
                .AsNoTracking()
                .Where(r => unassignedResIds.Contains(r.Id) && bookingStatuses.Contains((int)r.Status))
                .Select(r => new { r.Id, r.ReservationNo, r.GuestName, r.Status, ChannelName = r.Channel != null ? r.Channel.Name : string.Empty, ChannelIcon = r.Channel != null ? r.Channel.Icon : string.Empty })
                .ToListAsync();
            unassignedResList = raw.Select(r => (r.Id, r.ReservationNo ?? string.Empty, r.GuestName ?? string.Empty, (int)r.Status, r.ChannelName ?? string.Empty, r.ChannelIcon ?? string.Empty)).ToList();
        }
        var unassignedResMap = unassignedResList.ToDictionary(x => x.Id, x => (x.ReservationNo, x.GuestName, x.Status, x.ChannelName, x.ChannelIcon));
        var unassignedBookings = new List<UnassignedBookingDto>();
        foreach (var rr in unassignedRooms)
        {
            if (!unassignedResMap.TryGetValue(rr.ReservationId, out var res)) continue;
            if (!roomTypeIdToName.TryGetValue(rr.RoomTypeId, out var roomTypeName) || string.IsNullOrEmpty(roomTypeName)) continue;
            var arr = rr.ArrivalDate.Date;
            var dep = rr.DepartureDate.Date;
            for (var d = arr; d < dep && d < end; d = d.AddDays(1))
            {
                if (d >= start)
                    unassignedBookings.Add(new UnassignedBookingDto
                    {
                        RoomTypeName = roomTypeName,
                        InventoryDate = d,
                        ReservationId = rr.ReservationId,
                        ReservationNo = res.Item1,
                        GuestName = res.Item2,
                        ChannelName = res.Item4,
                        ChannelIcon = res.Item5,
                        ReservationStatus = res.Item3,
                    });
            }
        }

        var roomListDtos = rooms.Select(r =>
        {
            todayInventoryByRoom.TryGetValue(r.Id, out var invStatus);
            var statusCode = GetRoomStatusCode(invStatus, r.HousekeepingStatus);
            activeMaintenanceByRoom.TryGetValue(r.Id, out var maintenance);
            return MapToRoomListDto(r, statusCode, maintenance.Title, maintenance.Reason);
        }).ToList();
        var cells = inventory.Select(i =>
        {
            roomById.TryGetValue(i.RoomId, out var room);
            var roomNumber = room?.RoomNumber ?? string.Empty;
            string resNo = string.Empty, stayNo = string.Empty, guestName = string.Empty;
            Guid? channelId = null;
            string channelName = string.Empty, channelIcon = string.Empty;
            int? resStatus = null;
            var status = (int)i.Status;
            Guid? reservationId = i.ReservationId;
            Guid? stayId = i.StayId;

            if (i.ReservationId.HasValue && resMap.TryGetValue(i.ReservationId.Value, out var res))
            {
                (resNo, guestName, resStatus) = (res.Item1, res.Item2, res.Item3);
                channelId = res.Item4;
                channelName = res.Item5;
                channelIcon = res.Item6;
            }
            if (i.StayId.HasValue && stayMap.TryGetValue(i.StayId.Value, out var st))
            {
                stayNo = st.Item1;
                if (string.IsNullOrEmpty(guestName)) guestName = st.Item2;

                if (st.Item3.HasValue && resMap.TryGetValue(st.Item3.Value, out var stayRes))
                {
                    if (channelId == null) channelId = stayRes.Item4;
                    if (string.IsNullOrEmpty(channelName)) channelName = stayRes.Item5;
                    if (string.IsNullOrEmpty(channelIcon)) channelIcon = stayRes.Item6;
                }
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
                {
                    resStatus = resVal.Item3;
                    channelId = resVal.Item4;
                    channelName = resVal.Item5;
                    channelIcon = resVal.Item6;
                }
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

            // Do not display NoShow, Cancelled, CheckedIn, or Completed reservations in the grid — show as Vacant
            if (status == (int)RoomDailyInventoryStatus.Reserved && resStatus.HasValue &&
                (resStatus.Value == (int)PMS.App.ReservationStatus.Cancelled ||
                 resStatus.Value == (int)PMS.App.ReservationStatus.NoShow ||
                 resStatus.Value == (int)PMS.App.ReservationStatus.CheckedIn ||
                 resStatus.Value == (int)PMS.App.ReservationStatus.Completed))
            {
                status = (int)RoomDailyInventoryStatus.Vacant;
                reservationId = null;
                stayId = null;
                resNo = string.Empty;
                stayNo = string.Empty;
                guestName = string.Empty;
                channelId = null;
                channelName = string.Empty;
                channelIcon = string.Empty;
                resStatus = null;
                isArrival = false;
                isDeparture = false;
            }

            // Do not display checked-out stays in the grid — show as Vacant
            if (stayId.HasValue && checkedOutStayIds.Contains(stayId.Value))
            {
                status = (int)RoomDailyInventoryStatus.Vacant;
                stayId = null;
                stayNo = string.Empty;
                guestName = string.Empty;
                channelId = null;
                channelName = string.Empty;
                channelIcon = string.Empty;
                isArrival = false;
                isDeparture = false;
            }

            // Bookings count/dialog: only Draft reservations (exclude Pending and Confirmed)
            var countInBookings = status == (int)RoomDailyInventoryStatus.Reserved && reservationId.HasValue
                && resStatus == (int)PMS.App.ReservationStatus.Draft;

            // Maintenance info for OutOfOrder status
            var maintenanceTitle = string.Empty;
            var maintenanceReason = string.Empty;
            if (status == (int)RoomDailyInventoryStatus.OutOfOrder && activeMaintenanceByRoom.TryGetValue(i.RoomId, out var maintenance))
            {
                maintenanceTitle = maintenance.Title;
                maintenanceReason = maintenance.Reason;
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
                ChannelId = channelId,
                ChannelName = channelName,
                ChannelIcon = channelIcon,
                ReservationStatus = resStatus,
                IsArrivalDate = isArrival,
                IsDepartureDate = isDeparture,
                CountInBookings = countInBookings,
                MaintenanceTitle = maintenanceTitle,
                MaintenanceReason = maintenanceReason,
            };
        }).ToList();

        return new GetRoomRackResultDto { Rooms = roomListDtos, Cells = cells, UnassignedBookings = unassignedBookings };
    }

    private static string GetRoomStatusCode(RoomDailyInventoryStatus? invStatus, HousekeepingStatus housekeepingStatus)
    {
        if (invStatus == RoomDailyInventoryStatus.OutOfOrder)
        {
            return "OOO";
        }

        var isClean = housekeepingStatus == HousekeepingStatus.Clean
                      || housekeepingStatus == HousekeepingStatus.Inspected
                      || housekeepingStatus == HousekeepingStatus.Pickup;

        var isOccupied = invStatus == RoomDailyInventoryStatus.InHouse
                         || invStatus == RoomDailyInventoryStatus.HouseUse;

        if (isOccupied)
        {
            return isClean ? "OC" : "OD";
        }

        // Treat Vacant / Reserved / Blocked / null as vacant from FO perspective.
        return isClean ? "VC" : "VD";
    }

    private static RoomListDto MapToRoomListDto(Room room, string roomStatusCode, string maintenanceTitle = "", string maintenanceReason = "")
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
            Floor = room.Floor ?? string.Empty,
            HousekeepingStatus = room.HousekeepingStatus,
            IsActive = room.IsActive,
            RoomStatusCode = roomStatusCode,
            MaintenanceTitle = maintenanceTitle,
            MaintenanceReason = maintenanceReason,
        };
    }
}
