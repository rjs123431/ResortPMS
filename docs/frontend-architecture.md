# PMS – Frontend Architecture Deep Reference

> **For AI agents**: This document covers patterns, conventions, and implementation details for the React frontend. Read `Agents.MD` first for the project overview — this file goes deeper on frontend specifics.

---

## 1. Project Setup

| Item | Value |
|---|---|
| Root | `react/` |
| Entry | `react/src/main.tsx` |
| Root component | `react/src/App.tsx` |
| Dev server | `npm run dev` (from `react/`) |
| API URL (dev) | `http://localhost:5000` via `VITE_API_BASE_URL` in `react/.env` |
| API URL (prod) | `window.location.origin` (auto-detected) |
| Path aliases | `@/` → `react/src/`, `@pages/`, `@components/`, `@contexts/`, `@hooks/` |

### Path Alias Resolution (`vite.config.ts` + `tsconfig.json`)
```ts
// Import using aliases — always prefer these over relative paths
import { AuthContext } from '@contexts/AuthContext';
import { PermissionNames } from '@/config/permissionNames';
import { GuestListPage } from '@pages/Resort/Guests/GuestsPage';
import { MainLayout } from '@components/layout/MainLayout';
```

---

## 2. Core Structure

```
react/src/
├── App.tsx                     ← ALL routes defined here
├── main.tsx                    ← React root, providers
├── index.css                   ← Global styles (Tailwind directives)
├── config/
│   ├── api.config.ts           ← { baseURL, timeout, headers } + storage keys
│   └── permissionNames.ts      ← PermissionNames object (all ABP permission strings)
├── contexts/
│   ├── AuthContext.tsx          ← useAuth() → { user, login, logout, hasPermission }
│   ├── ThemeContext.tsx         ← useTheme() → { theme, toggleTheme }
│   └── SignalRContext.tsx       ← useSignalR() → { connection, on, off }
├── services/
│   ├── api.service.ts           ← Configured axios instance with JWT interceptors
│   └── *.service.ts             ← Domain-specific API functions
├── types/
│   ├── resort.types.ts          ← All hotel workflow TypeScript interfaces
│   └── *.types.ts               ← Other domain types
├── components/
│   ├── layout/                  ← All layout shell components
│   ├── common/                  ← Reusable UI: ErrorBoundary, LogoSpinner, etc.
│   └── auth/
│       └── ProtectedRoute.tsx   ← Auth + permission guard wrapper
├── pages/
│   ├── Resort/                  ← All hotel workflow pages
│   │   ├── Shared/              ← Cross-feature dialog components
│   │   └── <Module>/            ← Feature pages (Reservations/, Stays/, etc.)
│   └── Administration/          ← Admin pages (Users, Roles, AuditTrail)
├── hooks/
│   ├── useDocumentTitle.ts
│   ├── useApprovalCount.ts
│   └── useItems.ts
└── utils/
    ├── baseUrl.ts               ← getBaseUrl() — resolves API URL
    └── abp-events.ts            ← initAbpEvents() for ABP framework events
```

---

## 3. Authentication & Authorization

### AuthContext (`react/src/contexts/AuthContext.tsx`)
```tsx
const { user, login, logout, hasPermission, isLoading } = useAuth();
```

- `user` — current user object with `name`, `emailAddress`, `tenantId`, `permissions[]`
- `hasPermission(permissionName: string): boolean` — check a single permission
- JWT token stored in `localStorage` with key `simplesweldo_auth_token`

### ProtectedRoute component
```tsx
// Guard by auth only
<ProtectedRoute>
  <MyPage />
</ProtectedRoute>

// Guard by permission
<ProtectedRoute requiredPermissions={[PermissionNames.Pages_Reservations]}>
  <ReservationListPage />
</ProtectedRoute>

// Guard by multiple permissions (user needs at least one)
<ProtectedRoute requiredPermissions={[PermissionNames.Pages_Rooms, PermissionNames.Pages_RoomTypes]}>
  <RoomsPage />
</ProtectedRoute>
```

### PermissionNames usage
```tsx
import { PermissionNames } from '@/config/permissionNames';

// Check in component
const { hasPermission } = useAuth();
const canCreate = hasPermission(PermissionNames.Pages_Reservations_Create);

// Conditionally render action buttons
{canCreate && <button onClick={handleCreate}>New Reservation</button>}
```

---

## 4. API Service Layer

