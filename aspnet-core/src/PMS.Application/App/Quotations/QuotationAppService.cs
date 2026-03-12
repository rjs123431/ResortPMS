using Abp.Application.Services;
using Abp.Application.Services.Dto;
using Abp.Authorization;
using Abp.Domain.Repositories;
using Abp.Domain.Uow;
using Abp.Linq.Extensions;
using Abp.Timing;
using Abp.UI;
using Microsoft.EntityFrameworkCore;
using PMS.App.Quotations.Dto;
using PMS.Application.App.Services;
using PMS.Authorization;
using System;
using System.Linq;
using System.Linq.Dynamic.Core;
using System.Threading.Tasks;

namespace PMS.App.Quotations;

public interface IQuotationAppService : IApplicationService
{
    Task<QuotationDto> GetAsync(Guid id);
    Task<PagedResultDto<QuotationListDto>> GetAllAsync(GetQuotationsInput input);
    Task<Guid> CreateAsync(CreateQuotationDto input);
    Task<Guid> UpdateAsync(UpdateQuotationDto input);
    Task CancelAsync(Guid id);
    Task<QuotationDto> GetByNumberAsync(string quotationNo);
}

[AbpAuthorize(PermissionNames.Pages_Reservations)]
public class QuotationAppService(
    IRepository<Quotation, Guid> quotationRepository,
    IRepository<QuotationRoom, Guid> quotationRoomRepository,
    IRepository<QuotationExtraBed, Guid> quotationExtraBedRepository,
    IRepository<Guest, Guid> guestRepository,
    IRepository<RoomType, Guid> roomTypeRepository,
    IDocumentNumberService documentNumberService
) : PMSAppServiceBase, IQuotationAppService
{
    public async Task<QuotationDto> GetAsync(Guid id)
    {
        var quotation = await quotationRepository.GetAll()
            .Include(q => q.Rooms)
            .Include(q => q.ExtraBeds)
            .FirstOrDefaultAsync(q => q.Id == id);

        if (quotation == null)
            throw new UserFriendlyException(L("QuotationNotFound"));

        return ObjectMapper.Map<QuotationDto>(quotation);
    }

    public async Task<QuotationDto> GetByNumberAsync(string quotationNo)
    {
        var quotation = await quotationRepository.GetAll()
            .Include(q => q.Rooms)
            .Include(q => q.ExtraBeds)
            .FirstOrDefaultAsync(q => q.QuotationNo == quotationNo);

        if (quotation == null)
            throw new UserFriendlyException(L("QuotationNotFound"));

        return ObjectMapper.Map<QuotationDto>(quotation);
    }

    public async Task<PagedResultDto<QuotationListDto>> GetAllAsync(GetQuotationsInput input)
    {
        var query = quotationRepository.GetAll()
            .WhereIf(input.Status.HasValue, q => q.Status == input.Status.Value)
            .WhereIf(input.IncludeExpired != true, q => q.ExpiresAt == null || q.ExpiresAt > Clock.Now)
            .WhereIf(!string.IsNullOrWhiteSpace(input.Filter), q =>
                q.QuotationNo.Contains(input.Filter) ||
                q.GuestName.Contains(input.Filter));

        var total = await query.CountAsync();

        var items = await query
            .OrderBy(input.Sorting)
            .PageBy(input)
            .ToListAsync();

        return new PagedResultDto<QuotationListDto>(
            total,
            ObjectMapper.Map<System.Collections.Generic.List<QuotationListDto>>(items)
        );
    }

    [AbpAuthorize(PermissionNames.Pages_Reservations_Create)]
    [UnitOfWork]
    public async Task<Guid> CreateAsync(CreateQuotationDto input)
    {
        if (input.ArrivalDate.Date >= input.DepartureDate.Date)
            throw new UserFriendlyException(L("InvalidArrivalDepartureDate"));

        var quotationNo = await documentNumberService.GenerateNextDocumentNumberAsync("QUOTATION", "QUO-");
        var nights = (int)(input.DepartureDate.Date - input.ArrivalDate.Date).TotalDays;

        string guestName = input.GuestName ?? string.Empty;
        string firstName = input.FirstName ?? string.Empty;
        string lastName = input.LastName ?? string.Empty;
        string phone = input.Phone ?? string.Empty;
        string email = input.Email ?? string.Empty;

        if (input.GuestId.HasValue)
        {
            var guest = await guestRepository.FirstOrDefaultAsync(input.GuestId.Value);
            if (guest != null)
            {
                if (string.IsNullOrWhiteSpace(firstName)) firstName = guest.FirstName;
                if (string.IsNullOrWhiteSpace(lastName)) lastName = guest.LastName;
                if (string.IsNullOrWhiteSpace(phone)) phone = guest.Phone ?? string.Empty;
                if (string.IsNullOrWhiteSpace(email)) email = guest.Email ?? string.Empty;
                if (string.IsNullOrWhiteSpace(guestName)) guestName = $"{firstName} {lastName}".Trim();
            }
        }

        var quotation = new Quotation
        {
            QuotationNo = quotationNo,
            GuestId = input.GuestId,
            GuestName = guestName,
            FirstName = firstName,
            LastName = lastName,
            Phone = phone,
            Email = email,
            QuotationDate = Clock.Now,
            ArrivalDate = input.ArrivalDate.Date,
            DepartureDate = input.DepartureDate.Date,
            Nights = nights,
            Adults = input.Adults,
            Children = input.Children,
            Status = QuotationStatus.Active,
            TotalAmount = input.TotalAmount,
            Notes = input.Notes ?? string.Empty,
            SpecialRequests = input.SpecialRequests ?? string.Empty,
            ExpiresAt = Clock.Now.AddDays(7),
        };

        foreach (var room in input.Rooms)
        {
            var roomType = await roomTypeRepository.FirstOrDefaultAsync(room.RoomTypeId);
            var roomTypeName = room.RoomTypeName ?? roomType?.Name ?? string.Empty;

            quotation.Rooms.Add(new QuotationRoom
            {
                RoomTypeId = room.RoomTypeId,
                RoomId = room.RoomId,
                RoomTypeName = roomTypeName,
                RoomNumber = room.RoomNumber ?? string.Empty,
                RatePerNight = room.RatePerNight,
                NumberOfNights = room.NumberOfNights > 0 ? room.NumberOfNights : nights,
                Amount = room.Amount,
                SeniorCitizenCount = room.SeniorCitizenCount,
                SeniorCitizenDiscountAmount = room.SeniorCitizenDiscountAmount,
                NetAmount = room.NetAmount,
            });
        }

        foreach (var extraBed in input.ExtraBeds ?? [])
        {
            quotation.ExtraBeds.Add(new QuotationExtraBed
            {
                ExtraBedTypeId = extraBed.ExtraBedTypeId,
                ExtraBedTypeName = extraBed.ExtraBedTypeName ?? string.Empty,
                Quantity = extraBed.Quantity,
                RatePerNight = extraBed.RatePerNight,
                NumberOfNights = extraBed.NumberOfNights > 0 ? extraBed.NumberOfNights : nights,
                Amount = extraBed.Amount,
            });
        }

        await quotationRepository.InsertAsync(quotation);
        await CurrentUnitOfWork.SaveChangesAsync();

        return quotation.Id;
    }

    [AbpAuthorize(PermissionNames.Pages_Reservations_Edit)]
    [UnitOfWork]
    public async Task<Guid> UpdateAsync(UpdateQuotationDto input)
    {
        var quotation = await quotationRepository.GetAll()
            .Include(q => q.Rooms)
            .Include(q => q.ExtraBeds)
            .FirstOrDefaultAsync(q => q.Id == input.Id);

        if (quotation == null)
            throw new UserFriendlyException(L("QuotationNotFound"));

        if (quotation.Status == QuotationStatus.Converted || quotation.Status == QuotationStatus.Cancelled)
            throw new UserFriendlyException("Cannot update a converted or cancelled quotation.");

        if (input.ArrivalDate.Date >= input.DepartureDate.Date)
            throw new UserFriendlyException(L("InvalidArrivalDepartureDate"));

        var nights = (int)(input.DepartureDate.Date - input.ArrivalDate.Date).TotalDays;

        string guestName = input.GuestName ?? string.Empty;
        string firstName = input.FirstName ?? string.Empty;
        string lastName = input.LastName ?? string.Empty;
        string phone = input.Phone ?? string.Empty;
        string email = input.Email ?? string.Empty;

        if (input.GuestId.HasValue)
        {
            var guest = await guestRepository.FirstOrDefaultAsync(input.GuestId.Value);
            if (guest != null)
            {
                if (string.IsNullOrWhiteSpace(firstName)) firstName = guest.FirstName;
                if (string.IsNullOrWhiteSpace(lastName)) lastName = guest.LastName;
                if (string.IsNullOrWhiteSpace(phone)) phone = guest.Phone ?? string.Empty;
                if (string.IsNullOrWhiteSpace(email)) email = guest.Email ?? string.Empty;
                if (string.IsNullOrWhiteSpace(guestName)) guestName = $"{firstName} {lastName}".Trim();
            }
        }

        quotation.GuestId = input.GuestId;
        quotation.GuestName = guestName;
        quotation.FirstName = firstName;
        quotation.LastName = lastName;
        quotation.Phone = phone;
        quotation.Email = email;
        quotation.ArrivalDate = input.ArrivalDate.Date;
        quotation.DepartureDate = input.DepartureDate.Date;
        quotation.Nights = nights;
        quotation.Adults = input.Adults;
        quotation.Children = input.Children;
        quotation.TotalAmount = input.TotalAmount;
        quotation.Notes = input.Notes ?? string.Empty;
        quotation.SpecialRequests = input.SpecialRequests ?? string.Empty;

        foreach (var existingRoom in quotation.Rooms.ToList())
            await quotationRoomRepository.DeleteAsync(existingRoom);

        foreach (var existingExtraBed in quotation.ExtraBeds.ToList())
            await quotationExtraBedRepository.DeleteAsync(existingExtraBed);

        quotation.Rooms.Clear();
        quotation.ExtraBeds.Clear();

        foreach (var room in input.Rooms)
        {
            var roomType = await roomTypeRepository.FirstOrDefaultAsync(room.RoomTypeId);
            var roomTypeName = room.RoomTypeName ?? roomType?.Name ?? string.Empty;

            quotation.Rooms.Add(new QuotationRoom
            {
                QuotationId = quotation.Id,
                RoomTypeId = room.RoomTypeId,
                RoomId = room.RoomId,
                RoomTypeName = roomTypeName,
                RoomNumber = room.RoomNumber ?? string.Empty,
                RatePerNight = room.RatePerNight,
                NumberOfNights = room.NumberOfNights > 0 ? room.NumberOfNights : nights,
                Amount = room.Amount,
                SeniorCitizenCount = room.SeniorCitizenCount,
                SeniorCitizenDiscountAmount = room.SeniorCitizenDiscountAmount,
                NetAmount = room.NetAmount,
            });
        }

        foreach (var extraBed in input.ExtraBeds ?? [])
        {
            quotation.ExtraBeds.Add(new QuotationExtraBed
            {
                QuotationId = quotation.Id,
                ExtraBedTypeId = extraBed.ExtraBedTypeId,
                ExtraBedTypeName = extraBed.ExtraBedTypeName ?? string.Empty,
                Quantity = extraBed.Quantity,
                RatePerNight = extraBed.RatePerNight,
                NumberOfNights = extraBed.NumberOfNights > 0 ? extraBed.NumberOfNights : nights,
                Amount = extraBed.Amount,
            });
        }

        await CurrentUnitOfWork.SaveChangesAsync();
        return quotation.Id;
    }

    [AbpAuthorize(PermissionNames.Pages_Reservations_Edit)]
    [UnitOfWork]
    public async Task CancelAsync(Guid id)
    {
        var quotation = await quotationRepository.FirstOrDefaultAsync(id);
        if (quotation == null)
            throw new UserFriendlyException(L("QuotationNotFound"));

        if (quotation.Status == QuotationStatus.Converted)
            throw new UserFriendlyException("Cannot cancel a converted quotation.");

        quotation.Status = QuotationStatus.Cancelled;
        await CurrentUnitOfWork.SaveChangesAsync();
    }
}
