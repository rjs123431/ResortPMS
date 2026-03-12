using Abp.Application.Services;
using Abp.Application.Services.Dto;
using Abp.Authorization;
using Abp.Domain.Repositories;
using Abp.Domain.Uow;
using Abp.Linq.Extensions;
using Abp.Timing;
using Abp.UI;
using Microsoft.EntityFrameworkCore;
using PMS.App.PreCheckIns.Dto;
using PMS.Application.App.Services;
using PMS.Authorization;
using System;
using System.Linq;
using System.Linq.Dynamic.Core;
using System.Threading.Tasks;

namespace PMS.App.PreCheckIns;

public interface IPreCheckInAppService : IApplicationService
{
    Task<PreCheckInDto> GetAsync(Guid id);
    Task<PagedResultDto<PreCheckInListDto>> GetAllAsync(GetPreCheckInsInput input);
    Task<Guid> CreateAsync(CreatePreCheckInDto input);
    Task<Guid> UpdateAsync(UpdatePreCheckInDto input);
    Task CancelAsync(Guid id);
    Task<PreCheckInDto> GetByNumberAsync(string preCheckInNo);
    Task<PreCheckInDto> GetByReservationIdAsync(Guid reservationId);
    Task MarkReadyAsync(Guid id);
    Task MarkCheckedInAsync(Guid id);
}

