using System;

namespace PMS.Reporting.Dto;

public class DashboardKpisDto
{
    public DateTime AsOfDate { get; set; }
    public int TotalRooms { get; set; }
    public int InHouseRooms { get; set; }
    public int InHouseStays { get; set; }
    public int ArrivalsToday { get; set; }
    public int DeparturesToday { get; set; }
    public int ReservationsToday { get; set; }
    public int NoShowsToday { get; set; }
    public int CancellationsToday { get; set; }
    public decimal OccupancyPercent { get; set; }
    public decimal Adr { get; set; }
    public decimal RevPar { get; set; }
    public decimal RoomRevenueToday { get; set; }
    public decimal TotalRevenueToday { get; set; }
    public decimal PaymentsToday { get; set; }
}
