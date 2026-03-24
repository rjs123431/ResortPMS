using Abp.Application.Services;
using Abp.Application.Services.Dto;
using Abp.Authorization;
using Abp.Domain.Repositories;
using Abp.Domain.Uow;
using Abp.Timing;
using Abp.UI;
using Microsoft.EntityFrameworkCore;
using PMS.App.CheckIn.Dto;
using PMS.App.Events;
using Abp.Events.Bus;
using PMS.Application.App.PropertyTimes;
using PMS.Application.App.RoomDailyInventory;
using PMS.Application.App.Services;
using PMS.Auditing;
using PMS.Authorization;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace PMS.App.CheckIn;

public interface ICheckInAppService : IApplicationService
{
    Task<CheckInResultDto> CheckInFromReservationAsync(CheckInFromReservationDto input);
    Task<CheckInResultDto> CheckInWalkInAsync(CheckInWalkInDto input);
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
    IRepository<ChargeType, Guid> chargeTypeRepository,
    IRepository<Guest, Guid> guestRepository,
    IRepository<Room, Guid> roomRepository,
    IRepository<RoomType, Guid> roomTypeRepository,
    IDocumentNumberService documentNumberService,
    IPropertyTimesProvider propertyTimesProvider,
    IRoomDailyInventoryService roomDailyInventoryService,
    IMutationAuditService mutationAuditService,
    IFinancialAuditService financialAuditService,
    IEventBus eventBus
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
                .ThenInclude(eb => eb.ExtraBedType)
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

        // Validate primary room
        var primaryRoom = await ValidateAndGetRoomAsync(input.RoomId);

        await ApplyReservationRoomUpdatesAsync(reservation, input.ReservationRooms);
        await ApplyReservationExtraBedUpdatesAsync(reservation, input.ExtraBeds);

        var reservationRoom = ResolveReservationRoomForCheckIn(reservation, primaryRoom, input.ReservationRoomId);

        var requestedRoomIds = BuildRequestedRoomIds(input.RoomId, input.ReservationRooms);
        var rooms = new List<Room>();
        await roomDailyInventoryService.Ensure365DaysFromTodayAsync(requestedRoomIds);
        foreach (var roomId in requestedRoomIds)
        {
            var room = roomId == primaryRoom.Id ? primaryRoom : await ValidateAndGetRoomAsync(roomId);
            var available = await roomDailyInventoryService.IsRoomAvailableForDatesAsync(
                room.Id, reservation.ArrivalDate, reservation.DepartureDate,
                excludeReservationId: reservation.Id);
            if (!available)
                throw new UserFriendlyException(L("RoomIsNotAvailableForStayDates"));
            await EnsureRoomIsAvailableForReservationDatesAsync(
                reservationId: reservation.Id,
                roomId: room.Id,
                arrivalDate: reservation.ArrivalDate,
                departureDate: reservation.DepartureDate
            );
            rooms.Add(room);
        }

        var stay = await CreateStayAsync(
            reservationId: reservation.Id,
            channelId: reservation.ChannelId,
            guest: reservation.Guest,
            firstName: reservation.FirstName,
            lastName: reservation.LastName,
            phone: reservation.Phone,
            email: reservation.Email,
            primaryRoom: primaryRoom,
            assignedRooms: rooms,
            expectedCheckOut: input.ExpectedCheckOutDate ?? reservation.DepartureDate,
            additionalGuestIds: input.AdditionalGuestIds ?? []
        );

        // Keep reservation room assignment in sync with the selected check-in room.
        await AssignRoomToReservationRoomAsync(reservationRoom, primaryRoom);

        // Post reservation charges, then transfer reservation deposits to folio as payments
        var folio = await CreateFolioAsync(stay);
        await PostReservationChargesToFolioAsync(folio, reservation);

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
        reservation.MarkCheckedIn();
        await reservationRepository.UpdateAsync(reservation);

