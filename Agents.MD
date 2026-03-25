# PMS – Agent Reference Guide

> **For AI agents**: Read this file completely before writing any code. It covers the entire project — no need to scan source files for architecture, routes, entities, or conventions. Use `docs/frontend-architecture.md` and `docs/backend-architecture.md` for deeper patterns.

---

## 1. Project Overview

**PMS** is a full-stack Property Management System (PMS) for resorts.

- **Backend**: .NET 9, ASP.NET Boilerplate (ABP Zero), EF Core, SQL Server
- **Frontend**: React 19, TypeScript, Tailwind CSS, Vite, PWA
- **Architecture**: Modular Monolith (ABP multi-tenant)
- **Real-time**: SignalR (`@microsoft/signalr`)
- **Repo root**: `/Users/reymundosua/Projects/PMS/PMS`

---

## 2. Repository Structure

```
/
├── Agents.MD                    ← THIS FILE (agent reference)
├── app                          ← CLI script for migrations & DB (run from repo root)
├── aspnet-core/                 ← .NET backend
│   └── src/
│       ├── PMS.Core/            ← Domain entities, interfaces, enums
│       │   └── App/             ← All hotel domain entities
│       ├── PMS.Application/     ← AppServices, DTOs, mappings
│       │   └── App/             ← All feature AppServices
│       ├── PMS.EntityFrameworkCore/ ← DbContext, migrations, configurations
│       ├── PMS.Web.Host/        ← ASP.NET startup, controllers, auth
│       └── PMS.Migrator/        ← DB migration runner
├── react/                       ← React frontend (main UI)
│   └── src/
│       ├── App.tsx              ← Root routing (all routes defined here)
│       ├── components/          ← Shared UI components (layout/, common/, auth/)
│       ├── pages/               ← Page components by module
│       │   ├── Resort/          ← All hotel workflow pages
│       │   └── Administration/  ← Admin pages
│       ├── services/            ← API service layer (one file per domain)
│       ├── types/               ← TypeScript types (one file per domain)
│       ├── hooks/               ← Custom React hooks
│       ├── contexts/            ← React contexts (Auth, Theme, SignalR)
│       ├── config/              ← API config, permission names
│       └── utils/               ← Helpers (baseUrl, abp-events, etc.)
├── pos/                         ← POS terminal frontend (separate Vite app)
└── docs/                        ← Deep-dive architecture docs
    ├── frontend-architecture.md
    └── backend-architecture.md
```

---

## 3. Tech Stack Quick Reference

### Backend
| Concern | Technology |
|---|---|
| Framework | ASP.NET Boilerplate (ABP Zero) on .NET 9 |
| ORM | EF Core with SQL Server |
| Auth | JWT Bearer + ABP Identity |
| Multi-tenancy | ABP framework |
| Real-time | SignalR hubs |
| Background jobs | Hangfire |
| Logging | Serilog |

### Frontend
| Concern | Technology |
|---|---|
| Framework | React 19, TypeScript |
| Routing | react-router-dom v7 |
| Data fetching | @tanstack/react-query v5 |
| Forms | react-hook-form + zod + @hookform/resolvers |
| UI | Tailwind CSS v3 + @headlessui/react v2 + @heroicons/react v2 |
| Dialogs | Headless UI `Dialog` (see pattern below) |
| Charts | recharts |
| Date picker | react-datepicker |
| Select | react-select |
| HTTP | axios |
| Alerts | sweetalert2 |
| PWA | vite-plugin-pwa + workbox |

### Tailwind Primary Colors
`primary-600 = #2563eb` (blue). Use `bg-primary-600 hover:bg-primary-700 text-white` for primary buttons.

---

## 4. Development Commands

All run from **repo root** (`/Users/reymundosua/Projects/PMS/PMS`):

```bash
# Backend database
./app migration add "MigrationName"   # Add EF Core migration
./app migration remove                # Remove last migration
./app migration list                  # List migrations
./app db update                       # Apply migrations
./app db reset                        # Drop + recreate DB
./app db drop                         # Drop database

# Frontend (from react/ directory)
cd react && npm run dev               # Start dev server
npm run build                         # Build for production
npm run test                          # Run vitest tests
npm run type-check                    # TypeScript check only
npm run lint                          # ESLint
npm run format                        # Prettier format

# Backend build
cd aspnet-core && dotnet build src/PMS.Web.Host/PMS.Web.Host.csproj
```

