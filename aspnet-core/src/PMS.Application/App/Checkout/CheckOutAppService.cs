using Abp.Application.Services;
using Abp.Application.Services.Dto;
using Abp.Authorization;
using Abp.Domain.Repositories;
using Abp.Domain.Uow;
using Abp.Timing;
using Abp.UI;
using Microsoft.EntityFrameworkCore;
using PMS.App.Checkout.Dto;
using PMS.Application.App.Services;
using PMS.Authorization;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace PMS.App.Checkout;

public interface ICheckOutAppService : IApplicationService
{
    Task<CheckOutStatementDto> GetStatementAsync(Guid stayId);
    Task<CheckOutResultDto> ProcessCheckOutAsync(ProcessCheckOutDto input);
    Task WriteOffBalanceAsync(WriteOffBalanceDto input);
    Task<ReceiptDto> GetReceiptAsync(Guid receiptId);
    Task<ReceiptDto> GetLatestReceiptByStayAsync(Guid stayId);
}

[AbpAuthorize(PermissionNames.Pages_CheckOut)]
public class CheckOutAppService(
    IRepository<Stay, Guid> stayRepository,
    IRepository<Folio, Guid> folioRepository,
    IRepository<FolioTransaction, Guid> folioTransactionRepository,
    IRepository<FolioPayment, Guid> folioPaymentRepository,
    IRepository<CheckOutRecord, Guid> checkOutRecordRepository,
    IRepository<Receipt, Guid> receiptRepository,
    IRepository<ReceiptPayment, Guid> receiptPaymentRepository,
    IRepository<Room, Guid> roomRepository,
    IRepository<StayRoom, Guid> stayRoomRepository,
    IRepository<HousekeepingLog, Guid> housekeepingLogRepository,
    IDocumentNumberService documentNumberService
) : PMSAppServiceBase, ICheckOutAppService
{
    public async Task<CheckOutStatementDto> GetStatementAsync(Guid stayId)
    {
        var stay = await stayRepository.GetAll()
            .Include(s => s.Guest)
            .Include(s => s.AssignedRoom)
            .FirstOrDefaultAsync(s => s.Id == stayId);

        if (stay == null) throw new UserFriendlyException(L("StayNotFound"));

        var folio = await folioRepository.GetAll()
            .Include(f => f.Transactions).ThenInclude(t => t.ChargeType)
            .Include(f => f.Payments).ThenInclude(p => p.PaymentMethod)
            .FirstOrDefaultAsync(f => f.StayId == stayId);

        if (folio == null) throw new UserFriendlyException(L("FolioNotFound"));

        var activeTransactions = folio.Transactions
            .Where(t => !t.IsDeleted && !t.IsVoided)
            .ToList();

        var activePayments = folio.Payments
            .Where(p => !p.IsDeleted && !p.IsVoided)
            .ToList();

        var stayRooms = await stayRoomRepository.GetAll()
            .Include(sr => sr.Room)
            .Where(sr => sr.StayId == stayId)
            .OrderBy(sr => sr.AssignedAt)
            .ToListAsync();

        var totalCharges = activeTransactions
            .Where(t => t.TransactionType == FolioTransactionType.Charge)
            .Sum(t => t.NetAmount);

        var totalDiscounts = activeTransactions
            .Where(t => t.TransactionType == FolioTransactionType.Discount)
            .Sum(t => t.Amount);

        var totalPayments = activePayments.Sum(p => p.Amount);
        var balance = totalCharges - totalDiscounts - totalPayments;

        return new CheckOutStatementDto
        {
            StayId = stayId,
            StayNo = stay.StayNo,
            GuestName = stay.GuestName,
            RoomNumber = stay.RoomNumber,
            CheckInDateTime = stay.CheckInDateTime,
            ExpectedCheckOutDateTime = stay.ExpectedCheckOutDateTime,
            FolioId = folio.Id,
            FolioNo = folio.FolioNo,
            FolioStatus = folio.Status,
            TotalCharges = totalCharges,
            TotalDiscounts = totalDiscounts,
            TotalPayments = totalPayments,
            BalanceDue = balance < 0 ? 0 : balance,
            OverPayment = balance < 0 ? Math.Abs(balance) : 0,
            StayRooms = stayRooms.Select(sr => new StayRoomRecordDto
            {
                StayRoomId = sr.Id,
                RoomId = sr.RoomId,
                RoomNumber = sr.Room != null ? sr.Room.RoomNumber : string.Empty,
                AssignedAt = sr.AssignedAt,
                ReleasedAt = sr.ReleasedAt
            }).ToList(),
            Transactions = activeTransactions.Select(t => new StatementLineDto
            {
                Date = t.TransactionDate,
                Description = t.Description,
                ChargeTypeName = t.ChargeType?.Name,
                Type = t.TransactionType.ToString(),
                Amount = t.NetAmount
            }).ToList(),
            Payments = activePayments.Select(p => new StatementPaymentDto
            {
                Date = p.PaidDate,
                PaymentMethodName = p.PaymentMethod?.Name,
                Amount = p.Amount,
                ReferenceNo = p.ReferenceNo
            }).ToList()
        };
    }

    [AbpAuthorize(PermissionNames.Pages_CheckOut_Process)]
    [UnitOfWork]
    public async Task<CheckOutResultDto> ProcessCheckOutAsync(ProcessCheckOutDto input)
    {
        var stay = await stayRepository.GetAll()
            .Include(s => s.AssignedRoom)
            .FirstOrDefaultAsync(s => s.Id == input.StayId);

        if (stay == null) throw new UserFriendlyException(L("StayNotFound"));

        if (stay.Status == StayStatus.CheckedOut)
            throw new UserFriendlyException(L("StayAlreadyCheckedOut"));

        if (stay.Status != StayStatus.InHouse && stay.Status != StayStatus.CheckedIn)
            throw new UserFriendlyException(L("StayNotInHouse"));

        var folio = await folioRepository.GetAll()
            .Include(f => f.Transactions)
            .Include(f => f.Payments)
            .FirstOrDefaultAsync(f => f.StayId == input.StayId);

        if (folio == null) throw new UserFriendlyException(L("FolioNotFound"));

        // Post each settlement payment
        decimal totalNewPayments = 0;
        foreach (var payment in input.Payments)
        {
            if (payment.Amount <= 0) throw new UserFriendlyException(L("PaymentAmountMustBePositive"));

            await folioPaymentRepository.InsertAsync(new FolioPayment
            {
                FolioId = folio.Id,
                PaymentMethodId = payment.PaymentMethodId,
                Amount = payment.Amount,
                PaidDate = Clock.Now,
                ReferenceNo = payment.ReferenceNo ?? string.Empty,
                Notes = "Checkout settlement"
            });
            totalNewPayments += payment.Amount;
        }

        // Recalculate totals
        var allTransactions = folio.Transactions.Where(t => !t.IsDeleted && !t.IsVoided).ToList();
        var allPayments = folio.Payments.Where(p => !p.IsDeleted && !p.IsVoided).ToList();

        var totalCharges = allTransactions.Where(t => t.TransactionType == FolioTransactionType.Charge).Sum(t => t.NetAmount);
        var totalDiscounts = allTransactions.Where(t => t.TransactionType == FolioTransactionType.Discount).Sum(t => t.Amount);
        var totalPayments = allPayments.Sum(p => p.Amount) + totalNewPayments;
        var balanceDue = totalCharges - totalDiscounts - totalPayments;

        // Enforce no unpaid balance unless write-off path is used
        if (balanceDue > 0)
            throw new UserFriendlyException(L("CannotCheckOutWithUnpaidBalance"));

        // Close folio
        folio.Balance = balanceDue;
        folio.Status = FolioStatus.Settled;
        await folioRepository.UpdateAsync(folio);

        // Create checkout record
        await checkOutRecordRepository.InsertAsync(new CheckOutRecord
        {
            StayId = input.StayId,
            CheckOutDateTime = Clock.Now,
            TotalCharges = totalCharges,
            TotalPayments = totalPayments,
            TotalDiscounts = totalDiscounts,
            BalanceDue = balanceDue < 0 ? 0 : balanceDue,
            SettledAmount = totalPayments
        });

        // Generate receipt
        var receiptNo = await documentNumberService.GenerateNextDocumentNumberAsync("RECEIPT", "RCT-");
        var receipt = new Receipt
        {
            ReceiptNo = receiptNo,
            StayId = input.StayId,
            Amount = totalPayments,
            IssuedDate = Clock.Now
        };
        var receiptId = await receiptRepository.InsertAndGetIdAsync(receipt);

        foreach (var p in input.Payments)
        {
            await receiptPaymentRepository.InsertAsync(new ReceiptPayment
            {
                ReceiptId = receiptId,
                PaymentMethodId = p.PaymentMethodId,
                Amount = p.Amount
            });
        }

        // Release all active stay rooms and return each room to VacantDirty.
        var activeStayRooms = await stayRoomRepository.GetAll()
            .Include(sr => sr.Room)
            .Where(sr => sr.StayId == input.StayId && sr.ReleasedAt == null)
            .ToListAsync();

        foreach (var activeStayRoom in activeStayRooms)
        {
            activeStayRoom.ReleasedAt = Clock.Now;
            await stayRoomRepository.UpdateAsync(activeStayRoom);

            if (activeStayRoom.Room != null)
            {
                var oldStatus = activeStayRoom.Room.HousekeepingStatus;
                activeStayRoom.Room.OperationalStatus = RoomOperationalStatus.Vacant;
                activeStayRoom.Room.HousekeepingStatus = HousekeepingStatus.Dirty;
                await roomRepository.UpdateAsync(activeStayRoom.Room);

                await housekeepingLogRepository.InsertAsync(new HousekeepingLog
                {
                    RoomId = activeStayRoom.Room.Id,
                    OldStatus = oldStatus,
                    NewStatus = HousekeepingStatus.Dirty,
                    StaffId = null,
                    Remarks = "System (Checkout)",
                });
            }
        }

        // Mark stay complete
        stay.Status = StayStatus.CheckedOut;
        stay.ActualCheckOutDateTime = Clock.Now;
        await stayRepository.UpdateAsync(stay);

        Logger.Info($"Check-out completed: Stay {stay.StayNo}, Receipt {receiptNo}.");

        return new CheckOutResultDto
        {
            StayId = stay.Id,
            StayNo = stay.StayNo,
            ReceiptId = receiptId,
            ReceiptNo = receiptNo,
            TotalCharged = totalCharges,
            TotalPaid = totalPayments,
            BalanceDue = balanceDue < 0 ? 0 : balanceDue
        };
    }

    [AbpAuthorize(PermissionNames.Pages_CheckOut_WriteOff)]
    [UnitOfWork]
    public async Task WriteOffBalanceAsync(WriteOffBalanceDto input)
    {
        var folio = await folioRepository.GetAll()
            .FirstOrDefaultAsync(f => f.StayId == input.StayId);

        if (folio == null) throw new UserFriendlyException(L("FolioNotFound"));
        if (folio.Status == FolioStatus.Settled || folio.Status == FolioStatus.WrittenOff)
            throw new UserFriendlyException(L("FolioAlreadyClosedOrWrittenOff"));

        // Post write-off as adjusting transaction
        await folioTransactionRepository.InsertAsync(new FolioTransaction
        {
            FolioId = folio.Id,
            TransactionDate = Clock.Now,
            TransactionType = FolioTransactionType.Adjustment,
            Description = $"Write-off: {input.Reason}",
            Quantity = 1,
            UnitPrice = folio.Balance,
            Amount = folio.Balance,
            NetAmount = folio.Balance,
            IsVoided = false
        });

        folio.Balance = 0;
        folio.Status = FolioStatus.WrittenOff;
        await folioRepository.UpdateAsync(folio);

        Logger.Warn($"Folio {folio.FolioNo} written off. Reason: {input.Reason}.");
    }

    [AbpAuthorize(PermissionNames.Pages_CheckOut_Print)]
    public async Task<ReceiptDto> GetReceiptAsync(Guid receiptId)
    {
        var receipt = await receiptRepository.GetAll()
            .Include(r => r.Stay)
            .ThenInclude(s => s.AssignedRoom)
            .Include(r => r.Payments)
            .ThenInclude(p => p.PaymentMethod)
            .FirstOrDefaultAsync(r => r.Id == receiptId);

        if (receipt == null) throw new UserFriendlyException(L("ReceiptNotFound"));

        return new ReceiptDto
        {
            Id = receipt.Id,
            ReceiptNo = receipt.ReceiptNo,
            StayId = receipt.StayId,
            StayNo = receipt.Stay?.StayNo,
            GuestName = receipt.Stay?.GuestName,
            RoomNumber = receipt.Stay?.RoomNumber,
            IssuedDate = receipt.IssuedDate,
            Amount = receipt.Amount,
            Payments = receipt.Payments
                .Select(p => new ReceiptPaymentDto
                {
                    PaymentMethodId = p.PaymentMethodId,
                    PaymentMethodName = p.PaymentMethod != null ? p.PaymentMethod.Name : string.Empty,
                    Amount = p.Amount
                }).ToList()
        };
    }

    [AbpAuthorize(PermissionNames.Pages_CheckOut_Print)]
    public async Task<ReceiptDto> GetLatestReceiptByStayAsync(Guid stayId)
    {
        var receipt = await receiptRepository.GetAll()
            .Where(r => r.StayId == stayId)
            .OrderByDescending(r => r.IssuedDate)
            .FirstOrDefaultAsync();

        if (receipt == null) throw new UserFriendlyException(L("ReceiptNotFound"));
        return await GetReceiptAsync(receipt.Id);
    }
}