[AbpAuthorize(PermissionNames.Pages_CheckIn)]
public class PreCheckInAppService(
    IRepository<PreCheckIn, Guid> preCheckInRepository,
    IRepository<PreCheckInRoom, Guid> preCheckInRoomRepository,
    IRepository<PreCheckInExtraBed, Guid> preCheckInExtraBedRepository,
    IRepository<Guest, Guid> guestRepository,
    IRepository<RoomType, Guid> roomTypeRepository,
    IRepository<Reservation, Guid> reservationRepository,
    IDocumentNumberService documentNumberService
) : PMSAppServiceBase, IPreCheckInAppService
{
    public async Task<PreCheckInDto> GetAsync(Guid id)
    {
        var preCheckIn = await preCheckInRepository.GetAll()
            .Include(p => p.Rooms)
            .Include(p => p.ExtraBeds)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (preCheckIn == null)
            throw new UserFriendlyException(L("PreCheckInNotFound"));

        return ObjectMapper.Map<PreCheckInDto>(preCheckIn);
    }

    public async Task<PreCheckInDto> GetByNumberAsync(string preCheckInNo)
    {
        var preCheckIn = await preCheckInRepository.GetAll()
            .Include(p => p.Rooms)
            .Include(p => p.ExtraBeds)
            .FirstOrDefaultAsync(p => p.PreCheckInNo == preCheckInNo);

        if (preCheckIn == null)
            throw new UserFriendlyException(L("PreCheckInNotFound"));

        return ObjectMapper.Map<PreCheckInDto>(preCheckIn);
    }

    public async Task<PreCheckInDto> GetByReservationIdAsync(Guid reservationId)
    {
        var preCheckIn = await preCheckInRepository.GetAll()
            .Include(p => p.Rooms)
            .Include(p => p.ExtraBeds)
            .Where(p => p.ReservationId == reservationId)
            .Where(p => p.Status == PreCheckInStatus.Pending || p.Status == PreCheckInStatus.ReadyForCheckIn)
            .OrderByDescending(p => p.CreationTime)
            .FirstOrDefaultAsync();

        if (preCheckIn == null)
            return null;

        return ObjectMapper.Map<PreCheckInDto>(preCheckIn);
    }

    public async Task<PagedResultDto<PreCheckInListDto>> GetAllAsync(GetPreCheckInsInput input)
    {
        var query = preCheckInRepository.GetAll()
            .WhereIf(input.Status.HasValue, p => p.Status == input.Status.Value)
            .WhereIf(input.IncludeExpired != true, p => p.ExpiresAt == null || p.ExpiresAt > Clock.Now)
            .WhereIf(input.WalkInOnly == true, p => p.ReservationId == null)
            .WhereIf(input.ReservationOnly == true, p => p.ReservationId != null)
            .WhereIf(input.ReservationId.HasValue, p => p.ReservationId == input.ReservationId.Value)
            .WhereIf(!string.IsNullOrWhiteSpace(input.Filter), p =>
                p.PreCheckInNo.Contains(input.Filter) ||
                p.GuestName.Contains(input.Filter));

        var total = await query.CountAsync();

        var items = await query
            .OrderBy(input.Sorting)
            .PageBy(input)
            .ToListAsync();

        return new PagedResultDto<PreCheckInListDto>(
            total,
            ObjectMapper.Map<System.Collections.Generic.List<PreCheckInListDto>>(items)
        );
    }

    [UnitOfWork]
    public async Task<Guid> CreateAsync(CreatePreCheckInDto input)
    {
        if (input.ArrivalDate.Date >= input.DepartureDate.Date)
            throw new UserFriendlyException(L("InvalidArrivalDepartureDate"));

        if (input.ReservationId.HasValue)
        {
            var reservation = await reservationRepository.FirstOrDefaultAsync(input.ReservationId.Value);
            if (reservation == null)
                throw new UserFriendlyException(L("ReservationNotFound"));
        }

        var preCheckInNo = await documentNumberService.GenerateNextDocumentNumberAsync("PRECHECKIN", "PCI-");
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

        var preCheckIn = new PreCheckIn
        {
            PreCheckInNo = preCheckInNo,
            ReservationId = input.ReservationId,
            GuestId = input.GuestId,
            GuestName = guestName,
            FirstName = firstName,
            LastName = lastName,
            Phone = phone,
            Email = email,
            PreCheckInDate = Clock.Now,
            ArrivalDate = input.ArrivalDate.Date,
            DepartureDate = input.DepartureDate.Date,
            Nights = nights,
            Adults = input.Adults,
            Children = input.Children,
            Status = PreCheckInStatus.Pending,
            TotalAmount = input.TotalAmount,
            Notes = input.Notes ?? string.Empty,
            SpecialRequests = input.SpecialRequests ?? string.Empty,
            ExpiresAt = Clock.Now.AddDays(7),
        };

        foreach (var room in input.Rooms)
        {
            var roomType = await roomTypeRepository.FirstOrDefaultAsync(room.RoomTypeId);
            var roomTypeName = room.RoomTypeName ?? roomType?.Name ?? string.Empty;

            preCheckIn.Rooms.Add(new PreCheckInRoom
            {
                ReservationRoomId = room.ReservationRoomId,
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
            preCheckIn.ExtraBeds.Add(new PreCheckInExtraBed
            {
                ExtraBedTypeId = extraBed.ExtraBedTypeId,
                ExtraBedTypeName = extraBed.ExtraBedTypeName ?? string.Empty,
                Quantity = extraBed.Quantity,
                RatePerNight = extraBed.RatePerNight,
                NumberOfNights = extraBed.NumberOfNights > 0 ? extraBed.NumberOfNights : nights,
                Amount = extraBed.Amount,
            });
        }

        await preCheckInRepository.InsertAsync(preCheckIn);
        await CurrentUnitOfWork.SaveChangesAsync();

        return preCheckIn.Id;
    }

    [UnitOfWork]
    public async Task<Guid> UpdateAsync(UpdatePreCheckInDto input)
    {
        var preCheckIn = await preCheckInRepository.GetAll()
            .Include(p => p.Rooms)
            .Include(p => p.ExtraBeds)
            .FirstOrDefaultAsync(p => p.Id == input.Id);

        if (preCheckIn == null)
            throw new UserFriendlyException(L("PreCheckInNotFound"));

        if (preCheckIn.Status == PreCheckInStatus.CheckedIn || preCheckIn.Status == PreCheckInStatus.Cancelled)
            throw new UserFriendlyException("Cannot update a checked-in or cancelled pre-check-in.");

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

        preCheckIn.ReservationId = input.ReservationId;
        preCheckIn.GuestId = input.GuestId;
        preCheckIn.GuestName = guestName;
        preCheckIn.FirstName = firstName;
        preCheckIn.LastName = lastName;
        preCheckIn.Phone = phone;
        preCheckIn.Email = email;
        preCheckIn.ArrivalDate = input.ArrivalDate.Date;
        preCheckIn.DepartureDate = input.DepartureDate.Date;
        preCheckIn.Nights = nights;
        preCheckIn.Adults = input.Adults;
        preCheckIn.Children = input.Children;
        preCheckIn.TotalAmount = input.TotalAmount;
        preCheckIn.Notes = input.Notes ?? string.Empty;
        preCheckIn.SpecialRequests = input.SpecialRequests ?? string.Empty;

        foreach (var existingRoom in preCheckIn.Rooms.ToList())
            await preCheckInRoomRepository.DeleteAsync(existingRoom);

        foreach (var existingExtraBed in preCheckIn.ExtraBeds.ToList())
            await preCheckInExtraBedRepository.DeleteAsync(existingExtraBed);

        preCheckIn.Rooms.Clear();
        preCheckIn.ExtraBeds.Clear();

        foreach (var room in input.Rooms)
        {
            var roomType = await roomTypeRepository.FirstOrDefaultAsync(room.RoomTypeId);
            var roomTypeName = room.RoomTypeName ?? roomType?.Name ?? string.Empty;

            preCheckIn.Rooms.Add(new PreCheckInRoom
            {
                PreCheckInId = preCheckIn.Id,
                ReservationRoomId = room.ReservationRoomId,
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
            preCheckIn.ExtraBeds.Add(new PreCheckInExtraBed
            {
                PreCheckInId = preCheckIn.Id,
                ExtraBedTypeId = extraBed.ExtraBedTypeId,
                ExtraBedTypeName = extraBed.ExtraBedTypeName ?? string.Empty,
                Quantity = extraBed.Quantity,
                RatePerNight = extraBed.RatePerNight,
                NumberOfNights = extraBed.NumberOfNights > 0 ? extraBed.NumberOfNights : nights,
                Amount = extraBed.Amount,
            });
        }

        await CurrentUnitOfWork.SaveChangesAsync();
        return preCheckIn.Id;
    }

    [UnitOfWork]
    public async Task CancelAsync(Guid id)
    {
        var preCheckIn = await preCheckInRepository.FirstOrDefaultAsync(id);
        if (preCheckIn == null)
            throw new UserFriendlyException(L("PreCheckInNotFound"));

        if (preCheckIn.Status == PreCheckInStatus.CheckedIn)
            throw new UserFriendlyException("Cannot cancel a checked-in pre-check-in.");

        preCheckIn.Status = PreCheckInStatus.Cancelled;
        await CurrentUnitOfWork.SaveChangesAsync();
    }

    [UnitOfWork]
    public async Task MarkReadyAsync(Guid id)
    {
        var preCheckIn = await preCheckInRepository.FirstOrDefaultAsync(id);
        if (preCheckIn == null)
            throw new UserFriendlyException(L("PreCheckInNotFound"));

        if (preCheckIn.Status != PreCheckInStatus.Pending)
            throw new UserFriendlyException("Can only mark pending pre-check-ins as ready.");

        preCheckIn.Status = PreCheckInStatus.ReadyForCheckIn;
        await CurrentUnitOfWork.SaveChangesAsync();
    }

    [UnitOfWork]
    public async Task MarkCheckedInAsync(Guid id)
    {
        var preCheckIn = await preCheckInRepository.FirstOrDefaultAsync(id);
        if (preCheckIn == null)
            throw new UserFriendlyException(L("PreCheckInNotFound"));

        if (preCheckIn.Status == PreCheckInStatus.CheckedIn)
            throw new UserFriendlyException("Pre-check-in is already marked as checked in.");

        if (preCheckIn.Status == PreCheckInStatus.Cancelled || preCheckIn.Status == PreCheckInStatus.Expired)
            throw new UserFriendlyException("Cannot check in a cancelled or expired pre-check-in.");

        preCheckIn.Status = PreCheckInStatus.CheckedIn;
        await CurrentUnitOfWork.SaveChangesAsync();
    }
}
