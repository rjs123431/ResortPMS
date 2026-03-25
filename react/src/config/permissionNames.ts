export const PermissionNames = {
  // ── Hierarchy parents ────────────────────────────────────────────────
  Applications_Web: 'WebApp',
  Pages_FrontDesk: 'Pages.FrontDesk',
  Pages_Setup: 'Pages.Setup',
  Pages_Transactions: 'Pages.Transactions',
  Pages_Admin: 'Pages.Admin',

  // ── Administration ───────────────────────────────────────────────────
  Pages_Admin_Users: 'Pages.Admin.Users',
  Pages_Admin_Users_Create: 'Pages.Admin.Users.Create',
  Pages_Admin_Users_Edit: 'Pages.Admin.Users.Edit',
  Pages_Admin_Roles: 'Pages.Admin.Roles',
  Pages_Admin_Roles_Create: 'Pages.Admin.Roles.Create',
  Pages_Admin_Roles_Edit: 'Pages.Admin.Roles.Edit',
  Pages_Admin_AuditTrail: 'Pages.Admin.AuditTrail',
  Pages_Admin_Settings: 'Pages.Admin.Settings',

  // ── Setup — Guests ──────────────────────────────────────────────────
  Pages_Guests: 'Pages.Guests',
  Pages_Guests_Create: 'Pages.Guests.Create',
  Pages_Guests_Edit: 'Pages.Guests.Edit',

  // ── Setup — Rooms ───────────────────────────────────────────────────
  Pages_Rooms: 'Pages.Rooms',
  Pages_Rooms_Create: 'Pages.Rooms.Create',
  Pages_Rooms_Edit: 'Pages.Rooms.Edit',

  // ── Setup — Room Types ──────────────────────────────────────────────
  Pages_RoomTypes: 'Pages.RoomTypes',
  Pages_RoomTypes_Create: 'Pages.RoomTypes.Create',
  Pages_RoomTypes_Edit: 'Pages.RoomTypes.Edit',

  // ── Setup — Room Rate Plans ─────────────────────────────────────────
  Pages_RoomRatePlans: 'Pages.RoomRatePlans',
  Pages_RoomRatePlans_Create: 'Pages.RoomRatePlans.Create',
  Pages_RoomRatePlans_Edit: 'Pages.RoomRatePlans.Edit',

  // ── Setup — Charge Types ────────────────────────────────────────────
  Pages_ChargeTypes: 'Pages.ChargeTypes',
  Pages_ChargeTypes_Create: 'Pages.ChargeTypes.Create',
  Pages_ChargeTypes_Edit: 'Pages.ChargeTypes.Edit',

  // ── Setup — Payment Methods ─────────────────────────────────────────
  Pages_PaymentMethods: 'Pages.PaymentMethods',
  Pages_PaymentMethods_Create: 'Pages.PaymentMethods.Create',
  Pages_PaymentMethods_Edit: 'Pages.PaymentMethods.Edit',

  // ── Setup — Channels ────────────────────────────────────────────────
  Pages_Channels: 'Pages.Channels',
  Pages_Channels_Create: 'Pages.Channels.Create',
  Pages_Channels_Edit: 'Pages.Channels.Edit',

  // ── Setup — Agencies ────────────────────────────────────────────────
  Pages_Agencies: 'Pages.Agencies',
  Pages_Agencies_Create: 'Pages.Agencies.Create',
  Pages_Agencies_Edit: 'Pages.Agencies.Edit',

  // ── Setup — Extra Bed Types ─────────────────────────────────────────
  Pages_ExtraBedTypes: 'Pages.ExtraBedTypes',
  Pages_ExtraBedTypes_Create: 'Pages.ExtraBedTypes.Create',
  Pages_ExtraBedTypes_Edit: 'Pages.ExtraBedTypes.Edit',

  // ── Setup — Extra Bed Pricing ───────────────────────────────────────
  Pages_ExtraBedPricings: 'Pages.ExtraBedPricings',
  Pages_ExtraBedPricings_Create: 'Pages.ExtraBedPricings.Create',
  Pages_ExtraBedPricings_Edit: 'Pages.ExtraBedPricings.Edit',

  // ── Setup — Staff ───────────────────────────────────────────────────
  Pages_Staff: 'Pages.Staff',
  Pages_Staff_Create: 'Pages.Staff.Create',
  Pages_Staff_Edit: 'Pages.Staff.Edit',

  // ── Reservations ────────────────────────────────────────────────────
  Pages_Reservations: 'Pages.Reservations',
  Pages_Reservations_Create: 'Pages.Reservations.Create',
  Pages_Reservations_Edit: 'Pages.Reservations.Edit',
  Pages_Reservations_Cancel: 'Pages.Reservations.Cancel',
  Pages_Reservations_Deposit: 'Pages.Reservations.Deposit',

  // ── Check-In ────────────────────────────────────────────────────────
  Pages_CheckIn: 'Pages.CheckIn',
  Pages_CheckIn_FromReservation: 'Pages.CheckIn.FromReservation',
  Pages_CheckIn_WalkIn: 'Pages.CheckIn.WalkIn',

  // ── Stays (In-House) ────────────────────────────────────────────────
  Pages_Stays: 'Pages.Stays',
  Pages_Stays_PostCharge: 'Pages.Stays.PostCharge',
  Pages_Stays_PostPayment: 'Pages.Stays.PostPayment',
  Pages_Stays_Transfer: 'Pages.Stays.Transfer',
  Pages_Stays_Extend: 'Pages.Stays.Extend',
  Pages_Stays_VoidTransaction: 'Pages.Stays.VoidTransaction',

  // ── Check-Out ───────────────────────────────────────────────────────
  Pages_CheckOut: 'Pages.CheckOut',
  Pages_CheckOut_Process: 'Pages.CheckOut.Process',
  Pages_CheckOut_WriteOff: 'Pages.CheckOut.WriteOff',
  Pages_CheckOut_Print: 'Pages.CheckOut.Print',

  // ── Housekeeping ─────────────────────────────────────────────────────
  Pages_Housekeeping: 'Pages.Housekeeping',

  // ── Maintenance ─────────────────────────────────────────────────────
  Pages_Maintenance: 'Pages.Maintenance',
  Pages_Maintenance_Create: 'Pages.Maintenance.Create',
  Pages_Maintenance_Assign: 'Pages.Maintenance.Assign',
  Pages_Maintenance_Edit: 'Pages.Maintenance.Edit',

  // ── POS (F&B) ──────────────────────────────────────────────────────
  Pages_POS: 'Pages.POS',
  Pages_POS_Orders: 'Pages.POS.Orders',
  Pages_POS_RoomCharge: 'Pages.POS.RoomCharge',
  Pages_POS_Outlets: 'Pages.POS.Outlets',
  Pages_POS_Menu: 'Pages.POS.Menu',

  // ── Reports ─────────────────────────────────────────────────────────
  Pages_Reports: 'Pages.Reports',

  // ── Incidents ───────────────────────────────────────────────────────
  Pages_Incidents: 'Pages.Incidents',
  Pages_Incidents_Create: 'Pages.Incidents.Create',
  Pages_Incidents_Resolve: 'Pages.Incidents.Resolve',
} as const;
