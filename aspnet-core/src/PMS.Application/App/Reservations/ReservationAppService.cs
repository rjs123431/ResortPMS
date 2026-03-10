using Abp.Application.Services;
using Abp.Application.Services.Dto;
using Abp.Authorization;
using Abp.Domain.Repositories;
using Abp.Domain.Uow;
using Abp.Linq.Extensions;
using Abp.Timing;
using Abp.UI;
using Microsoft.EntityFrameworkCore;
using PMS.App.Reservations.Dto;
using PMS.Application.App.Services;
using PMS.Authorization;
using System;
using System.Linq;
using System.Linq.Dynamic.Core;
using System.Threading.Tasks;

namespace PMS.App.Reservations;

public interface IReservationAppService : IApplicationService
{
    Task<ReservationDto> GetAsync(Guid id);
    Task<PagedResultDto<ReservationListDto>> GetAllAsync(GetReservationsInput input);
    Task<Guid> CreateAsync(CreateReservationDto input);
    Task UpdateAsync(UpdateReservationDto input);
    Task CancelAsync(CancelReservationDto input);
    Task ConfirmAsync(Guid reservationId);
    Task MarkNoShowAsync(Guid reservationId);
    Task<Guid> RecordDepositAsync(RecordReservationDepositDto input);
    Task<int> AddGuestsAsync(AddReservationGuestsDto input);
    Task UpdateGuestAgeAsync(UpdateReservationGuestAgeDto input);
    Task RemoveGuestAsync(RemoveReservationGuestDto input);
    Task AssignRoomAsync(AssignReservationRoomDto input);
    Task<ReservationDto> GetByNumberAsync(string reservationNo);
}

