using Abp.Authorization;
using Abp.Localization;
using Abp.MultiTenancy;

namespace PMS.Authorization;

public class PMSAuthorizationProvider : AuthorizationProvider
{
    public override void SetPermissions(IPermissionDefinitionContext context)
    {
        context.CreatePermission(PermissionNames.Pages_Tenants, L("Tenants"), multiTenancySides: MultiTenancySides.Host);
        context.CreatePermission(PermissionNames.Pages_Global_Notifications, L("GlobalNotifications"), multiTenancySides: MultiTenancySides.Host);
        context.CreatePermission(PermissionNames.Pages_Users, L("Users"), multiTenancySides: MultiTenancySides.Host);
        context.CreatePermission(PermissionNames.Pages_Roles, L("Roles"), multiTenancySides: MultiTenancySides.Host);

        var webApp = context.CreatePermission(PermissionNames.Applications_Web, L("Web"));

        // SETUP
        var setup = webApp.CreateChildPermission(PermissionNames.Pages_Setup, L("Setup"), multiTenancySides: MultiTenancySides.Tenant);

        var items = setup.CreateChildPermission(PermissionNames.Pages_Items, L("Items"), multiTenancySides: MultiTenancySides.Tenant);
        items.CreateChildPermission(PermissionNames.Pages_Items_Create, L("Create"));
        items.CreateChildPermission(PermissionNames.Pages_Items_Edit, L("Edit"));

        var categories = setup.CreateChildPermission(PermissionNames.Pages_Categories, L("Categories"), multiTenancySides: MultiTenancySides.Tenant);
        categories.CreateChildPermission(PermissionNames.Pages_Categories_Create, L("Create"));
        categories.CreateChildPermission(PermissionNames.Pages_Categories_Edit, L("Edit"));

        // TRANSACTIONS
        var transactions = webApp.CreateChildPermission(PermissionNames.Pages_Transactions, L("Transactions"), multiTenancySides: MultiTenancySides.Tenant);

        var stockIn = transactions.CreateChildPermission(PermissionNames.Pages_StockIn, L("StockIn"), multiTenancySides: MultiTenancySides.Tenant);
        stockIn.CreateChildPermission(PermissionNames.Pages_StockIn_Create, L("Create"));
        stockIn.CreateChildPermission(PermissionNames.Pages_StockIn_Print, L("Print"));

        var stockOut = transactions.CreateChildPermission(PermissionNames.Pages_StockOut, L("StockOut"), multiTenancySides: MultiTenancySides.Tenant);
        stockOut.CreateChildPermission(PermissionNames.Pages_StockOut_Create, L("Create"));
        stockOut.CreateChildPermission(PermissionNames.Pages_StockOut_Print, L("Print"));
        
        var stockAdjustment = transactions.CreateChildPermission(PermissionNames.Pages_StockAdjustment, L("StockAdjustment"), multiTenancySides: MultiTenancySides.Tenant);
        stockAdjustment.CreateChildPermission(PermissionNames.Pages_StockAdjustment_Create, L("Create"));
        stockAdjustment.CreateChildPermission(PermissionNames.Pages_StockAdjustment_Print, L("Print"));

        var physicalCount = transactions.CreateChildPermission(PermissionNames.Pages_PhysicalCount, L("PhysicalCount"), multiTenancySides: MultiTenancySides.Tenant);
        physicalCount.CreateChildPermission(PermissionNames.Pages_PhysicalCount_Create, L("Create"));
        physicalCount.CreateChildPermission(PermissionNames.Pages_PhysicalCount_Start, L("Start"));
        physicalCount.CreateChildPermission(PermissionNames.Pages_PhysicalCount_Complete, L("Complete"));
        physicalCount.CreateChildPermission(PermissionNames.Pages_PhysicalCount_Cancel, L("Cancel"));
        physicalCount.CreateChildPermission(PermissionNames.Pages_PhysicalCount_Print, L("Print"));
        

        // REPORTS
        var reports = webApp.CreateChildPermission(PermissionNames.Pages_Reports, L("Reports"), multiTenancySides: MultiTenancySides.Tenant);
       
        var inventorySummary = reports.CreateChildPermission(PermissionNames.Pages_PMSSummary, L("PMSSummary"), multiTenancySides: MultiTenancySides.Tenant);
        inventorySummary.CreateChildPermission(PermissionNames.Pages_PMSSummary_Print, L("Print"));
        inventorySummary.CreateChildPermission(PermissionNames.Pages_PMSSummary_Export, L("Export"));
        
        var withdrawalReport = reports.CreateChildPermission(PermissionNames.Pages_WithdrawalReport, L("WithdrawalReport"), multiTenancySides: MultiTenancySides.Tenant);
        withdrawalReport.CreateChildPermission(PermissionNames.Pages_WithdrawalReport_Print, L("Print"));
        withdrawalReport.CreateChildPermission(PermissionNames.Pages_WithdrawalReport_Export, L("Export"));
        
        var stockInReport = reports.CreateChildPermission(PermissionNames.Pages_StockInReport, L("StockInReport"), multiTenancySides: MultiTenancySides.Tenant);
        stockInReport.CreateChildPermission(PermissionNames.Pages_StockInReport_Print, L("Print"));
        stockInReport.CreateChildPermission(PermissionNames.Pages_StockInReport_Export, L("Export"));
        
        var stockOutReport = reports.CreateChildPermission(PermissionNames.Pages_StockOutReport, L("StockOutReport"), multiTenancySides: MultiTenancySides.Tenant);
        stockOutReport.CreateChildPermission(PermissionNames.Pages_StockOutReport_Print, L("Print"));
        stockOutReport.CreateChildPermission(PermissionNames.Pages_StockOutReport_Export, L("Export"));
        
        var stockAdjustmentReport = reports.CreateChildPermission(PermissionNames.Pages_StockAdjustmentReport, L("StockAdjustmentReport"), multiTenancySides: MultiTenancySides.Tenant);
        stockAdjustmentReport.CreateChildPermission(PermissionNames.Pages_StockAdjustmentReport_Print, L("Print"));
        stockAdjustmentReport.CreateChildPermission(PermissionNames.Pages_StockAdjustmentReport_Export, L("Export"));
        
        var transferReport = reports.CreateChildPermission(PermissionNames.Pages_TransferReport, L("TransferReport"), multiTenancySides: MultiTenancySides.Tenant);
        transferReport.CreateChildPermission(PermissionNames.Pages_TransferReport_Print, L("Print"));
        transferReport.CreateChildPermission(PermissionNames.Pages_TransferReport_Export, L("Export"));

        // Administration
        var administration = webApp.CreateChildPermission(PermissionNames.Pages_Admin, L("Administration"), multiTenancySides: MultiTenancySides.Tenant);

        var users = administration.CreateChildPermission(PermissionNames.Pages_Admin_Users, L("Users"), multiTenancySides: MultiTenancySides.Tenant);
        users.CreateChildPermission(PermissionNames.Pages_Admin_Users_Create, L("Create"));
        users.CreateChildPermission(PermissionNames.Pages_Admin_Users_Edit, L("Edit"));

        var roles = administration.CreateChildPermission(PermissionNames.Pages_Admin_Roles, L("Roles"), multiTenancySides: MultiTenancySides.Tenant);
        roles.CreateChildPermission(PermissionNames.Pages_Admin_Roles_Create, L("Create"));
        roles.CreateChildPermission(PermissionNames.Pages_Admin_Roles_Edit, L("Edit"));

        //administration.CreateChildPermission(PermissionNames.Pages_Admin_Settings, L("Settings"), multiTenancySides: MultiTenancySides.Tenant);

        // ── PMS HOTEL WORKFLOW ─────────────────────────────────────────────────

        // SETUP — Guests
        var guests = setup.CreateChildPermission(PermissionNames.Pages_Guests, L("Guests"), multiTenancySides: MultiTenancySides.Tenant);
        guests.CreateChildPermission(PermissionNames.Pages_Guests_Create, L("Create"));
        guests.CreateChildPermission(PermissionNames.Pages_Guests_Edit, L("Edit"));

        // SETUP — Room Types
        var roomTypes = setup.CreateChildPermission(PermissionNames.Pages_RoomTypes, L("RoomTypes"), multiTenancySides: MultiTenancySides.Tenant);
        roomTypes.CreateChildPermission(PermissionNames.Pages_RoomTypes_Create, L("Create"));
        roomTypes.CreateChildPermission(PermissionNames.Pages_RoomTypes_Edit, L("Edit"));

        // SETUP — Rooms
        var rooms = setup.CreateChildPermission(PermissionNames.Pages_Rooms, L("Rooms"), multiTenancySides: MultiTenancySides.Tenant);
        rooms.CreateChildPermission(PermissionNames.Pages_Rooms_Create, L("Create"));
        rooms.CreateChildPermission(PermissionNames.Pages_Rooms_Edit, L("Edit"));

        // SETUP — Charge Types
        var chargeTypes = setup.CreateChildPermission(PermissionNames.Pages_ChargeTypes, L("ChargeTypes"), multiTenancySides: MultiTenancySides.Tenant);
        chargeTypes.CreateChildPermission(PermissionNames.Pages_ChargeTypes_Create, L("Create"));
        chargeTypes.CreateChildPermission(PermissionNames.Pages_ChargeTypes_Edit, L("Edit"));

        // SETUP — Payment Methods
        var paymentMethods = setup.CreateChildPermission(PermissionNames.Pages_PaymentMethods, L("PaymentMethods"), multiTenancySides: MultiTenancySides.Tenant);
        paymentMethods.CreateChildPermission(PermissionNames.Pages_PaymentMethods_Create, L("Create"));
        paymentMethods.CreateChildPermission(PermissionNames.Pages_PaymentMethods_Edit, L("Edit"));

        // SETUP — Extra Bed Types
        var extraBedTypes = setup.CreateChildPermission(PermissionNames.Pages_ExtraBedTypes, L("ExtraBedTypes"), multiTenancySides: MultiTenancySides.Tenant);
        extraBedTypes.CreateChildPermission(PermissionNames.Pages_ExtraBedTypes_Create, L("Create"));
        extraBedTypes.CreateChildPermission(PermissionNames.Pages_ExtraBedTypes_Edit, L("Edit"));

        // RESERVATIONS
        var reservations = transactions.CreateChildPermission(PermissionNames.Pages_Reservations, L("Reservations"), multiTenancySides: MultiTenancySides.Tenant);
        reservations.CreateChildPermission(PermissionNames.Pages_Reservations_Create, L("Create"));
        reservations.CreateChildPermission(PermissionNames.Pages_Reservations_Edit, L("Edit"));
        reservations.CreateChildPermission(PermissionNames.Pages_Reservations_Cancel, L("Cancel"));
        reservations.CreateChildPermission(PermissionNames.Pages_Reservations_Deposit, L("Deposit"));

        // CHECK-IN
        var checkIn = transactions.CreateChildPermission(PermissionNames.Pages_CheckIn, L("CheckIn"), multiTenancySides: MultiTenancySides.Tenant);
        checkIn.CreateChildPermission(PermissionNames.Pages_CheckIn_FromReservation, L("FromReservation"));
        checkIn.CreateChildPermission(PermissionNames.Pages_CheckIn_WalkIn, L("WalkIn"));

        // STAY
        var stays = transactions.CreateChildPermission(PermissionNames.Pages_Stays, L("Stays"), multiTenancySides: MultiTenancySides.Tenant);
        stays.CreateChildPermission(PermissionNames.Pages_Stays_PostCharge, L("PostCharge"));
        stays.CreateChildPermission(PermissionNames.Pages_Stays_PostPayment, L("PostPayment"));
        stays.CreateChildPermission(PermissionNames.Pages_Stays_Transfer, L("Transfer"));
        stays.CreateChildPermission(PermissionNames.Pages_Stays_Extend, L("Extend"));
        stays.CreateChildPermission(PermissionNames.Pages_Stays_VoidTransaction, L("VoidTransaction"));

        // CHECKOUT
        var checkOut = transactions.CreateChildPermission(PermissionNames.Pages_CheckOut, L("CheckOut"), multiTenancySides: MultiTenancySides.Tenant);
        checkOut.CreateChildPermission(PermissionNames.Pages_CheckOut_Process, L("Process"));
        checkOut.CreateChildPermission(PermissionNames.Pages_CheckOut_WriteOff, L("WriteOff"));
        checkOut.CreateChildPermission(PermissionNames.Pages_CheckOut_Print, L("Print"));

        context.CreatePermission(PermissionNames.Pages_HangfireDasboard, L("BackgroundJobs"), multiTenancySides: PMSConsts.MultiTenancyEnabled ? MultiTenancySides.Host : MultiTenancySides.Tenant);
    }

    private static ILocalizableString L(string name)
    {
        return new LocalizableString(name, PMSConsts.LocalizationSourceName);
    }
}

