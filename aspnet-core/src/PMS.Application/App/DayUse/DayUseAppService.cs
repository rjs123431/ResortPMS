using Abp.Application.Services;
using Abp.Application.Services.Dto;
using Abp.Authorization;
using Abp.Domain.Repositories;
using Abp.Domain.Uow;
using Abp.Linq.Extensions;
using Abp.Timing;
using Abp.UI;
using Microsoft.EntityFrameworkCore;
using PMS.App.DayUse.Dto;
using PMS.Application.App.Services;
using PMS.Authorization;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Dynamic.Core;
using System.Threading.Tasks;

namespace PMS.App.DayUse;

public interface IDayUseAppService : IApplicationService
{
    Task<PagedResultDto<DayUseVisitListDto>> GetAllAsync(GetDayUseVisitsInput input);
    Task<DayUseVisitDto> GetAsync(Guid id);
    Task<PagedResultDto<DayUseOfferListDto>> GetOffersAsync(GetDayUseOffersInput input);
    Task<List<DayUseOfferListDto>> GetActiveOffersAsync(DayUseOfferAvailabilityInput input);
    Task<Guid> CreateOfferAsync(CreateDayUseOfferDto input);
    Task UpdateOfferAsync(UpdateDayUseOfferDto input);
    Task<DayUseSaleResultDto> CreateSaleAsync(CreateDayUseSaleDto input);
}

