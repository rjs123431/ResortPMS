using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace PMS.Application.App.RoomDailyInventory;

public interface IRoomDailyInventoryService
{
    /// <summary>
    /// Ensures inventory rows exist for the given rooms and date range (up to 365 days from today).
    /// Adds rows only where they do not exist; does not overwrite existing rows.
    /// </summary>
    Task EnsureInventoryForDateRangeAsync(IReadOnlyList<Guid> roomIds, DateTime startDate, DateTime endDate);

    /// <summary>
    /// Ensures 365 days of inventory from today for the given rooms. Call before availability checks or updates.
    /// </summary>
    Task Ensure365DaysFromTodayAsync(IReadOnlyList<Guid> roomIds);

    /// <summary>
    /// Sets daily inventory to Reserved for the room and date range (arrival inclusive, departure exclusive).
    /// Ensures rows exist first, then updates.
    /// </summary>
    Task SetReservedAsync(Guid roomId, DateTime arrivalDate, DateTime departureDate, Guid reservationId);

    /// <summary>
    /// Atomically reserves inventory only where status is Vacant. Returns true if exactly (end - start) days
    /// were updated; false if another request reserved some nights (prevents overbooking). Must run inside
    /// the caller's unit of work so that a subsequent reservation insert failure rolls back this update.
    /// </summary>
    Task<bool> TryReserveInventoryAsync(Guid roomId, DateTime arrivalDate, DateTime departureDate, Guid reservationId);

    /// <summary>
    /// Sets daily inventory to InHouse for the room and date range.
    /// </summary>
    Task SetInHouseAsync(Guid roomId, DateTime arrivalDate, DateTime departureDate, Guid stayId);

    /// <summary>
    /// Sets daily inventory to Vacant for the room and date range; clears ReservationId and StayId.
    /// </summary>
    Task SetVacantAsync(Guid roomId, DateTime fromDate, DateTime toDate);

    /// <summary>
    /// Returns true if the room can be used for the given dates: all days in range are Vacant (or Reserved/InHouse for the excluded ids),
    /// and the room's operational/housekeeping status allows it. Use for reservation and check-in validation.
    /// </summary>
    /// <param name="excludeReservationId">When checking for an existing reservation update, pass its id so its own Reserved days are allowed.</param>
    /// <param name="excludeStayId">When checking for an existing stay, pass its id so its own InHouse days are allowed.</param>
    Task<bool> IsRoomAvailableForDatesAsync(
        Guid roomId,
        DateTime arrivalDate,
        DateTime departureDate,
        Guid? excludeReservationId = null,
        Guid? excludeStayId = null);
}