### Axios Instance (`react/src/services/api.service.ts`)
- Auto-attaches JWT Bearer token from localStorage
- Handles 401 → redirects to `/login`
- All calls made against `getBaseUrl()` (resolves to `http://localhost:5000` in dev)

### Service File Pattern
```ts
// react/src/services/reservation.service.ts
import api from './api.service';
import type { Reservation, CreateReservationDto, PagedResultDto } from '@/types/resort.types';

export const reservationService = {
  getAll: (params: GetReservationsInput) =>
    api.get<PagedResultDto<ReservationListDto>>('/api/services/app/Reservation/GetAll', { params }),

  getById: (id: number) =>
    api.get<ReservationDto>(`/api/services/app/Reservation/Get`, { params: { id } }),

  create: (data: CreateReservationDto) =>
    api.post('/api/services/app/Reservation/Create', data),

  update: (data: UpdateReservationDto) =>
    api.put('/api/services/app/Reservation/Update', data),
};
```

### ABP API URL pattern
All ABP AppService methods are at:
```
/api/services/app/{ServiceName}/{MethodName}
```
Examples:
- `GET /api/services/app/Reservation/GetAll`
- `POST /api/services/app/CheckIn/CheckInFromReservation`
- `POST /api/services/app/Stay/PostCharge`
- `GET /api/services/app/FrontDeskDashboard/GetSummary`

---

## 5. Data Fetching Pattern (React Query)

### Standard list query
```tsx
import { useQuery } from '@tanstack/react-query';
import { reservationService } from '@/services/reservation.service';

const { data, isLoading, error } = useQuery({
  queryKey: ['reservations', filters],
  queryFn: () => reservationService.getAll(filters).then(r => r.data.result),
});
```

### Mutation pattern
```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Swal from 'sweetalert2';

const queryClient = useQueryClient();

const createMutation = useMutation({
  mutationFn: (data: CreateReservationDto) => reservationService.create(data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['reservations'] });
    Swal.fire('Success', 'Reservation created.', 'success');
  },
  onError: (err: any) => {
    Swal.fire('Error', err.response?.data?.error?.message || 'An error occurred.', 'error');
  },
});
```

### Query client config (from `App.tsx`)
```ts
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,  // 5 minutes
    },
  },
});
```

---

## 6. Form Pattern (react-hook-form + zod)

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  guestName: z.string().min(1, 'Guest name is required'),
  arrivalDate: z.string().min(1, 'Arrival date is required'),
  nights: z.number().min(1, 'Must be at least 1 night'),
});

type FormValues = z.infer<typeof schema>;

const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
  resolver: zodResolver(schema),
  defaultValues: { guestName: '', arrivalDate: '', nights: 1 },
});

// In JSX
<input {...register('guestName')} className="..." />
{errors.guestName && <p className="text-red-500 text-sm">{errors.guestName.message}</p>}
```

---

## 7. Headless UI Dialog Pattern

ALWAYS use this overlay pattern for stacking correctness:

```tsx
import { Dialog, DialogPanel } from '@headlessui/react';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function MyDialog({ open, onClose }: Props) {
  // Escape key handler
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  return (
    <Dialog open={open} onClose={() => {}} className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop — visual only, no pointer events */}
      <div className="fixed inset-0 bg-black/50 pointer-events-none" aria-hidden />
      {/* Centering wrapper — no pointer events so clicks pass through */}
      <div className="relative flex min-h-screen items-center justify-center p-4 pointer-events-none">
        {/* Panel — only interactive element */}
        <DialogPanel className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800 pointer-events-auto">
          {/* content */}
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:text-gray-800">Cancel</button>
            <button className="rounded bg-primary-600 px-4 py-2 text-white hover:bg-primary-700">Save</button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
```

---

## 8. Standard Page Layout

Every list/detail page uses this structure:

```tsx
import { MainLayout } from '@components/layout/MainLayout';
import { Link } from 'react-router-dom';

export function MyListPage() {
  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header row */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Page Title</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Short description.</p>
          </div>
          {/* Optional: primary action */}
          <Link to="/path/new" className="rounded bg-primary-600 px-4 py-2 text-white hover:bg-primary-700">
            New Item
          </Link>
        </div>

        {/* Main content card */}
        <section className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
          {/* table, filters, content */}
        </section>
      </div>
    </MainLayout>
  );
}
```

---

## 9. Adding a New Page — Step by Step

1. **Create the service** (if needed) — `react/src/services/<module>.service.ts`
2. **Add TypeScript types** — `react/src/types/resort.types.ts` (interface for Dto, list dto, create dto)
3. **Create the page component** — `react/src/pages/Resort/<Module>/<Name>Page.tsx`
4. **Add the route** — in `react/src/App.tsx` under the correct layout section
5. **Add sidebar link** — in the appropriate sidebar component (e.g., `FrontDeskSidebar.tsx`)
6. **Add permission guard** — wrap route in `<ProtectedRoute requiredPermissions={[...]}>` if needed

### Choosing the right layout
| Page section | Layout to use | Sidebar |
|---|---|---|
| Front desk workflow | `FrontDeskLayout` (via `<Outlet>`) | `FrontDeskSidebar` |
| Housekeeping | `HousekeepingLayout` (standalone) | `HousekeepingSidebar` |
| Maintenance | `MaintenanceLayout` (standalone) | `MaintenanceSidebar` |
| Admin / Setup | `AdminLayout` (via `<Outlet>`) + `MainLayout` inside page | `AdminSidebar` |
| General / Reports | `MainLayout` inside page | `Sidebar` |

---

## 10. React Select Pattern

```tsx
import Select from 'react-select';

