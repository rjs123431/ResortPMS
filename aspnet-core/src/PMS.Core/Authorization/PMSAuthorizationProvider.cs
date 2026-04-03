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

        // MODULES (aligns with primary sidebars)
        var frontDesk = webApp.CreateChildPermission(PermissionNames.Pages_FrontDesk, L("FrontDesk"), multiTenancySides: MultiTenancySides.Tenant);
        webApp.CreateChildPermission(PermissionNames.Pages_Housekeeping, L("Housekeeping"), multiTenancySides: MultiTenancySides.Tenant);

        // SETUP
        var setup = webApp.CreateChildPermission(PermissionNames.Pages_Setup, L("Setup"), multiTenancySides: MultiTenancySides.Tenant);

        // TRANSACTIONS (hotel workflow)
        var transactions = frontDesk.CreateChildPermission(PermissionNames.Pages_Transactions, L("Transactions"), multiTenancySides: MultiTenancySides.Tenant);

        // Administration
        var administration = webApp.CreateChildPermission(PermissionNames.Pages_Admin, L("Administration"), multiTenancySides: MultiTenancySides.Tenant);

        var users = administration.CreateChildPermission(PermissionNames.Pages_Admin_Users, L("Users"), multiTenancySides: MultiTenancySides.Tenant);
        users.CreateChildPermission(PermissionNames.Pages_Admin_Users_Create, L("Create"));
        users.CreateChildPermission(PermissionNames.Pages_Admin_Users_Edit, L("Edit"));

        var roles = administration.CreateChildPermission(PermissionNames.Pages_Admin_Roles, L("Roles"), multiTenancySides: MultiTenancySides.Tenant);
        roles.CreateChildPermission(PermissionNames.Pages_Admin_Roles_Create, L("Create"));
        roles.CreateChildPermission(PermissionNames.Pages_Admin_Roles_Edit, L("Edit"));

        administration.CreateChildPermission(PermissionNames.Pages_Admin_AuditTrail, L("AuditTrail"), multiTenancySides: MultiTenancySides.Tenant);
        administration.CreateChildPermission(PermissionNames.Pages_Admin_Settings, L("Settings"), multiTenancySides: MultiTenancySides.Tenant);

        webApp.CreateChildPermission(PermissionNames.Pages_Reports, L("Reports"), multiTenancySides: MultiTenancySides.Tenant);

        // ── PMS HOTEL WORKFLOW ─────────────────────────────────────────────────

        // FRONT DESK — Guests
        var guests = frontDesk.CreateChildPermission(PermissionNames.Pages_Guests, L("Guests"), multiTenancySides: MultiTenancySides.Tenant);
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

        // FRONT DESK — Rooms
        var rooms = frontDesk.CreateChildPermission(PermissionNames.Pages_Rooms, L("Rooms"), multiTenancySides: MultiTenancySides.Tenant);
        rooms.CreateChildPermission(PermissionNames.Pages_Rooms_Create, L("Create"));
        rooms.CreateChildPermission(PermissionNames.Pages_Rooms_Edit, L("Edit"));

        // SETUP — Charge Types
        var chargeTypes = setup.CreateChildPermission(PermissionNames.Pages_ChargeTypes, L("ChargeTypes"), multiTenancySides: MultiTenancySides.Tenant);
        chargeTypes.CreateChildPermission(PermissionNames.Pages_ChargeTypes_Create, L("Create"));
        chargeTypes.CreateChildPermission(PermissionNames.Pages_ChargeTypes_Edit, L("Edit"));

        var dayUse = transactions.CreateChildPermission(PermissionNames.Pages_DayUse, L("DayUse"), multiTenancySides: MultiTenancySides.Tenant);
        dayUse.CreateChildPermission(PermissionNames.Pages_DayUse_Create, L("Create"));
        dayUse.CreateChildPermission(PermissionNames.Pages_DayUse_Edit, L("Edit"));
        dayUse.CreateChildPermission(PermissionNames.Pages_DayUse_Sell, L("Sell"));
        dayUse.CreateChildPermission(PermissionNames.Pages_DayUse_Admin, L("Admin"));

        // SETUP — Payment Methods
        var paymentMethods = setup.CreateChildPermission(PermissionNames.Pages_PaymentMethods, L("PaymentMethods"), multiTenancySides: MultiTenancySides.Tenant);
        paymentMethods.CreateChildPermission(PermissionNames.Pages_PaymentMethods_Create, L("Create"));
        paymentMethods.CreateChildPermission(PermissionNames.Pages_PaymentMethods_Edit, L("Edit"));

        // SETUP — Channels
        var channels = setup.CreateChildPermission(PermissionNames.Pages_Channels, L("Channels"), multiTenancySides: MultiTenancySides.Tenant);
        channels.CreateChildPermission(PermissionNames.Pages_Channels_Create, L("Create"));
        channels.CreateChildPermission(PermissionNames.Pages_Channels_Edit, L("Edit"));

        // SETUP — Agencies
        var agencies = setup.CreateChildPermission(PermissionNames.Pages_Agencies, L("Agencies"), multiTenancySides: MultiTenancySides.Tenant);
        agencies.CreateChildPermission(PermissionNames.Pages_Agencies_Create, L("Create"));
        agencies.CreateChildPermission(PermissionNames.Pages_Agencies_Edit, L("Edit"));

        // SETUP — Extra Bed Types
        var extraBedTypes = setup.CreateChildPermission(PermissionNames.Pages_ExtraBedTypes, L("ExtraBedTypes"), multiTenancySides: MultiTenancySides.Tenant);
        extraBedTypes.CreateChildPermission(PermissionNames.Pages_ExtraBedTypes_Create, L("Create"));
        extraBedTypes.CreateChildPermission(PermissionNames.Pages_ExtraBedTypes_Edit, L("Edit"));

        // SETUP — Extra Bed Pricing
        var extraBedPricings = setup.CreateChildPermission(PermissionNames.Pages_ExtraBedPricings, L("ExtraBedPricings"), multiTenancySides: MultiTenancySides.Tenant);
        extraBedPricings.CreateChildPermission(PermissionNames.Pages_ExtraBedPricings_Create, L("Create"));
        extraBedPricings.CreateChildPermission(PermissionNames.Pages_ExtraBedPricings_Edit, L("Edit"));

        // SETUP — Staff
        var staff = setup.CreateChildPermission(PermissionNames.Pages_Staff, L("Staff"), multiTenancySides: MultiTenancySides.Tenant);
        staff.CreateChildPermission(PermissionNames.Pages_Staff_Create, L("Create"));
        staff.CreateChildPermission(PermissionNames.Pages_Staff_Edit, L("Edit"));

        // SETUP — Conference Venues
        var conferenceVenues = setup.CreateChildPermission(PermissionNames.Pages_ConferenceVenues, L("ConferenceVenues"), multiTenancySides: MultiTenancySides.Tenant);
        conferenceVenues.CreateChildPermission(PermissionNames.Pages_ConferenceVenues_Create, L("Create"));
        conferenceVenues.CreateChildPermission(PermissionNames.Pages_ConferenceVenues_Edit, L("Edit"));

        // SETUP — Conference Companies
        var conferenceCompanies = setup.CreateChildPermission(PermissionNames.Pages_ConferenceCompanies, L("ConferenceCompanies"), multiTenancySides: MultiTenancySides.Tenant);
        conferenceCompanies.CreateChildPermission(PermissionNames.Pages_ConferenceCompanies_Create, L("Create"));
        conferenceCompanies.CreateChildPermission(PermissionNames.Pages_ConferenceCompanies_Edit, L("Edit"));

        // SETUP — Conference Extras
        var conferenceExtras = setup.CreateChildPermission(PermissionNames.Pages_ConferenceExtras, L("ConferenceExtras"), multiTenancySides: MultiTenancySides.Tenant);
        conferenceExtras.CreateChildPermission(PermissionNames.Pages_ConferenceExtras_Create, L("Create"));
        conferenceExtras.CreateChildPermission(PermissionNames.Pages_ConferenceExtras_Edit, L("Edit"));

        // RESERVATIONS
        var reservations = transactions.CreateChildPermission(PermissionNames.Pages_Reservations, L("Reservations"), multiTenancySides: MultiTenancySides.Tenant);
        reservations.CreateChildPermission(PermissionNames.Pages_Reservations_Create, L("Create"));
        reservations.CreateChildPermission(PermissionNames.Pages_Reservations_Edit, L("Edit"));
        reservations.CreateChildPermission(PermissionNames.Pages_Reservations_Cancel, L("Cancel"));
        reservations.CreateChildPermission(PermissionNames.Pages_Reservations_Deposit, L("Deposit"));

        // CONFERENCE BOOKINGS
        var conferenceBookings = transactions.CreateChildPermission(PermissionNames.Pages_ConferenceBookings, L("ConferenceBookings"), multiTenancySides: MultiTenancySides.Tenant);
        conferenceBookings.CreateChildPermission(PermissionNames.Pages_ConferenceBookings_Create, L("Create"));
        conferenceBookings.CreateChildPermission(PermissionNames.Pages_ConferenceBookings_Edit, L("Edit"));
        conferenceBookings.CreateChildPermission(PermissionNames.Pages_ConferenceBookings_Cancel, L("Cancel"));
        conferenceBookings.CreateChildPermission(PermissionNames.Pages_ConferenceBookings_Deposit, L("Deposit"));

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

        // MAINTENANCE MODULE
        var maintenance = webApp.CreateChildPermission(PermissionNames.Pages_Maintenance, L("Maintenance"), multiTenancySides: MultiTenancySides.Tenant);
        maintenance.CreateChildPermission(PermissionNames.Pages_Maintenance_Create, L("Create"));
        maintenance.CreateChildPermission(PermissionNames.Pages_Maintenance_Assign, L("Assign"));
        maintenance.CreateChildPermission(PermissionNames.Pages_Maintenance_Edit, L("Edit"));

        // INCIDENTS
        var incidents = transactions.CreateChildPermission(PermissionNames.Pages_Incidents, L("Incidents"), multiTenancySides: MultiTenancySides.Tenant);
        incidents.CreateChildPermission(PermissionNames.Pages_Incidents_Create, L("Create"));
        incidents.CreateChildPermission(PermissionNames.Pages_Incidents_Resolve, L("Resolve"));

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

