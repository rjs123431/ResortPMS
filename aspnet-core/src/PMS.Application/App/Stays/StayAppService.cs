using Abp.Application.Services;
using Abp.Application.Services.Dto;
using Abp.Authorization;
using Abp.Domain.Repositories;
using Abp.Domain.Uow;
using Abp.Linq.Extensions;
using Abp.Timing;
using Abp.UI;
using Microsoft.EntityFrameworkCore;
using PMS.App.Stays.Dto;
using PMS.Application.App.RoomDailyInventory;
using PMS.Auditing;
using PMS.Authorization;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Dynamic.Core;
using System.Threading.Tasks;

namespace PMS.App.Stays;

public interface IStayAppService : IApplicationService
{
    Task<List<GuestRequestListDto>> GetGuestRequestsAsync(Guid stayId);
    Task<GuestRequestCompletionContextDto> GetGuestRequestCompletionContextAsync(Guid guestRequestId);
    Task<PagedResultDto<StayListDto>> GetInHouseAsync(GetStaysInput input);
    Task<PagedResultDto<StayListDto>> GetInHouseWithRoomsAsync(GetInHouseWithRoomsInput input);
    Task TransferRoomAsync(TransferRoomDto input);
    Task<Guid> AddGuestRequestAsync(AddGuestRequestDto input);
    Task CompleteGuestRequestAsync(CompleteGuestRequestDto input);

    // Folio operations
    Task<FolioDto> GetFolioAsync(Guid stayId);
    Task<Guid> PostChargeAsync(PostChargeDto input);
    Task<Guid> PostPaymentAsync(PostPaymentDto input);
    Task<Guid> PostRefundAsync(PostRefundDto input);
    Task<FolioSummaryDto> GetFolioSummaryAsync(Guid stayId);
    Task SettleFolioAsync(SettleFolioDto input);
}

