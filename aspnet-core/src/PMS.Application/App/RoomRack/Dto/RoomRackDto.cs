using System;
using System.Collections.Generic;
using PMS.App.Rooms.Dto;

namespace PMS.Application.App.RoomRack.Dto;

/// <summary>Input for room rack grid: date range from the page filter.</summary>
public class GetRoomRackInput
{
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
}

/// <summary>One cell in the room rack: room + date + inventory status and optional reservation/stay display info.</summary>
public class RoomRackDayCellDto
{
    public Guid RoomId { get; set; }
    public string RoomNumber { get; set; } = string.Empty;
    public DateTime InventoryDate { get; set; }
    public int Status { get; set; }
    public Guid? ReservationId { get; set; }
    public Guid? StayId { get; set; }
    public string ReservationNo { get; set; } = string.Empty;
    public string StayNo { get; set; } = string.Empty;
    public string GuestName { get; set; } = string.Empty;
    public Guid? ChannelId { get; set; }
    public string ChannelName { get; set; } = string.Empty;
    public string ChannelIcon { get; set; } = string.Empty;
    /// <summary>Reservation status when this cell is Reserved (Status=2). Confirmed=2 for green, Pending=1 for yellow.</summary>
    public int? ReservationStatus { get; set; }
    /// <summary>True when this date is the arrival date for the reservation/stay in this room (used to draw bar from 2pm on first day).</summary>
    public bool IsArrivalDate { get; set; }
    /// <summary>True when this date is the departure date for the reservation/stay in this room (used to draw half-day on last day).</summary>
    public bool IsDepartureDate { get; set; }
    /// <summary>When true, this cell is included in the "No. of bookings" count (reservations with a room that are draft, pending, or confirmed).</summary>
    public bool CountInBookings { get; set; }
    /// <summary>Maintenance request title when this cell is OutOfOrder (Status=4).</summary>
    public string MaintenanceTitle { get; set; } = string.Empty;
    /// <summary>Maintenance request description when this cell is OutOfOrder (Status=4).</summary>
    public string MaintenanceReason { get; set; } = string.Empty;
}

/// <summary>One unassigned reservation booking (no room assigned) for the bookings count/dialog per room type and date.</summary>
public class UnassignedBookingDto
{
    public string RoomTypeName { get; set; } = string.Empty;
    public DateTime InventoryDate { get; set; }
    public Guid ReservationId { get; set; }
    public string ReservationNo { get; set; } = string.Empty;
    public string GuestName { get; set; } = string.Empty;
    public string ChannelName { get; set; } = string.Empty;
    public string ChannelIcon { get; set; } = string.Empty;
    public int ReservationStatus { get; set; }
}

/// <summary>Result of GetRoomInfoAsync: rooms list and daily inventory cells for the date range.</summary>
public class GetRoomRackResultDto
{
    public List<RoomListDto> Rooms { get; set; } = [];
    public List<RoomRackDayCellDto> Cells { get; set; } = [];
    /// <summary>Reservations (draft, pending, confirmed) without a room assigned — shown in bookings count/dialog only.</summary>
    public List<UnassignedBookingDto> UnassignedBookings { get; set; } = [];
}
