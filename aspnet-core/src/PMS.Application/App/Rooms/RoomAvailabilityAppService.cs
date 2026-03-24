using Abp.Application.Services;
using Abp.Authorization;
using Abp.Domain.Repositories;
using Abp.Linq.Extensions;
using Abp.UI;
using Microsoft.EntityFrameworkCore;
using PMS.App;
using PMS.Application.App.RoomDailyInventory;
using PMS.App.Rooms.Dto;
using PMS.Authorization;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;

namespace PMS.App.Rooms;

public interface IRoomAvailabilityAppService : IApplicationService
{
    /// <summary>Returns rooms available for the given date range, room type, and optional filters.</summary>
    Task<List<RoomListDto>> GetAvailableRoomsAsync(GetAvailableRoomsInput input);

    /// <summary>Returns true if the specific room is available for the given dates.</summary>
    Task<bool> IsRoomAvailableAsync(IsRoomAvailableInput input);
}

public class IsRoomAvailableInput
{
    public Guid RoomId { get; set; }
    public DateTime ArrivalDate { get; set; }
    public DateTime DepartureDate { get; set; }
    public Guid? ExcludeReservationId { get; set; }
    public Guid? ExcludeStayId { get; set; }
}

[AbpAuthorize]
public class RoomAvailabilityAppService(
    IRepository<Room, Guid> roomRepository,
    IRepository<ReservationRoom, Guid> reservationRoomRepository,
    IRepository<StayRoom, Guid> stayRoomRepository,
    IRepository<RoomDailyInventory, Guid> roomDailyInventoryRepository,
    IRoomDailyInventoryService roomDailyInventoryService,
    IRoomPricingManager roomPricingManager
) : PMSAppServiceBase, IRoomAvailabilityAppService
{
    public async Task<List<RoomListDto>> GetAvailableRoomsAsync(GetAvailableRoomsInput input)
    {
        var hasDateRange = input.ArrivalDate.HasValue && input.DepartureDate.HasValue;
        var excludeReservedWithoutAssignedRoom = hasDateRange && input.ExcludeReservedWithoutAssignedRoom;
        var checkInReadyOnly = input.CheckInReadyOnly;

        if (input.ArrivalDate.HasValue != input.DepartureDate.HasValue)
            throw new UserFriendlyException(L("InvalidArrivalDepartureDate"));

        if (hasDateRange && input.ArrivalDate!.Value.Date >= input.DepartureDate!.Value.Date)
            throw new UserFriendlyException(L("InvalidArrivalDepartureDate"));

        var query = roomRepository.GetAll()
            .AsNoTracking()
            .Include(r => r.RoomType)
            .Where(r => r.IsActive)
            .WhereIf(input.RoomTypeId.HasValue, r => r.RoomTypeId == input.RoomTypeId);

        if (!hasDateRange || checkInReadyOnly)
        {
            var today = Abp.Timing.Clock.Now.Date;
            var occupiedRoomIds = await stayRoomRepository.GetAll()
                .AsNoTracking()
                .Where(sr => sr.ReleasedAt == null && (sr.Stay.Status == StayStatus.CheckedIn || sr.Stay.Status == StayStatus.InHouse))
                .Where(sr => sr.ArrivalDate <= today && sr.DepartureDate > today)
                .Select(sr => sr.RoomId)
                .ToListAsync();
            query = query.Where(r => !occupiedRoomIds.Contains(r.Id));
        }

        if (hasDateRange)
        {
            var arrivalDate = input.ArrivalDate!.Value.Date;
            var departureDate = input.DepartureDate!.Value.Date;

            var candidateRoomIds = await query.Select(r => r.Id).ToListAsync();
            if (candidateRoomIds.Count > 0)
            {
                await roomDailyInventoryService.EnsureInventoryForDateRangeAsync(candidateRoomIds, arrivalDate, departureDate);

                var blockedRoomIds = await roomDailyInventoryRepository.GetAll()
                    .AsNoTracking()
                    .Where(i => candidateRoomIds.Contains(i.RoomId)
                        && i.InventoryDate >= arrivalDate
                        && i.InventoryDate < departureDate
                        && i.Status != RoomDailyInventoryStatus.Vacant
                        && (i.Status != RoomDailyInventoryStatus.Reserved || i.ReservationId != input.ReservationId))
                    .Select(i => i.RoomId)
                    .Distinct()
                    .ToListAsync();

                if (blockedRoomIds.Count > 0)
                    query = query.Where(r => !blockedRoomIds.Contains(r.Id));
            }
        }

        var items = await query.OrderBy(r => r.RoomNumber).ToListAsync();

        if (excludeReservedWithoutAssignedRoom)
        {
            var arrivalDate = input.ArrivalDate!.Value.Date;
            var departureDate = input.DepartureDate!.Value.Date;

            var blockingReservationStatuses = new[]
            {
                ReservationStatus.Pending,
                ReservationStatus.Confirmed
            };

            var unassignedCountsByRoomType = await reservationRoomRepository.GetAll()
                .AsNoTracking()
                .Where(rr => rr.RoomId == null)
                .WhereIf(input.ReservationId.HasValue, rr => rr.ReservationId != input.ReservationId!.Value)
                .Where(rr => rr.ArrivalDate.Date < departureDate && rr.DepartureDate.Date > arrivalDate)
                .Where(rr => blockingReservationStatuses.Contains(rr.Reservation.Status))
                .GroupBy(rr => rr.RoomTypeId)
                .Select(g => new { RoomTypeId = g.Key, Count = g.Count() })
                .ToListAsync();

            if (unassignedCountsByRoomType.Count > 0)
            {
                var remainingExclusions = unassignedCountsByRoomType.ToDictionary(x => x.RoomTypeId, x => x.Count);
                var filteredItems = new List<Room>();

                foreach (var room in items)
                {
                    if (remainingExclusions.TryGetValue(room.RoomTypeId, out var count) && count > 0)
                    {
                        remainingExclusions[room.RoomTypeId] = count - 1;
                        continue;
                    }

                    filteredItems.Add(room);
                }

                items = filteredItems;
            }
        }

        var ratesByRoomType = new Dictionary<Guid, decimal>();
        if (hasDateRange)
        {
            var arrivalDate = input.ArrivalDate!.Value;
            var departureDate = input.DepartureDate!.Value;
            var roomTypeIds = items.Select(r => r.RoomTypeId).Distinct().ToList();

            foreach (var roomTypeId in roomTypeIds)
            {
                ratesByRoomType[roomTypeId] = await roomPricingManager.GetBestRatePerNightAsync(
                    roomTypeId,
                    arrivalDate,
                    departureDate,
                    input.ChannelId);
            }
        }

        var result = new List<RoomListDto>();
        foreach (var room in items)
        {
            var baseRate = ratesByRoomType.TryGetValue(room.RoomTypeId, out var rate) ? rate : 0m;
            result.Add(MapToRoomListDto(room, baseRate));
        }

        return result;
    }

    public async Task<bool> IsRoomAvailableAsync(IsRoomAvailableInput input)
    {
        return await roomDailyInventoryService.IsRoomAvailableForDatesAsync(
            input.RoomId,
            input.ArrivalDate,
            input.DepartureDate,
            input.ExcludeReservationId,
            input.ExcludeStayId);
    }

    private static RoomListDto MapToRoomListDto(Room room, decimal baseRate = 0)
    {
        var roomTypeName = room.RoomType?.Name ?? string.Empty;
        var roomTypeDescription = room.RoomType?.Description ?? string.Empty;
        var profile = GetRoomTypeProfile(roomTypeName, roomTypeDescription);

        return new RoomListDto
        {
            Id = room.Id,
            RoomNumber = room.RoomNumber,
            RoomTypeId = room.RoomTypeId,
            RoomTypeName = roomTypeName,
            RoomTypeDescription = roomTypeDescription,
            BedTypeSummary = profile.BedTypeSummary,
            FeatureTags = profile.FeatureTags,
            AmenityItems = profile.AmenityItems,
            MaxAdults = room.RoomType?.MaxAdults ?? 0,
            MaxChildren = room.RoomType?.MaxChildren ?? 0,
            BaseRate = baseRate,
            Floor = room.Floor,
            HousekeepingStatus = room.HousekeepingStatus,
            IsActive = room.IsActive,
        };
    }

    private static RoomTypeProfile GetRoomTypeProfile(string roomTypeName, string roomTypeDescription)
    {
        if (TryParseRoomTypeProfileFromDescription(roomTypeDescription, out var profileFromDescription))
            return profileFromDescription;

        if (roomTypeName.Contains("Superior Twin", StringComparison.OrdinalIgnoreCase))
            return new RoomTypeProfile("2 twin beds",
                ["1 room", "40 m2", "Balcony", "Sea view", "Air conditioning", "Attached bathroom", "Terrace"],
                ["Free toiletries", "Shower", "Safe", "Bidet", "Toilet", "Towels", "Tile/Marble floor", "Desk", "TV", "Slippers", "Tea/Coffee maker", "Electric kettle", "Cable channels", "Wardrobe or closet", "Toilet paper"]);

        if (roomTypeName.Contains("Superior King", StringComparison.OrdinalIgnoreCase))
            return new RoomTypeProfile("1 full bed",
                ["1 room", "40 m2", "Balcony", "Sea view", "Air conditioning", "Attached bathroom", "Terrace"],
                ["Free toiletries", "Shower", "Safe", "Bidet", "Toilet", "Towels", "Tile/Marble floor", "Desk", "TV", "Slippers", "Tea/Coffee maker", "Electric kettle", "Cable channels", "Wardrobe or closet", "Toilet paper"]);

        if (roomTypeName.Contains("Family", StringComparison.OrdinalIgnoreCase))
            return new RoomTypeProfile("2 queen beds",
                ["1 room", "55 m2", "Family area", "Air conditioning", "Attached bathroom", "Pantry"],
                ["Free toiletries", "Shower", "Safe", "Toilet", "Towels", "Desk", "TV", "Slippers", "Tea/Coffee maker", "Electric kettle", "Wardrobe or closet", "Toilet paper"]);

        if (roomTypeName.Contains("Suite", StringComparison.OrdinalIgnoreCase))
            return new RoomTypeProfile("1 king bed",
                ["1 room", "65 m2", "Living room", "Premium view", "Air conditioning", "Attached bathroom"],
                ["Breakfast included", "Late check-in", "Flexible reschedule", "Free toiletries", "Shower", "Safe", "Toilet", "Towels", "TV", "Tea/Coffee maker", "Electric kettle", "Wardrobe or closet"]);

        return new RoomTypeProfile("1 bed", ["1 room"], ["Free toiletries", "Towels", "Toilet paper"]);
    }

    private static bool TryParseRoomTypeProfileFromDescription(string roomTypeDescription, out RoomTypeProfile profile)
    {
        const string prefix = "__RTMETA__";
        profile = default!;

        if (string.IsNullOrWhiteSpace(roomTypeDescription) || !roomTypeDescription.StartsWith(prefix, StringComparison.Ordinal))
            return false;

        try
        {
            var json = roomTypeDescription[prefix.Length..];
            using var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;
            var bedTypeSummary = root.TryGetProperty("bedTypeSummary", out var bed) ? bed.GetString() : null;
            var featureTags = root.TryGetProperty("featureTags", out var tags) && tags.ValueKind == JsonValueKind.Array
                ? tags.EnumerateArray().Select(x => x.GetString() ?? string.Empty).Where(x => !string.IsNullOrWhiteSpace(x)).ToArray()
                : Array.Empty<string>();
            var amenityItems = root.TryGetProperty("amenityItems", out var amenities) && amenities.ValueKind == JsonValueKind.Array
                ? amenities.EnumerateArray().Select(x => x.GetString() ?? string.Empty).Where(x => !string.IsNullOrWhiteSpace(x)).ToArray()
                : Array.Empty<string>();

            if (string.IsNullOrWhiteSpace(bedTypeSummary))
                return false;

            profile = new RoomTypeProfile(bedTypeSummary, featureTags, amenityItems);
            return true;
        }
        catch
        {
            return false;
        }
    }

    private sealed record RoomTypeProfile(string BedTypeSummary, string[] FeatureTags, string[] AmenityItems);
}
