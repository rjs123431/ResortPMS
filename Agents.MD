# ResortPMS Room Availability System
## AI-Ready Technical Specification

Version: 1.0  
Target Platform: .NET 9 + EF Core  
Architecture: Modular Monolith  
Modules: Rooms, Reservations, Stays, Inventory

---

# 1. Purpose

The Room Availability System determines whether rooms or room types are available for a requested stay period.

It must support:

- Reservation availability search
- Walk-in availability
- Room assignment validation
- Check-in validation
- Preventing overbooking
- High performance under concurrency

The system must be **fast, consistent, and safe under concurrent reservations**.

---

# 2. Availability Model

Availability is based on **date-only occupancy**, not datetime.

## Date Rules

ArrivalDate = check-in date  
DepartureDate = check-out date

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
