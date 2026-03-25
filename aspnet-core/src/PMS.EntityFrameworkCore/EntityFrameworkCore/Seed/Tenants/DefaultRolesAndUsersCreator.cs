using System.Collections.Generic;
using System.Linq;
using Abp.Authorization.Roles;
using Abp.Authorization.Users;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using PMS.Authorization;
using PMS.Authorization.Roles;
using PMS.Authorization.Users;

namespace PMS.EntityFrameworkCore.Seed.Tenants;

/// <summary>
/// Seeds Manager, FrontDesk, and Housekeeping roles with appropriate permissions,
/// plus demo users assigned to each role.
/// </summary>
public class DefaultRolesAndUsersCreator
{
    private readonly PMSDbContext _context;
    private readonly int _tenantId;

    public DefaultRolesAndUsersCreator(PMSDbContext context, int tenantId)
    {
        _context = context;
        _tenantId = tenantId;
    }

    public void Create()
    {
        // ── Roles ──────────────────────────────────────────────────

        var managerRole = CreateRoleIfNotExists(StaticRoleNames.Tenants.Manager, ManagerPermissions());
        var frontDeskRole = CreateRoleIfNotExists(StaticRoleNames.Tenants.FrontDesk, FrontDeskPermissions());
        var housekeepingRole = CreateRoleIfNotExists(StaticRoleNames.Tenants.Housekeeping, HousekeepingPermissions());

        // ── Users ──────────────────────────────────────────────────

        CreateUserIfNotExists("manager", "Manager", "User", "manager@resortpms.com", managerRole.Id);
        CreateUserIfNotExists("frontdesk1", "FrontDesk", "One", "frontdesk1@resortpms.com", frontDeskRole.Id);
        CreateUserIfNotExists("frontdesk2", "FrontDesk", "Two", "frontdesk2@resortpms.com", frontDeskRole.Id);
        CreateUserIfNotExists("housekeeping1", "Housekeeping", "One", "housekeeping1@resortpms.com", housekeepingRole.Id);
        CreateUserIfNotExists("housekeeping2", "Housekeeping", "Two", "housekeeping2@resortpms.com", housekeepingRole.Id);
    }

    // ── Role helper ──────────────────────────────────────────────────────

    private Role CreateRoleIfNotExists(string roleName, List<string> permissionNames)
    {
        var role = _context.Roles.IgnoreQueryFilters()
            .FirstOrDefault(r => r.TenantId == _tenantId && r.Name == roleName);

        if (role == null)
        {
            role = _context.Roles.Add(new Role(_tenantId, roleName, roleName) { IsStatic = false }).Entity;
            _context.SaveChanges();
        }

        // Grant permissions that are not yet granted
        var alreadyGranted = _context.Permissions.IgnoreQueryFilters()
            .OfType<RolePermissionSetting>()
            .Where(p => p.TenantId == _tenantId && p.RoleId == role.Id)
            .Select(p => p.Name)
            .ToList();

        var toGrant = permissionNames.Where(p => !alreadyGranted.Contains(p)).ToList();

        if (toGrant.Any())
        {
            _context.Permissions.AddRange(toGrant.Select(name => new RolePermissionSetting
            {
                TenantId = _tenantId,
                Name = name,
                IsGranted = true,
                RoleId = role.Id
            }));
            _context.SaveChanges();
        }

        return role;
    }

    // ── User helper ──────────────────────────────────────────────────────

    private void CreateUserIfNotExists(string userName, string name, string surname, string email, int roleId)
    {
        if (_context.Users.IgnoreQueryFilters().Any(u => u.TenantId == _tenantId && u.UserName == userName))
            return;

        var user = new User
        {
            TenantId = _tenantId,
            UserName = userName,
            Name = name,
            Surname = surname,
            EmailAddress = email,
            IsEmailConfirmed = true,
            IsActive = true
        };

        user.Password = new PasswordHasher<User>(
            new OptionsWrapper<PasswordHasherOptions>(new PasswordHasherOptions()))
            .HashPassword(user, User.DefaultPassword);
        user.SetNormalizedNames();

        _context.Users.Add(user);
        _context.SaveChanges();

        _context.UserRoles.Add(new UserRole(_tenantId, user.Id, roleId));
        _context.SaveChanges();
    }

    // ── Permission sets per role ─────────────────────────────────────────