**Dev API URL**: `http://localhost:5000` (set via `VITE_API_BASE_URL` env var in `react/.env`).  
**API base**: `getBaseUrl()` in `react/src/utils/baseUrl.ts` — in dev reads `VITE_API_BASE_URL`, in prod uses `window.location.origin`.

---

## 5. Backend Module Map

### PMS.Core/App — Domain Entities

| Module | Key Entities |
|---|---|
| **Rooms** | `RoomType`, `Room`, `RoomStatusLog`, `RoomDailyInventory` |
| **Rate Plans** | `RoomRatePlanGroup`, `RoomRatePlan`, `RoomRatePlanDay`, `RatePlanDateOverride`, `RoomRatePlanGroupChannel` |
| **Guests** | `Guest`, `GuestIdentification` |
| **Reservations** | `Reservation`, `ReservationRoom`, `ReservationExtraBed`, `ReservationGuest`, `ReservationDailyRate`, `ReservationDeposit` |
| **Stays** | `Stay`, `StayRoom`, `StayGuest`, `RoomTransfer`, `StayExtension`, `RoomChangeRequest` |
| **Billing** | `Folio`, `FolioTransaction`, `FolioPayment`, `FolioAdjustment` |
| **Checkout** | `CheckOutRecord`, `Receipt`, `ReceiptPayment` |
| **Pre-Check-In** | `PreCheckIn`, `PreCheckInRoom`, `PreCheckInExtraBed` |
| **Quotations** | `Quotation`, `QuotationRoom`, `QuotationExtraBed` |
| **Housekeeping** | `HousekeepingTask`, `HousekeepingLog`, `CleaningBoard` |
| **Maintenance** | `RoomMaintenanceRequest`, `RoomMaintenanceType`, `RoomMaintenanceRequestType` |
| **POS** | `PosOutlet`, `PosOutletTerminal`, `PosTable`, `PosOrder`, `PosOrderItem`, `PosOrderPayment`, `PosSession`, `MenuItem`, `MenuCategory`, `OptionGroup`, `Option` |
| **Lookups** | `Channel`, `Agency`, `ChargeType`, `PaymentMethod`, `ExtraBedType`, `ExtraBedPrice`, `Staff` |
| **Operational** | `GuestRequest`, `Incident` |
| **Infra** | `DocumentSequence`, `MutationAuditLog`, `FinancialAuditLog` |

### PMS.Application/App — Application Services

| Service | Key Methods |
|---|---|
| `ReservationAppService` | GetAsync, GetAllAsync, CreateAsync, UpdateAsync, CancelAsync, ConfirmAsync, SetPendingAsync, MarkNoShowAsync, AddRoomTypesAsync, AddExtraBedsAsync, AssignRoomAsync, AssignRoomsAsync, RecordDepositAsync |
| `StayAppService` | GetInHouseAsync, GetInHouseWithRoomsAsync, TransferRoomAsync, GetFolioAsync, PostChargeAsync, PostPaymentAsync, PostRefundAsync |
| `CheckInAppService` | CheckInFromReservationAsync, WalkInCheckInAsync |
| `CheckOutAppService` | GetStatementAsync, ProcessCheckOutAsync, WriteOffBalanceAsync, GetReceiptAsync |
| `RoomTypeAppService` | GetAsync, GetAllAsync, CreateAsync, UpdateAsync, GetAllActiveAsync |
| `RoomAppService` | GetAsync, GetAllAsync, CreateAsync, UpdateAsync, UpdateHousekeepingStatusAsync |
| `RoomAvailabilityAppService` | Check availability for date ranges |
| `RoomRatePlanAppService` | Get, Create, Update, bulk daily rates and overrides |
| `GuestAppService` | Full CRUD + identification management |
| `PreCheckInAppService` | GetAsync, CreateAsync, UpdateAsync, CancelAsync, MarkReadyAsync, MarkCheckedInAsync |
| `QuotationAppService` | Get, Create, Update |
| `HousekeepingAppService` | Task management, room status operations |
| `RoomMaintenanceAppService` | Create, Assign, Edit, Cancel |
| `FrontDeskDashboardAppService` | GetSummaryAsync, GetArrivalsTodayAsync, GetDeparturesTodayAsync |
| `RoomRackAppService` | Room assignment and management |
| `PosOrderAppService` | Order creation, payment, fulfillment |
| `PosSessionAppService` | Open, close, reconciliation |
| Lookup Services | `ChargeTypeAppService`, `PaymentMethodAppService`, `ChannelAppService`, `AgencyAppService`, `ExtraBedTypeAppService`, `StaffAppService` — all have GetAsync, GetAllAsync, GetAllActiveAsync, CreateAsync, UpdateAsync |