[AbpAuthorize(PermissionNames.Pages_DayUse)]
public class DayUseAppService(
    IRepository<DayUseVisit, Guid> dayUseVisitRepository,
    IRepository<DayUseVisitLine, Guid> dayUseVisitLineRepository,
    IRepository<DayUsePayment, Guid> dayUsePaymentRepository,
    IRepository<DayUseOffer, Guid> dayUseOfferRepository,
    IRepository<Guest, Guid> guestRepository,
    IRepository<Stay, Guid> stayRepository,
    IRepository<Folio, Guid> folioRepository,
    IRepository<FolioTransaction, Guid> folioTransactionRepository,
    IRepository<ChargeType, Guid> chargeTypeRepository,
    IRepository<PaymentMethod, Guid> paymentMethodRepository,
    IDocumentNumberService documentNumberService
) : PMSAppServiceBase, IDayUseAppService
{
    public async Task<PagedResultDto<DayUseVisitListDto>> GetAllAsync(GetDayUseVisitsInput input)
    {
        var query = dayUseVisitRepository.GetAll()
            .WhereIf(!string.IsNullOrWhiteSpace(input.Filter), x => x.VisitNo.Contains(input.Filter) || x.GuestName.Contains(input.Filter))
            .WhereIf(input.GuestContext.HasValue, x => x.GuestContext == input.GuestContext.Value)
            .WhereIf(input.Status.HasValue, x => x.Status == input.Status.Value)
            .WhereIf(input.VisitDate.HasValue, x => x.VisitDate == input.VisitDate.Value.Date);

        var totalCount = await query.CountAsync();
        var items = await query.OrderBy(input.Sorting ?? "VisitDate desc, VisitNo desc").PageBy(input).ToListAsync();

        return new PagedResultDto<DayUseVisitListDto>(totalCount, items.Select(MapVisitListDto).ToList());
    }

    public async Task<DayUseVisitDto> GetAsync(Guid id)
    {
        var visit = await dayUseVisitRepository.GetAll()
            .Include(x => x.Lines)
            .Include(x => x.Payments)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (visit == null)
            throw new UserFriendlyException("Day use visit not found.");

        var chargeTypeIds = visit.Lines.Select(x => x.ChargeTypeId).Distinct().ToList();
        var paymentMethodIds = visit.Payments.Select(x => x.PaymentMethodId).Distinct().ToList();
        var chargeTypeNames = await chargeTypeRepository.GetAll()
            .Where(x => chargeTypeIds.Contains(x.Id))
            .ToDictionaryAsync(x => x.Id, x => x.Name);
        var paymentMethodNames = await paymentMethodRepository.GetAll()
            .Where(x => paymentMethodIds.Contains(x.Id))
            .ToDictionaryAsync(x => x.Id, x => x.Name);

        return MapVisitDto(visit, chargeTypeNames, paymentMethodNames);
    }

    public async Task<PagedResultDto<DayUseOfferListDto>> GetOffersAsync(GetDayUseOffersInput input)
    {
        var query = dayUseOfferRepository.GetAll()
            .Include(x => x.ChargeType)
            .WhereIf(!string.IsNullOrWhiteSpace(input.Filter), x => x.Name.Contains(input.Filter) || x.Code.Contains(input.Filter) || x.VariantName.Contains(input.Filter))
            .WhereIf(input.GuestContext.HasValue, x => x.GuestContext == input.GuestContext.Value)
            .WhereIf(input.OfferType.HasValue, x => x.OfferType == input.OfferType.Value)
            .WhereIf(input.IsActive.HasValue, x => x.IsActive == input.IsActive.Value);

        var totalCount = await query.CountAsync();
        var items = await query.OrderBy(input.Sorting ?? "SortOrder asc, Name asc").PageBy(input).ToListAsync();

        return new PagedResultDto<DayUseOfferListDto>(totalCount, items.Select(MapOfferListDto).ToList());
    }

    public async Task<List<DayUseOfferListDto>> GetActiveOffersAsync(DayUseOfferAvailabilityInput input)
    {
        var items = await dayUseOfferRepository.GetAll()
            .Include(x => x.ChargeType)
            .Where(x => x.IsActive)
            .WhereIf(input.GuestContext.HasValue, x => x.GuestContext == input.GuestContext.Value)
            .WhereIf(input.OfferType.HasValue, x => x.OfferType == input.OfferType.Value)
            .OrderBy(x => x.SortOrder)
            .ThenBy(x => x.Name)
            .ThenBy(x => x.VariantName)
            .ToListAsync();

        return items.Select(MapOfferListDto).ToList();
    }

    [UnitOfWork]
    public async Task<Guid> CreateOfferAsync(CreateDayUseOfferDto input)
    {
        await ValidateOfferInputAsync(input.Code, input.ChargeTypeId, input.IdOrDefault());

        var offer = new DayUseOffer
        {
            Code = input.Code.Trim().ToUpperInvariant(),
            Name = input.Name.Trim(),
            VariantName = input.VariantName?.Trim() ?? string.Empty,
            Description = input.Description?.Trim() ?? string.Empty,
            OfferType = input.OfferType,
            GuestContext = input.GuestContext,
            GuestCategory = input.GuestCategory,
            DurationMinutes = input.DurationMinutes,
            ChargeTypeId = input.ChargeTypeId,
            Amount = input.Amount,
            SortOrder = input.SortOrder,
            IsActive = true,
        };

        return await dayUseOfferRepository.InsertAndGetIdAsync(offer);
    }

    [UnitOfWork]
    public async Task UpdateOfferAsync(UpdateDayUseOfferDto input)
    {
        var offer = await dayUseOfferRepository.FirstOrDefaultAsync(input.Id);
        if (offer == null)
            throw new UserFriendlyException("Day use offer not found.");

        await ValidateOfferInputAsync(input.Code, input.ChargeTypeId, input.Id);

        offer.Code = input.Code.Trim().ToUpperInvariant();
        offer.Name = input.Name.Trim();
        offer.VariantName = input.VariantName?.Trim() ?? string.Empty;
        offer.Description = input.Description?.Trim() ?? string.Empty;
        offer.OfferType = input.OfferType;
        offer.GuestContext = input.GuestContext;
        offer.GuestCategory = input.GuestCategory;
        offer.DurationMinutes = input.DurationMinutes;
        offer.ChargeTypeId = input.ChargeTypeId;
        offer.Amount = input.Amount;
        offer.SortOrder = input.SortOrder;
        offer.IsActive = input.IsActive;

        await dayUseOfferRepository.UpdateAsync(offer);
    }

    [UnitOfWork]
    public async Task<DayUseSaleResultDto> CreateSaleAsync(CreateDayUseSaleDto input)
    {
        if (input.Lines == null || input.Lines.Count == 0)
            throw new UserFriendlyException("Select at least one day use item.");

        if (input.AccessEndTime <= input.AccessStartTime)
            throw new UserFriendlyException("Access end time must be later than the access start time.");

        var guest = await guestRepository.FirstOrDefaultAsync(input.GuestId);
        if (guest == null)
            throw new UserFriendlyException("Guest not found.");

        Stay? stay = null;
        Folio? folio = null;
        if (input.GuestContext == DayUseGuestContext.InHouse)
        {
            if (!input.StayId.HasValue)
                throw new UserFriendlyException("An active stay is required for in-house day use charges.");

            stay = await stayRepository.FirstOrDefaultAsync(input.StayId.Value);
            if (stay == null)
                throw new UserFriendlyException("Stay not found.");

            folio = await folioRepository.GetAll()
                .Include(x => x.Transactions)
                .FirstOrDefaultAsync(x => x.StayId == stay.Id);

            if (folio == null)
                throw new UserFriendlyException("Folio not found for the selected stay.");
        }

        var offerIds = input.Lines.Select(x => x.OfferId).Distinct().ToList();
        var offers = await dayUseOfferRepository.GetAll()
            .Include(x => x.ChargeType)
            .Where(x => offerIds.Contains(x.Id))
            .ToListAsync();

        if (offers.Count != offerIds.Count)
            throw new UserFriendlyException("One or more day use items are no longer available.");

        foreach (var offer in offers)
        {
            if (!offer.IsActive)
                throw new UserFriendlyException($"{offer.Name} is inactive.");

            if (offer.GuestContext != input.GuestContext)
                throw new UserFriendlyException($"{offer.Name} is not available for the selected guest context.");
        }

        var visitNo = await documentNumberService.GenerateNextDocumentNumberAsync("DAYUSE", "DU-");
        var lines = new List<DayUseVisitLine>();
        decimal totalAmount = 0;

        foreach (var requestedLine in input.Lines)
        {
            var offer = offers.First(x => x.Id == requestedLine.OfferId);
            var quantity = requestedLine.Quantity <= 0 ? 1 : requestedLine.Quantity;
            var amount = Math.Round(quantity * offer.Amount, 4);
            var description = string.IsNullOrWhiteSpace(requestedLine.Description)
                ? BuildOfferDescription(offer)
                : requestedLine.Description.Trim();

            lines.Add(new DayUseVisitLine
            {
                DayUseOfferId = offer.Id,
                ChargeTypeId = offer.ChargeTypeId,
                OfferType = offer.OfferType,
                GuestContext = offer.GuestContext,
                GuestCategory = offer.GuestCategory,
                OfferCode = offer.Code,
                OfferName = offer.Name,
                VariantName = offer.VariantName,
                Description = description,
                DurationMinutes = offer.DurationMinutes,
                Quantity = quantity,
                UnitPrice = offer.Amount,
                Amount = amount,
            });

            totalAmount += amount;
        }

        var directPayments = new List<DayUsePayment>();
        decimal paidAmount = 0;
        if (input.GuestContext == DayUseGuestContext.WalkIn)
        {
            foreach (var paymentInput in input.Payments ?? [])
            {
                if (paymentInput.Amount <= 0)
                    continue;

                var paymentMethod = await paymentMethodRepository.FirstOrDefaultAsync(paymentInput.PaymentMethodId);
                if (paymentMethod == null)
                    throw new UserFriendlyException("Payment method not found.");

                directPayments.Add(new DayUsePayment
                {
                    PaymentMethodId = paymentInput.PaymentMethodId,
                    Amount = paymentInput.Amount,
                    PaidAt = Clock.Now,
                    ReferenceNo = paymentInput.ReferenceNo?.Trim() ?? string.Empty,
                    Notes = paymentInput.Notes?.Trim() ?? string.Empty,
                });
                paidAmount += paymentInput.Amount;
            }
        }

        var balanceAmount = input.GuestContext == DayUseGuestContext.WalkIn
            ? Math.Max(0, totalAmount - paidAmount)
            : 0m;

        var visit = new DayUseVisit
        {
            VisitNo = visitNo,
            GuestId = guest.Id,
            GuestName = $"{guest.FirstName} {guest.LastName}".Trim(),
            StayId = input.StayId,
            RoomId = input.RoomId,
            VisitDate = input.VisitDate.Date,
            AccessStartTime = input.AccessStartTime,
            AccessEndTime = input.AccessEndTime,
            GuestContext = input.GuestContext,
            Remarks = input.Remarks?.Trim() ?? string.Empty,
            TotalAmount = totalAmount,
            PaidAmount = paidAmount,
            BalanceAmount = balanceAmount,
            Status = input.GuestContext == DayUseGuestContext.InHouse || balanceAmount <= 0 ? DayUseStatus.Completed : DayUseStatus.Open,
        };

        var visitId = await dayUseVisitRepository.InsertAndGetIdAsync(visit);
        await CurrentUnitOfWork.SaveChangesAsync();

        foreach (var line in lines)
        {
            line.DayUseVisitId = visitId;
            await dayUseVisitLineRepository.InsertAsync(line);

            if (input.GuestContext == DayUseGuestContext.InHouse && folio != null)
            {
                folio.Transactions ??= [];
                var transaction = new FolioTransaction
                {
                    FolioId = folio.Id,
                    TransactionDate = Clock.Now,
                    TransactionType = FolioTransactionType.Charge,
                    ChargeTypeId = line.ChargeTypeId,
                    Description = line.Description,
                    Quantity = line.Quantity,
                    UnitPrice = line.UnitPrice,
                    Amount = line.Amount,
                    TaxAmount = 0,
                    DiscountAmount = 0,
                    NetAmount = line.Amount,
                };

                await folioTransactionRepository.InsertAsync(transaction);
                folio.Transactions.Add(transaction);
                folio.Balance += line.Amount;
            }
        }

        foreach (var payment in directPayments)
        {
            payment.DayUseVisitId = visitId;
            await dayUsePaymentRepository.InsertAsync(payment);
        }

        if (folio != null)
        {
            UpdateFolioStatus(folio);
            await folioRepository.UpdateAsync(folio);
        }

        return new DayUseSaleResultDto
        {
            VisitId = visitId,
            VisitNo = visitNo,
            TotalAmount = totalAmount,
            PaidAmount = paidAmount,
            BalanceAmount = balanceAmount,
            PostedToFolio = input.GuestContext == DayUseGuestContext.InHouse,
        };
    }

    private async Task ValidateOfferInputAsync(string code, Guid chargeTypeId, Guid? currentId)
    {
        var normalizedCode = code?.Trim().ToUpperInvariant() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(normalizedCode))
            throw new UserFriendlyException("Code is required.");

        var codeExists = await dayUseOfferRepository.GetAll()
            .AnyAsync(x => x.Code == normalizedCode && x.Id != currentId);
        if (codeExists)
            throw new UserFriendlyException("Offer code already exists.");

        var chargeType = await chargeTypeRepository.FirstOrDefaultAsync(chargeTypeId);
        if (chargeType == null)
            throw new UserFriendlyException("Charge type not found.");
    }

    private static string BuildOfferDescription(DayUseOffer offer)
    {
        var parts = new List<string> { offer.Name };
        if (!string.IsNullOrWhiteSpace(offer.VariantName))
            parts.Add(offer.VariantName);
        if (offer.DurationMinutes.HasValue)
            parts.Add($"{offer.DurationMinutes.Value} mins");
        return string.Join(" - ", parts);
    }

    private static DayUseOfferListDto MapOfferListDto(DayUseOffer offer)
    {
        return new DayUseOfferListDto
        {
            Id = offer.Id,
            Code = offer.Code,
            Name = offer.Name,
            VariantName = offer.VariantName,
            Description = offer.Description,
            OfferType = offer.OfferType,
            GuestContext = offer.GuestContext,
            GuestCategory = offer.GuestCategory,
            DurationMinutes = offer.DurationMinutes,
            ChargeTypeId = offer.ChargeTypeId,
            ChargeTypeName = offer.ChargeType?.Name ?? string.Empty,
            Amount = offer.Amount,
            SortOrder = offer.SortOrder,
            IsActive = offer.IsActive,
        };
    }

    private static DayUseVisitListDto MapVisitListDto(DayUseVisit visit)
    {
        return new DayUseVisitListDto
        {
            Id = visit.Id,
            VisitNo = visit.VisitNo,
            GuestName = visit.GuestName,
            VisitDate = visit.VisitDate,
            GuestContext = visit.GuestContext,
            Status = visit.Status,
            TotalAmount = visit.TotalAmount,
            PaidAmount = visit.PaidAmount,
            BalanceAmount = visit.BalanceAmount,
        };
    }

    private static DayUseVisitDto MapVisitDto(
        DayUseVisit visit,
        IReadOnlyDictionary<Guid, string> chargeTypeNames,
        IReadOnlyDictionary<Guid, string> paymentMethodNames)
    {
        return new DayUseVisitDto
        {
            Id = visit.Id,
            VisitNo = visit.VisitNo,
            GuestId = visit.GuestId,
            GuestName = visit.GuestName,
            StayId = visit.StayId,
            RoomId = visit.RoomId,
            VisitDate = visit.VisitDate,
            AccessStartTime = visit.AccessStartTime,
            AccessEndTime = visit.AccessEndTime,
            GuestContext = visit.GuestContext,
            Status = visit.Status,
            Remarks = visit.Remarks,
            TotalAmount = visit.TotalAmount,
            PaidAmount = visit.PaidAmount,
            BalanceAmount = visit.BalanceAmount,
            Lines = visit.Lines.Select(line => new DayUseVisitLineDto
            {
                Id = line.Id,
                DayUseOfferId = line.DayUseOfferId,
                ChargeTypeId = line.ChargeTypeId,
                ChargeTypeName = chargeTypeNames.TryGetValue(line.ChargeTypeId, out var chargeTypeName) ? chargeTypeName : string.Empty,
                OfferType = line.OfferType,
                GuestContext = line.GuestContext,
                GuestCategory = line.GuestCategory,
                OfferCode = line.OfferCode,
                OfferName = line.OfferName,
                VariantName = line.VariantName,
                Description = line.Description,
                DurationMinutes = line.DurationMinutes,
                Quantity = line.Quantity,
                UnitPrice = line.UnitPrice,
                Amount = line.Amount,
            }).ToList(),
            Payments = visit.Payments.Select(payment => new DayUsePaymentDto
            {
                Id = payment.Id,
                PaymentMethodId = payment.PaymentMethodId,
                PaymentMethodName = paymentMethodNames.TryGetValue(payment.PaymentMethodId, out var paymentMethodName) ? paymentMethodName : string.Empty,
                Amount = payment.Amount,
                PaidAt = payment.PaidAt,
                ReferenceNo = payment.ReferenceNo,
                Notes = payment.Notes,
            }).ToList(),
        };
    }

    private static void UpdateFolioStatus(Folio folio)
    {
        if (folio.Status == FolioStatus.Voided || folio.Status == FolioStatus.WrittenOff || folio.Status == FolioStatus.Settled)
            return;

        var totalCharges = folio.Transactions?.Where(t => !t.IsDeleted && !t.IsVoided).Sum(t => t.NetAmount) ?? 0m;
        folio.Status = folio.Balance < totalCharges ? FolioStatus.PartiallyPaid : FolioStatus.Open;
    }
}

internal static class DayUseOfferDtoExtensions
{
    public static Guid? IdOrDefault(this CreateDayUseOfferDto _) => null;
}