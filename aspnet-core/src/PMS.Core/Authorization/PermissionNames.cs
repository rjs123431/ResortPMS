namespace PMS.Authorization
{
    public static class PermissionNames
    {
        // HOST
        public const string Pages_Roles = "Pages.Roles";
        public const string Pages_Users = "Pages.Users";
        public const string Pages_Tenants = "Pages.Tenants";
        public const string Pages_HangfireDasboard = "Pages.HangfireDasboard";
        public const string Pages_Global_Notifications = "Pages.Global.Notifications";

        public const string Applications_Web = "WebApp";

        // SETUP
        public const string Pages_Setup = "Pages.Setup";

        // TRANSACTIONS (hotel workflow)
        public const string Pages_Transactions = "Pages.Transactions";

        public const string Pages_Admin = "Pages.Admin";
        public const string Pages_Admin_Roles = "Pages.Admin.Roles";
        public const string Pages_Admin_Roles_Create = "Pages.Admin.Roles.Create";
        public const string Pages_Admin_Roles_Edit = "Pages.Admin.Roles.Edit";

        public const string Pages_Admin_Users = "Pages.Admin.Users";
        public const string Pages_Admin_Users_Create = "Pages.Admin.Users.Create";
        public const string Pages_Admin_Users_Edit = "Pages.Admin.Users.Edit";

        public const string Pages_Admin_Settings = "Pages.Admin.Settings";
        public const string Pages_Admin_AuditTrail = "Pages.Admin.AuditTrail";

        public const string Pages_Reports = "Pages.Reports";

        // ── PMS HOTEL WORKFLOW ──────────────────────────────────────────────────────

        // SETUP — Guests
        public const string Pages_Guests = "Pages.Guests";
        public const string Pages_Guests_Create = "Pages.Guests.Create";
        public const string Pages_Guests_Edit = "Pages.Guests.Edit";

        // SETUP — Room Types
        public const string Pages_RoomTypes = "Pages.RoomTypes";
        public const string Pages_RoomTypes_Create = "Pages.RoomTypes.Create";
        public const string Pages_RoomTypes_Edit = "Pages.RoomTypes.Edit";

        // SETUP — Room Rate Plans
        public const string Pages_RoomRatePlans = "Pages.RoomRatePlans";
        public const string Pages_RoomRatePlans_Create = "Pages.RoomRatePlans.Create";
        public const string Pages_RoomRatePlans_Edit = "Pages.RoomRatePlans.Edit";

        // SETUP — Rooms
        public const string Pages_Rooms = "Pages.Rooms";
        public const string Pages_Rooms_Create = "Pages.Rooms.Create";
        public const string Pages_Rooms_Edit = "Pages.Rooms.Edit";

        // SETUP — Charge Types
        public const string Pages_ChargeTypes = "Pages.ChargeTypes";
        public const string Pages_ChargeTypes_Create = "Pages.ChargeTypes.Create";
        public const string Pages_ChargeTypes_Edit = "Pages.ChargeTypes.Edit";

        // SETUP — Payment Methods
        public const string Pages_PaymentMethods = "Pages.PaymentMethods";
        public const string Pages_PaymentMethods_Create = "Pages.PaymentMethods.Create";
        public const string Pages_PaymentMethods_Edit = "Pages.PaymentMethods.Edit";

        // SETUP — Extra Bed Types
        public const string Pages_ExtraBedTypes = "Pages.ExtraBedTypes";
        public const string Pages_ExtraBedTypes_Create = "Pages.ExtraBedTypes.Create";
        public const string Pages_ExtraBedTypes_Edit = "Pages.ExtraBedTypes.Edit";

        // SETUP — Staff
        public const string Pages_Staff = "Pages.Staff";
        public const string Pages_Staff_Create = "Pages.Staff.Create";
        public const string Pages_Staff_Edit = "Pages.Staff.Edit";

        // RESERVATIONS
        public const string Pages_Reservations = "Pages.Reservations";
        public const string Pages_Reservations_Create = "Pages.Reservations.Create";
        public const string Pages_Reservations_Edit = "Pages.Reservations.Edit";
        public const string Pages_Reservations_Cancel = "Pages.Reservations.Cancel";
        public const string Pages_Reservations_Deposit = "Pages.Reservations.Deposit";

        // CHECK-IN
        public const string Pages_CheckIn = "Pages.CheckIn";
        public const string Pages_CheckIn_FromReservation = "Pages.CheckIn.FromReservation";
        public const string Pages_CheckIn_WalkIn = "Pages.CheckIn.WalkIn";

        // STAY (In-House)
        public const string Pages_Stays = "Pages.Stays";
        public const string Pages_Stays_PostCharge = "Pages.Stays.PostCharge";
        public const string Pages_Stays_PostPayment = "Pages.Stays.PostPayment";
        public const string Pages_Stays_Transfer = "Pages.Stays.Transfer";
        public const string Pages_Stays_Extend = "Pages.Stays.Extend";
        public const string Pages_Stays_VoidTransaction = "Pages.Stays.VoidTransaction";

        // CHECKOUT
        public const string Pages_CheckOut = "Pages.CheckOut";
        public const string Pages_CheckOut_Process = "Pages.CheckOut.Process";
        public const string Pages_CheckOut_WriteOff = "Pages.CheckOut.WriteOff";
        public const string Pages_CheckOut_Print = "Pages.CheckOut.Print";

        // POS (F&B)
        public const string Pages_POS = "Pages.POS";
        public const string Pages_POS_Orders = "Pages.POS.Orders";
        public const string Pages_POS_RoomCharge = "Pages.POS.RoomCharge";
        public const string Pages_POS_Outlets = "Pages.POS.Outlets";
        public const string Pages_POS_Menu = "Pages.POS.Menu";
    }
}