---

## 6. Key Domain Status Flows

```
Reservation:  Draft → Pending → Confirmed → CheckedIn → Completed
                                          ↘ Cancelled / NoShow

Stay:         CheckedIn → InHouse → CheckedOut / Cancelled

Room:         Vacant | Occupied | Reserved | OutOfOrder | OutOfService

Housekeeping: Clean | Dirty | Inspected | Pickup

Folio:        Open → Settled / WrittenOff / Voided

Maintenance:  Open → Assigned → InProgress → Completed / Cancelled

RoomDailyInv: Vacant | Reserved | InHouse | OutOfOrder | Blocked | HouseUse
```

---

## 7. Entity Base Classes (PMS.Core)

| Base | Auditing | Soft Delete | Use for |
|---|---|---|---|
| `FullAuditedEntity<T>` | Created + Modified + Who | ✅ IsDeleted | Transactional documents |
| `AuditedEntity<T>` | Created + Modified + Who | ❌ | Master data |
| `CreationAuditedEntity<T>` | Created + Who | ❌ | Append-only logs |
| `Entity<T>` | None | ❌ | Child/aggregate entities |

Custom interfaces: `IPassivable` (IsActive), `ISyncable` (LastSyncTime), `IMayHaveTenant` (TenantId).

---

## 8. Availability Model

Availability is based on **date-only occupancy**, not datetime.

ArrivalDate = check-in date | DepartureDate = check-out date

A room is occupied for nights between:

---

# React Dialog Overlays (Headless UI)

When adding or editing dialogs that use `@headlessui/react` `Dialog`, use this overlay pattern so dialogs stack correctly and the overlay does not block or capture clicks meant for the panel.

## Pattern

1. **Root**: `<Dialog className="fixed inset-0 z-50 overflow-y-auto">`
2. **Backdrop**: A separate `div` with `fixed inset-0 bg-black/50 pointer-events-none` and `aria-hidden`. This is visual only; it does not receive pointer events.
3. **Wrapper**: A `div` with `relative flex min-h-screen items-center justify-center p-4 pointer-events-none` so the centering container does not steal clicks.
4. **Panel**: `DialogPanel` (or `Dialog.Panel`) must include `pointer-events-auto` so only the panel receives clicks. Close via a Close/Cancel button and/or Escape (handle in `useEffect` with `keydown`).

Example:

```tsx
<Dialog open={open} onClose={() => {}} className="fixed inset-0 z-50 overflow-y-auto">
  <div className="fixed inset-0 bg-black/50 pointer-events-none" aria-hidden />
  <div className="relative flex min-h-screen items-center justify-center p-4 pointer-events-none">
    <DialogPanel className="... pointer-events-auto">
      {/* content */}
    </DialogPanel>
  </div>
</Dialog>
```

## Rationale

- Without `pointer-events-none` on the backdrop and wrapper, the overlay can capture clicks and cause focus/stacking issues when multiple dialogs or dropdowns are present (e.g. Add Extra Bed, New Guest, Search Guest).
- `pointer-events-auto` on the panel ensures the dialog content remains interactive and that nested controls (inputs, buttons) work correctly.

---

# Standard Page Layout (MainLayout)

Use this layout for list/detail pages so headers and primary actions are consistent.

## Pattern

