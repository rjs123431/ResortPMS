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
    IRepository<Stay, Guid> stayRepository,
    IRepository<Folio, Guid> folioRepository,
    IRepository<StayGuest, Guid> stayGuestRepository,
    IRepository<StayRoom, Guid> stayRoomRepository,
    IRepository<FolioPayment, Guid> folioPaymentRepository,
    IRepository<Guest, Guid> guestRepository,
    IRepository<Room, Guid> roomRepository,
    IDocumentNumberService documentNumberService
) : PMSAppServiceBase, ICheckInAppService
{
    [AbpAuthorize(PermissionNames.Pages_CheckIn_FromReservation)]
    [UnitOfWork]
    public async Task<CheckInResultDto> CheckInFromReservationAsync(CheckInFromReservationDto input)
    {
        var reservation = await reservationRepository.GetAll()
            .Include(r => r.Guest)
            .Include(r => r.Deposits)
            .FirstOrDefaultAsync(r => r.Id == input.ReservationId);

        if (reservation == null)
            throw new UserFriendlyException(L("ReservationNotFound"));

        if (reservation.Status == ReservationStatus.Cancelled || reservation.Status == ReservationStatus.NoShow)
            throw new UserFriendlyException(L("CannotCheckInCancelledOrNoShowReservation"));

        if (reservation.Status == ReservationStatus.CheckedIn || reservation.Status == ReservationStatus.Completed)
            throw new UserFriendlyException(L("ReservationAlreadyCheckedIn"));

        // Validate room
        var room = await ValidateAndGetRoomAsync(input.RoomId);

        var stay = await CreateStayAsync(
            reservationId: reservation.Id,
            guest: reservation.Guest,
            room: room,
            expectedCheckOut: input.ExpectedCheckOutDate ?? reservation.DepartureDate,
            additionalGuestIds: input.AdditionalGuestIds ?? []
        );

        // Transfer reservation deposits to folio as payments
        var folio = await CreateFolioAsync(stay);
        var depositTotal = reservation.Deposits.Where(d => !d.IsDeleted).Sum(d => d.Amount);
        if (depositTotal > 0)
        {
            await PostDepositTransferToFolioAsync(folio, reservation, depositTotal);
        }

        // Mark reservation as checked-in
        reservation.Status = ReservationStatus.CheckedIn;
        await reservationRepository.UpdateAsync(reservation);

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

    private async Task PostAdvancePaymentAsync(Folio folio, decimal amount, Guid paymentMethodId, string reference)
    {
        await folioPaymentRepository.InsertAsync(new FolioPayment
        {
            FolioId = folio.Id,
            PaymentMethodId = paymentMethodId,
            Amount = amount,
            PaidDate = Clock.Now,
            ReferenceNo = reference ?? string.Empty,
            Notes = "Walk-in advance payment"
        });

        folio.Balance -= amount;
        await folioRepository.UpdateAsync(folio);
    }
}
