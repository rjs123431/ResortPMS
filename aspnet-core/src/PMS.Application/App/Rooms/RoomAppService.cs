using Abp.Application.Services;
using System;
using System.Collections.Generic;
using Abp.Application.Services.Dto;
using Abp.Authorization;
using Abp.Domain.Repositories;
using Abp.Linq.Extensions;
using Abp.UI;
using Microsoft.EntityFrameworkCore;
using PMS.App.Rooms.Dto;
using PMS.Authorization;
using System.Linq;
using System.Linq.Dynamic.Core;
using System.Text.Json;
using System.Threading.Tasks;

namespace PMS.App.Rooms;

public interface IRoomTypeAppService : IApplicationService
{
    Task<RoomTypeDto> GetAsync(Guid id);
    Task<PagedResultDto<RoomTypeListDto>> GetAllAsync(GetRoomTypesInput input);
    Task<Guid> CreateAsync(CreateRoomTypeDto input);
    Task UpdateAsync(RoomTypeDto input);
    Task<System.Collections.Generic.List<RoomTypeListDto>> GetAllActiveAsync();
}

public interface IRoomAppService : IApplicationService
{
    Task<RoomDto> GetAsync(Guid id);
    Task<PagedResultDto<RoomListDto>> GetAllAsync(GetRoomsInput input);
    Task<Guid> CreateAsync(CreateRoomDto input);
    Task UpdateAsync(RoomDto input);
    Task UpdateOperationalStatusAsync(UpdateRoomOperationalStatusDto input);
    Task UpdateHousekeepingStatusAsync(UpdateHousekeepingStatusDto input);
    Task<System.Collections.Generic.List<RoomListDto>> GetAvailableRoomsAsync(GetAvailableRoomsInput input);
}

[AbpAuthorize(PermissionNames.Pages_RoomTypes)]
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

    public async Task<System.Collections.Generic.List<RoomTypeListDto>> GetAllActiveAsync()
    {
        var list = await roomTypeRepository.GetAll()
            .Where(r => r.IsActive)
            .OrderBy(r => r.Name)
            .ToListAsync();
        return ObjectMapper.Map<System.Collections.Generic.List<RoomTypeListDto>>(list);
    }

    public async Task<PagedResultDto<RoomTypeListDto>> GetAllAsync(GetRoomTypesInput input)
    {
        var query = roomTypeRepository.GetAll()
            .WhereIf(!string.IsNullOrWhiteSpace(input.Filter), r => r.Name.Contains(input.Filter))
            .WhereIf(input.IsActive.HasValue, r => r.IsActive == input.IsActive);

        var total = await query.CountAsync();
        var items = await query.OrderBy(input.Sorting ?? "Name").PageBy(input).ToListAsync();
        return new PagedResultDto<RoomTypeListDto>(total, ObjectMapper.Map<System.Collections.Generic.List<RoomTypeListDto>>(items));
    }

    [AbpAuthorize(PermissionNames.Pages_RoomTypes_Edit)]
    public async Task UpdateAsync(RoomTypeDto input)
    {
        var entity = await roomTypeRepository.GetAsync(input.Id);
        ObjectMapper.Map(input, entity);
        await roomTypeRepository.UpdateAsync(entity);
    }
}

