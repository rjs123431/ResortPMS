using System.ComponentModel.DataAnnotations;

namespace PMS.Application.App.RoomRack.Dto;

public class RoomRackSettingsDto
{
    [Range(1, 90)]
    public int DateRangeDays { get; set; } = 14;

    [StringLength(20)]
    public string ColorInHouse { get; set; } = "#DBEAFE";

    [StringLength(20)]
    public string ColorInHouseDark { get; set; } = "#1E3A8A";

    [StringLength(20)]
    public string ColorPendingReservation { get; set; } = "#FEF3C7";

    [StringLength(20)]
    public string ColorPendingReservationDark { get; set; } = "#713F12";

    [StringLength(20)]
    public string ColorConfirmedReservation { get; set; } = "#D1FAE5";

    [StringLength(20)]
    public string ColorConfirmedReservationDark { get; set; } = "#14532D";

    [StringLength(20)]
    public string ColorCheckoutToday { get; set; } = "#BFDBFE";

    [StringLength(20)]
    public string ColorCheckoutTodayDark { get; set; } = "#1E40AF";

    [StringLength(20)]
    public string ColorOnHoldRoom { get; set; } = "#E2E8F0";

    [StringLength(20)]
    public string ColorOnHoldRoomDark { get; set; } = "#475569";
}
