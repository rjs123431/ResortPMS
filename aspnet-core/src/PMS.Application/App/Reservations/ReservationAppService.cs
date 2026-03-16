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
using PMS.Application.App.PropertyTimes;
using PMS.Application.App.RoomDailyInventory;
using PMS.Application.App.Services;
using PMS.Auditing;
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
    Task<PagedResultDto<ReservationDto>> GetReservationsWithRoomsAsync(GetReservationsInput input);
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
    IDocumentNumberService documentNumberService,
    IPropertyTimesProvider propertyTimesProvider,
    IRoomDailyInventoryService roomDailyInventoryService,
    IMutationAuditService mutationAuditService
) : PMSAppServiceBase, IReservationAppService
{
    [AbpAuthorize(PermissionNames.Pages_Reservations_Create)]
    [UnitOfWork]
    public async Task<Guid> CreateAsync(CreateReservationDto input)
    {
        Guest? guest = null;
        if (input.GuestId.HasValue && input.GuestId.Value != Guid.Empty)
        {
            guest = await guestRepository.FirstOrDefaultAsync(input.GuestId.Value);
            if (guest == null)
                throw new UserFriendlyException(L("GuestNotFound"));
        }
        else
        {
            if (string.IsNullOrWhiteSpace(input.FirstName) || string.IsNullOrWhiteSpace(input.LastName) || string.IsNullOrWhiteSpace(input.Phone))
                throw new UserFriendlyException(L("FirstNameLastNameAndPhoneRequiredWhenNoGuest"));
        }

        // Validate dates
        if (input.ArrivalDate.Date >= input.DepartureDate.Date)
            throw new UserFriendlyException(L("InvalidArrivalDepartureDate"));

        if (input.ArrivalDate.Date < Clock.Now.Date)
            throw new UserFriendlyException(L("ArrivalDateMustBeFutureOrToday"));

        var (checkInTime, checkOutTime) = await propertyTimesProvider.GetDefaultCheckInCheckOutTimesAsync();
        var arrivalDate = input.ArrivalDate.TimeOfDay == TimeSpan.Zero ? input.ArrivalDate.Date.Add(checkInTime) : input.ArrivalDate;
        var departureDate = input.DepartureDate.TimeOfDay == TimeSpan.Zero ? input.DepartureDate.Date.Add(checkOutTime) : input.DepartureDate;

        var reservationNo = await documentNumberService.GenerateNextDocumentNumberAsync("RESERVATION", "RES-");
        var reservationId = Guid.NewGuid();

        var firstName = guest != null && string.IsNullOrWhiteSpace(input.FirstName) ? guest.FirstName : (input.FirstName ?? string.Empty).Trim();
        var lastName = guest != null && string.IsNullOrWhiteSpace(input.LastName) ? guest.LastName : (input.LastName ?? string.Empty).Trim();
        var phone = guest != null && string.IsNullOrWhiteSpace(input.Phone) ? (guest.Phone ?? string.Empty) : (input.Phone ?? string.Empty).Trim();
        var email = guest != null && string.IsNullOrWhiteSpace(input.Email) ? (guest.Email ?? string.Empty) : (input.Email ?? string.Empty).Trim();

        var isTempReservation = input.IsTempReservation;
        var nights = (int)(departureDate.Date - arrivalDate.Date).TotalDays;

        if (!isTempReservation)
        {
            // Atomically reserve inventory for each assigned room to prevent double booking under concurrency
            foreach (var room in input.Rooms)
            {
                if (!room.RoomId.HasValue) continue;
                var roomId = room.RoomId.Value;
                await roomDailyInventoryService.Ensure365DaysFromTodayAsync([roomId]);
                var reserved = await roomDailyInventoryService.TryReserveInventoryAsync(roomId, arrivalDate, departureDate, reservationId);
                if (!reserved)
                    throw new UserFriendlyException(L("RoomIsNotAvailableForStayDates"));
            }
        }

        var reservation = new Reservation
        {
            Id = reservationId,
            ReservationNo = reservationNo,
            GuestId = input.GuestId,
            GuestName = $"{firstName} {lastName}".Trim(),
            FirstName = firstName,
            LastName = lastName,
            Phone = phone,
            Email = email,
            ReservationDate = Clock.Now,
            ArrivalDate = arrivalDate,
            DepartureDate = departureDate,
            Nights = nights,
            Adults = input.Adults,
            Children = input.Children,
            Status = isTempReservation ? ReservationStatus.Draft : ReservationStatus.Pending,
            TotalAmount = isTempReservation ? 0 : input.TotalAmount,
            DepositPercentage = input.DepositPercentage,
            DepositRequired = isTempReservation ? 0 : input.DepositRequired,
            Notes = input.Notes ?? string.Empty,
            ReservationConditions = input.ReservationConditions ?? string.Empty,
            SpecialRequests = input.SpecialRequests ?? string.Empty,
        };

// Attach room entries (temp: room type/dates/rates only, no RoomId or RoomNumber; normal: include assignment and reserve inventory)
        foreach (var room in input.Rooms)
        {
            var roomType = await roomTypeRepository.FirstOrDefaultAsync(room.RoomTypeId);
            if (roomType == null)
                throw new UserFriendlyException(L("RoomTypeNotFound"));

            string roomNumber = string.Empty;
            Guid? roomId = room.RoomId;
            if (!isTempReservation && room.RoomId.HasValue)
            {
                var roomEntity = await roomRepository.FirstOrDefaultAsync(room.RoomId.Value);
                if (roomEntity != null)
                    roomNumber = roomEntity.RoomNumber ?? string.Empty;
                // Inventory already reserved atomically via TryReserveInventoryAsync above
            }
            else if (isTempReservation)
            {
                roomId = null;
                roomNumber = string.Empty;
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
                RoomId = roomId,
                ArrivalDate = arrivalDate,
                DepartureDate = departureDate,
                RatePerNight = room.RatePerNight,
                NumberOfNights = numberOfNights,
                Amount = amount,
                DiscountPercent = discountPercent,
                DiscountAmount = discountAmount,
                SeniorCitizenCount = seniorCitizenCount,
                SeniorCitizenPercent = seniorCitizenPercent,
                SeniorCitizenDiscountAmount = seniorCitizenDiscountAmount,
                NetAmount = netAmount,
                RoomTypeName = roomType.Name,
                RoomNumber = roomNumber
            });
        }

        if (!isTempReservation)
        {
            foreach (var extraBed in input.ExtraBeds ?? [])
            {
                var quantity = Math.Max(1, extraBed.Quantity);
                var extraArrival = extraBed.ArrivalDate.HasValue ? extraBed.ArrivalDate.Value.Date.Add(extraBed.ArrivalDate.Value.TimeOfDay == TimeSpan.Zero ? checkInTime : extraBed.ArrivalDate.Value.TimeOfDay) : arrivalDate;
                var extraDeparture = extraBed.DepartureDate.HasValue ? extraBed.DepartureDate.Value.Date.Add(extraBed.DepartureDate.Value.TimeOfDay == TimeSpan.Zero ? checkOutTime : extraBed.DepartureDate.Value.TimeOfDay) : departureDate;
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
                    ArrivalDate = extraArrival,
                    DepartureDate = extraDeparture,
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
        }

        // Attach primary and additional guests only when a guest is linked
        if (input.GuestId.HasValue && input.GuestId.Value != Guid.Empty)
        {
            reservation.Guests.Add(new ReservationGuest { GuestId = input.GuestId.Value, Age = 0, IsPrimary = true });
            foreach (var guestId in input.AdditionalGuestIds ?? [])
            {
                reservation.Guests.Add(new ReservationGuest { GuestId = guestId, Age = 0, IsPrimary = false });
            }
        }

        await reservationRepository.InsertAsync(reservation);

        await mutationAuditService.RecordAsync(
            "Reservation",
            reservation.Id.ToString(),
            "Created",
            null,
            new { reservation.ReservationNo, reservation.GuestName, reservation.ArrivalDate, reservation.DepartureDate, reservation.Status },
            nameof(CreateAsync));

        if (guest != null)
            Logger.Info($"Reservation {reservationNo} created for guest {guest.GuestCode}.");
        else
            Logger.Info($"Reservation {reservationNo} created (walk-in: {reservation.GuestName}).");
        return reservation.Id;
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

        var (checkInTime, checkOutTime) = await propertyTimesProvider.GetDefaultCheckInCheckOutTimesAsync();
        reservation.ArrivalDate = input.ArrivalDate.Date.Add(checkInTime);
        reservation.DepartureDate = input.DepartureDate.Date.Add(checkOutTime);
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

        await mutationAuditService.RecordAsync(
            "Reservation",
            reservation.Id.ToString(),
            "Updated",
            null,
            new { reservation.ReservationNo, reservation.ArrivalDate, reservation.DepartureDate, reservation.Status },
            nameof(UpdateAsync));
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

        var previousStatus = reservation.Status;
        reservation.Status = ReservationStatus.Cancelled;
        reservation.Notes = string.IsNullOrWhiteSpace(input.Reason)
            ? reservation.Notes
            : $"{reservation.Notes}\n[CANCELLED] {input.Reason}".Trim();

        await reservationRepository.UpdateAsync(reservation);

        var rooms = await reservationRoomRepository.GetAll()
            .Where(rr => rr.ReservationId == reservation.Id && rr.RoomId.HasValue)
            .ToListAsync();
        var arr = reservation.ArrivalDate.Date;
        var dep = reservation.DepartureDate.Date;
        foreach (var rr in rooms)
            await roomDailyInventoryService.SetVacantAsync(rr.RoomId!.Value, arr, dep);

        await mutationAuditService.RecordAsync(
            "Reservation",
            reservation.Id.ToString(),
            "Updated",
            new { PreviousStatus = (int)previousStatus },
            new { Status = (int)ReservationStatus.Cancelled, Reason = input.Reason },
            nameof(CancelAsync),
            "Cancelled");

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

        await mutationAuditService.RecordAsync(
            "Reservation",
            reservation.Id.ToString(),
            "Updated",
            null,
            new { Status = (int)ReservationStatus.Confirmed },
            nameof(ConfirmAsync));
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

        await mutationAuditService.RecordAsync(
            "Reservation",
            reservation.Id.ToString(),
            "Updated",
            null,
            new { Status = (int)ReservationStatus.NoShow },
            nameof(MarkNoShowAsync));
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

        var arrivalDate = reservation.ArrivalDate.Date;
        var departureDate = reservation.DepartureDate.Date;

        await roomDailyInventoryService.Ensure365DaysFromTodayAsync([input.RoomId]);
        var available = await roomDailyInventoryService.IsRoomAvailableForDatesAsync(
            input.RoomId, arrivalDate, departureDate, excludeReservationId: reservation.Id);
        if (!available)
            throw new UserFriendlyException(L("RoomIsNotAvailableForStayDates"));

        var hasReservationConflict = await reservationRoomRepository.GetAll()
            .AsNoTracking()
            .Where(rr => rr.RoomId == input.RoomId)
            .Where(rr => rr.ReservationId != input.ReservationId)
            .Where(rr => rr.ArrivalDate < departureDate && rr.DepartureDate > arrivalDate)
            .AnyAsync(rr => rr.Reservation.Status == ReservationStatus.Pending ||
                           rr.Reservation.Status == ReservationStatus.Confirmed ||
                           rr.Reservation.Status == ReservationStatus.CheckedIn);

        if (hasReservationConflict)
            throw new UserFriendlyException(L("RoomIsNotAvailableForStayDates"));

        var hasStayConflict = await stayRoomRepository.GetAll()
            .AsNoTracking()
            .Where(sr => sr.RoomId == input.RoomId && !sr.ReleasedAt.HasValue)
            .Where(sr => sr.ArrivalDate < departureDate && sr.DepartureDate > arrivalDate)
            .AnyAsync(sr => sr.Stay.Status == StayStatus.CheckedIn || sr.Stay.Status == StayStatus.InHouse);

        if (hasStayConflict)
            throw new UserFriendlyException(L("RoomIsNotAvailableForStayDates"));

        await roomDailyInventoryService.Ensure365DaysFromTodayAsync([room.Id]);
        var reserved = await roomDailyInventoryService.TryReserveInventoryAsync(room.Id, arrivalDate, departureDate, reservation.Id);
        if (!reserved)
            throw new UserFriendlyException(L("RoomIsNotAvailableForStayDates"));

        var oldRoomId = reservationRoom.RoomId;
        var oldRoomNumber = reservationRoom.RoomNumber;
        if (oldRoomId.HasValue)
            await roomDailyInventoryService.SetVacantAsync(oldRoomId.Value, arrivalDate, departureDate);

        reservationRoom.RoomId = room.Id;
        reservationRoom.RoomNumber = room.RoomNumber;
        await reservationRoomRepository.UpdateAsync(reservationRoom);

        await mutationAuditService.RecordAsync(
            "Reservation",
            reservation.Id.ToString(),
            "Updated",
            new { RoomId = oldRoomId, RoomNumber = oldRoomNumber },
            new { RoomId = room.Id, RoomNumber = room.RoomNumber },
            nameof(AssignRoomAsync),
            "AssignRoom");
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

    public async Task<PagedResultDto<ReservationListDto>> GetAllAsync(GetReservationsInput input)
    {
        var query = reservationRepository.GetAll()
            .Include(r => r.Guest)
            .WhereIf(!string.IsNullOrWhiteSpace(input.Filter),
                r => r.ReservationNo.Contains(input.Filter) ||
                     r.GuestName.Contains(input.Filter))
            .WhereIf(input.Status.HasValue, r => r.Status == input.Status)
            .WhereIf(input.ArrivalDateFrom.HasValue, r => r.ArrivalDate >= input.ArrivalDateFrom.Value.Date)
            .WhereIf(input.ArrivalDateTo.HasValue, r => r.ArrivalDate <= input.ArrivalDateTo.Value.Date)
            .WhereIf(input.OverlapStartDate.HasValue && input.OverlapEndDate.HasValue,
                r => r.ArrivalDate < input.OverlapEndDate.Value.Date && r.DepartureDate > input.OverlapStartDate.Value.Date)
            .WhereIf(input.RoomIds != null && input.RoomIds.Count > 0,
                r => r.Rooms.Any(rr => rr.RoomId.HasValue && input.RoomIds.Contains(rr.RoomId.Value)));

        var total = await query.CountAsync();
        var items = await query.OrderBy(input.Sorting ?? "ArrivalDate desc").PageBy(input).ToListAsync();
        return new PagedResultDto<ReservationListDto>(total, ObjectMapper.Map<System.Collections.Generic.List<ReservationListDto>>(items));
    }

    public async Task<PagedResultDto<ReservationDto>> GetReservationsWithRoomsAsync(GetReservationsInput input)
    {
        var query = reservationRepository.GetAll()
            .Include(r => r.Guest)
            .Include(r => r.Rooms).ThenInclude(rr => rr.RoomType)
            .WhereIf(!string.IsNullOrWhiteSpace(input.Filter),
                r => r.ReservationNo.Contains(input.Filter) ||
                     r.GuestName.Contains(input.Filter))
            .WhereIf(input.Status.HasValue, r => r.Status == input.Status)
            .WhereIf(input.ArrivalDateFrom.HasValue, r => r.ArrivalDate >= input.ArrivalDateFrom.Value.Date)
            .WhereIf(input.ArrivalDateTo.HasValue, r => r.ArrivalDate <= input.ArrivalDateTo.Value.Date)
            .WhereIf(input.OverlapStartDate.HasValue && input.OverlapEndDate.HasValue,
                r => r.Rooms.Any(rr => rr.ArrivalDate < input.OverlapEndDate.Value.Date && rr.DepartureDate >= input.OverlapStartDate.Value.Date))
            .WhereIf(input.RoomIds != null && input.RoomIds.Count > 0,
                r => r.Rooms.Any(rr => rr.RoomId.HasValue && input.RoomIds.Contains(rr.RoomId.Value)));

        var total = await query.CountAsync();
        var items = await query.OrderBy(input.Sorting ?? "ArrivalDate desc").PageBy(input).ToListAsync();
        return new PagedResultDto<ReservationDto>(total, ObjectMapper.Map<System.Collections.Generic.List<ReservationDto>>(items));
    }
}