[AbpAuthorize(PermissionNames.Pages_Stays)]
public class StayAppService(
    IRepository<Stay, Guid> stayRepository,
    IRepository<Folio, Guid> folioRepository,
    IRepository<FolioTransaction, Guid> folioTransactionRepository,
    IRepository<FolioPayment, Guid> folioPaymentRepository,
    IRepository<Room, Guid> roomRepository,
    IRepository<StayRoom, Guid> stayRoomRepository,
    IRepository<StayRoomTransfer, Guid> stayRoomTransferRepository,
    IRepository<RoomChangeRequest, Guid> roomChangeRequestRepository,
    IRepository<GuestRequest, Guid> guestRequestRepository,
    IRepository<ChargeType, Guid> chargeTypeRepository,
    IRepository<HousekeepingTask, Guid> housekeepingTaskRepository,
    IRepository<ReservationRoom, Guid> reservationRoomRepository,
    IRoomDailyInventoryService roomDailyInventoryService,
    IFinancialAuditService financialAuditService
) : PMSAppServiceBase, IStayAppService
{
    private static List<StayRoomDto> MapStayRooms(IEnumerable<StayRoom> rooms)
    {
        if (rooms == null) return [];
        return rooms
            .Select(sr => new StayRoomDto
            {
                Id = sr.Id,
                StayId = sr.StayId,
                RoomId = sr.RoomId,
                RoomNumber = sr.Room?.RoomNumber ?? string.Empty,
                RoomTypeId = sr.RoomTypeId,
                RoomTypeName = sr.RoomType?.Name ?? sr.Room?.RoomType?.Name ?? string.Empty,
                AssignedAt = sr.AssignedAt,
                ReleasedAt = sr.ReleasedAt,
                ArrivalDate = sr.ArrivalDate,
                DepartureDate = sr.DepartureDate,
            })
            .ToList();
    }

    public async Task<PagedResultDto<StayListDto>> GetInHouseAsync(GetStaysInput input)
    {
        var query = stayRepository.GetAll()
            .Include(s => s.Guest)
            .Include(s => s.AssignedRoom)
            .Include(s => s.Rooms).ThenInclude(sr => sr.Room)
            .Include(s => s.Rooms).ThenInclude(sr => sr.RoomType)
            .Where(s => s.Status == StayStatus.InHouse || s.Status == StayStatus.CheckedIn)
            .WhereIf(!string.IsNullOrWhiteSpace(input.Filter),
                s => s.StayNo.Contains(input.Filter) ||
                     s.GuestName.Contains(input.Filter) ||
                     (s.Rooms != null && s.Rooms.Any(sr => sr.Room != null && sr.Room.RoomNumber.Contains(input.Filter))));

        var total = await query.CountAsync();
        var items = await query.OrderBy(input.Sorting ?? "CheckInDateTime desc").PageBy(input).ToListAsync();
        var dtos = items.Select(stay =>
        {
            var dto = ObjectMapper.Map<StayListDto>(stay);
            if (stay.Rooms != null && stay.Rooms.Count > 0)
            {
                dto.RoomNumber = string.Join(",", stay.Rooms.Select(sr => sr.Room?.RoomNumber ?? string.Empty).Where(n => !string.IsNullOrEmpty(n)));
                dto.StayRooms = MapStayRooms(stay.Rooms);
            }
            return dto;
        }).ToList();
        return new PagedResultDto<StayListDto>(total, dtos);
    }

    public async Task<PagedResultDto<StayListDto>> GetInHouseWithRoomsAsync(GetInHouseWithRoomsInput input)
    {
        var query = stayRepository.GetAll()
            .Include(s => s.Guest)
            .Include(s => s.Rooms).ThenInclude(sr => sr.Room)
            .Include(s => s.Rooms).ThenInclude(sr => sr.RoomType)
            .Where(s => s.Status == StayStatus.InHouse || s.Status == StayStatus.CheckedIn)
            .WhereIf(!string.IsNullOrWhiteSpace(input.Filter),
                s => s.StayNo.Contains(input.Filter) ||
                     s.GuestName.Contains(input.Filter) ||
                     (s.Rooms != null && s.Rooms.Any(sr => sr.Room != null && sr.Room.RoomNumber.Contains(input.Filter))))
            .WhereIf(input.RoomDateFrom.HasValue && input.RoomDateTo.HasValue,
                s => s.Rooms.Any(sr =>
                    sr.AssignedAt < input.RoomDateTo.Value.Date &&
                    (sr.ReleasedAt ?? s.ExpectedCheckOutDateTime).Date >= input.RoomDateFrom.Value.Date))
            .WhereIf(input.RoomIds != null && input.RoomIds.Count > 0,
                s => s.Rooms.Any(sr => input.RoomIds.Contains(sr.RoomId)));

        var total = await query.CountAsync();
        var items = await query.OrderBy(input.Sorting ?? "CheckInDateTime desc").PageBy(input).ToListAsync();
        var dtos = items.Select(stay =>
        {
            var dto = ObjectMapper.Map<StayListDto>(stay);
            if (stay.Rooms != null && stay.Rooms.Count > 0)
            {
                dto.RoomNumber = string.Join(",", stay.Rooms.Select(sr => sr.Room?.RoomNumber ?? string.Empty).Where(n => !string.IsNullOrEmpty(n)));
                dto.StayRooms = MapStayRooms(stay.Rooms);
            }
            return dto;
        }).ToList();
        return new PagedResultDto<StayListDto>(total, dtos);
    }

    public async Task<List<GuestRequestListDto>> GetGuestRequestsAsync(Guid stayId)
    {
        var exists = await stayRepository.GetAll().AnyAsync(s => s.Id == stayId);
        if (!exists) throw new UserFriendlyException(L("StayNotFound"));

        var requests = await guestRequestRepository.GetAll()
            .Where(gr => gr.StayId == stayId)
            .OrderByDescending(gr => gr.RequestedAt)
            .Select(gr => new GuestRequestListDto
            {
                Id = gr.Id,
                RequestTypes = gr.RequestTypes,
                Description = gr.Description,
                Status = gr.Status,
                RequestedAt = gr.RequestedAt,
                CompletedAt = gr.CompletedAt,
            })
            .ToListAsync();

        return requests;
    }

    public async Task<GuestRequestCompletionContextDto> GetGuestRequestCompletionContextAsync(Guid guestRequestId)
    {
        var request = await guestRequestRepository.GetAll()
            .FirstOrDefaultAsync(gr => gr.Id == guestRequestId);

        if (request == null)
            throw new UserFriendlyException("Guest request not found.");

        var relatedTasks = await housekeepingTaskRepository.GetAll()
            .Include(t => t.Room)
            .Where(t => t.GuestRequestId == guestRequestId)
            .OrderByDescending(t => t.TaskDate)
            .Select(t => new GuestRequestTaskStatusDto
            {
                TaskId = t.Id,
                RoomNumber = t.Room.RoomNumber,
                TaskType = t.TaskType,
                Status = t.Status,
                TaskDate = t.TaskDate,
                StartedAt = t.StartedAt,
                CompletedAt = t.CompletedAt,
                Remarks = t.Remarks,
            })
            .ToListAsync();

        return new GuestRequestCompletionContextDto
        {
            GuestRequestId = request.Id,
            StayId = request.StayId,
            RequestTypes = request.RequestTypes,
            Description = request.Description,
            Status = request.Status,
            RequestedAt = request.RequestedAt,
            CompletedAt = request.CompletedAt,
            RelatedTasks = relatedTasks,
        };
    }

    /// <summary>
    /// Quick room transfer (backward compatible). 
    /// For the full workflow with request tracking, use IRoomChangeService.
    /// </summary>
    [AbpAuthorize(PermissionNames.Pages_Stays_Transfer)]
    [UnitOfWork]
    public async Task TransferRoomAsync(TransferRoomDto input)
    {
        var stay = await stayRepository.GetAsync(input.StayId);

        if (stay.Status != StayStatus.InHouse && stay.Status != StayStatus.CheckedIn)
            throw new UserFriendlyException(L("CannotTransferRoomForNonActiveStay"));

        var activeStayRoom = await stayRoomRepository.GetAll()
            .Where(sr => sr.StayId == input.StayId && sr.ReleasedAt == null)
            .OrderByDescending(sr => sr.AssignedAt)
            .FirstOrDefaultAsync()
            ?? throw new UserFriendlyException(L("ActiveRoomAssignmentNotFound"));

        if (activeStayRoom.RoomId == input.ToRoomId)
            throw new UserFriendlyException(L("CannotTransferToSameRoom"));

        var toRoom = await roomRepository.GetAsync(input.ToRoomId);
        var fromRoom = await roomRepository.GetAsync(activeStayRoom.RoomId);

        // Validate target room availability
        await ValidateTargetRoomForTransferAsync(stay, input.ToRoomId);

        // Close old StayRoom
        var releaseNow = Clock.Now;
        activeStayRoom.ReleasedAt = releaseNow;
        activeStayRoom.DepartureDate = releaseNow.Date;
        await stayRoomRepository.UpdateAsync(activeStayRoom);

        var assignNow = Clock.Now;
        // Create new StayRoom (preserve original assignment)
        var newStayRoom = new StayRoom
        {
            StayId = input.StayId,
            RoomTypeId = toRoom.RoomTypeId,
            RoomId = input.ToRoomId,
            AssignedAt = assignNow,
            ArrivalDate = assignNow.Date,
            DepartureDate = stay.ExpectedCheckOutDateTime.Date,
            OriginalRoomTypeId = activeStayRoom.OriginalRoomTypeId != Guid.Empty 
                ? activeStayRoom.OriginalRoomTypeId 
                : activeStayRoom.RoomTypeId,
            OriginalRoomId = activeStayRoom.OriginalRoomId != Guid.Empty 
                ? activeStayRoom.OriginalRoomId 
                : activeStayRoom.RoomId
        };
        var newStayRoomId = await stayRoomRepository.InsertAndGetIdAsync(newStayRoom);

        // Update room statuses (occupancy is tracked via RoomDailyInventory)
        fromRoom.HousekeepingStatus = HousekeepingStatus.Dirty;
        await roomRepository.UpdateAsync(fromRoom);

        await roomRepository.UpdateAsync(toRoom);

        var transferEnd = stay.ExpectedCheckOutDateTime.Date.AddDays(1);
        await roomDailyInventoryService.SetVacantAsync(activeStayRoom.RoomId, releaseNow.Date, transferEnd);
        await roomDailyInventoryService.SetInHouseAsync(input.ToRoomId, assignNow.Date, transferEnd, stay.Id);

        // Log transfer
        await stayRoomTransferRepository.InsertAsync(new StayRoomTransfer
        {
            StayRoomId = newStayRoomId,
            FromRoomTypeId = activeStayRoom.RoomTypeId,
            FromRoomId = activeStayRoom.RoomId,
            ToRoomTypeId = toRoom.RoomTypeId,
            ToRoomId = input.ToRoomId,
            TransferredAt = Clock.Now,
            Reason = input.Reason ?? string.Empty
        });

        // Update stay snapshot
        await stayRepository.UpdateAsync(stay);

        // Create RoomChangeRequest for audit trail (with all fields set upfront)
        var now = Clock.Now;
        var userId = AbpSession.UserId?.ToString() ?? "System";
        await roomChangeRequestRepository.InsertAsync(new RoomChangeRequest
        {
            StayId = input.StayId,
            StayRoomId = newStayRoomId,
            Source = RoomChangeSource.Internal,
            Reason = RoomChangeReason.Other,
            ReasonDetails = input.Reason ?? string.Empty,
            FromRoomTypeId = activeStayRoom.RoomTypeId,
            FromRoomId = activeStayRoom.RoomId,
            ToRoomTypeId = toRoom.RoomTypeId,
            ToRoomId = input.ToRoomId,
            Status = RoomChangeRequestStatus.Completed,
            RequestedAt = now,
            RequestedBy = userId,
            ApprovedAt = now,
            ApprovedBy = userId,
            CompletedAt = now,
            CompletedBy = userId
        });

        Logger.Info($"Room transfer: Stay {stay.StayNo} from Room {fromRoom.RoomNumber} to {toRoom.RoomNumber}.");
    }

    private async Task ValidateTargetRoomForTransferAsync(Stay stay, Guid toRoomId)
    {
        var room = await roomRepository.GetAsync(toRoomId);

        if (room.HousekeepingStatus == HousekeepingStatus.Dirty)
            throw new UserFriendlyException(L("TargetRoomIsDirty"));

        if (room.HousekeepingStatus == HousekeepingStatus.Pickup)
            throw new UserFriendlyException(L("TargetRoomNeedsCleaning"));

        var hasActiveStay = await stayRoomRepository.GetAll()
            .AnyAsync(sr => sr.RoomId == toRoomId &&
                           sr.ReleasedAt == null &&
                           (sr.Stay.Status == StayStatus.CheckedIn || sr.Stay.Status == StayStatus.InHouse));

        if (hasActiveStay)
            throw new UserFriendlyException(L("TargetRoomHasActiveStay"));

        var today = Clock.Now.Date;
        var departureDate = stay.ExpectedCheckOutDateTime.Date;

        await roomDailyInventoryService.Ensure365DaysFromTodayAsync([toRoomId]);
        var available = await roomDailyInventoryService.IsRoomAvailableForDatesAsync(toRoomId, today, departureDate);
        if (!available)
            throw new UserFriendlyException(L("RoomIsNotAvailableForStayDates"));

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

    [AbpAuthorize(PermissionNames.Pages_Stays_PostCharge)]
    [UnitOfWork]
    public async Task<Guid> PostChargeAsync(PostChargeDto input)
    {
        var folio = await GetOpenFolioOrThrowAsync(input.StayId);

        var chargeType = await chargeTypeRepository.FirstOrDefaultAsync(input.ChargeTypeId);
        if (chargeType == null) throw new UserFriendlyException(L("ChargeTypeNotFound"));

        var netAmount = (input.Amount * input.Quantity) + input.TaxAmount - input.DiscountAmount;

        var transaction = new FolioTransaction
        {
            FolioId = folio.Id,
            TransactionDate = Clock.Now,
            TransactionType = FolioTransactionType.Charge,
            ChargeTypeId = input.ChargeTypeId,
            Description = input.Description ?? chargeType.Name,
            Quantity = input.Quantity,
            UnitPrice = input.Amount,
            Amount = input.Amount * input.Quantity,
            TaxAmount = input.TaxAmount,
            DiscountAmount = input.DiscountAmount,
            NetAmount = netAmount
        };

        var txId = await folioTransactionRepository.InsertAndGetIdAsync(transaction);

        folio.Balance += netAmount;
        UpdateFolioStatus(folio);
        await folioRepository.UpdateAsync(folio);

        await financialAuditService.RecordTransactionCreatedAsync(
            txId, folio.Id, folio.StayId, netAmount, transaction.Description ?? string.Empty, null);

        return txId;
    }

    [AbpAuthorize(PermissionNames.Pages_Stays_PostPayment)]
    [UnitOfWork]
    public async Task<Guid> PostPaymentAsync(PostPaymentDto input)
    {
        var folio = await GetOpenFolioOrThrowAsync(input.StayId);

        if (input.Amount <= 0) throw new UserFriendlyException(L("PaymentAmountMustBePositive"));

        var payment = new FolioPayment
        {
            FolioId = folio.Id,
            PaymentMethodId = input.PaymentMethodId,
            Amount = input.Amount,
            PaidDate = Clock.Now,
            ReferenceNo = input.ReferenceNo ?? string.Empty,
            Notes = input.Notes ?? string.Empty
        };

        var payId = await folioPaymentRepository.InsertAndGetIdAsync(payment);

        folio.Balance -= input.Amount;
        UpdateFolioStatus(folio);
        await folioRepository.UpdateAsync(folio);

        await financialAuditService.RecordPaymentCreatedAsync(
            payId, folio.Id, folio.StayId, payment.Amount, payment.Notes ?? string.Empty, null);

        return payId;
    }

    [AbpAuthorize(PermissionNames.Pages_Stays_PostPayment)]
    [UnitOfWork]
    public async Task<Guid> PostRefundAsync(PostRefundDto input)
    {
        var folio = await folioRepository.GetAll()
            .Include(f => f.Transactions)
            .FirstOrDefaultAsync(f => f.StayId == input.StayId);

        if (folio == null) throw new UserFriendlyException(L("FolioNotFound"));

        if (folio.Status == FolioStatus.Voided || folio.Status == FolioStatus.WrittenOff)
            throw new UserFriendlyException("Cannot post refund to a closed folio.");

        if (input.Amount <= 0)
            throw new UserFriendlyException(L("PaymentAmountMustBePositive"));

        if (folio.Balance >= 0)
            throw new UserFriendlyException("Refund is allowed only when folio has overpayment.");

        var maxRefund = Math.Abs(folio.Balance);
        if (input.Amount > maxRefund)
            throw new UserFriendlyException("Refund amount cannot exceed current overpayment.");

        var activeTransactions = folio.Transactions.Where(t => !t.IsDeleted && !t.IsVoided).ToList();
        var hasDepositPayment = activeTransactions.Any(t => t.TransactionType == FolioTransactionType.DepositPayment);
        var hasDepositRefund = activeTransactions.Any(t => t.TransactionType == FolioTransactionType.DepositRefund);

        var refundType = hasDepositPayment ? FolioTransactionType.DepositRefund : FolioTransactionType.Refund;

        if (refundType == FolioTransactionType.Refund && hasDepositRefund)
            throw new UserFriendlyException("Cannot process Refund when a DepositRefund transaction already exists.");

        var transaction = new FolioTransaction
        {
            FolioId = folio.Id,
            TransactionDate = Clock.Now,
            TransactionType = refundType,
            Description = string.IsNullOrWhiteSpace(input.Description)
                ? (refundType == FolioTransactionType.DepositRefund ? "Deposit refund" : "Refund")
                : input.Description,
            Quantity = 1,
            UnitPrice = input.Amount,
            Amount = input.Amount,
            TaxAmount = 0,
            DiscountAmount = 0,
            NetAmount = input.Amount,
            IsVoided = false
        };

        var txId = await folioTransactionRepository.InsertAndGetIdAsync(transaction);

        // A refund increases folio balance towards zero from a negative overpayment state.
        folio.Balance += input.Amount;
        UpdateFolioStatus(folio);
        await folioRepository.UpdateAsync(folio);

        await financialAuditService.RecordTransactionCreatedAsync(
            txId, folio.Id, folio.StayId, input.Amount, transaction.Description ?? string.Empty, new { RefundType = refundType.ToString() });

        return txId;
    }

    public async Task<FolioDto> GetFolioAsync(Guid stayId)
    {
        var folio = await folioRepository.GetAll()
            .Include(f => f.Transactions).ThenInclude(t => t.ChargeType)
            .Include(f => f.Payments).ThenInclude(p => p.PaymentMethod)
            .FirstOrDefaultAsync(f => f.StayId == stayId);

        if (folio == null) throw new UserFriendlyException(L("FolioNotFound"));
        return ObjectMapper.Map<FolioDto>(folio);
    }

    public async Task<FolioSummaryDto> GetFolioSummaryAsync(Guid stayId)
    {
        var folio = await folioRepository.GetAll()
            .Include(f => f.Transactions)
            .Include(f => f.Payments)
            .FirstOrDefaultAsync(f => f.StayId == stayId);

        if (folio == null) throw new UserFriendlyException(L("FolioNotFound"));

        var charges = folio.Transactions.Where(t => !t.IsDeleted && !t.IsVoided && t.TransactionType == FolioTransactionType.Charge).Sum(t => t.NetAmount);
        var discounts = folio.Transactions.Where(t => !t.IsDeleted && !t.IsVoided && t.TransactionType == FolioTransactionType.Discount).Sum(t => t.Amount);
        var payments = folio.Payments.Where(p => !p.IsDeleted && !p.IsVoided).Sum(p => p.Amount);

        return new FolioSummaryDto
        {
            FolioId = folio.Id,
            FolioNo = folio.FolioNo,
            Status = folio.Status,
            TotalCharges = charges,
            TotalDiscounts = discounts,
            TotalPayments = payments,
            Balance = folio.Balance
        };
    }

    [UnitOfWork]
    public async Task<Guid> AddGuestRequestAsync(AddGuestRequestDto input)
    {
        var stay = await stayRepository.GetAsync(input.StayId);
        if (stay.Status != StayStatus.InHouse && stay.Status != StayStatus.CheckedIn) throw new UserFriendlyException(L("StayNotInHouse"));

        var selectedTypes = input.RequestTypes
            .Where(t => t != GuestRequestType.None)
            .Distinct()
            .ToList();

        if (selectedTypes.Count == 0)
            throw new UserFriendlyException("At least one request type is required.");

        var requestFlags = selectedTypes.Aggregate(GuestRequestType.None, (current, next) => current | next);

        var requestId = await guestRequestRepository.InsertAndGetIdAsync(new GuestRequest
        {
            StayId = input.StayId,
            RequestTypes = requestFlags,
            Description = input.Description,
            RequestedAt = Clock.Now
        });

        await CreateHousekeepingTasksForGuestRequestAsync(stay.Id, requestId, selectedTypes, input.Description);

        return requestId;
    }

    [UnitOfWork]
    public async Task CompleteGuestRequestAsync(CompleteGuestRequestDto input)
    {
        var request = await guestRequestRepository.FirstOrDefaultAsync(input.GuestRequestId);
        if (request == null)
            throw new UserFriendlyException("Guest request not found.");

        if (string.Equals(request.Status, "Completed", StringComparison.OrdinalIgnoreCase))
            throw new UserFriendlyException("Guest request is already completed.");

        var hasIncompleteRelatedTasks = await housekeepingTaskRepository.GetAll()
            .AnyAsync(t => t.GuestRequestId == input.GuestRequestId && t.Status != HousekeepingTaskStatus.Completed);

        if (hasIncompleteRelatedTasks)
            throw new UserFriendlyException("Cannot complete guest request while related housekeeping tasks are not completed.");

        request.Status = "Completed";
        request.CompletedAt = Clock.Now;

        if (!string.IsNullOrWhiteSpace(input.Remarks))
        {
            request.Description = string.IsNullOrWhiteSpace(request.Description)
                ? input.Remarks.Trim()
                : $"{request.Description} | Completion: {input.Remarks.Trim()}";
        }

        await guestRequestRepository.UpdateAsync(request);
    }

    private async Task CreateHousekeepingTasksForGuestRequestAsync(Guid stayId, Guid guestRequestId, List<GuestRequestType> selectedTypes, string? description)
    {
        var taskTypes = selectedTypes
            .Select(MapGuestRequestTypeToHousekeepingTaskType)
            .Where(taskType => taskType.HasValue)
            .Select(taskType => taskType!.Value)
            .Distinct()
            .ToList();

        if (taskTypes.Count == 0)
            return;

        var activeStayRoom = await stayRoomRepository.GetAll()
            .Where(sr => sr.StayId == stayId && sr.ReleasedAt == null)
            .OrderByDescending(sr => sr.AssignedAt)
            .FirstOrDefaultAsync();

        if (activeStayRoom == null)
            throw new UserFriendlyException("Active room assignment not found for stay.");

        var today = Clock.Now.Date;

        foreach (var taskType in taskTypes)
        {
            await housekeepingTaskRepository.InsertAsync(new HousekeepingTask
            {
                RoomId = activeStayRoom.RoomId,
                GuestRequestId = guestRequestId,
                TaskType = taskType,
                Status = HousekeepingTaskStatus.Pending,
                TaskDate = today,
                Remarks = description ?? string.Empty,
            });
        }
    }

    private static HousekeepingTaskType? MapGuestRequestTypeToHousekeepingTaskType(GuestRequestType requestType)
    {
        return requestType switch
        {
            GuestRequestType.PickupCleaning => HousekeepingTaskType.PickupCleaning,
            GuestRequestType.StayoverCleaning => HousekeepingTaskType.StayoverCleaning,
            _ => null,
        };
    }

    [UnitOfWork]
    public async Task SettleFolioAsync(SettleFolioDto input)
    {
        var folio = await folioRepository.GetAll()
            .FirstOrDefaultAsync(f => f.StayId == input.StayId);

        if (folio == null) throw new UserFriendlyException(L("FolioNotFound"));

        if (folio.Status == FolioStatus.Settled)
            throw new UserFriendlyException(L("FolioAlreadySettled"));

        if (folio.Status == FolioStatus.Voided || folio.Status == FolioStatus.WrittenOff)
            throw new UserFriendlyException(L("FolioIsAlreadyClosed"));

        if (Math.Abs(folio.Balance) > 0.005m)
            throw new UserFriendlyException(L("FolioBalanceMustBeZeroToSettle"));

        folio.Status = FolioStatus.Settled;
        await folioRepository.UpdateAsync(folio);
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    private async Task<Folio> GetOpenFolioOrThrowAsync(Guid stayId)
    {
        var folio = await folioRepository.GetAll()
            .FirstOrDefaultAsync(f => f.StayId == stayId);

        if (folio == null) throw new UserFriendlyException(L("FolioNotFound"));

        if (folio.Status == FolioStatus.Settled || folio.Status == FolioStatus.Voided)
            throw new UserFriendlyException(L("FolioIsAlreadyClosed"));

        return folio;
    }

    private static void UpdateFolioStatus(Folio folio)
    {
        if (folio.Status == FolioStatus.Voided || folio.Status == FolioStatus.WrittenOff || folio.Status == FolioStatus.Settled) return;

        var totalCharges = folio.Transactions.Where(t => !t.IsDeleted && !t.IsVoided).Sum(t => t.NetAmount);
        if (folio.Balance < totalCharges)
            folio.Status = FolioStatus.PartiallyPaid;
        else
            folio.Status = FolioStatus.Open;
    }
}