1. **Root**: `<MainLayout>` wraps the page.
2. **Outer container**: `<div className="space-y-6">` for vertical spacing.
3. **Header row**: `<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">`
   - **Left**: A `<div>` with page title and description:
     - `<h1 className="text-2xl font-bold text-gray-900 dark:text-white">Page Title</h1>`
     - `<p className="text-sm text-gray-500 dark:text-gray-400">Short description.</p>`
   - **Right** (optional): Primary action — e.g. `<Link>` or `<button>` with `rounded bg-primary-600 px-4 py-2 text-white hover:bg-primary-700`.
4. **Content card**: `<section className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">` for the main content (tables, forms, etc.).

Example:

```tsx
<MainLayout>
  <div className="space-y-6">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reservations</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Confirm, cancel, and inspect reservation details.</p>
      </div>

      <Link to="/reservations/new" className="rounded bg-primary-600 px-4 py-2 text-white hover:bg-primary-700">
        New Reservation
      </Link>
    </div>

    <section className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
      {/* list, filters, table, etc. */}
    </section>
  </div>
</MainLayout>
```

Use the same header row (with or without a right-side action) and content section on all resort and admin list/detail pages.

---

# EF Core Migrations and Database

Use the project’s `./app` script from the **repository root** for migrations and database updates. Do not use raw `dotnet ef` unless the script does not support what you need.

**Add a new migration** (after changing entities or DbContext):

```bash
./app migration add "MigrationName"
```

Example: `./app migration add "AddPosOrderPosTerminalId"`

**Apply migrations to the database**:

```bash
./app db update
```

Other useful commands (see `./app` for full list):

- `./app migration remove` — remove the last migration
- `./app migration list` — list migrations
- `./app db drop` — drop the database
- `./app db reset` — drop and recreate the database

---

# Room Rate Plan Grouping (2026-03)

Rate plans are now group-based:

- `RoomRatePlanGroup` holds shared metadata: `Code`, `Name`, `StartDate`, `EndDate`, `Priority`, `IsDefault`, `IsActive`.
- `RoomRatePlan` is room-type-specific and belongs to one group (`RoomRatePlanGroupId`).
- One group can have one or more room-type rates.

Seed behavior for initial setup:

- Create one default group: `Code = REGULAR_RATE`, `Name = REGULAR RATE`.
- Create one plan per room type under this group.
- Merge day pricing in the same plan:
  - Mon-Fri use weekday rate.
  - Sat-Sun use weekend rate.

UI behavior:

- `/admin/room-rate-plans` shows grouped rows (one row per group code).
- `/admin/room-rate-plans/new` creates a group and room-type rates.
- `/admin/room-rate-plans/:groupCode/edit` edits group metadata and per-room-type rates.

---

# Front Desk Layout (2026-03)

Front desk pages should use the same sidebar width and general shell structure as housekeeping pages.

- Use `FrontDeskSidebar` inside `FrontDeskLayout` instead of a separate top navigation row.
- Keep the sidebar width pattern aligned with `HousekeepingSidebar` (`sm:min-w-[200px]` with icon-first compact behavior on smaller widths).
- Put front desk navigation items in the sidebar, including:
  - Dashboard
  - Room Rack
  - Reservations
  - Arrivals
  - Walk-In
  - In House
  - Departures
  - Guests

---

## 9. Frontend Route Map

All routes are defined in `react/src/App.tsx`.

### Public Routes
| Path | Component |
|---|---|
| `/login` | `LoginPage` |
| `/register` | `RegisterPage` |
| `/forgot-password` | `ForgotPasswordPage` |
| `/account/reset-password` | `ResetPasswordPage` |

### Front Desk Routes (under `FrontDeskLayout`)
All paths are prefixed with `/front-desk/`

