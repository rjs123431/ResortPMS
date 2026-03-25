import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@contexts/AuthContext';
import { PermissionNames } from '@config/permissionNames';

interface QuickLink {
  label: string;
  description: string;
  path: string;
  permission?: string;
  icon: React.ReactNode;
  color: string;
}

const propertySetupLinks: QuickLink[] = [
  {
    label: 'Room Types',
    description: 'Manage room categories and configurations',
    path: '/admin/room-types',
    permission: PermissionNames.Pages_RoomTypes,
    color: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7h18M5 7V5a2 2 0 012-2h10a2 2 0 012 2v2m0 0v10a2 2 0 01-2 2H7a2 2 0 01-2-2V7m4 6h6" />
      </svg>
    ),
  },
  {
    label: 'Rooms',
    description: 'View and manage individual rooms',
    path: '/admin/rooms',
    permission: PermissionNames.Pages_Rooms,
    color: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400',
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H5m14 0h2M5 21H3m4-10h2m4 0h2m-6 4h2m4 0h2" />
      </svg>
    ),
  },
  {
    label: 'Rate Plans',
    description: 'Configure room pricing and rate groups',
    path: '/admin/room-rate-plans',
    permission: PermissionNames.Pages_RoomRatePlans,
    color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400',
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    label: 'Channels',
    description: 'Booking channels and distribution',
    path: '/admin/channels',
    permission: PermissionNames.Pages_Channels,
    color: 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400',
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.904 9.904 0 01-4.255-.949L3 20l1.19-3.57A7.686 7.686 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
  },
  {
    label: 'Agencies',
    description: 'Travel agencies and partners',
    path: '/admin/agencies',
    permission: PermissionNames.Pages_Agencies,
    color: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m8 0H8m8 0h2a2 2 0 012 2v6M8 6H6a2 2 0 00-2 2v6" />
      </svg>
    ),
  },
  {
    label: 'Charge Types',
    description: 'Folio charge categories',
    path: '/admin/charge-types',
    permission: PermissionNames.Pages_ChargeTypes,
    color: 'bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400',
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2v16z" />
      </svg>
    ),
  },
  {
    label: 'Payment Methods',
    description: 'Accepted payment types',
    path: '/admin/payment-methods',
    permission: PermissionNames.Pages_PaymentMethods,
    color: 'bg-teal-50 text-teal-700 dark:bg-teal-900/20 dark:text-teal-400',
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h4m-8 4h18a2 2 0 002-2V7a2 2 0 00-2-2H3a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    label: 'Extra Bed Types',
    description: 'Extra bed options and pricing',
    path: '/admin/extra-bed-types',
    permission: PermissionNames.Pages_ExtraBedTypes,
    color: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-900/20 dark:text-cyan-400',
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h8M8 12h8M8 17h5M6 4h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2z" />
      </svg>
    ),
  },
];

const systemLinks: QuickLink[] = [
  {
    label: 'Users',
    description: 'Manage user accounts and access',
    path: '/admin/users',
    permission: PermissionNames.Pages_Admin_Users,
    color: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
  {
    label: 'Roles',
    description: 'Roles and permission management',
    path: '/admin/roles',
    permission: PermissionNames.Pages_Admin_Roles,
    color: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400',
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    label: 'Staff',
    description: 'Hotel staff directory',
    path: '/admin/staff',
    permission: PermissionNames.Pages_Staff,
    color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400',
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5V4H2v16h5m10 0v-4a3 3 0 00-3-3H10a3 3 0 00-3 3v4m10 0H7m10-9a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
  {
    label: 'Guests',
    description: 'Guest records and profiles',
    path: '/admin/guests',
    permission: PermissionNames.Pages_Guests,
    color: 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400',
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    label: 'Audit Trail',
    description: 'Activity logs and history',
    path: '/admin/audit-trail',
    permission: PermissionNames.Pages_Admin_AuditTrail,
    color: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
  },
  {
    label: 'Settings',
    description: 'System and display settings',
    path: '/admin/settings',
    permission: PermissionNames.Pages_Admin_Settings,
    color: 'bg-gray-100 text-gray-700 dark:bg-gray-700/40 dark:text-gray-300',
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

export function AdminDashboardPage() {
  const { isGranted } = useAuth();

  const filterLinks = (links: QuickLink[]) =>
    links.filter((l) => !l.permission || isGranted(l.permission));

  const visiblePropertyLinks = filterLinks(propertySetupLinks);
  const visibleSystemLinks = filterLinks(systemLinks);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Administration</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage property setup, system configuration, users and roles.
          </p>
        </div>
      </div>

      {visiblePropertyLinks.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Property Setup
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {visiblePropertyLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="group flex items-start gap-4 rounded-lg bg-white p-4 shadow-sm ring-1 ring-gray-200 transition hover:shadow-md hover:ring-gray-300 dark:bg-gray-800 dark:ring-gray-700 dark:hover:ring-gray-600"
              >
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${link.color}`}>
                  {link.icon}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 group-hover:text-primary-600 dark:text-white dark:group-hover:text-primary-400">
                    {link.label}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{link.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {visibleSystemLinks.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            System Administration
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {visibleSystemLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="group flex items-start gap-4 rounded-lg bg-white p-4 shadow-sm ring-1 ring-gray-200 transition hover:shadow-md hover:ring-gray-300 dark:bg-gray-800 dark:ring-gray-700 dark:hover:ring-gray-600"
              >
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${link.color}`}>
                  {link.icon}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 group-hover:text-primary-600 dark:text-white dark:group-hover:text-primary-400">
                    {link.label}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{link.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
