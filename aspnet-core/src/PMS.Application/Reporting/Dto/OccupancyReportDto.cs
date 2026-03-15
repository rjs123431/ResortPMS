using System;
using System.Collections.Generic;

namespace PMS.Reporting.Dto;

public class OccupancyReportDto
{
    public DateTime FromDate { get; set; }
    public DateTime ToDate { get; set; }
    public int TotalRooms { get; set; }
    public int TotalRoomNightsAvailable { get; set; }
    public int RoomNightsSold { get; set; }
    public decimal OccupancyPercent { get; set; }
    public List<OccupancyByDayDto> ByDay { get; set; } = [];
}

public class OccupancyByDayDto
{
    public DateTime Date { get; set; }
    public int RoomsOccupied { get; set; }
    public int RoomsAvailable { get; set; }
    public decimal OccupancyPercent { get; set; }
}