| Path | Component | Permission |
|---|---|---|
| `/front-desk` | `FrontDeskDashboardPage` | – |
| `/front-desk/room-rack` | `RoomRackPage` | `Pages_Rooms` |
| `/front-desk/reservations` | `ReservationListPage` | `Pages_Reservations` |
| `/front-desk/reservations/new` | `ReservationPage` | `Pages_Reservations` |
| `/front-desk/reservations/:id` | `ReservationDetailPage` | `Pages_Reservations` |
| `/front-desk/check-in` | `CheckInPage` | `Pages_CheckIn` |
| `/front-desk/check-in/reservations/:reservationId` | `CheckInReservationPage` | `Pages_CheckIn` |
| `/front-desk/walk-in/:preCheckInId?` | `CheckInWalkInPage` | `Pages_CheckIn` |
| `/front-desk/check-in/confirmation` | `CheckInConfirmationPage` | `Pages_CheckIn` |
| `/front-desk/stays` | `StaysPage` | `Pages_Stays` |
| `/front-desk/stays/:stayId` | `StayDetailPage` | `Pages_Stays` |
| `/front-desk/check-out` | `CheckOutListPage` | `Pages_CheckOut` |
| `/front-desk/check-out/:id` | `CheckOutPage` | `Pages_CheckOut` |
| `/front-desk/check-out/confirmation/:id` | `CheckOutConfirmationPage` | `Pages_CheckOut` |
| `/front-desk/guests` | `GuestListPage` | `Pages_Guests` |
| `/front-desk/pre-check-ins` | `PreCheckInsPage` | `Pages_CheckIn` |
| `/front-desk/incidents` | `IncidentsPage` | `Pages_Incidents` |

### Housekeeping Routes (standalone, `HousekeepingLayout`)
| Path | Component |
|---|---|
| `/housekeeping` | `HousekeepingHubPage` |
| `/housekeeping/cleaning-board` | `CleaningBoardPage` |
| `/housekeeping/room-status` | `HousekeepingRoomStatusPage` |
| `/housekeeping/tasks` | `HousekeepingTasksPage` |

### Maintenance Routes (standalone, `MaintenanceLayout`)
| Path | Component |
|---|---|
| `/maintenance` | `MaintenanceHubPage` |
| `/maintenance/work-orders` | `WorkOrdersPage` |
| `/maintenance/preventive` | `PreventiveMaintenancePage` |
| `/maintenance/repair-history` | `RepairHistoryPage` |

### Admin Routes (under `AdminLayout`)
All paths are prefixed with `/admin/`

| Path | Component |
|---|---|
| `/admin/guests` | `GuestListPage` |
| `/admin/rooms` | `RoomsPage` |
| `/admin/room-types` | `RoomTypeListPage` |
| `/admin/room-rate-plans` | `RoomRatePlansPage` |
| `/admin/room-rate-plans/new` | `RoomRatePlanGroupEditorPage` |
| `/admin/room-rate-plans/:groupCode/edit` | `RoomRatePlanGroupEditorPage` |
| `/admin/charge-types` | `ChargeTypeListPage` |
| `/admin/payment-methods` | `PaymentMethodListPage` |
| `/admin/channels` | `ChannelListPage` |
| `/admin/agencies` | `AgencyListPage` |
| `/admin/extra-bed-types` | `ExtraBedTypeListPage` |
| `/admin/extra-bed-pricing` | `ExtraBedPricingPage` |
| `/admin/staff` | `StaffListPage` |
| `/admin/users` | `UsersPage` |
| `/admin/roles` | `RolesPage` |
| `/admin/audit-trail` | `AuditTrailPage` |
| `/admin/room-rack-settings` | `RoomRackSettingsPage` |

### Other Routes
| Path | Notes |
|---|---|
| `/` | `HomePage` (protected) |
| `/reports` | `ReportsPage` |
| `/profile` | `ProfilePage` |
| `/change-password` | `ChangePasswordPage` |
| `/notifications` | `NotificationsPage` |
| `/my-account` | `MyAccountPage` |

### Redirects
Old top-level paths (`/reservations/*`, `/check-in/*`, etc.) redirect to `/front-desk/...` equivalents.

---

## 10. Frontend Services & Types Map

All API calls go through axios service files in `react/src/services/`. All types are in `react/src/types/`.

