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

        public const string Pages_Items = "Pages.Items";
        public const string Pages_Items_Create = "Pages.Items.Create";
        public const string Pages_Items_Edit = "Pages.Items.Edit";

        public const string Pages_Categories = "Pages.Categories";
        public const string Pages_Categories_Create = "Pages.Categories.Create";
        public const string Pages_Categories_Edit = "Pages.Categories.Edit";

        // TRANSACTIONS
        public const string Pages_Transactions = "Pages.Transactions";

        public const string Pages_StockIn = "Pages.StockIn";
        public const string Pages_StockIn_Create = "Pages.StockIn.Create";
        public const string Pages_StockIn_Print = "Pages.StockIn.Print";

        public const string Pages_StockOut = "Pages.StockOut";
        public const string Pages_StockOut_Create = "Pages.StockOut.Create";
        public const string Pages_StockOut_Print = "Pages.StockOut.Print";

        public const string Pages_StockAdjustment = "Pages.StockAdjustment";
        public const string Pages_StockAdjustment_Create = "Pages.StockAdjustment.Create";
        public const string Pages_StockAdjustment_Print = "Pages.StockAdjustment.Print";

        public const string Pages_PhysicalCount = "Pages.PhysicalCount";
        public const string Pages_PhysicalCount_Create = "Pages.PhysicalCount.Create";
        public const string Pages_PhysicalCount_Start = "Pages.PhysicalCount.Start";
        public const string Pages_PhysicalCount_Complete = "Pages.PhysicalCount.Complete";
        public const string Pages_PhysicalCount_Cancel = "Pages.PhysicalCount.Cancel";
        public const string Pages_PhysicalCount_Print = "Pages.PhysicalCount.Print";


        // REPORTS
        public const string Pages_Reports = "Pages.Reports";

        public const string Pages_PMSSummary = "Pages.PMSSummary";
        public const string Pages_PMSSummary_Print = "Pages.PMSSummary.Print";
        public const string Pages_PMSSummary_Export = "Pages.PMSSummary.Export";

        public const string Pages_WithdrawalReport = "Pages.WithdrawalReport";
        public const string Pages_WithdrawalReport_Print = "Pages.WithdrawalReport.Print";
        public const string Pages_WithdrawalReport_Export = "Pages.WithdrawalReport.Export";

        public const string Pages_StockInReport = "Pages.StockInReport";
        public const string Pages_StockInReport_Print = "Pages.StockInReport.Print";
        public const string Pages_StockInReport_Export = "Pages.StockInReport.Export";

        public const string Pages_StockOutReport = "Pages.StockOutReport";
        public const string Pages_StockOutReport_Print = "Pages.StockOutReport.Print";
        public const string Pages_StockOutReport_Export = "Pages.StockOutReport.Export";

        public const string Pages_StockAdjustmentReport = "Pages.StockAdjustmentReport";
        public const string Pages_StockAdjustmentReport_Print = "Pages.StockAdjustmentReport.Print";
        public const string Pages_StockAdjustmentReport_Export = "Pages.StockAdjustmentReport.Export";

        public const string Pages_TransferReport = "Pages.TransferReport";
        public const string Pages_TransferReport_Print = "Pages.TransferReport.Print";
        public const string Pages_TransferReport_Export = "Pages.TransferReport.Export";

        public const string Pages_Admin = "Pages.Admin";
        public const string Pages_Admin_Roles = "Pages.Admin.Roles";
        public const string Pages_Admin_Roles_Create = "Pages.Admin.Roles.Create";
        public const string Pages_Admin_Roles_Edit = "Pages.Admin.Roles.Edit";

        public const string Pages_Admin_Users = "Pages.Admin.Users";
        public const string Pages_Admin_Users_Create = "Pages.Admin.Users.Create";
        public const string Pages_Admin_Users_Edit = "Pages.Admin.Users.Edit";

        public const string Pages_Admin_Settings = "Pages.Admin.Settings";

        // ── PMS HOTEL WORKFLOW ──────────────────────────────────────────────────────

        // SETUP — Guests
        public const string Pages_Guests = "Pages.Guests";
        public const string Pages_Guests_Create = "Pages.Guests.Create";
        public const string Pages_Guests_Edit = "Pages.Guests.Edit";

        // SETUP — Room Types
        public const string Pages_RoomTypes = "Pages.RoomTypes";
        public const string Pages_RoomTypes_Create = "Pages.RoomTypes.Create";
        public const string Pages_RoomTypes_Edit = "Pages.RoomTypes.Edit";

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

        // App

    }
}





