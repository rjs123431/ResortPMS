import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@contexts/AuthContext';
import { PermissionNames } from '@config/permissionNames';

const statCards = [
  { label: 'Arrivals Today', value: 18 },
  { label: 'Departures Today', value: 14 },
  { label: 'Occupied Rooms', value: 72 },
  { label: 'Vacant Rooms', value: 28 },
  { label: 'Rooms Dirty', value: 12 },
  { label: 'Rooms Out of Order', value: 2 },
] as const;

export const FrontDeskDashboardPage: React.FC = () => {
  const { isGranted } = useAuth();

  const canCreateReservation = isGranted(PermissionNames.Pages_Reservations);
  const canCheckIn = isGranted(PermissionNames.Pages_CheckIn);
  const canAssignRoom = isGranted(PermissionNames.Pages_Rooms);

  return (
    <>
      <div className="space-y-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Front Desk Dashboard</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Daily overview for arrivals, departures, occupancy, and quick front desk actions.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 sm:flex-nowrap sm:gap-2" aria-label="Quick actions">
            {canCheckIn && (
              <Link
                to="/front-desk/walk-in"
                className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
              >
                + Walk-in
              </Link>
            )}
            {canCreateReservation && (
              <Link
                to="/front-desk/reservations/new"
                className="inline-flex items-center gap-2 rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
              >
                + New Reservation
              </Link>
            )}
          </div>
        </header>

        <section aria-label="Front desk KPIs" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {statCards.map((card) => (
            <div
              key={card.label}
              className="flex flex-col justify-between rounded-lg bg-white p-4 shadow-sm ring-1 ring-gray-200 dark:bg-gray-800 dark:ring-gray-700"
            >
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{card.label}</p>
              <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">{card.value}</p>
            </div>
          ))}
        </section>
      </div>
    </>
  );
};