| Domain | Service File | Types File |
|---|---|---|
| Auth / Login | `auth.service.ts` | `auth.types.ts` |
| Guests | `guest.service.ts` | `resort.types.ts` |
| Rooms | `room.service.ts` | `resort.types.ts` |
| Room Types | `room-type.service.ts` | `resort.types.ts` |
| Room Rate Plans | `room-rate-plan.service.ts` | `resort.types.ts` |
| Room Availability | `room-availability.service.ts` | `resort.types.ts` |
| Room Pricing | `room-pricing.service.ts` | `resort.types.ts` |
| Reservations | `reservation.service.ts` | `resort.types.ts` |
| Check-In | `check-in.service.ts` | `resort.types.ts` |
| Check-Out | `check-out.service.ts` | `resort.types.ts` |
| Stays | `stay.service.ts` | `resort.types.ts` |
| Folio / Billing | `stay.service.ts` | `resort.types.ts` |
| Pre-Check-In | `pre-check-in.service.ts` | `resort.types.ts` |
| Quotations | `quotation.service.ts` | `resort.types.ts` |
| Housekeeping | `housekeeping.service.ts` | `resort.types.ts` |
| Maintenance | `room-maintenance.service.ts` | `resort.types.ts` |
| Room Rack | `room-rack.service.ts` | `resort.types.ts` |
| Front Desk | `frontdesk.service.ts` | `resort.types.ts` |
| Room Status Change | `room-change.service.ts` | `resort.types.ts` |
| Charge Types | `charge-type.service.ts` | `resort.types.ts` |
| Payment Methods | `payment-method.service.ts` | `resort.types.ts` |
| Channels | `channel.service.ts` | `resort.types.ts` |
| Agencies | `agency.service.ts` | `resort.types.ts` |
| Extra Bed Types | `extra-bed-type.service.ts` | `resort.types.ts` |
| Extra Bed Pricing | `extra-bed-pricing.service.ts` | `resort.types.ts` |
| Staff | `staff.service.ts` | `resort.types.ts` |
| Incidents | `incident.service.ts` | `resort.types.ts` |
| Reporting | `reporting.service.ts` | `resort.types.ts` |
| SignalR | `signalr.service.ts` | – |

**Most domain types live in `resort.types.ts`** — a single large types file for all hotel workflow types.

---

## 11. Layout Components

Located in `react/src/components/layout/`.

| Component | Used for | Notes |
|---|---|---|
| `MainLayout` | General pages (admin/setup) | Use for all `/admin/*` pages |
| `AdminLayout` | Admin section shell | Wraps all `/admin/*` routes via `<Outlet>` |
| `AdminSidebar` | Admin navigation | Inside `AdminLayout` |
| `FrontDeskLayout` | Front desk shell | Wraps all `/front-desk/*` routes |
| `FrontDeskSidebar` | Front desk navigation | Inside `FrontDeskLayout` |
| `HousekeepingLayout` | Housekeeping shell | Wraps `/housekeeping/*` |
| `HousekeepingSidebar` | Housekeeping navigation | Inside `HousekeepingLayout`, `sm:min-w-[200px]` |
| `MaintenanceLayout` | Maintenance shell | Wraps `/maintenance/*` |
| `MaintenanceSidebar` | Maintenance navigation | Inside `MaintenanceLayout` |
| `Header` | Top header bar | Inside `MainLayout` |
| `Sidebar` | General sidebar | Inside `MainLayout` |

**Rule**: Always use the layout appropriate for the route's section. Front desk pages → `FrontDeskLayout`. Housekeeping → `HousekeepingLayout`. Admin setup pages → `AdminLayout` + `MainLayout` inside pages.

---

## 12. Permission Names Reference

Defined in `react/src/config/permissionNames.ts` and must match backend `AppAuthorizationProvider`.

