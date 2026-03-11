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
using PMS.Authorization;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Dynamic.Core;
using System.Threading.Tasks;

namespace PMS.App.Stays;

public interface IStayAppService : IApplicationService
{
    Task<StayDto> GetAsync(Guid stayId);
    Task<List<GuestRequestListDto>> GetGuestRequestsAsync(Guid stayId);
    Task<GuestRequestCompletionContextDto> GetGuestRequestCompletionContextAsync(Guid guestRequestId);
    Task<PagedResultDto<StayListDto>> GetInHouseAsync(GetStaysInput input);
    Task TransferRoomAsync(TransferRoomDto input);
    Task ExtendStayAsync(ExtendStayDto input);
    Task<Guid> AddGuestRequestAsync(AddGuestRequestDto input);
    Task CompleteGuestRequestAsync(CompleteGuestRequestDto input);
    Task<Guid> AddIncidentAsync(AddIncidentDto input);

    // Folio operations
    Task<FolioDto> GetFolioAsync(Guid stayId);
    Task<Guid> PostChargeAsync(PostChargeDto input);
    Task<Guid> PostPaymentAsync(PostPaymentDto input);
    Task<Guid> PostRefundAsync(PostRefundDto input);
    Task VoidTransactionAsync(VoidTransactionDto input);
    Task<FolioSummaryDto> GetFolioSummaryAsync(Guid stayId);
}