[AbpAuthorize(PermissionNames.Pages_Rooms)]
public class RoomAppService(
    IRepository<Room, Guid> roomRepository,
    IRepository<RoomStatusLog, Guid> roomStatusLogRepository,
    IRepository<HousekeepingLog, Guid> housekeepingLogRepository,
    IRepository<ReservationRoom, Guid> reservationRoomRepository,
    IRepository<StayRoom, Guid> stayRoomRepository,
    IRepository<PreCheckInRoom, Guid> preCheckInRoomRepository
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
            .WhereIf(input.OperationalStatus.HasValue, r => r.OperationalStatus == input.OperationalStatus)
            .WhereIf(input.HousekeepingStatus.HasValue, r => r.HousekeepingStatus == input.HousekeepingStatus)
            .WhereIf(input.RoomTypeId.HasValue, r => r.RoomTypeId == input.RoomTypeId)
            .WhereIf(input.IsActive.HasValue, r => r.IsActive == input.IsActive);

        var total = await query.CountAsync();
        var items = await query.OrderBy(input.Sorting ?? "RoomNumber").PageBy(input).ToListAsync();
        return new PagedResultDto<RoomListDto>(total, ObjectMapper.Map<System.Collections.Generic.List<RoomListDto>>(items));
    }

    public async Task<System.Collections.Generic.List<RoomListDto>> GetAvailableRoomsAsync(GetAvailableRoomsInput input)
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
            .WhereIf(input.RoomTypeId.HasValue, r => r.RoomTypeId == input.RoomTypeId)
            .Where(r => r.OperationalStatus != RoomOperationalStatus.OutOfOrder &&
                        r.OperationalStatus != RoomOperationalStatus.OutOfService);

        if (!hasDateRange || checkInReadyOnly)
        {
            query = query.Where(r => r.OperationalStatus == RoomOperationalStatus.Vacant);
        }

        if (hasDateRange)
        {
            var arrivalDate = input.ArrivalDate!.Value.Date;
            var departureDate = input.DepartureDate!.Value.Date;
            var arrivalNextDay = arrivalDate.AddDays(1);

            var blockingReservationStatuses = new[]
            {
                ReservationStatus.Pending,
                ReservationStatus.Confirmed,
                ReservationStatus.CheckedIn,
            };

            var activeStayStatuses = new[] { StayStatus.CheckedIn, StayStatus.InHouse };

            // Materialize blocked room IDs first — correlated cross-repository subqueries
            // cannot be translated by EF Core; using Contains on pre-fetched ID lists instead.
            var blockedByReservation = await reservationRoomRepository.GetAll()
                .AsNoTracking()
                .Where(rr => rr.RoomId.HasValue)
                .WhereIf(input.ReservationId.HasValue, rr => rr.ReservationId != input.ReservationId!.Value)
                .Where(rr => rr.ArrivalDate < departureDate && rr.DepartureDate > arrivalDate)
                .Where(rr => blockingReservationStatuses.Contains(rr.Reservation.Status))
                .Select(rr => rr.RoomId!.Value)
                .Distinct()
                .ToListAsync();

            var blockedByStay = await stayRoomRepository.GetAll()
                .AsNoTracking()
                .Where(sr => sr.AssignedAt < departureDate)
                .Where(sr => (sr.ReleasedAt ?? sr.Stay.ExpectedCheckOutDateTime) >= arrivalNextDay)
                .Where(sr => activeStayStatuses.Contains(sr.Stay.Status))
                .Select(sr => sr.RoomId)
                .Distinct()
                .ToListAsync();

            if (blockedByReservation.Count > 0)
                query = query.Where(r => !blockedByReservation.Contains(r.Id));

            if (blockedByStay.Count > 0)
                query = query.Where(r => !blockedByStay.Contains(r.Id));

            var blockedByPreCheckIn = await preCheckInRoomRepository.GetAll()
                .AsNoTracking()
                .Where(pcr => pcr.RoomId.HasValue)
                .Where(pcr => pcr.PreCheckIn.Status == PreCheckInStatus.Pending)
                .Where(pcr => pcr.PreCheckIn.ArrivalDate < departureDate && pcr.PreCheckIn.DepartureDate > arrivalDate)
                .Select(pcr => pcr.RoomId!.Value)
                .Distinct()
                .ToListAsync();

            if (blockedByPreCheckIn.Count > 0)
                query = query.Where(r => !blockedByPreCheckIn.Contains(r.Id));
        }

        var items = await query.OrderBy(r => r.RoomNumber).ToListAsync();

        if (excludeReservedWithoutAssignedRoom)
        {
            var arrivalDate = input.ArrivalDate!.Value.Date;
            var departureDate = input.DepartureDate!.Value.Date;

            var blockingReservationStatuses = new[]
            {
                ReservationStatus.Pending,
                ReservationStatus.Confirmed,
                ReservationStatus.CheckedIn,
            };

            var unassignedCountsByRoomType = await reservationRoomRepository.GetAll()
                .AsNoTracking()
                .Where(rr => rr.RoomId == null)
                .WhereIf(input.ReservationId.HasValue, rr => rr.ReservationId != input.ReservationId.Value)
                .Where(rr => rr.ArrivalDate < departureDate && rr.DepartureDate > arrivalDate)
                .Where(rr => blockingReservationStatuses.Contains(rr.Reservation.Status))
                .GroupBy(rr => rr.RoomTypeId)
                .Select(g => new { RoomTypeId = g.Key, Count = g.Count() })
                .ToListAsync();

            if (unassignedCountsByRoomType.Count > 0)
            {
                var remainingExclusions = unassignedCountsByRoomType.ToDictionary(x => x.RoomTypeId, x => x.Count);
                var filteredItems = new System.Collections.Generic.List<Room>();

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

        return items.Select(MapToRoomListDto).ToList();
    }

    private static RoomListDto MapToRoomListDto(Room room)
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
            BaseRate = room.RoomType?.BaseRate ?? 0,
            Floor = room.Floor,
            OperationalStatus = room.OperationalStatus,
            HousekeepingStatus = room.HousekeepingStatus,
            IsActive = room.IsActive,
        };
    }

    private static RoomTypeProfile GetRoomTypeProfile(string roomTypeName, string roomTypeDescription)
    {
        if (TryParseRoomTypeProfileFromDescription(roomTypeDescription, out var profileFromDescription))
        {
            return profileFromDescription;
        }

        if (roomTypeName.Contains("Superior Twin", StringComparison.OrdinalIgnoreCase))
        {
            return new RoomTypeProfile(
                "2 twin beds",
                ["1 room", "40 m2", "Balcony", "Sea view", "Air conditioning", "Attached bathroom", "Terrace"],
                ["Free toiletries", "Shower", "Safe", "Bidet", "Toilet", "Towels", "Tile/Marble floor", "Desk", "TV", "Slippers", "Tea/Coffee maker", "Electric kettle", "Cable channels", "Wardrobe or closet", "Toilet paper"]
            );
        }

        if (roomTypeName.Contains("Superior King", StringComparison.OrdinalIgnoreCase))
        {
            return new RoomTypeProfile(
                "1 full bed",
                ["1 room", "40 m2", "Balcony", "Sea view", "Air conditioning", "Attached bathroom", "Terrace"],
                ["Free toiletries", "Shower", "Safe", "Bidet", "Toilet", "Towels", "Tile/Marble floor", "Desk", "TV", "Slippers", "Tea/Coffee maker", "Electric kettle", "Cable channels", "Wardrobe or closet", "Toilet paper"]
            );
        }

        if (roomTypeName.Contains("Family", StringComparison.OrdinalIgnoreCase))
        {
            return new RoomTypeProfile(
                "2 queen beds",
                ["1 room", "55 m2", "Family area", "Air conditioning", "Attached bathroom", "Pantry"],
                ["Free toiletries", "Shower", "Safe", "Toilet", "Towels", "Desk", "TV", "Slippers", "Tea/Coffee maker", "Electric kettle", "Wardrobe or closet", "Toilet paper"]
            );
        }

        if (roomTypeName.Contains("Suite", StringComparison.OrdinalIgnoreCase))
        {
            return new RoomTypeProfile(
                "1 king bed",
                ["1 room", "65 m2", "Living room", "Premium view", "Air conditioning", "Attached bathroom"],
                ["Breakfast included", "Late check-in", "Flexible reschedule", "Free toiletries", "Shower", "Safe", "Toilet", "Towels", "TV", "Tea/Coffee maker", "Electric kettle", "Wardrobe or closet"]
            );
        }

        return new RoomTypeProfile(
            "1 bed",
            ["1 room"],
            ["Free toiletries", "Towels", "Toilet paper"]
        );
    }

    private static bool TryParseRoomTypeProfileFromDescription(string roomTypeDescription, out RoomTypeProfile profile)
    {
        const string prefix = "__RTMETA__";
        profile = default!;

        if (string.IsNullOrWhiteSpace(roomTypeDescription) || !roomTypeDescription.StartsWith(prefix, StringComparison.Ordinal))
        {
            return false;
        }

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
            {
                return false;
            }

            profile = new RoomTypeProfile(
                bedTypeSummary,
                featureTags,
                amenityItems
            );
            return true;
        }
        catch
        {
            return false;
        }
    }

    private sealed record RoomTypeProfile(string BedTypeSummary, string[] FeatureTags, string[] AmenityItems);

    [AbpAuthorize(PermissionNames.Pages_Rooms_Edit)]
    public async Task UpdateAsync(RoomDto input)
    {
        var entity = await roomRepository.GetAsync(input.Id);
        var originalOperationalStatus = entity.OperationalStatus;
        var originalHousekeepingStatus = entity.HousekeepingStatus;
        ObjectMapper.Map(input, entity);
        entity.OperationalStatus = originalOperationalStatus;
        entity.HousekeepingStatus = originalHousekeepingStatus;
        await roomRepository.UpdateAsync(entity);
    }

    public async Task UpdateOperationalStatusAsync(UpdateRoomOperationalStatusDto input)
    {
        var room = await roomRepository.GetAsync(input.RoomId);
        room.OperationalStatus = input.OperationalStatus;
        await roomRepository.UpdateAsync(room);

        await roomStatusLogRepository.InsertAsync(new RoomStatusLog
        {
            RoomId = input.RoomId,
            OperationalStatus = input.OperationalStatus,
            Remarks = input.Remarks ?? string.Empty,
            ChangedAt = Abp.Timing.Clock.Now
        });
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