[AbpAuthorize(PermissionNames.Pages_Reservations)]
public class ReservationAppService(
    IRepository<Reservation, Guid> reservationRepository,
    IRepository<ReservationRoom, Guid> reservationRoomRepository,
    IRepository<StayRoom, Guid> stayRoomRepository,
    IRepository<ReservationDeposit, Guid> depositRepository,
    IRepository<ReservationGuest, Guid> reservationGuestRepository,
    IRepository<Guest, Guid> guestRepository,
    IRepository<Room, Guid> roomRepository,
    IRepository<RoomType, Guid> roomTypeRepository,
    IDocumentNumberService documentNumberService
) : PMSAppServiceBase, IReservationAppService
{
    [AbpAuthorize(PermissionNames.Pages_Reservations_Create)]
    [UnitOfWork]
    public async Task<Guid> CreateAsync(CreateReservationDto input)
    {
        // Validate guest exists
        var guest = await guestRepository.FirstOrDefaultAsync(input.GuestId);
        if (guest == null)
            throw new UserFriendlyException(L("GuestNotFound"));

        // Validate dates
        if (input.ArrivalDate.Date >= input.DepartureDate.Date)
            throw new UserFriendlyException(L("InvalidArrivalDepartureDate"));

        if (input.ArrivalDate.Date < Clock.Now.Date)
            throw new UserFriendlyException(L("ArrivalDateMustBeFutureOrToday"));

        var reservationNo = await documentNumberService.GenerateNextDocumentNumberAsync("RESERVATION", "RES-");
        var firstName = string.IsNullOrWhiteSpace(input.FirstName) ? guest.FirstName : input.FirstName.Trim();
        var lastName = string.IsNullOrWhiteSpace(input.LastName) ? guest.LastName : input.LastName.Trim();
        var phone = string.IsNullOrWhiteSpace(input.Phone) ? (guest.Phone ?? string.Empty) : input.Phone.Trim();
        var email = string.IsNullOrWhiteSpace(input.Email) ? (guest.Email ?? string.Empty) : input.Email.Trim();

        var reservation = new Reservation
        {
            ReservationNo = reservationNo,
            GuestId = input.GuestId,
            GuestName = $"{firstName} {lastName}".Trim(),
            FirstName = firstName,
            LastName = lastName,
            Phone = phone,
            Email = email,
            ReservationDate = Clock.Now,
            ArrivalDate = input.ArrivalDate.Date,
            DepartureDate = input.DepartureDate.Date,
            Nights = (int)(input.DepartureDate.Date - input.ArrivalDate.Date).TotalDays,
            Adults = input.Adults,
            Children = input.Children,
            Status = ReservationStatus.Pending,
            TotalAmount = input.TotalAmount,
            DepositPercentage = input.DepositPercentage,
            DepositRequired = input.DepositRequired,
            Notes = input.Notes ?? string.Empty,
            ReservationConditions = input.ReservationConditions ?? string.Empty,
            SpecialRequests = input.SpecialRequests ?? string.Empty,
        };

        // Attach room entries
        foreach (var room in input.Rooms)
        {
            var roomType = await roomTypeRepository.FirstOrDefaultAsync(room.RoomTypeId);
            if (roomType == null)
                throw new UserFriendlyException(L("RoomTypeNotFound"));

            if (room.RoomId.HasValue)
            {
                var roomId = room.RoomId.Value;
                var hasReservationConflict = await reservationRoomRepository.GetAll()
                    .Include(rr => rr.Reservation)
                    .Where(rr => rr.RoomId == roomId)
                    .Where(rr => rr.ArrivalDate < input.DepartureDate.Date && rr.DepartureDate > input.ArrivalDate.Date)
                    .AnyAsync(rr => rr.Reservation.Status == ReservationStatus.Pending ||
                                   rr.Reservation.Status == ReservationStatus.Confirmed ||
                                   rr.Reservation.Status == ReservationStatus.CheckedIn);

                if (hasReservationConflict)
                    throw new UserFriendlyException(L("RoomIsNotAvailableForStayDates"));

                var hasStayConflict = await stayRoomRepository.GetAll()
                    .Include(sr => sr.Stay)
                    .Where(sr => sr.RoomId == roomId)
                    .Where(sr => sr.AssignedAt.Date < input.DepartureDate.Date)
                    .Where(sr => (sr.ReleasedAt.HasValue ? sr.ReleasedAt.Value.Date : sr.Stay.ExpectedCheckOutDateTime.Date) > input.ArrivalDate.Date)
                    .AnyAsync(sr => sr.Stay.Status == StayStatus.CheckedIn || sr.Stay.Status == StayStatus.InHouse);

                if (hasStayConflict)
                    throw new UserFriendlyException(L("RoomIsNotAvailableForStayDates"));
            }

            var numberOfNights = reservation.Nights;
            var amount = room.Amount > 0 ? room.Amount : room.RatePerNight * numberOfNights;
            var discountPercent = room.DiscountPercent;
            var discountAmount = room.DiscountAmount;
            var seniorCitizenCount = Math.Max(0, room.SeniorCitizenCount);
            var seniorCitizenPercent = room.SeniorCitizenPercent > 0 ? room.SeniorCitizenPercent : 20m;
            var seniorCitizenDiscountAmount = room.SeniorCitizenDiscountAmount;
            var netAmount = room.NetAmount > 0
                ? room.NetAmount
                : Math.Max(0, amount - discountAmount - seniorCitizenDiscountAmount);

            reservation.Rooms.Add(new ReservationRoom
            {
                RoomTypeId = room.RoomTypeId,
                RoomId = room.RoomId,
                ArrivalDate = input.ArrivalDate.Date,
                DepartureDate = input.DepartureDate.Date,
                RatePerNight = room.RatePerNight,
                NumberOfNights = numberOfNights,
                Amount = amount,
                DiscountPercent = discountPercent,
                DiscountAmount = discountAmount,
                SeniorCitizenCount = seniorCitizenCount,
                SeniorCitizenPercent = seniorCitizenPercent,
                SeniorCitizenDiscountAmount = seniorCitizenDiscountAmount,
                NetAmount = netAmount,
                RoomTypeName = roomType.Name
            });
        }

        foreach (var extraBed in input.ExtraBeds ?? [])
        {
            var quantity = Math.Max(1, extraBed.Quantity);
            var arrivalDate = extraBed.ArrivalDate?.Date ?? input.ArrivalDate.Date;
            var departureDate = extraBed.DepartureDate?.Date ?? input.DepartureDate.Date;
            var numberOfNights = extraBed.NumberOfNights > 0 ? extraBed.NumberOfNights : reservation.Nights;
            var amount = extraBed.Amount > 0 ? extraBed.Amount : extraBed.RatePerNight * numberOfNights * quantity;
            var discountPercent = extraBed.DiscountPercent;
            var discountAmount = extraBed.DiscountAmount;
            var seniorCitizenCount = Math.Max(0, extraBed.SeniorCitizenCount);
            var seniorCitizenPercent = extraBed.SeniorCitizenPercent > 0 ? extraBed.SeniorCitizenPercent : 20m;
            var seniorCitizenDiscountAmount = extraBed.SeniorCitizenDiscountAmount;
            var netAmount = extraBed.NetAmount > 0
                ? extraBed.NetAmount
                : Math.Max(0, amount - discountAmount - seniorCitizenDiscountAmount);

            reservation.ExtraBeds.Add(new ReservationExtraBed
            {
                ExtraBedTypeId = extraBed.ExtraBedTypeId,
                ArrivalDate = arrivalDate,
                DepartureDate = departureDate,
                Quantity = quantity,
                RatePerNight = extraBed.RatePerNight,
                NumberOfNights = numberOfNights,
                Amount = amount,
                DiscountPercent = discountPercent,
                DiscountAmount = discountAmount,
                SeniorCitizenCount = seniorCitizenCount,
                SeniorCitizenPercent = seniorCitizenPercent,
                SeniorCitizenDiscountAmount = seniorCitizenDiscountAmount,
                NetAmount = netAmount,
            });
        }

        // Attach additional guests
        reservation.Guests.Add(new ReservationGuest { GuestId = input.GuestId, Age = 0, IsPrimary = true });
        foreach (var guestId in input.AdditionalGuestIds ?? [])
        {
            reservation.Guests.Add(new ReservationGuest { GuestId = guestId, Age = 0, IsPrimary = false });
        }

        var id = await reservationRepository.InsertAndGetIdAsync(reservation);
        Logger.Info($"Reservation {reservationNo} created for guest {guest.GuestCode}.");
        return id;
    }

    [AbpAuthorize(PermissionNames.Pages_Reservations_Edit)]
    [UnitOfWork]
    public async Task UpdateAsync(UpdateReservationDto input)
    {
        var reservation = await reservationRepository.GetAsync(input.Id);

        if (reservation.Status == ReservationStatus.CheckedIn || reservation.Status == ReservationStatus.Completed)
            throw new UserFriendlyException(L("CannotEditCheckedInOrCompletedReservation"));

        if (input.ArrivalDate.Date >= input.DepartureDate.Date)
            throw new UserFriendlyException(L("InvalidArrivalDepartureDate"));

        reservation.ArrivalDate = input.ArrivalDate.Date;
        reservation.DepartureDate = input.DepartureDate.Date;
        reservation.Nights = (int)(input.DepartureDate.Date - input.ArrivalDate.Date).TotalDays;
        reservation.Adults = input.Adults;
        reservation.Children = input.Children;
        reservation.TotalAmount = input.TotalAmount;
        reservation.DepositPercentage = input.DepositPercentage;
        reservation.DepositRequired = input.DepositRequired;
        reservation.Notes = input.Notes ?? string.Empty;
        reservation.ReservationConditions = input.ReservationConditions ?? string.Empty;
        reservation.SpecialRequests = input.SpecialRequests ?? string.Empty;

        await reservationRepository.UpdateAsync(reservation);
    }

    [AbpAuthorize(PermissionNames.Pages_Reservations_Cancel)]
    [UnitOfWork]
    public async Task CancelAsync(CancelReservationDto input)
    {
        var reservation = await reservationRepository.GetAsync(input.ReservationId);

        if (reservation.Status == ReservationStatus.CheckedIn)
            throw new UserFriendlyException(L("CannotCancelCheckedInReservation"));

        if (reservation.Status == ReservationStatus.Cancelled)
            throw new UserFriendlyException(L("ReservationAlreadyCancelled"));

        reservation.Status = ReservationStatus.Cancelled;
        reservation.Notes = string.IsNullOrWhiteSpace(input.Reason)
            ? reservation.Notes
            : $"{reservation.Notes}\n[CANCELLED] {input.Reason}".Trim();

        await reservationRepository.UpdateAsync(reservation);
        Logger.Info($"Reservation {reservation.ReservationNo} cancelled.");
    }

    [AbpAuthorize(PermissionNames.Pages_Reservations_Edit)]
    [UnitOfWork]
    public async Task ConfirmAsync(Guid reservationId)
    {
        var reservation = await reservationRepository.GetAsync(reservationId);

        if (reservation.Status != ReservationStatus.Draft && reservation.Status != ReservationStatus.Pending)
            throw new UserFriendlyException(L("OnlyDraftOrPendingCanBeConfirmed"));

        reservation.Status = ReservationStatus.Confirmed;
        await reservationRepository.UpdateAsync(reservation);
    }

    [AbpAuthorize(PermissionNames.Pages_Reservations_Edit)]
    [UnitOfWork]
    public async Task MarkNoShowAsync(Guid reservationId)
    {
        var reservation = await reservationRepository.GetAsync(reservationId);

        if (reservation.Status != ReservationStatus.Confirmed)
            throw new UserFriendlyException(L("OnlyConfirmedCanBeMarkedNoShow"));

        reservation.Status = ReservationStatus.NoShow;
        await reservationRepository.UpdateAsync(reservation);
    }

    [AbpAuthorize(PermissionNames.Pages_Reservations_Deposit)]
    [UnitOfWork]
    public async Task<Guid> RecordDepositAsync(RecordReservationDepositDto input)
    {
        var reservation = await reservationRepository.GetAsync(input.ReservationId);

        if (reservation.Status == ReservationStatus.Cancelled || reservation.Status == ReservationStatus.NoShow)
            throw new UserFriendlyException(L("CannotAddDepositToCancelledReservation"));

        var remainingTotalAmount = Math.Max(0m, reservation.TotalAmount - reservation.DepositPaid);
        if (input.Amount > remainingTotalAmount)
            throw new UserFriendlyException("Deposit amount exceeds remaining total amount.");

        var deposit = new ReservationDeposit
        {
            ReservationId = input.ReservationId,
            Amount = input.Amount,
            PaymentMethodId = input.PaymentMethodId,
            PaidDate = input.PaidDate ?? Clock.Now,
            ReferenceNo = input.ReferenceNo ?? string.Empty
        };

        var depositId = await depositRepository.InsertAndGetIdAsync(deposit);

        reservation.DepositPaid += input.Amount;
        await reservationRepository.UpdateAsync(reservation);

        return depositId;
    }

    [AbpAuthorize(PermissionNames.Pages_Reservations_Edit)]
    [UnitOfWork]
    public async Task<int> AddGuestsAsync(AddReservationGuestsDto input)
    {
        var reservation = await reservationRepository.GetAll()
            .Include(r => r.Guests)
            .FirstOrDefaultAsync(r => r.Id == input.ReservationId);

        if (reservation == null)
            throw new UserFriendlyException(L("ReservationNotFound"));

        if (reservation.Status == ReservationStatus.Cancelled ||
            reservation.Status == ReservationStatus.NoShow ||
            reservation.Status == ReservationStatus.CheckedIn ||
            reservation.Status == ReservationStatus.Completed)
        {
            throw new UserFriendlyException("Cannot add guests for this reservation status.");
        }

        var guestRows = (input.Guests ?? [])
            .Where(x => x.GuestId != Guid.Empty)
            .GroupBy(x => x.GuestId)
            .Select(g => g.Last())
            .ToList();

        if (!guestRows.Any())
            throw new UserFriendlyException("Please provide at least one guest.");

        var existingGuestIds = reservation.Guests.Select(g => g.GuestId).ToHashSet();
        var candidates = guestRows.Where(x => !existingGuestIds.Contains(x.GuestId)).ToList();

        if (!candidates.Any())
            return 0;

        var validGuestIds = await guestRepository.GetAll()
            .Where(g => candidates.Select(c => c.GuestId).Contains(g.Id))
            .Select(g => g.Id)
            .ToListAsync();

        foreach (var guestId in validGuestIds)
        {
            var item = candidates.First(x => x.GuestId == guestId);
            reservation.Guests.Add(new ReservationGuest
            {
                GuestId = guestId,
                Age = Math.Max(0, item.Age),
                IsPrimary = false,
            });
        }

        await reservationRepository.UpdateAsync(reservation);
        return validGuestIds.Count;
    }

    [AbpAuthorize(PermissionNames.Pages_Reservations_Edit)]
    [UnitOfWork]
    public async Task UpdateGuestAgeAsync(UpdateReservationGuestAgeDto input)
    {
        var reservation = await reservationRepository.GetAsync(input.ReservationId);
        if (reservation.Status == ReservationStatus.Cancelled ||
            reservation.Status == ReservationStatus.NoShow ||
            reservation.Status == ReservationStatus.CheckedIn ||
            reservation.Status == ReservationStatus.Completed)
        {
            throw new UserFriendlyException("Cannot edit guests for this reservation status.");
        }

        var guest = await reservationGuestRepository.FirstOrDefaultAsync(g =>
            g.Id == input.ReservationGuestId && g.ReservationId == input.ReservationId);

        if (guest == null)
            throw new UserFriendlyException("Reservation guest not found.");

        guest.Age = Math.Max(0, input.Age);
        await reservationGuestRepository.UpdateAsync(guest);
    }

    [AbpAuthorize(PermissionNames.Pages_Reservations_Edit)]
    [UnitOfWork]
    public async Task RemoveGuestAsync(RemoveReservationGuestDto input)
    {
        var reservation = await reservationRepository.GetAsync(input.ReservationId);
        if (reservation.Status == ReservationStatus.Cancelled ||
            reservation.Status == ReservationStatus.NoShow ||
            reservation.Status == ReservationStatus.CheckedIn ||
            reservation.Status == ReservationStatus.Completed)
        {
            throw new UserFriendlyException("Cannot edit guests for this reservation status.");
        }

        var guest = await reservationGuestRepository.FirstOrDefaultAsync(g =>
            g.Id == input.ReservationGuestId && g.ReservationId == input.ReservationId);

        if (guest == null)
            throw new UserFriendlyException("Reservation guest not found.");

        if (guest.IsPrimary)
            throw new UserFriendlyException("Primary guest cannot be removed.");

        await reservationGuestRepository.DeleteAsync(guest);
    }

    [AbpAuthorize(PermissionNames.Pages_Reservations_Edit)]
    [UnitOfWork]
    public async Task AssignRoomAsync(AssignReservationRoomDto input)
    {
        var reservation = await reservationRepository.GetAsync(input.ReservationId);
        if (reservation.Status == ReservationStatus.Cancelled ||
            reservation.Status == ReservationStatus.NoShow ||
            reservation.Status == ReservationStatus.CheckedIn ||
            reservation.Status == ReservationStatus.Completed)
        {
            throw new UserFriendlyException("Cannot assign room for this reservation status.");
        }

        var reservationRoom = await reservationRoomRepository.FirstOrDefaultAsync(x =>
            x.Id == input.ReservationRoomId && x.ReservationId == input.ReservationId);

        if (reservationRoom == null)
            throw new UserFriendlyException("Reservation room entry not found.");

        var room = await roomRepository.FirstOrDefaultAsync(input.RoomId);
        if (room == null)
            throw new UserFriendlyException(L("RoomNotFound"));

        if (room.RoomTypeId != reservationRoom.RoomTypeId)
            throw new UserFriendlyException("Selected room does not match reservation room type.");

        var hasReservationConflict = await reservationRoomRepository.GetAll()
            .Include(rr => rr.Reservation)
            .Where(rr => rr.RoomId == input.RoomId)
            .Where(rr => rr.ReservationId != input.ReservationId)
            .Where(rr => rr.ArrivalDate < reservation.DepartureDate.Date && rr.DepartureDate > reservation.ArrivalDate.Date)
            .AnyAsync(rr => rr.Reservation.Status == ReservationStatus.Pending ||
                           rr.Reservation.Status == ReservationStatus.Confirmed ||
                           rr.Reservation.Status == ReservationStatus.CheckedIn);

        if (hasReservationConflict)
            throw new UserFriendlyException(L("RoomIsNotAvailableForStayDates"));

        var hasStayConflict = await stayRoomRepository.GetAll()
            .Include(sr => sr.Stay)
            .Where(sr => sr.RoomId == input.RoomId)
            .Where(sr => sr.AssignedAt.Date < reservation.DepartureDate.Date)
            .Where(sr => (sr.ReleasedAt.HasValue ? sr.ReleasedAt.Value.Date : sr.Stay.ExpectedCheckOutDateTime.Date) > reservation.ArrivalDate.Date)
            .AnyAsync(sr => sr.Stay.Status == StayStatus.CheckedIn || sr.Stay.Status == StayStatus.InHouse);

        if (hasStayConflict)
            throw new UserFriendlyException(L("RoomIsNotAvailableForStayDates"));

        reservationRoom.RoomId = room.Id;
        reservationRoom.RoomNumber = room.RoomNumber;
        await reservationRoomRepository.UpdateAsync(reservationRoom);
    }

    public async Task<ReservationDto> GetAsync(Guid id)
    {
        var reservation = await reservationRepository.GetAll()
            .Include(r => r.Guest)
            .Include(r => r.Rooms).ThenInclude(rr => rr.RoomType)
            .Include(r => r.ExtraBeds).ThenInclude(eb => eb.ExtraBedType)
            .Include(r => r.Guests).ThenInclude(rg => rg.Guest)
            .Include(r => r.Deposits).ThenInclude(d => d.PaymentMethod)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (reservation == null)
            throw new UserFriendlyException(L("ReservationNotFound"));

        var dto = ObjectMapper.Map<ReservationDto>(reservation);
        foreach (var extraBed in dto.ExtraBeds)
        {
            var source = reservation.ExtraBeds.FirstOrDefault(x => x.Id == extraBed.Id);
            extraBed.ExtraBedTypeName = source?.ExtraBedType?.Name ?? string.Empty;
        }

        foreach (var guest in dto.Guests)
        {
            var source = reservation.Guests.FirstOrDefault(x => x.Id == guest.Id);
            guest.GuestName = source?.Guest == null
                ? guest.GuestName
                : $"{source.Guest.FirstName} {source.Guest.LastName}".Trim();
        }

        return dto;
    }

    public async Task<ReservationDto> GetByNumberAsync(string reservationNo)
    {
        var reservation = await reservationRepository.GetAll()
            .Include(r => r.Guest)
            .Include(r => r.Rooms).ThenInclude(rr => rr.RoomType)
            .Include(r => r.ExtraBeds).ThenInclude(eb => eb.ExtraBedType)
            .Include(r => r.Deposits).ThenInclude(d => d.PaymentMethod)
            .FirstOrDefaultAsync(r => r.ReservationNo == reservationNo.Trim().ToUpper());

        if (reservation == null)
            throw new UserFriendlyException(L("ReservationNotFound"));

        var dto = ObjectMapper.Map<ReservationDto>(reservation);
        foreach (var extraBed in dto.ExtraBeds)
        {
            var source = reservation.ExtraBeds.FirstOrDefault(x => x.Id == extraBed.Id);
            extraBed.ExtraBedTypeName = source?.ExtraBedType?.Name ?? string.Empty;
        }

        return dto;
    }

    public async Task<PagedResultDto<ReservationListDto>> GetAllAsync(GetReservationsInput input)
    {
        var query = reservationRepository.GetAll()
            .Include(r => r.Guest)
            .WhereIf(!string.IsNullOrWhiteSpace(input.Filter),
                r => r.ReservationNo.Contains(input.Filter) ||
                     r.GuestName.Contains(input.Filter))
            .WhereIf(input.Status.HasValue, r => r.Status == input.Status)
            .WhereIf(input.ArrivalDateFrom.HasValue, r => r.ArrivalDate >= input.ArrivalDateFrom.Value.Date)
            .WhereIf(input.ArrivalDateTo.HasValue, r => r.ArrivalDate <= input.ArrivalDateTo.Value.Date);

        var total = await query.CountAsync();
        var items = await query.OrderBy(input.Sorting ?? "ArrivalDate desc").PageBy(input).ToListAsync();
        return new PagedResultDto<ReservationListDto>(total, ObjectMapper.Map<System.Collections.Generic.List<ReservationListDto>>(items));
    }
}