| PermissionNames key | ABP string |
|---|---|
| `Pages_Guests` | `Pages.Guests` |
| `Pages_Rooms` | `Pages.Rooms` |
| `Pages_RoomTypes` | `Pages.RoomTypes` |
| `Pages_RoomRatePlans` | `Pages.RoomRatePlans` |
| `Pages_ChargeTypes` | `Pages.ChargeTypes` |
| `Pages_PaymentMethods` | `Pages.PaymentMethods` |
| `Pages_Channels` | `Pages.Channels` |
| `Pages_Agencies` | `Pages.Agencies` |
| `Pages_ExtraBedTypes` | `Pages.ExtraBedTypes` |
| `Pages_ExtraBedPricings` | `Pages.ExtraBedPricings` |
| `Pages_Staff` | `Pages.Staff` |
| `Pages_Reservations` | `Pages.Reservations` |
| `Pages_CheckIn` | `Pages.CheckIn` |
| `Pages_Stays` | `Pages.Stays` |
| `Pages_CheckOut` | `Pages.CheckOut` |
| `Pages_Maintenance` | `Pages.Maintenance` |
| `Pages_POS` | `Pages.POS` |
| `Pages_Reports` | `Pages.Reports` |
| `Pages_Incidents` | `Pages.Incidents` |
| `Pages_Admin_Users` | `Pages.Admin.Users` |
| `Pages_Admin_Roles` | `Pages.Admin.Roles` |
| `Pages_Admin_AuditTrail` | `Pages.Admin.AuditTrail` |

Each feature also has `_Create` and `_Edit` variants (e.g., `Pages_Rooms_Create`, `Pages_Rooms_Edit`).

---

## 13. Shared Dialog Components

In `react/src/pages/Resort/Shared/` — reusable cross-feature dialogs:

| Component | Purpose |
|---|---|
| `SearchGuestDialog` | Search and select existing guest |
| `AssignRoomDialog` | Assign a room to a reservation/stay |
| `AddExtraBedDialog` | Add extra bed to reservation/stay |
| `PostChargeDialog` | Post a charge to a folio |
| `AddPaymentDialog` | Post payment or refund to folio |
| `GuestRequestDialog` | Create guest request during stay |
| `CompleteGuestRequestDialog` | Mark guest request as complete |
| `ClearRoomDialog` | Clear a room for housekeeping |
| `LoadPreCheckInDialog` | Load pre check-in data |
| `RoomChangeRequestDialog` | Request room change for a stay |
| `RoomTypeAvailabilitySearch` | Search availability by room type |
| `SearchStaffDialog` | Search and select a staff member |

---

## 14. Adding a New Feature — Checklist

### Backend
1. Add entity in `PMS.Core/App/<Module>/`  — choose correct base class from §7
2. Add entity config in `PMS.EntityFrameworkCore/EntityConfigurations/`
3. Add `DbSet<Entity>` in `PMSDbContext.cs`
4. Add DTOs in `PMS.Application/App/<Module>/`
5. Add AppService + interface in `PMS.Application/App/<Module>/`
6. Register permissions in `AppAuthorizationProvider.cs` if needed
7. Map in `CustomDtoMapper.cs` or a `Profile` class
8. Run `./app migration add "Description"` then `./app db update`

### Frontend
1. Add service methods in `react/src/services/<domain>.service.ts`
2. Add TypeScript types in `react/src/types/resort.types.ts`
3. Create page component in `react/src/pages/Resort/<Module>/`
4. Add route in `react/src/App.tsx` under the appropriate layout
5. Add nav link to the appropriate sidebar component
6. Add permission guard (`ProtectedRoute requiredPermissions`) on the route

---

## 15. Key File Locations (Quick Reference)

| What | Where |
|---|---|
| All routes | `react/src/App.tsx` |
| API base URL | `react/src/utils/baseUrl.ts` |
| Axios instance config | `react/src/services/api.service.ts` |
| API config & auth keys | `react/src/config/api.config.ts` |
| Permission names | `react/src/config/permissionNames.ts` |
| All domain types | `react/src/types/resort.types.ts` |
| Auth context | `react/src/contexts/AuthContext.tsx` |
| SignalR context | `react/src/contexts/SignalRContext.tsx` |
| Theme context | `react/src/contexts/ThemeContext.tsx` |
| Main DB context | `aspnet-core/src/PMS.EntityFrameworkCore/PMSDbContext.cs` |
| Permissions | `aspnet-core/src/PMS.Core/Authorization/AppAuthorizationProvider.cs` |
| DTO mapper | `aspnet-core/src/PMS.Application/CustomDtoMapper.cs` |
| ABP module config | `aspnet-core/src/PMS.Application/PMSApplicationModule.cs` |
