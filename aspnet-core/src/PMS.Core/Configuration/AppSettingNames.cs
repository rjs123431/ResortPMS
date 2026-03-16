namespace PMS.Configuration
{
    public static class AppSettingNames
    {
        public const string UiTheme = "App.UiTheme";
        
        public const string PublicApiKey = "App.Public.ApiKey";

        public static class Email
        {
            public const string UseHostDefaultEmailSettings = "App.Email.UseHostDefaultEmailSettings";
        }

        /// <summary>Front Desk Room Rack settings (date range, color codes).</summary>
        public static class FrontDesk_RoomRack
        {
            public const string DateRangeDays = "App.FrontDesk_RoomRack.DateRangeDays";
            public const string ColorInHouse = "App.FrontDesk_RoomRack.ColorInHouse";
            public const string ColorInHouseDark = "App.FrontDesk_RoomRack.ColorInHouseDark";
            public const string ColorPendingReservation = "App.FrontDesk_RoomRack.ColorPendingReservation";
            public const string ColorPendingReservationDark = "App.FrontDesk_RoomRack.ColorPendingReservationDark";
            public const string ColorConfirmedReservation = "App.FrontDesk_RoomRack.ColorConfirmedReservation";
            public const string ColorConfirmedReservationDark = "App.FrontDesk_RoomRack.ColorConfirmedReservationDark";
            public const string ColorCheckoutToday = "App.FrontDesk_RoomRack.ColorCheckoutToday";
            public const string ColorCheckoutTodayDark = "App.FrontDesk_RoomRack.ColorCheckoutTodayDark";
            public const string ColorOnHoldRoom = "App.FrontDesk_RoomRack.ColorOnHoldRoom";
            public const string ColorOnHoldRoomDark = "App.FrontDesk_RoomRack.ColorOnHoldRoomDark";
        }
    }
}





