using Abp.Application.Services;
using Abp.Application.Services.Dto;
using Abp.Authorization;
using Abp.Domain.Repositories;
using Abp.Domain.Uow;
using Abp.Timing;
using Abp.UI;
using Microsoft.EntityFrameworkCore;
using PMS.App.CheckIn.Dto;
using PMS.Application.App.Services;
using PMS.Authorization;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace PMS.App.CheckIn;

public interface ICheckInAppService : IApplicationService
{
    Task<CheckInResultDto> CheckInFromReservationAsync(CheckInFromReservationDto input);
    Task<CheckInResultDto> WalkInCheckInAsync(WalkInCheckInDto input);
}

[AbpAuthorize(PermissionNames.Pages_CheckIn)]
public class CheckInAppService(
    IRepository<Reservation, Guid> reservationRepository,
    IRepository<ReservationRoom, Guid> reservationRoomRepository,
    IRepository<ReservationExtraBed, Guid> reservationExtraBedRepository,
    IRepository<Stay, Guid> stayRepository,
    IRepository<Folio, Guid> folioRepository,
    IRepository<FolioTransaction, Guid> folioTransactionRepository,
    IRepository<StayGuest, Guid> stayGuestRepository,
    IRepository<StayRoom, Guid> stayRoomRepository,
    IRepository<FolioPayment, Guid> folioPaymentRepository,
    IRepository<Guest, Guid> guestRepository,
    IRepository<Room, Guid> roomRepository,
    IRepository<RoomType, Guid> roomTypeRepository,
    IDocumentNumberService documentNumberService
) : PMSAppServiceBase, ICheckInAppService
{
    [AbpAuthorize(PermissionNames.Pages_CheckIn_FromReservation)]
    [UnitOfWork]
    public async Task<CheckInResultDto> CheckInFromReservationAsync(CheckInFromReservationDto input)
    {
        // Search + load reservation + guest + room lines in one roundtrip
        var reservation = await reservationRepository.GetAll()
            .Include(r => r.Guest)
            .Include(r => r.Rooms)
            .Include(r => r.ExtraBeds)
            .Include(r => r.Guests)
            .Include(r => r.Deposits)
            .FirstOrDefaultAsync(r => r.Id == input.ReservationId);

        if (reservation == null)
            throw new UserFriendlyException(L("ReservationNotFound"));

        if (reservation.Status == ReservationStatus.Cancelled || reservation.Status == ReservationStatus.NoShow)
            throw new UserFriendlyException(L("CannotCheckInCancelledOrNoShowReservation"));

        if (reservation.Status == ReservationStatus.CheckedIn || reservation.Status == ReservationStatus.Completed)
            throw new UserFriendlyException(L("ReservationAlreadyCheckedIn"));

        if (reservation.Status != ReservationStatus.Confirmed)
            throw new UserFriendlyException(L("OnlyConfirmedCanCheckIn"));

        if (reservation.Rooms == null || reservation.Rooms.Count == 0)
            throw new UserFriendlyException(L("ReservationMustHaveAtLeastOneRoom"));

        // Validate room
        var room = await ValidateAndGetRoomAsync(input.RoomId);

        await ApplyReservationRoomUpdatesAsync(reservation, input.ReservationRooms);
        await ApplyReservationExtraBedUpdatesAsync(reservation, input.ExtraBeds);

        var reservationRoom = ResolveReservationRoomForCheckIn(reservation, room, input.ReservationRoomId);

        // Find available rooms for reservation dates and ensure selected room is still free.
        await EnsureRoomIsAvailableForReservationDatesAsync(
            reservationId: reservation.Id,
            roomId: room.Id,
            arrivalDate: reservation.ArrivalDate,
            departureDate: reservation.DepartureDate
        );

        var stay = await CreateStayAsync(
            reservationId: reservation.Id,
            guest: reservation.Guest,
            room: room,
            expectedCheckOut: input.ExpectedCheckOutDate ?? reservation.DepartureDate,
            additionalGuestIds: input.AdditionalGuestIds ?? []
        );

        // Keep reservation room assignment in sync with the selected check-in room.
        await AssignRoomToReservationRoomAsync(reservationRoom, room);

        // Transfer reservation deposits to folio as payments
        var folio = await CreateFolioAsync(stay);
        var depositTotal = reservation.Deposits.Where(d => !d.IsDeleted).Sum(d => d.Amount);
        if (depositTotal > 0)
        {
            await PostDepositTransferToFolioAsync(folio, reservation, depositTotal);
        }

        if (input.Payments != null)
        {
            foreach (var payment in input.Payments.Where(p => p.Amount > 0))
            {
                await PostAdvancePaymentAsync(
                    folio,
                    payment.Amount,
                    payment.PaymentMethodId,
                    payment.ReferenceNo,
                    payment.PaidDate,
                    "Check-in payment"
                );
            }
        }

        if (input.RefundableCashDepositAmount.HasValue && input.RefundableCashDepositAmount.Value > 0)
        {
            if (!input.RefundableCashDepositPaymentMethodId.HasValue)
                throw new UserFriendlyException(L("PaymentMethodIsRequired"));

            await PostAdvancePaymentAsync(
                folio,
                input.RefundableCashDepositAmount.Value,
                input.RefundableCashDepositPaymentMethodId.Value,
                input.RefundableCashDepositReference,
                Clock.Now,
                "Refundable cash deposit",
                FolioTransactionType.DepositPayment
            );
        }

        // Mark reservation as checked-in
        reservation.Status = ReservationStatus.CheckedIn;
        await reservationRepository.UpdateAsync(reservation);

        // Extension point: sync room turn-over consumption (linen/amenities/etc.) when inventory module is available.
        await UpdateInventoryAfterCheckInAsync(stay, room);

        await CurrentUnitOfWork.SaveChangesAsync();

        Logger.Info($"Check-in completed: Stay {stay.StayNo}, Room {room.RoomNumber}, Guest {reservation.Guest.GuestCode}.");

        return new CheckInResultDto { StayId = stay.Id, StayNo = stay.StayNo, FolioId = folio.Id, FolioNo = folio.FolioNo };
    }

    [AbpAuthorize(PermissionNames.Pages_CheckIn_WalkIn)]
    [UnitOfWork]
    public async Task<CheckInResultDto> WalkInCheckInAsync(WalkInCheckInDto input)
    {
        var guest = await guestRepository.FirstOrDefaultAsync(input.GuestId);
        if (guest == null)
            throw new UserFriendlyException(L("GuestNotFound"));

        var room = await ValidateAndGetRoomAsync(input.RoomId);

        var stay = await CreateStayAsync(
            reservationId: null,
            guest: guest,
            room: room,
            expectedCheckOut: input.ExpectedCheckOutDate,
            additionalGuestIds: input.AdditionalGuestIds ?? []
        );

        var folio = await CreateFolioAsync(stay);

        // Record walk-in advance payment if provided
        if (input.AdvancePaymentAmount > 0)
        {
            if (!input.PaymentMethodId.HasValue)
                throw new UserFriendlyException(L("PaymentMethodIsRequired"));

            await PostAdvancePaymentAsync(folio, input.AdvancePaymentAmount, input.PaymentMethodId.Value, input.PaymentReference);
        }

        Logger.Info($"Walk-in check-in: Stay {stay.StayNo}, Room {room.RoomNumber}, Guest {guest.GuestCode}.");

        return new CheckInResultDto { StayId = stay.Id, StayNo = stay.StayNo, FolioId = folio.Id, FolioNo = folio.FolioNo };
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private async Task<Room> ValidateAndGetRoomAsync(Guid roomId)
    {
        var room = await roomRepository.GetAll()
            .Include(r => r.RoomType)
            .FirstOrDefaultAsync(r => r.Id == roomId);

        if (room == null)
            throw new UserFriendlyException(L("RoomNotFound"));

        if (room.Status == RoomStatus.Occupied)
            throw new UserFriendlyException(L("RoomIsAlreadyOccupied"));

        if (room.Status == RoomStatus.OutOfOrder || room.Status == RoomStatus.Maintenance)
            throw new UserFriendlyException(L("RoomNotAvailableForCheckIn"));

        return room;
    }

    private static ReservationRoom ResolveReservationRoomForCheckIn(Reservation reservation, Room room, Guid? reservationRoomId)
    {
        if (reservationRoomId.HasValue)
        {
            var matched = reservation.Rooms.FirstOrDefault(rr => rr.Id == reservationRoomId.Value);
            if (matched == null)
                throw new UserFriendlyException("Reservation room entry not found.");

            return matched;
        }

        var byRoom = reservation.Rooms.FirstOrDefault(rr => rr.RoomId.HasValue && rr.RoomId.Value == room.Id);
        if (byRoom != null)
            return byRoom;

        var byRoomType = reservation.Rooms.FirstOrDefault(rr => rr.RoomTypeId == room.RoomTypeId && !rr.RoomId.HasValue);
        if (byRoomType != null)
            return byRoomType;

        var firstUnassigned = reservation.Rooms.FirstOrDefault(rr => !rr.RoomId.HasValue);
        if (firstUnassigned != null)
            return firstUnassigned;

        return reservation.Rooms.First();
    }

    private async Task ApplyReservationRoomUpdatesAsync(Reservation reservation, System.Collections.Generic.List<CheckInReservationRoomUpdateDto> roomUpdates)
    {
        if (roomUpdates == null || roomUpdates.Count == 0)
            return;

        var updatesById = roomUpdates
            .Where(r => r.ReservationRoomId != Guid.Empty && r.RoomTypeId != Guid.Empty && r.RoomId != Guid.Empty)
            .GroupBy(r => r.ReservationRoomId)
            .ToDictionary(g => g.Key, g => g.Last());

        foreach (var roomLine in reservation.Rooms)
        {
            if (!updatesById.TryGetValue(roomLine.Id, out var update))
                continue;

            var roomType = await roomTypeRepository.FirstOrDefaultAsync(update.RoomTypeId);
            if (roomType == null)
                throw new UserFriendlyException(L("RoomTypeNotFound"));

            var selectedRoom = await roomRepository.FirstOrDefaultAsync(update.RoomId);
            if (selectedRoom == null)
                throw new UserFriendlyException(L("RoomNotFound"));

            roomLine.RoomTypeId = update.RoomTypeId;
            roomLine.RoomId = update.RoomId;
            roomLine.RoomTypeName = roomType.Name;
            roomLine.RoomNumber = selectedRoom.RoomNumber;

            await reservationRoomRepository.UpdateAsync(roomLine);
        }
    }

    private async Task ApplyReservationExtraBedUpdatesAsync(Reservation reservation, System.Collections.Generic.List<CheckInReservationExtraBedDto> extraBeds)
    {
        if (extraBeds == null)
            return;

        var existing = await reservationExtraBedRepository.GetAll()
            .Where(eb => eb.ReservationId == reservation.Id)
            .ToListAsync();

        foreach (var row in existing)
            await reservationExtraBedRepository.DeleteAsync(row);

        foreach (var row in extraBeds)
        {
            if (row.Quantity <= 0 || row.RatePerNight < 0)
                continue;

            var arrival = row.ArrivalDate.Date;
            var departure = row.DepartureDate.Date;
            if (arrival >= departure)
                continue;

            var nights = row.NumberOfNights > 0
                ? row.NumberOfNights
                : Math.Max(1, (int)(departure - arrival).TotalDays);
            var amount = row.Amount > 0
                ? row.Amount
                : row.Quantity * row.RatePerNight * nights;

            await reservationExtraBedRepository.InsertAsync(new ReservationExtraBed
            {
                ReservationId = reservation.Id,
                ExtraBedTypeId = row.ExtraBedTypeId,
                ArrivalDate = arrival,
                DepartureDate = departure,
                Quantity = row.Quantity,
                RatePerNight = row.RatePerNight,
                NumberOfNights = nights,
                Amount = amount,
                DiscountPercent = 0,
                DiscountAmount = 0,
                SeniorCitizenCount = 0,
                SeniorCitizenPercent = 20m,
                SeniorCitizenDiscountAmount = 0,
                NetAmount = amount,
            });
        }
    }

    private async Task EnsureRoomIsAvailableForReservationDatesAsync(Guid reservationId, Guid roomId, DateTime arrivalDate, DateTime departureDate)
    {
        var hasReservationConflict = await reservationRoomRepository.GetAll()
            .Include(rr => rr.Reservation)
            .Where(rr => rr.RoomId == roomId)
            .Where(rr => rr.ReservationId != reservationId)
            .Where(rr => rr.ArrivalDate < departureDate.Date && rr.DepartureDate > arrivalDate.Date)
            .AnyAsync(rr => rr.Reservation.Status == ReservationStatus.Pending
                            || rr.Reservation.Status == ReservationStatus.Confirmed
                            || rr.Reservation.Status == ReservationStatus.CheckedIn);

        if (hasReservationConflict)
            throw new UserFriendlyException(L("RoomIsNotAvailableForStayDates"));

        var hasStayConflict = await stayRoomRepository.GetAll()
            .Include(sr => sr.Stay)
            .Where(sr => sr.RoomId == roomId)
            .Where(sr => sr.AssignedAt.Date < departureDate.Date)
            .Where(sr => (sr.ReleasedAt.HasValue ? sr.ReleasedAt.Value.Date : sr.Stay.ExpectedCheckOutDateTime.Date) > arrivalDate.Date)
            .AnyAsync(sr => sr.Stay.Status == StayStatus.CheckedIn || sr.Stay.Status == StayStatus.InHouse);

        if (hasStayConflict)
            throw new UserFriendlyException(L("RoomIsNotAvailableForStayDates"));
    }

    private async Task AssignRoomToReservationRoomAsync(ReservationRoom reservationRoom, Room room)
    {
        reservationRoom.RoomId = room.Id;
        reservationRoom.RoomNumber = room.RoomNumber;
        await reservationRoomRepository.UpdateAsync(reservationRoom);
    }

    private Task UpdateInventoryAfterCheckInAsync(Stay stay, Room room)
    {
        // Inventory domain is not yet modeled in this repository. Keep this step explicit for flow compliance.
        Logger.Debug($"Inventory update hook executed for stay {stay.StayNo} room {room.RoomNumber}.");
        return Task.CompletedTask;
    }

    private async Task<Stay> CreateStayAsync(Guid? reservationId, Guest guest, Room room, DateTime expectedCheckOut, Guid[] additionalGuestIds)
    {
        var stayNo = await documentNumberService.GenerateNextDocumentNumberAsync("STAY", "STY-");

        var stay = new Stay
        {
            StayNo = stayNo,
            ReservationId = reservationId,
            GuestId = guest.Id,
            GuestName = $"{guest.FirstName} {guest.LastName}".Trim(),
            CheckInDateTime = Clock.Now,
            ExpectedCheckOutDateTime = expectedCheckOut.Date.AddHours(12),
            Status = StayStatus.InHouse,
            AssignedRoomId = room.Id,
            RoomNumber = room.RoomNumber
        };

        var stayId = await stayRepository.InsertAndGetIdAsync(stay);

        // Register primary guest
        await stayGuestRepository.InsertAsync(new StayGuest { StayId = stayId, GuestId = guest.Id, IsPrimary = true });

        // Register additional guests
        foreach (var gid in additionalGuestIds)
            await stayGuestRepository.InsertAsync(new StayGuest { StayId = stayId, GuestId = gid, IsPrimary = false });

        // Record room assignment
        await stayRoomRepository.InsertAsync(new StayRoom { StayId = stayId, RoomId = room.Id, AssignedAt = Clock.Now });

        // Mark room as occupied
        room.Status = RoomStatus.Occupied;
        await roomRepository.UpdateAsync(room);

        stay.Id = stayId;
        return stay;
    }

    private async Task<Folio> CreateFolioAsync(Stay stay)
    {
        var folioNo = await documentNumberService.GenerateNextDocumentNumberAsync("FOLIO", "FOL-");

        var folio = new Folio
        {
            FolioNo = folioNo,
            StayId = stay.Id,
            Status = FolioStatus.Open,
            Balance = 0
        };

        var folioId = await folioRepository.InsertAndGetIdAsync(folio);
        folio.Id = folioId;

        // Ensure principal row exists before inserting FolioPayment dependents.
        await CurrentUnitOfWork.SaveChangesAsync();

        return folio;
    }

    private async Task PostDepositTransferToFolioAsync(Folio folio, Reservation reservation, decimal depositTotal)
    {
        // Post reservation deposits as folio payments
        foreach (var deposit in reservation.Deposits.Where(d => !d.IsDeleted))
        {
            await folioPaymentRepository.InsertAsync(new FolioPayment
            {
                FolioId = folio.Id,
                PaymentMethodId = deposit.PaymentMethodId,
                Amount = deposit.Amount,
                PaidDate = Clock.Now,
                ReferenceNo = deposit.ReferenceNo,
                Notes = $"Transfer from reservation deposit {reservation.ReservationNo}"
            });
        }

        folio.Balance -= depositTotal;
        await folioRepository.UpdateAsync(folio);
    }

    private async Task PostAdvancePaymentAsync(
        Folio folio,
        decimal amount,
        Guid paymentMethodId,
        string reference,
        DateTime? paidDate = null,
        string notes = "Walk-in advance payment",
        FolioTransactionType? transactionType = null)
    {
        var effectivePaidDate = paidDate ?? Clock.Now;

        await folioPaymentRepository.InsertAsync(new FolioPayment
        {
            FolioId = folio.Id,
            PaymentMethodId = paymentMethodId,
            Amount = amount,
            PaidDate = effectivePaidDate,
            ReferenceNo = reference ?? string.Empty,
            Notes = notes ?? string.Empty
        });

        if (transactionType.HasValue)
        {
            await folioTransactionRepository.InsertAsync(new FolioTransaction
            {
                FolioId = folio.Id,
                TransactionDate = effectivePaidDate,
                TransactionType = transactionType.Value,
                Description = notes ?? string.Empty,
                Quantity = 1,
                UnitPrice = amount,
                Amount = amount,
                NetAmount = amount,
                IsVoided = false
            });
        }

        folio.Balance -= amount;
        await folioRepository.UpdateAsync(folio);
    }
}