        // Extension point: sync room turn-over consumption (linen/amenities/etc.) when inventory module is available.
        await UpdateInventoryAfterCheckInAsync(stay, primaryRoom);

        await CurrentUnitOfWork.SaveChangesAsync();

        Logger.Info($"Check-in completed: Stay {stay.StayNo}, Rooms {string.Join(", ", rooms.Select(r => r.RoomNumber))}, Guest {reservation.Guest?.GuestCode ?? reservation.GuestName}.");

        await eventBus.TriggerAsync(new ReservationStatusChangedEvent
        {
            ReservationId = reservation.Id,
            ReservationNo = reservation.ReservationNo,
            PreviousStatus = ReservationStatus.Confirmed,
            NewStatus = ReservationStatus.CheckedIn,
            ChangedAt = Clock.Now
        });

        await eventBus.TriggerAsync(new StayCheckedInEvent
        {
            StayId = stay.Id,
            StayNo = stay.StayNo,
            ReservationId = reservation.Id,
            RoomId = primaryRoom.Id,
            RoomNumber = primaryRoom.RoomNumber,
            CheckInDateTime = stay.CheckInDateTime,
            ExpectedCheckOutDateTime = stay.ExpectedCheckOutDateTime
        });

        return new CheckInResultDto { StayId = stay.Id, StayNo = stay.StayNo, FolioId = folio.Id, FolioNo = folio.FolioNo };
    }

    [AbpAuthorize(PermissionNames.Pages_CheckIn_WalkIn)]
    [UnitOfWork]
    public async Task<CheckInResultDto> CheckInWalkInAsync(CheckInWalkInDto input)
    {
        Guest guest = null;
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

        var expectedCheckOut = input.ExpectedCheckOutDate ?? Clock.Now.Date.AddDays(1);
        var primaryRoom = await ValidateAndGetRoomAsync(input.RoomId);
        var requestedRoomIds = BuildRequestedRoomIds(input.RoomId, input.ReservationRooms);
        var rooms = new List<Room>();
        await roomDailyInventoryService.Ensure365DaysFromTodayAsync(requestedRoomIds);
        foreach (var roomId in requestedRoomIds)
        {
            var room = roomId == primaryRoom.Id ? primaryRoom : await ValidateAndGetRoomAsync(roomId);
            var available = await roomDailyInventoryService.IsRoomAvailableForDatesAsync(
                room.Id, Clock.Now.Date, expectedCheckOut.Date);
            if (!available)
                throw new UserFriendlyException(L("RoomIsNotAvailableForStayDates"));
            rooms.Add(room);
        }

        var stay = await CreateStayAsync(
            reservationId: null,
            channelId: null,
            guest: guest,
            firstName: input.FirstName ?? string.Empty,
            lastName: input.LastName ?? string.Empty,
            phone: input.Phone ?? string.Empty,
            email: input.Email ?? string.Empty,
            primaryRoom: primaryRoom,
            assignedRooms: rooms,
            expectedCheckOut: expectedCheckOut,
            additionalGuestIds: input.AdditionalGuestIds ?? []
        );

        var folio = await CreateFolioAsync(stay);

        await PostWalkInRoomChargesToFolioAsync(folio, input.ReservationRooms, input.RoomId, expectedCheckOut);
        await PostWalkInExtraBedChargesToFolioAsync(folio, input.ExtraBeds);

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

        await UpdateInventoryAfterCheckInAsync(stay, primaryRoom);
        await CurrentUnitOfWork.SaveChangesAsync();

        Logger.Info($"Walk-in check-in completed: Stay {stay.StayNo}, Rooms {string.Join(", ", rooms.Select(r => r.RoomNumber))}, Guest {guest?.GuestCode ?? stay.GuestName}.");

        await eventBus.TriggerAsync(new StayCheckedInEvent
        {
            StayId = stay.Id,
            StayNo = stay.StayNo,
            ReservationId = null,
            RoomId = primaryRoom.Id,
            RoomNumber = primaryRoom.RoomNumber,
            CheckInDateTime = stay.CheckInDateTime,
            ExpectedCheckOutDateTime = stay.ExpectedCheckOutDateTime
        });

        return new CheckInResultDto { StayId = stay.Id, StayNo = stay.StayNo, FolioId = folio.Id, FolioNo = folio.FolioNo };
    }

    [AbpAuthorize(PermissionNames.Pages_CheckIn_WalkIn)]
    [UnitOfWork]
    public async Task<CheckInResultDto> WalkInCheckInAsync(WalkInCheckInDto input)
    {
        if (input.AdvancePaymentAmount > 0 && !input.PaymentMethodId.HasValue)
            throw new UserFriendlyException(L("PaymentMethodIsRequired"));

        var convertedInput = new CheckInWalkInDto
        {
            GuestId = input.GuestId,
            RoomId = input.RoomId,
            ExpectedCheckOutDate = input.ExpectedCheckOutDate,
            FirstName = input.FirstName,
            LastName = input.LastName,
            Phone = input.Phone,
            Email = input.Email,
            AdditionalGuestIds = input.AdditionalGuestIds ?? [],
            Payments = input.AdvancePaymentAmount > 0 && input.PaymentMethodId.HasValue
                ? [new CheckInReservationPaymentDto
                    {
                        PaymentMethodId = input.PaymentMethodId.Value,
                        Amount = input.AdvancePaymentAmount,
                        PaidDate = Clock.Now,
                        ReferenceNo = input.PaymentReference
                    }]
                : []
        };

        return await CheckInWalkInAsync(convertedInput);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private async Task<Room> ValidateAndGetRoomAsync(Guid roomId)
    {
        var room = await roomRepository.GetAll()
            .Include(r => r.RoomType)
            .FirstOrDefaultAsync(r => r.Id == roomId);

        if (room == null)
            throw new UserFriendlyException(L("RoomNotFound"));

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
        var arrivalDay = arrivalDate;
        var departureDay = departureDate;

        var hasReservationConflict = await reservationRoomRepository.GetAll()
            .AsNoTracking()
            .Include(rr => rr.Reservation)
            .Where(rr => rr.RoomId == roomId)
            .Where(rr => rr.ReservationId != reservationId)
            .Where(rr => rr.ArrivalDate < departureDay && rr.DepartureDate > arrivalDay)
            .FirstOrDefaultAsync(rr => rr.Reservation.Status == ReservationStatus.Pending
                            || rr.Reservation.Status == ReservationStatus.Confirmed);

        if (hasReservationConflict != null)
            throw new UserFriendlyException(L("RoomIsNotAvailableForStayDates"));

        var hasStayConflict = await stayRoomRepository.GetAll()
            .AsNoTracking()
            .Where(sr => sr.RoomId == roomId && !sr.ReleasedAt.HasValue)
            .Where(sr => sr.ArrivalDate < departureDay && sr.DepartureDate > arrivalDay)
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

    private async Task UpdateInventoryAfterCheckInAsync(Stay stay, Room room)
    {
        var stayRooms = await stayRoomRepository.GetAll()
            .Where(sr => sr.StayId == stay.Id)
            .ToListAsync();
        foreach (var sr in stayRooms)
        {
            var claimed = await roomDailyInventoryService.TrySetInHouseAsync(
                sr.RoomId, sr.ArrivalDate, sr.DepartureDate, stay.Id,
                reservationId: stay.ReservationId);

            if (!claimed)
                throw new UserFriendlyException(L("RoomNoLongerAvailablePleaseSelectAnother"));
        }
    }

    private static List<Guid> BuildRequestedRoomIds(Guid primaryRoomId, List<CheckInReservationRoomUpdateDto> reservationRooms)
    {
        var roomIds = reservationRooms?
            .Where(x => x.RoomId != Guid.Empty)
            .Select(x => x.RoomId)
            .ToList() ?? [];

        if (!roomIds.Contains(primaryRoomId))
            roomIds.Insert(0, primaryRoomId);

        return roomIds.Distinct().ToList();
    }

    private async Task<Stay> CreateStayAsync(
        Guid? reservationId,
        Guid? channelId,
        Guest guest,
        string firstName,
        string lastName,
        string phone,
        string email,
        Room primaryRoom,
        IReadOnlyCollection<Room> assignedRooms,
        DateTime expectedCheckOut,
        Guid[] additionalGuestIds)
    {
        var stayNo = await documentNumberService.GenerateNextDocumentNumberAsync("STAY", "STY-");
        var effectiveRooms = (assignedRooms == null || assignedRooms.Count == 0 ? [primaryRoom] : assignedRooms)
            .GroupBy(r => r.Id)
            .Select(g => g.First())
            .ToList();

        var (_, checkOutTime) = await propertyTimesProvider.GetDefaultCheckInCheckOutTimesAsync();
        var guestName = !string.IsNullOrWhiteSpace(firstName) || !string.IsNullOrWhiteSpace(lastName)
            ? $"{firstName} {lastName}".Trim()
            : (guest != null ? $"{guest.FirstName} {guest.LastName}".Trim() : string.Empty);
        var stay = new Stay
        {
            StayNo = stayNo,
            ReservationId = reservationId,
            ChannelId = channelId,
            GuestId = guest?.Id,
            GuestName = guestName,
            FirstName = firstName ?? guest?.FirstName ?? string.Empty,
            LastName = lastName ?? guest?.LastName ?? string.Empty,
            Phone = phone ?? guest?.Phone ?? string.Empty,
            Email = email ?? guest?.Email ?? string.Empty,
            CheckInDateTime = Clock.Now,
            ExpectedCheckOutDateTime = expectedCheckOut.Date.Add(checkOutTime),
            Status = StayStatus.InHouse,
            AssignedRoom = primaryRoom,
        };

        var stayId = await stayRepository.InsertAndGetIdAsync(stay);
        stay.Id = stayId;

        await mutationAuditService.RecordAsync(
            "Stay",
            stayId.ToString(),
            "Created",
            null,
            new { stay.StayNo, stay.GuestName, stay.CheckInDateTime, stay.ExpectedCheckOutDateTime, stay.Status },
            "CreateStayAsync");

        if (guest != null)
        {
            await stayGuestRepository.InsertAsync(new StayGuest { StayId = stayId, GuestId = guest.Id, IsPrimary = true });
            foreach (var gid in additionalGuestIds)
                await stayGuestRepository.InsertAsync(new StayGuest { StayId = stayId, GuestId = gid, IsPrimary = false });
        }

        var now = Clock.Now;
        var arrivalDate = now.Date;
        var departureDate = expectedCheckOut.Date;

        // Record all requested room assignments for this stay.
        foreach (var room in effectiveRooms)
        {
            await stayRoomRepository.InsertAsync(new StayRoom
            {
                StayId = stayId,
                RoomTypeId = room.RoomTypeId,
                RoomId = room.Id,
                AssignedAt = now,
                ArrivalDate = arrivalDate,
                DepartureDate = departureDate,
                OriginalRoomTypeId = room.RoomTypeId,
                OriginalRoomId = room.Id
            });
        }

        // Room occupancy is tracked via RoomDailyInventory (SetInHouseAsync); no Room.OperationalStatus.

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

        await mutationAuditService.RecordAsync(
            "Folio",
            folio.Id.ToString(),
            "Created",
            null,
            new { folio.FolioNo, folio.StayId, folio.Status },
            "CreateFolioAsync");

        // Ensure principal row exists before inserting FolioPayment dependents.
        await CurrentUnitOfWork.SaveChangesAsync();

        return folio;
    }

    private async Task PostDepositTransferToFolioAsync(Folio folio, Reservation reservation, decimal depositTotal)
    {
        // Post reservation deposits as folio payments
        foreach (var deposit in reservation.Deposits.Where(d => !d.IsDeleted))
        {
            var payment = new FolioPayment
            {
                FolioId = folio.Id,
                PaymentMethodId = deposit.PaymentMethodId,
                Amount = deposit.Amount,
                PaidDate = Clock.Now,
                ReferenceNo = deposit.ReferenceNo,
                Notes = $"Transfer from reservation deposit {reservation.ReservationNo}"
            };
            var paymentId = await folioPaymentRepository.InsertAndGetIdAsync(payment);
            await financialAuditService.RecordPaymentCreatedAsync(
                paymentId, folio.Id, folio.StayId, payment.Amount,
                $"Transfer from reservation deposit {reservation.ReservationNo}", null);
        }

        folio.Balance -= depositTotal;
        await folioRepository.UpdateAsync(folio);
    }

    private async Task PostReservationChargesToFolioAsync(Folio folio, Reservation reservation)
    {
        var roomChargeTypeId = await ResolveChargeTypeIdByRoomChargeTypeAsync(RoomChargeType.Room);
        var extraBedChargeTypeId = await ResolveChargeTypeIdByRoomChargeTypeAsync(RoomChargeType.ExtraBed);

        decimal totalPostedCharges = 0m;

        foreach (var roomLine in reservation.Rooms)
        {
            var netAmount = roomLine.NetAmount > 0
                ? roomLine.NetAmount
                : Math.Max(0m, roomLine.Amount - roomLine.DiscountAmount - roomLine.SeniorCitizenDiscountAmount);

            if (netAmount <= 0)
                continue;

            var roomDesc = $"Room charge - {roomLine.RoomTypeName}" +
                           (string.IsNullOrWhiteSpace(roomLine.RoomNumber) ? string.Empty : $" ({roomLine.RoomNumber})");
            var txId = await folioTransactionRepository.InsertAndGetIdAsync(new FolioTransaction
            {
                FolioId = folio.Id,
                TransactionDate = Clock.Now,
                TransactionType = FolioTransactionType.Charge,
                ChargeTypeId = roomChargeTypeId,
                Description = roomDesc,
                Quantity = 1,
                UnitPrice = netAmount,
                Amount = roomLine.Amount > 0 ? roomLine.Amount : netAmount,
                DiscountAmount = roomLine.DiscountAmount + roomLine.SeniorCitizenDiscountAmount,
                NetAmount = netAmount,
                IsVoided = false
            });
            await financialAuditService.RecordTransactionCreatedAsync(txId, folio.Id, folio.StayId, netAmount, roomDesc, null);

            totalPostedCharges += netAmount;
        }

        foreach (var extraBedLine in reservation.ExtraBeds)
        {
            var netAmount = extraBedLine.NetAmount > 0
                ? extraBedLine.NetAmount
                : Math.Max(0m, extraBedLine.Amount - extraBedLine.DiscountAmount - extraBedLine.SeniorCitizenDiscountAmount);

            if (netAmount <= 0)
                continue;

            var extraBedName = extraBedLine.ExtraBedType?.Name ?? "Extra bed";
            var extraDesc = $"Extra bed charge - {extraBedName}";

            var extraTxId = await folioTransactionRepository.InsertAndGetIdAsync(new FolioTransaction
            {
                FolioId = folio.Id,
                TransactionDate = Clock.Now,
                TransactionType = FolioTransactionType.Charge,
                ChargeTypeId = extraBedChargeTypeId,
                Description = extraDesc,
                Quantity = extraBedLine.Quantity > 0 ? extraBedLine.Quantity : 1,
                UnitPrice = extraBedLine.RatePerNight,
                Amount = extraBedLine.Amount > 0 ? extraBedLine.Amount : netAmount,
                DiscountAmount = extraBedLine.DiscountAmount + extraBedLine.SeniorCitizenDiscountAmount,
                NetAmount = netAmount,
                IsVoided = false
            });
            await financialAuditService.RecordTransactionCreatedAsync(extraTxId, folio.Id, folio.StayId, netAmount, extraDesc, null);

            totalPostedCharges += netAmount;
        }

        if (totalPostedCharges > 0)
        {
            folio.Balance += totalPostedCharges;
            await folioRepository.UpdateAsync(folio);
        }
    }

    private async Task PostWalkInExtraBedChargesToFolioAsync(Folio folio, System.Collections.Generic.List<CheckInReservationExtraBedDto> extraBeds)
    {
        if (extraBeds == null || extraBeds.Count == 0)
            return;

        var extraBedChargeTypeId = await ResolveChargeTypeIdByRoomChargeTypeAsync(RoomChargeType.ExtraBed);
        decimal totalPostedCharges = 0m;

        foreach (var row in extraBeds)
        {
            if (row.Quantity <= 0 || row.RatePerNight < 0)
                continue;

            var netAmount = row.Amount > 0
                ? row.Amount
                : row.Quantity * row.RatePerNight * (row.NumberOfNights > 0 ? row.NumberOfNights : 1);

            if (netAmount <= 0)
                continue;

            var walkInExtraTxId = await folioTransactionRepository.InsertAndGetIdAsync(new FolioTransaction
            {
                FolioId = folio.Id,
                TransactionDate = Clock.Now,
                TransactionType = FolioTransactionType.Charge,
                ChargeTypeId = extraBedChargeTypeId,
                Description = "Extra bed charge",
                Quantity = row.Quantity,
                UnitPrice = row.RatePerNight,
                Amount = netAmount,
                DiscountAmount = 0,
                NetAmount = netAmount,
                IsVoided = false
            });
            await financialAuditService.RecordTransactionCreatedAsync(walkInExtraTxId, folio.Id, folio.StayId, netAmount, "Extra bed charge", null);

            totalPostedCharges += netAmount;
        }

        if (totalPostedCharges > 0)
        {
            folio.Balance += totalPostedCharges;
            await folioRepository.UpdateAsync(folio);
        }
    }

    private async Task PostWalkInRoomChargesToFolioAsync(
        Folio folio,
        System.Collections.Generic.List<CheckInReservationRoomUpdateDto> reservationRooms,
        Guid fallbackRoomId,
        DateTime expectedCheckOut)
    {
        var stayNights = Math.Max(1, (int)(expectedCheckOut.Date - Clock.Now.Date).TotalDays);
        var roomChargeTypeId = await ResolveChargeTypeIdByRoomChargeTypeAsync(RoomChargeType.Room);

        var roomLines = reservationRooms?.Where(x => x.RoomId != Guid.Empty).ToList() ?? [];
        if (roomLines.Count == 0)
        {
            roomLines.Add(new CheckInReservationRoomUpdateDto
            {
                RoomId = fallbackRoomId,
                RoomTypeId = Guid.Empty,
                ReservationRoomId = Guid.Empty,
                NumberOfNights = stayNights
            });
        }

        var uniqueRoomIds = roomLines
            .Select(x => x.RoomId)
            .Where(x => x != Guid.Empty)
            .Distinct()
            .ToList();

        if (uniqueRoomIds.Count == 0)
            return;

        var roomsById = await roomRepository.GetAll()
            .Where(r => uniqueRoomIds.Contains(r.Id))
            .Select(r => new { r.Id, r.RoomTypeId, r.RoomNumber })
            .ToListAsync();

        var roomTypeIds = roomsById.Select(x => x.RoomTypeId).Distinct().ToList();
        var roomTypes = await roomTypeRepository.GetAll()
            .Where(rt => roomTypeIds.Contains(rt.Id))
            .Select(rt => new { rt.Id, rt.Name })
            .ToListAsync();

        var roomTypeById = roomTypes.ToDictionary(x => x.Id, x => x);
        var lineByRoomId = roomLines
            .GroupBy(x => x.RoomId)
            .ToDictionary(g => g.Key, g => g.First());
        decimal totalPostedCharges = 0m;

        foreach (var room in roomsById)
        {
            if (!roomTypeById.TryGetValue(room.RoomTypeId, out var roomType))
                continue;

            lineByRoomId.TryGetValue(room.Id, out var inputLine);

            var nights = inputLine?.NumberOfNights > 0 ? inputLine.NumberOfNights : stayNights;
            var unitPrice = inputLine?.RatePerNight > 0 ? inputLine.RatePerNight : 0m;
            var fallbackAmount = unitPrice * nights;

            var amount = inputLine?.Amount > 0 ? inputLine.Amount : fallbackAmount;
            var discountAmount = inputLine?.DiscountAmount > 0 ? inputLine.DiscountAmount : 0m;
            var netAmount = inputLine?.NetAmount > 0
                ? inputLine.NetAmount
                : Math.Max(0m, amount - discountAmount);

            if (netAmount <= 0)
                continue;

            var walkInRoomDesc = $"Room charge - {roomType.Name} ({room.RoomNumber})";
            var walkInRoomTxId = await folioTransactionRepository.InsertAndGetIdAsync(new FolioTransaction
            {
                FolioId = folio.Id,
                TransactionDate = Clock.Now,
                TransactionType = FolioTransactionType.Charge,
                ChargeTypeId = roomChargeTypeId,
                Description = walkInRoomDesc,
                Quantity = 1,
                UnitPrice = unitPrice,
                Amount = amount,
                DiscountAmount = discountAmount,
                NetAmount = netAmount,
                IsVoided = false
            });
            await financialAuditService.RecordTransactionCreatedAsync(walkInRoomTxId, folio.Id, folio.StayId, netAmount, walkInRoomDesc, null);

            totalPostedCharges += netAmount;
        }

        if (totalPostedCharges > 0)
        {
            folio.Balance += totalPostedCharges;
            await folioRepository.UpdateAsync(folio);
        }
    }

    private async Task<Guid> ResolveChargeTypeIdByRoomChargeTypeAsync(RoomChargeType roomChargeType)
    {
        var activeChargeTypeId = await chargeTypeRepository.GetAll()
            .Where(x => x.IsActive && x.RoomChargeType == roomChargeType)
            .Select(x => x.Id)
            .FirstOrDefaultAsync();

        if (activeChargeTypeId != Guid.Empty)
        {
            return activeChargeTypeId;
        }

        var chargeTypeId = await chargeTypeRepository.GetAll()
            .Where(x => x.RoomChargeType == roomChargeType)
            .Select(x => x.Id)
            .FirstOrDefaultAsync();

        if (chargeTypeId == Guid.Empty)
        {
            throw new UserFriendlyException($"No ChargeType is configured for RoomChargeType '{roomChargeType}'.");
        }

        return chargeTypeId;
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

        var payment = new FolioPayment
        {
            FolioId = folio.Id,
            PaymentMethodId = paymentMethodId,
            Amount = amount,
            PaidDate = effectivePaidDate,
            ReferenceNo = reference ?? string.Empty,
            Notes = notes ?? string.Empty
        };
        var advancePaymentId = await folioPaymentRepository.InsertAndGetIdAsync(payment);
        await financialAuditService.RecordPaymentCreatedAsync(advancePaymentId, folio.Id, folio.StayId, amount, notes ?? string.Empty, null);

        if (transactionType.HasValue)
        {
            var advTxId = await folioTransactionRepository.InsertAndGetIdAsync(new FolioTransaction
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
            await financialAuditService.RecordTransactionCreatedAsync(advTxId, folio.Id, folio.StayId, amount, notes ?? string.Empty, null);
        }

        folio.Balance -= amount;
        await folioRepository.UpdateAsync(folio);
    }
}
