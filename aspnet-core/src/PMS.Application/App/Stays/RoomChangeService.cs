using Abp.Application.Services;
using Abp.Authorization;
using Abp.Domain.Repositories;
using Abp.Domain.Uow;
using Abp.Timing;
using Abp.UI;
using Microsoft.EntityFrameworkCore;
using PMS.App.Stays.Dto;
using PMS.Authorization;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace PMS.App.Stays;

public interface IRoomChangeService : IApplicationService
{
    Task<Guid> CreateRequestAsync(CreateRoomChangeRequestDto input);
    Task<List<AvailableRoomForChangeDto>> GetAvailableRoomsForChangeAsync(Guid requestId);
    Task ApproveRequestAsync(ApproveRoomChangeRequestDto input);
    Task RejectRequestAsync(RejectRoomChangeRequestDto input);
    Task CancelRequestAsync(CancelRoomChangeRequestDto input);
    Task<Guid> ExecuteRoomChangeAsync(ExecuteRoomChangeDto input);
    Task<RoomChangeRequestDto> GetRequestAsync(Guid requestId);
    Task<List<RoomChangeRequestListDto>> GetPendingRequestsAsync();
    Task<List<RoomChangeRequestListDto>> GetRequestsByStayAsync(Guid stayId);
}

[AbpAuthorize(PermissionNames.Pages_Stays)]
public class RoomChangeService(
    IRepository<Stay, Guid> stayRepository,
    IRepository<StayRoom, Guid> stayRoomRepository,
    IRepository<StayRoomTransfer, Guid> stayRoomTransferRepository,
    IRepository<RoomChangeRequest, Guid> roomChangeRequestRepository,
    IRepository<Room, Guid> roomRepository,
    IRepository<RoomType, Guid> roomTypeRepository,
    IRepository<ReservationRoom, Guid> reservationRoomRepository
) : PMSAppServiceBase, IRoomChangeService
{
    /// <summary>
    /// Step 1: Create room change request
    /// </summary>
    [AbpAuthorize(PermissionNames.Pages_Stays_Transfer)]
    [UnitOfWork]
    public async Task<Guid> CreateRequestAsync(CreateRoomChangeRequestDto input)
    {
        var stay = await stayRepository.GetAsync(input.StayId);

        if (stay.Status != StayStatus.InHouse && stay.Status != StayStatus.CheckedIn)
            throw new UserFriendlyException(L("CannotCreateRoomChangeForNonActiveStay"));

        var activeStayRoom = await GetActiveStayRoomAsync(input.StayId, input.StayRoomId);

        var hasPendingRequest = await roomChangeRequestRepository.GetAll()
            .AnyAsync(r => r.StayRoomId == activeStayRoom.Id &&
                          (r.Status == RoomChangeRequestStatus.Pending ||
                           r.Status == RoomChangeRequestStatus.Approved ||
                           r.Status == RoomChangeRequestStatus.InProgress));

        if (hasPendingRequest)
            throw new UserFriendlyException(L("PendingRoomChangeRequestExists"));

        var request = new RoomChangeRequest
        {
            StayId = input.StayId,
            StayRoomId = activeStayRoom.Id,
            Source = input.Source,
            Reason = input.Reason,
            ReasonDetails = input.ReasonDetails ?? string.Empty,
            FromRoomTypeId = activeStayRoom.RoomTypeId,
            FromRoomId = activeStayRoom.RoomId,
            PreferredRoomTypeId = input.PreferredRoomTypeId,
            ToRoomId = input.PreferredRoomId,
            ToRoomTypeId = input.PreferredRoomId.HasValue
                ? (await roomRepository.GetAsync(input.PreferredRoomId.Value)).RoomTypeId
                : input.PreferredRoomTypeId,
            Status = RoomChangeRequestStatus.Pending,
            RequestedAt = Clock.Now,
            RequestedBy = AbpSession.UserId.HasValue ? AbpSession.UserId.ToString() : "System"
        };

        return await roomChangeRequestRepository.InsertAndGetIdAsync(request);
    }

    /// <summary>
    /// Step 2: Find available rooms for transfer
    /// </summary>
    public async Task<List<AvailableRoomForChangeDto>> GetAvailableRoomsForChangeAsync(Guid requestId)
    {
        var request = await roomChangeRequestRepository.GetAll()
            .Include(r => r.Stay)
            .Include(r => r.FromRoom)
                .ThenInclude(r => r.RoomType)
            .FirstOrDefaultAsync(r => r.Id == requestId)
            ?? throw new UserFriendlyException(L("RoomChangeRequestNotFound"));

        var currentRoomTypeBaseRate = request.FromRoom.RoomType.BaseRate;
        var departureDate = request.Stay.ExpectedCheckOutDateTime.Date;
        var today = Clock.Now.Date;

        var activeStayStatuses = new[] { StayStatus.CheckedIn, StayStatus.InHouse };
        var blockingReservationStatuses = new[]
        {
            ReservationStatus.Pending,
            ReservationStatus.Confirmed,
            ReservationStatus.CheckedIn,
        };

        var blockedByStay = await stayRoomRepository.GetAll()
            .AsNoTracking()
            .Where(sr => sr.ReleasedAt == null)
            .Where(sr => activeStayStatuses.Contains(sr.Stay.Status))
            .Where(sr => sr.RoomId != request.FromRoomId)
            .Select(sr => sr.RoomId)
            .Distinct()
            .ToListAsync();

        var blockedByReservation = await reservationRoomRepository.GetAll()
            .AsNoTracking()
            .Where(rr => rr.RoomId.HasValue)
            .Where(rr => rr.ArrivalDate < departureDate && rr.DepartureDate > today)
            .Where(rr => blockingReservationStatuses.Contains(rr.Reservation.Status))
            .Select(rr => rr.RoomId!.Value)
            .Distinct()
            .ToListAsync();

        var blockedRoomIds = blockedByStay.Concat(blockedByReservation).Distinct().ToList();
        blockedRoomIds.Add(request.FromRoomId);

        var query = roomRepository.GetAll()
            .AsNoTracking()
            .Include(r => r.RoomType)
            .Where(r => r.IsActive)
            .Where(r => r.OperationalStatus != RoomOperationalStatus.OutOfOrder)
            .Where(r => r.OperationalStatus != RoomOperationalStatus.OutOfService)
            .Where(r => r.OperationalStatus != RoomOperationalStatus.Occupied)
            .Where(r => !blockedRoomIds.Contains(r.Id));

        if (request.PreferredRoomTypeId.HasValue)
        {
            query = query.Where(r => r.RoomTypeId == request.PreferredRoomTypeId.Value);
        }

        var availableRooms = await query.OrderBy(r => r.RoomNumber).ToListAsync();

        return availableRooms.Select(r => new AvailableRoomForChangeDto
        {
            RoomId = r.Id,
            RoomNumber = r.RoomNumber,
            RoomTypeId = r.RoomTypeId,
            RoomTypeName = r.RoomType?.Name ?? string.Empty,
            BaseRate = r.RoomType?.BaseRate ?? 0,
            Floor = r.Floor,
            HousekeepingStatus = r.HousekeepingStatus,
            IsUpgrade = (r.RoomType?.BaseRate ?? 0) > currentRoomTypeBaseRate,
            IsDowngrade = (r.RoomType?.BaseRate ?? 0) < currentRoomTypeBaseRate,
            IsSameType = r.RoomTypeId == request.FromRoomTypeId
        }).ToList();
    }

    /// <summary>
    /// Step 3: Approve request and assign target room
    /// </summary>
    [AbpAuthorize(PermissionNames.Pages_Stays_Transfer)]
    [UnitOfWork]
    public async Task ApproveRequestAsync(ApproveRoomChangeRequestDto input)
    {
        var request = await roomChangeRequestRepository.GetAsync(input.RequestId);

        if (request.Status != RoomChangeRequestStatus.Pending)
            throw new UserFriendlyException(L("OnlyPendingRequestsCanBeApproved"));

        var targetRoom = await roomRepository.GetAll()
            .Include(r => r.RoomType)
            .FirstOrDefaultAsync(r => r.Id == input.ToRoomId)
            ?? throw new UserFriendlyException(L("TargetRoomNotFound"));

        await ValidateRoomAvailabilityAsync(request, input.ToRoomId);

        request.ToRoomId = input.ToRoomId;
        request.ToRoomTypeId = targetRoom.RoomTypeId;
        request.Status = RoomChangeRequestStatus.Approved;
        request.ApprovedAt = Clock.Now;
        request.ApprovedBy = AbpSession.UserId.HasValue ? AbpSession.UserId.ToString() : "System";

        await roomChangeRequestRepository.UpdateAsync(request);

        Logger.Info($"Room change request {request.Id} approved. Target room: {targetRoom.RoomNumber}");
    }

    /// <summary>
    /// Step 3 (alternative): Reject request
    /// </summary>
    [AbpAuthorize(PermissionNames.Pages_Stays_Transfer)]
    [UnitOfWork]
    public async Task RejectRequestAsync(RejectRoomChangeRequestDto input)
    {
        var request = await roomChangeRequestRepository.GetAsync(input.RequestId);

        if (request.Status != RoomChangeRequestStatus.Pending)
            throw new UserFriendlyException(L("OnlyPendingRequestsCanBeRejected"));

        request.Status = RoomChangeRequestStatus.Rejected;
        request.CancellationReason = input.RejectionReason;

        await roomChangeRequestRepository.UpdateAsync(request);

        Logger.Info($"Room change request {request.Id} rejected. Reason: {input.RejectionReason}");
    }

    /// <summary>
    /// Cancel a pending or approved request
    /// </summary>
    [AbpAuthorize(PermissionNames.Pages_Stays_Transfer)]
    [UnitOfWork]
    public async Task CancelRequestAsync(CancelRoomChangeRequestDto input)
    {
        var request = await roomChangeRequestRepository.GetAsync(input.RequestId);

        if (request.Status != RoomChangeRequestStatus.Pending &&
            request.Status != RoomChangeRequestStatus.Approved)
            throw new UserFriendlyException(L("OnlyPendingOrApprovedRequestsCanBeCancelled"));

        request.Status = RoomChangeRequestStatus.Cancelled;
        request.CancellationReason = input.CancellationReason ?? string.Empty;

        await roomChangeRequestRepository.UpdateAsync(request);

        Logger.Info($"Room change request {request.Id} cancelled.");
    }

    /// <summary>
    /// Step 4-8: Execute the room change (full transfer flow)
    /// </summary>
    [AbpAuthorize(PermissionNames.Pages_Stays_Transfer)]
    [UnitOfWork]
    public async Task<Guid> ExecuteRoomChangeAsync(ExecuteRoomChangeDto input)
    {
        var request = await roomChangeRequestRepository.GetAll()
            .Include(r => r.Stay)
            .Include(r => r.StayRoom)
            .FirstOrDefaultAsync(r => r.Id == input.RequestId)
            ?? throw new UserFriendlyException(L("RoomChangeRequestNotFound"));

        if (request.Status != RoomChangeRequestStatus.Approved)
            throw new UserFriendlyException(L("OnlyApprovedRequestsCanBeExecuted"));

        if (!request.ToRoomId.HasValue || !request.ToRoomTypeId.HasValue)
            throw new UserFriendlyException(L("TargetRoomNotAssigned"));

        request.Status = RoomChangeRequestStatus.InProgress;
        await roomChangeRequestRepository.UpdateAsync(request);

        await ValidateRoomAvailabilityAsync(request, request.ToRoomId.Value);

        var activeStayRoom = request.StayRoom;
        if (activeStayRoom.ReleasedAt.HasValue)
            throw new UserFriendlyException(L("StayRoomAlreadyReleased"));

        var toRoom = await roomRepository.GetAsync(request.ToRoomId.Value);

        // Step 5: Close old StayRoom
        activeStayRoom.ReleasedAt = Clock.Now;
        await stayRoomRepository.UpdateAsync(activeStayRoom);

        // Step 6: Create new StayRoom (preserve original assignment)
        var newStayRoom = new StayRoom
        {
            StayId = request.StayId,
            RoomTypeId = request.ToRoomTypeId.Value,
            RoomId = request.ToRoomId.Value,
            AssignedAt = Clock.Now,
            OriginalRoomTypeId = activeStayRoom.OriginalRoomTypeId,
            OriginalRoomId = activeStayRoom.OriginalRoomId
        };
        var newStayRoomId = await stayRoomRepository.InsertAndGetIdAsync(newStayRoom);

        // Step 7: Update room statuses
        var fromRoom = await roomRepository.GetAsync(activeStayRoom.RoomId);
        fromRoom.OperationalStatus = RoomOperationalStatus.Vacant;
        fromRoom.HousekeepingStatus = HousekeepingStatus.Dirty;
        await roomRepository.UpdateAsync(fromRoom);

        toRoom.OperationalStatus = RoomOperationalStatus.Occupied;
        await roomRepository.UpdateAsync(toRoom);

        // Step 8: Log transfer
        await stayRoomTransferRepository.InsertAsync(new StayRoomTransfer
        {
            StayRoomId = newStayRoomId,
            FromRoomTypeId = activeStayRoom.RoomTypeId,
            FromRoomId = activeStayRoom.RoomId,
            ToRoomTypeId = request.ToRoomTypeId.Value,
            ToRoomId = request.ToRoomId.Value,
            TransferredAt = Clock.Now,
            Reason = BuildTransferReason(request)
        });

        // Update stay's room number snapshot
        var stay = request.Stay;
        stay.RoomNumber = toRoom.RoomNumber;
        await stayRepository.UpdateAsync(stay);

        // Mark request as completed
        request.Status = RoomChangeRequestStatus.Completed;
        request.CompletedAt = Clock.Now;
        request.CompletedBy = AbpSession.UserId.HasValue ? AbpSession.UserId.ToString() : "System";
        await roomChangeRequestRepository.UpdateAsync(request);

        Logger.Info($"Room change completed: Stay {stay.StayNo} from {fromRoom.RoomNumber} to {toRoom.RoomNumber}");

        return newStayRoomId;
    }

    public async Task<RoomChangeRequestDto> GetRequestAsync(Guid requestId)
    {
        var request = await roomChangeRequestRepository.GetAll()
            .Include(r => r.Stay)
            .Include(r => r.FromRoom)
            .Include(r => r.FromRoomType)
            .Include(r => r.ToRoom)
            .Include(r => r.ToRoomType)
            .Include(r => r.PreferredRoomType)
            .FirstOrDefaultAsync(r => r.Id == requestId)
            ?? throw new UserFriendlyException(L("RoomChangeRequestNotFound"));

        return MapToDto(request);
    }

    public async Task<List<RoomChangeRequestListDto>> GetPendingRequestsAsync()
    {
        var requests = await roomChangeRequestRepository.GetAll()
            .Include(r => r.Stay)
            .Include(r => r.FromRoom)
            .Include(r => r.ToRoom)
            .Where(r => r.Status == RoomChangeRequestStatus.Pending ||
                       r.Status == RoomChangeRequestStatus.Approved)
            .OrderByDescending(r => r.RequestedAt)
            .ToListAsync();

        return requests.Select(MapToListDto).ToList();
    }

    public async Task<List<RoomChangeRequestListDto>> GetRequestsByStayAsync(Guid stayId)
    {
        var requests = await roomChangeRequestRepository.GetAll()
            .Include(r => r.Stay)
            .Include(r => r.FromRoom)
            .Include(r => r.ToRoom)
            .Where(r => r.StayId == stayId)
            .OrderByDescending(r => r.RequestedAt)
            .ToListAsync();

        return requests.Select(MapToListDto).ToList();
    }

    private async Task<StayRoom> GetActiveStayRoomAsync(Guid stayId, Guid? stayRoomId)
    {
        var query = stayRoomRepository.GetAll()
            .Where(sr => sr.StayId == stayId && sr.ReleasedAt == null);

        if (stayRoomId.HasValue)
        {
            query = query.Where(sr => sr.Id == stayRoomId.Value);
        }

        var activeStayRoom = await query
            .OrderByDescending(sr => sr.AssignedAt)
            .FirstOrDefaultAsync();

        if (activeStayRoom == null)
            throw new UserFriendlyException(L("ActiveRoomAssignmentNotFound"));

        return activeStayRoom;
    }

    private async Task ValidateRoomAvailabilityAsync(RoomChangeRequest request, Guid toRoomId)
    {
        var room = await roomRepository.GetAsync(toRoomId);

        if (room.OperationalStatus == RoomOperationalStatus.Occupied)
            throw new UserFriendlyException(L("TargetRoomIsOccupied"));

        if (room.OperationalStatus == RoomOperationalStatus.OutOfOrder)
            throw new UserFriendlyException(L("TargetRoomIsOutOfOrder"));

        if (room.OperationalStatus == RoomOperationalStatus.OutOfService)
            throw new UserFriendlyException(L("TargetRoomIsOutOfService"));

        var hasActiveStay = await stayRoomRepository.GetAll()
            .AnyAsync(sr => sr.RoomId == toRoomId &&
                           sr.ReleasedAt == null &&
                           (sr.Stay.Status == StayStatus.CheckedIn || sr.Stay.Status == StayStatus.InHouse));

        if (hasActiveStay)
            throw new UserFriendlyException(L("TargetRoomHasActiveStay"));

        var today = Clock.Now.Date;
        var departureDate = request.Stay.ExpectedCheckOutDateTime.Date;

        var blockingStatuses = new[]
        {
            ReservationStatus.Pending,
            ReservationStatus.Confirmed,
        };

        var hasBlockingReservation = await reservationRoomRepository.GetAll()
            .AnyAsync(rr => rr.RoomId == toRoomId &&
                           rr.ArrivalDate < departureDate &&
                           rr.DepartureDate > today &&
                           blockingStatuses.Contains(rr.Reservation.Status));

        if (hasBlockingReservation)
            throw new UserFriendlyException(L("TargetRoomHasBlockingReservation"));
    }

    private static string BuildTransferReason(RoomChangeRequest request)
    {
        var source = request.Source switch
        {
            RoomChangeSource.GuestRequest => "Guest Request",
            RoomChangeSource.Internal => "Internal",
            RoomChangeSource.Maintenance => "Maintenance",
            RoomChangeSource.Upgrade => "Upgrade",
            RoomChangeSource.Downgrade => "Downgrade",
            _ => "Other"
        };

        var reason = request.Reason switch
        {
            RoomChangeReason.GuestPreference => "Guest Preference",
            RoomChangeReason.RoomIssue => "Room Issue",
            RoomChangeReason.Maintenance => "Maintenance",
            RoomChangeReason.Noise => "Noise",
            RoomChangeReason.ViewChange => "View Change",
            RoomChangeReason.Accessibility => "Accessibility",
            RoomChangeReason.FamilyReunion => "Family Reunion",
            RoomChangeReason.Upgrade => "Upgrade",
            RoomChangeReason.Downgrade => "Downgrade",
            RoomChangeReason.Overbooking => "Overbooking",
            _ => "Other"
        };

        var result = $"[{source}] {reason}";
        if (!string.IsNullOrWhiteSpace(request.ReasonDetails))
        {
            result += $": {request.ReasonDetails}";
        }

        return result.Length > 512 ? result[..512] : result;
    }

    private static RoomChangeRequestDto MapToDto(RoomChangeRequest request)
    {
        return new RoomChangeRequestDto
        {
            Id = request.Id,
            StayId = request.StayId,
            StayNo = request.Stay?.StayNo ?? string.Empty,
            GuestName = request.Stay?.GuestName ?? string.Empty,
            Source = request.Source,
            Reason = request.Reason,
            ReasonDetails = request.ReasonDetails,
            FromRoomNumber = request.FromRoom?.RoomNumber ?? string.Empty,
            FromRoomTypeName = request.FromRoomType?.Name ?? string.Empty,
            ToRoomNumber = request.ToRoom?.RoomNumber ?? string.Empty,
            ToRoomTypeName = request.ToRoomType?.Name ?? string.Empty,
            PreferredRoomTypeName = request.PreferredRoomType?.Name ?? string.Empty,
            Status = request.Status,
            RequestedAt = request.RequestedAt,
            RequestedBy = request.RequestedBy,
            ApprovedAt = request.ApprovedAt,
            ApprovedBy = request.ApprovedBy,
            CompletedAt = request.CompletedAt,
            CompletedBy = request.CompletedBy
        };
    }

    private static RoomChangeRequestListDto MapToListDto(RoomChangeRequest request)
    {
        return new RoomChangeRequestListDto
        {
            Id = request.Id,
            StayNo = request.Stay?.StayNo ?? string.Empty,
            GuestName = request.Stay?.GuestName ?? string.Empty,
            Source = request.Source,
            Reason = request.Reason,
            FromRoomNumber = request.FromRoom?.RoomNumber ?? string.Empty,
            ToRoomNumber = request.ToRoom?.RoomNumber ?? string.Empty,
            Status = request.Status,
            RequestedAt = request.RequestedAt
        };
    }
}