const options = roomTypes.map(rt => ({ value: rt.id, label: rt.name }));

<Select
  options={options}
  value={options.find(o => o.value === selectedId) ?? null}
  onChange={(opt) => setSelectedId(opt?.value ?? null)}
  placeholder="Select room type..."
  isClearable
  classNamePrefix="react-select"
/>
```

---

## 11. Date Picker Pattern

```tsx
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const [date, setDate] = useState<Date | null>(null);

<DatePicker
  selected={date}
  onChange={(d) => setDate(d)}
  dateFormat="yyyy-MM-dd"
  placeholderText="Select date"
  className="block w-full rounded border border-gray-300 px-3 py-2 dark:bg-gray-700 dark:text-white"
/>
```

---

## 12. SignalR Context

```tsx
import { useSignalR } from '@contexts/SignalRContext';

const { connection } = useSignalR();

useEffect(() => {
  if (!connection) return;
  connection.on('RoomStatusChanged', (data) => {
    // handle real-time update
  });
  return () => { connection.off('RoomStatusChanged'); };
}, [connection]);
```

---

## 13. Tailwind Dark Mode

- Dark mode is class-based (`darkMode: 'class'` in `tailwind.config.js`)
- Always pair light + dark classes: `text-gray-900 dark:text-white`
- Common dark combos:
  - Page background: `bg-gray-50 dark:bg-gray-900`
  - Card: `bg-white dark:bg-gray-800`
  - Input: `bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600`
  - Label: `text-gray-700 dark:text-gray-300`
  - Muted text: `text-gray-500 dark:text-gray-400`
  - Table rows: `bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700`

---

## 14. Page File Structure Convention

```
react/src/pages/Resort/<Module>/
├── <Name>Page.tsx          ← Main list/dashboard page (exported named export)
├── <Name>DetailPage.tsx    ← Detail view page
├── <Name>Dialog.tsx        ← Create/Edit dialog (if inline)
└── __tests__/
    └── <Name>Page.test.tsx ← Vitest tests
```

- Exports are **named exports** (not default): `export function ReservationListPage()`
- `App.tsx` imports via lazy: `const ReservationListPage = lazy(() => import(...).then(m => ({ default: m.ReservationListPage })))`

---

## 15. SweetAlert2 Patterns

```tsx
import Swal from 'sweetalert2';

// Success toast
Swal.fire({ icon: 'success', title: 'Saved!', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });

// Confirm dialog before destructive action
const result = await Swal.fire({
  title: 'Cancel Reservation?',
  text: 'This cannot be undone.',
  icon: 'warning',
  showCancelButton: true,
  confirmButtonText: 'Yes, cancel it',
  confirmButtonColor: '#dc2626',
});
if (result.isConfirmed) { /* proceed */ }

// Error
Swal.fire('Error', err.response?.data?.error?.message || 'Something went wrong.', 'error');
```

---

## 16. Common Heroicons Usage

```tsx
import { PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';

// In button
<button className="...">
  <PlusIcon className="h-4 w-4 mr-1" /> Add
</button>
```

Use `24/outline` for buttons/UI, `24/solid` for status indicators.
