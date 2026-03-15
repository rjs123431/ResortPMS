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

        // TRANSACTIONS (hotel workflow)
        var transactions = webApp.CreateChildPermission(PermissionNames.Pages_Transactions, L("Transactions"), multiTenancySides: MultiTenancySides.Tenant);

        // Administration
        var administration = webApp.CreateChildPermission(PermissionNames.Pages_Admin, L("Administration"), multiTenancySides: MultiTenancySides.Tenant);

        var users = administration.CreateChildPermission(PermissionNames.Pages_Admin_Users, L("Users"), multiTenancySides: MultiTenancySides.Tenant);
        users.CreateChildPermission(PermissionNames.Pages_Admin_Users_Create, L("Create"));
        users.CreateChildPermission(PermissionNames.Pages_Admin_Users_Edit, L("Edit"));

        var roles = administration.CreateChildPermission(PermissionNames.Pages_Admin_Roles, L("Roles"), multiTenancySides: MultiTenancySides.Tenant);
        roles.CreateChildPermission(PermissionNames.Pages_Admin_Roles_Create, L("Create"));
        roles.CreateChildPermission(PermissionNames.Pages_Admin_Roles_Edit, L("Edit"));

        administration.CreateChildPermission(PermissionNames.Pages_Admin_AuditTrail, L("AuditTrail"), multiTenancySides: MultiTenancySides.Tenant);

        //administration.CreateChildPermission(PermissionNames.Pages_Admin_Settings, L("Settings"), multiTenancySides: MultiTenancySides.Tenant);

        webApp.CreateChildPermission(PermissionNames.Pages_Reports, L("Reports"), multiTenancySides: MultiTenancySides.Tenant);

        // ── PMS HOTEL WORKFLOW ─────────────────────────────────────────────────

        // SETUP — Guests
        var guests = setup.CreateChildPermission(PermissionNames.Pages_Guests, L("Guests"), multiTenancySides: MultiTenancySides.Tenant);
        guests.CreateChildPermission(PermissionNames.Pages_Guests_Create, L("Create"));
        guests.CreateChildPermission(PermissionNames.Pages_Guests_Edit, L("Edit"));

        // SETUP — Room Types
        var roomTypes = setup.CreateChildPermission(PermissionNames.Pages_RoomTypes, L("RoomTypes"), multiTenancySides: MultiTenancySides.Tenant);
        roomTypes.CreateChildPermission(PermissionNames.Pages_RoomTypes_Create, L("Create"));
        roomTypes.CreateChildPermission(PermissionNames.Pages_RoomTypes_Edit, L("Edit"));

        // SETUP — Room Rate Plans
        var roomRatePlans = setup.CreateChildPermission(PermissionNames.Pages_RoomRatePlans, L("RoomRatePlans"), multiTenancySides: MultiTenancySides.Tenant);
        roomRatePlans.CreateChildPermission(PermissionNames.Pages_RoomRatePlans_Create, L("Create"));
        roomRatePlans.CreateChildPermission(PermissionNames.Pages_RoomRatePlans_Edit, L("Edit"));

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

        // SETUP — Staff
        var staff = setup.CreateChildPermission(PermissionNames.Pages_Staff, L("Staff"), multiTenancySides: MultiTenancySides.Tenant);
        staff.CreateChildPermission(PermissionNames.Pages_Staff_Create, L("Create"));
        staff.CreateChildPermission(PermissionNames.Pages_Staff_Edit, L("Edit"));

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

        // POS (F&B)
        var pos = webApp.CreateChildPermission(PermissionNames.Pages_POS, L("POS"), multiTenancySides: MultiTenancySides.Tenant);
        pos.CreateChildPermission(PermissionNames.Pages_POS_Orders, L("Orders"));
        pos.CreateChildPermission(PermissionNames.Pages_POS_RoomCharge, L("RoomCharge"));
        pos.CreateChildPermission(PermissionNames.Pages_POS_Outlets, L("Outlets"));
        pos.CreateChildPermission(PermissionNames.Pages_POS_Menu, L("Menu"));

        context.CreatePermission(PermissionNames.Pages_HangfireDasboard, L("BackgroundJobs"), multiTenancySides: PMSConsts.MultiTenancyEnabled ? MultiTenancySides.Host : MultiTenancySides.Tenant);
    }

    private static ILocalizableString L(string name)
    {
        return new LocalizableString(name, PMSConsts.LocalizationSourceName);
    }
}

