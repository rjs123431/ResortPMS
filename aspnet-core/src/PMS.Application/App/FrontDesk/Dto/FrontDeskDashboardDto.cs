using System;

namespace PMS.App.FrontDesk.Dto;

public class FrontDeskDashboardDto
{
    public DateTime AsOfDate { get; set; }

    public int ArrivalsToday { get; set; }
    public int DeparturesToday { get; set; }

    public int OccupiedRooms { get; set; }
    public int VacantRooms { get; set; }

    public int RoomsDirty { get; set; }
    public int RoomsOutOfOrder { get; set; }
}

public class FrontDeskArrivalRowDto
{
    public Guid StayId { get; set; }

    public string StayNo { get; set; } = string.Empty;
    public string GuestName { get; set; } = string.Empty;

    public string RoomNumber { get; set; } = string.Empty;

    public DateTime? EstimatedArrivalTime { get; set; }
}

public class FrontDeskDepartureRowDto
{
    public Guid StayId { get; set; }

    public string StayNo { get; set; } = string.Empty;
    public string GuestName { get; set; } = string.Empty;

    public string RoomNumber { get; set; } = string.Empty;

    public DateTime? EstimatedDepartureTime { get; set; }

    public decimal? Balance { get; set; }
}