    /// <summary>
    /// Manager / Supervisor — full operational access including setup (read-only admin).
    /// </summary>
    private static List<string> ManagerPermissions() =>
    [
        // Root
        PermissionNames.Applications_Web,

        // Setup (all)
        PermissionNames.Pages_Setup,
        PermissionNames.Pages_Guests,
        PermissionNames.Pages_Guests_Create,
        PermissionNames.Pages_Guests_Edit,
        PermissionNames.Pages_RoomTypes,
        PermissionNames.Pages_RoomTypes_Create,
        PermissionNames.Pages_RoomTypes_Edit,
        PermissionNames.Pages_RoomRatePlans,
        PermissionNames.Pages_RoomRatePlans_Create,
        PermissionNames.Pages_RoomRatePlans_Edit,
        PermissionNames.Pages_Rooms,
        PermissionNames.Pages_Rooms_Create,
        PermissionNames.Pages_Rooms_Edit,
        PermissionNames.Pages_ChargeTypes,
        PermissionNames.Pages_ChargeTypes_Create,
        PermissionNames.Pages_ChargeTypes_Edit,
        PermissionNames.Pages_PaymentMethods,
        PermissionNames.Pages_PaymentMethods_Create,
        PermissionNames.Pages_PaymentMethods_Edit,
        PermissionNames.Pages_Channels,
        PermissionNames.Pages_Channels_Create,
        PermissionNames.Pages_Channels_Edit,
        PermissionNames.Pages_Agencies,
        PermissionNames.Pages_Agencies_Create,
        PermissionNames.Pages_Agencies_Edit,
        PermissionNames.Pages_ExtraBedTypes,
        PermissionNames.Pages_ExtraBedTypes_Create,
        PermissionNames.Pages_ExtraBedTypes_Edit,
        PermissionNames.Pages_ExtraBedPricings,
        PermissionNames.Pages_ExtraBedPricings_Create,
        PermissionNames.Pages_ExtraBedPricings_Edit,
        PermissionNames.Pages_Staff,
        PermissionNames.Pages_Staff_Create,
        PermissionNames.Pages_Staff_Edit,

        // Transactions (all)
        PermissionNames.Pages_Transactions,
        PermissionNames.Pages_Reservations,
        PermissionNames.Pages_Reservations_Create,
        PermissionNames.Pages_Reservations_Edit,
        PermissionNames.Pages_Reservations_Cancel,
        PermissionNames.Pages_Reservations_Deposit,
        PermissionNames.Pages_CheckIn,
        PermissionNames.Pages_CheckIn_FromReservation,
        PermissionNames.Pages_CheckIn_WalkIn,
        PermissionNames.Pages_Stays,
        PermissionNames.Pages_Stays_PostCharge,
        PermissionNames.Pages_Stays_PostPayment,
        PermissionNames.Pages_Stays_Transfer,
        PermissionNames.Pages_Stays_Extend,
        PermissionNames.Pages_Stays_VoidTransaction,
        PermissionNames.Pages_CheckOut,
        PermissionNames.Pages_CheckOut_Process,
        PermissionNames.Pages_CheckOut_WriteOff,
        PermissionNames.Pages_CheckOut_Print,
        PermissionNames.Pages_Maintenance,
        PermissionNames.Pages_Maintenance_Create,
        PermissionNames.Pages_Maintenance_Assign,
        PermissionNames.Pages_Maintenance_Edit,
        PermissionNames.Pages_Incidents,
        PermissionNames.Pages_Incidents_Create,
        PermissionNames.Pages_Incidents_Resolve,

        // Admin (view users/roles, audit trail — no create/edit)
        PermissionNames.Pages_Admin,
        PermissionNames.Pages_Admin_Users,
        PermissionNames.Pages_Admin_Roles,
        PermissionNames.Pages_Admin_AuditTrail,

        // Reports
        PermissionNames.Pages_Reports,

        // POS
        PermissionNames.Pages_POS,
        PermissionNames.Pages_POS_Orders,
        PermissionNames.Pages_POS_RoomCharge,
        PermissionNames.Pages_POS_Outlets,
        PermissionNames.Pages_POS_Menu,
    ];

    /// <summary>
    /// Front Desk — reservations, check-in/out, stays, guests, incidents.
    /// </summary>
    private static List<string> FrontDeskPermissions() =>
    [
        PermissionNames.Applications_Web,
        PermissionNames.Pages_Transactions,

        // Guests (view + create + edit)
        PermissionNames.Pages_Setup,
        PermissionNames.Pages_Guests,
        PermissionNames.Pages_Guests_Create,
        PermissionNames.Pages_Guests_Edit,

        // Rooms (view only)
        PermissionNames.Pages_Rooms,

        // Reservations (full)
        PermissionNames.Pages_Reservations,
        PermissionNames.Pages_Reservations_Create,
        PermissionNames.Pages_Reservations_Edit,
        PermissionNames.Pages_Reservations_Cancel,
        PermissionNames.Pages_Reservations_Deposit,

        // Check-In (full)
        PermissionNames.Pages_CheckIn,
        PermissionNames.Pages_CheckIn_FromReservation,
        PermissionNames.Pages_CheckIn_WalkIn,

        // Stays (operational — no void)
        PermissionNames.Pages_Stays,
        PermissionNames.Pages_Stays_PostCharge,
        PermissionNames.Pages_Stays_PostPayment,
        PermissionNames.Pages_Stays_Transfer,
        PermissionNames.Pages_Stays_Extend,

        // Check-Out (process + print — no write-off)
        PermissionNames.Pages_CheckOut,
        PermissionNames.Pages_CheckOut_Process,
        PermissionNames.Pages_CheckOut_Print,

        // Incidents (create only — no resolve)
        PermissionNames.Pages_Incidents,
        PermissionNames.Pages_Incidents_Create,
    ];

    /// <summary>
    /// Housekeeping — room status, maintenance, and limited room view.
    /// </summary>
    private static List<string> HousekeepingPermissions() =>
    [
        PermissionNames.Applications_Web,

        // Rooms (view only — needed for housekeeping status)
        PermissionNames.Pages_Setup,
        PermissionNames.Pages_Rooms,

        // Maintenance
        PermissionNames.Pages_Transactions,
        PermissionNames.Pages_Maintenance,
        PermissionNames.Pages_Maintenance_Create,
        PermissionNames.Pages_Maintenance_Edit,

        // Incidents (create only)
        PermissionNames.Pages_Incidents,
        PermissionNames.Pages_Incidents_Create,
    ];
}