[AbpAuthorize(PermissionNames.Pages_Stays)]
public class StayAppService(
    IRepository<Stay, Guid> stayRepository,
    IRepository<Folio, Guid> folioRepository,
    IRepository<FolioTransaction, Guid> folioTransactionRepository,
    IRepository<FolioPayment, Guid> folioPaymentRepository,
    IRepository<Room, Guid> roomRepository,
    IRepository<StayRoom, Guid> stayRoomRepository,
    IRepository<RoomTransfer, Guid> roomTransferRepository,
    IRepository<StayExtension, Guid> stayExtensionRepository,
    IRepository<GuestRequest, Guid> guestRequestRepository,
    IRepository<Incident, Guid> incidentRepository,
    IRepository<ChargeType, Guid> chargeTypeRepository,
    IRepository<HousekeepingTask, Guid> housekeepingTaskRepository
) : PMSAppServiceBase, IStayAppService
{
    public async Task<StayDto> GetAsync(Guid stayId)
    {
        var stay = await stayRepository.GetAll()
            .Include(s => s.Guest)
            .Include(s => s.AssignedRoom).ThenInclude(r => r.RoomType)
            .Include(s => s.Guests).ThenInclude(sg => sg.Guest)
            .FirstOrDefaultAsync(s => s.Id == stayId);

        if (stay == null) throw new UserFriendlyException(L("StayNotFound"));
        return ObjectMapper.Map<StayDto>(stay);
    }

    public async Task<PagedResultDto<StayListDto>> GetInHouseAsync(GetStaysInput input)
    {
        var query = stayRepository.GetAll()
            .Include(s => s.Guest)
            .Include(s => s.AssignedRoom)
            .Where(s => s.Status == StayStatus.InHouse || s.Status == StayStatus.CheckedIn)
            .WhereIf(!string.IsNullOrWhiteSpace(input.Filter),
                s => s.StayNo.Contains(input.Filter) ||
                     s.GuestName.Contains(input.Filter) ||
                     s.RoomNumber.Contains(input.Filter));

        var total = await query.CountAsync();
        var items = await query.OrderBy(input.Sorting ?? "CheckInDateTime desc").PageBy(input).ToListAsync();
        return new PagedResultDto<StayListDto>(total, ObjectMapper.Map<System.Collections.Generic.List<StayListDto>>(items));
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
            .FirstOrDefaultAsync();

        if (activeStayRoom == null)
            throw new UserFriendlyException("Active room assignment not found for stay.");

        if (activeStayRoom.RoomId == input.ToRoomId)
            throw new UserFriendlyException(L("CannotTransferToSameRoom"));

        var newRoom = await roomRepository.GetAsync(input.ToRoomId);
        if (newRoom.OperationalStatus == RoomOperationalStatus.Occupied)
            throw new UserFriendlyException(L("TargetRoomIsOccupied"));

        // Release old room
        activeStayRoom.ReleasedAt = Clock.Now;
        await stayRoomRepository.UpdateAsync(activeStayRoom);

        // Update old room status
        var oldRoom = await roomRepository.GetAsync(activeStayRoom.RoomId);
        oldRoom.OperationalStatus = RoomOperationalStatus.Vacant;
        oldRoom.HousekeepingStatus = HousekeepingStatus.Dirty;
        await roomRepository.UpdateAsync(oldRoom);

        // Assign new room
        await stayRoomRepository.InsertAsync(new StayRoom { StayId = input.StayId, RoomId = input.ToRoomId, AssignedAt = Clock.Now });
        newRoom.OperationalStatus = RoomOperationalStatus.Occupied;
        await roomRepository.UpdateAsync(newRoom);

        // Log transfer
        await roomTransferRepository.InsertAsync(new RoomTransfer
        {
            StayId = input.StayId,
            FromRoomId = activeStayRoom.RoomId,
            ToRoomId = input.ToRoomId,
            TransferDate = Clock.Now,
            Reason = input.Reason ?? string.Empty
        });

        stay.RoomNumber = newRoom.RoomNumber;
        await stayRepository.UpdateAsync(stay);

        Logger.Info($"Room transfer: Stay {stay.StayNo} from Room {oldRoom.RoomNumber} to {newRoom.RoomNumber}.");
    }

    [AbpAuthorize(PermissionNames.Pages_Stays_Extend)]
    [UnitOfWork]
    public async Task ExtendStayAsync(ExtendStayDto input)
    {
        var stay = await stayRepository.GetAsync(input.StayId);

        if (stay.Status != StayStatus.InHouse && stay.Status != StayStatus.CheckedIn)
            throw new UserFriendlyException(L("CannotExtendNonActiveStay"));

        if (input.NewDepartureDate.Date <= stay.ExpectedCheckOutDateTime.Date)
            throw new UserFriendlyException(L("NewDepartureDateMustBeAfterCurrent"));

        await stayExtensionRepository.InsertAsync(new StayExtension
        {
            StayId = input.StayId,
            OldDepartureDate = stay.ExpectedCheckOutDateTime,
            NewDepartureDate = input.NewDepartureDate.Date.AddHours(12),
            ApprovedBy = input.ApprovedBy ?? string.Empty,
            Reason = input.Reason ?? string.Empty
        });

        stay.ExpectedCheckOutDateTime = input.NewDepartureDate.Date.AddHours(12);
        await stayRepository.UpdateAsync(stay);
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

        return txId;
    }

    [AbpAuthorize(PermissionNames.Pages_Stays_VoidTransaction)]
    [UnitOfWork]
    public async Task VoidTransactionAsync(VoidTransactionDto input)
    {
        var folio = await GetOpenFolioOrThrowAsync(input.StayId);

        if (!string.IsNullOrWhiteSpace(input.TransactionId.ToString()))
        {
            var tx = await folioTransactionRepository.GetAsync(input.TransactionId);
            if (tx.FolioId != folio.Id) throw new UserFriendlyException(L("TransactionNotFound"));
            if (tx.IsVoided) throw new UserFriendlyException(L("TransactionAlreadyVoided"));

            tx.IsVoided = true;
            tx.VoidReason = input.Reason;
            await folioTransactionRepository.UpdateAsync(tx);

            folio.Balance -= tx.NetAmount;
            UpdateFolioStatus(folio);
            await folioRepository.UpdateAsync(folio);
        }
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
    public async Task<Guid> AddIncidentAsync(AddIncidentDto input)
    {
        return await incidentRepository.InsertAndGetIdAsync(new Incident
        {
            StayId = input.StayId,
            Description = input.Description,
            ReportedAt = Clock.Now
        });
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
        if (folio.Status == FolioStatus.Voided || folio.Status == FolioStatus.WrittenOff) return;

        if (folio.Balance <= 0)
            folio.Status = FolioStatus.Settled;
        else if (folio.Balance < folio.Transactions.Where(t => !t.IsDeleted && !t.IsVoided).Sum(t => t.NetAmount))
            folio.Status = FolioStatus.PartiallyPaid;
        else
            folio.Status = FolioStatus.Open;
    }
}
