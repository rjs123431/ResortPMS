using System.ComponentModel.DataAnnotations;

namespace PMS.Application.App.RoomRack.Dto;

public class RoomRackSettingsDto
{
    [Range(1, 90)]
    public int DateRangeDays { get; set; } = 14;

    [StringLength(20)]
    public string ColorInHouse { get; set; } = "#DCFCE7";

    [StringLength(20)]
    public string ColorInHouseDark { get; set; } = "#166534";

    [StringLength(20)]
    public string ColorPendingReservation { get; set; } = "#DBEAFE";

    [StringLength(20)]
    public string ColorPendingReservationDark { get; set; } = "#1E40AF";

    [StringLength(20)]
    public string ColorConfirmedReservation { get; set; } = "#DCFCE7";

    [StringLength(20)]
    public string ColorConfirmedReservationDark { get; set; } = "#166534";

    [StringLength(20)]
    public string ColorCheckoutToday { get; set; } = "#FFEDD5";

    [StringLength(20)]
    public string ColorCheckoutTodayDark { get; set; } = "#9A3412";

    [StringLength(20)]
    public string ColorOnHoldRoom { get; set; } = "#F3F4F6";

    [StringLength(20)]
    public string ColorOnHoldRoomDark { get; set; } = "#374151";
}
