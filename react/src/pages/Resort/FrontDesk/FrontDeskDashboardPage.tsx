import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@contexts/AuthContext';
import { PermissionNames } from '@config/permissionNames';
import { useQuery } from '@tanstack/react-query';
import {
  frontDeskService,
  type FrontDeskArrivalRowDto,
  type FrontDeskDashboardDto,
  type FrontDeskDepartureRowDto,
} from '@services/frontdesk.service';
import { resortKeys } from '@/lib/resortQueries';

export const FrontDeskDashboardPage: React.FC = () => {
  const { isGranted } = useAuth();
  const navigate = useNavigate();

  const { data } = useQuery<FrontDeskDashboardDto>({
    queryKey: resortKeys.frontDeskDashboard(),
    queryFn: () => frontDeskService.getDashboardSummary(),
    staleTime: 60_000,
  });

  const { data: arrivals } = useQuery<FrontDeskArrivalRowDto[]>({
    queryKey: resortKeys.frontDeskArrivalsToday(),
    queryFn: () => frontDeskService.getTodayArrivals(),
    staleTime: 60_000,
  });

  const { data: departures } = useQuery<FrontDeskDepartureRowDto[]>({
    queryKey: resortKeys.frontDeskDeparturesToday(),
    queryFn: () => frontDeskService.getTodayDepartures(),
    staleTime: 60_000,
  });

  const canCreateReservation = isGranted(PermissionNames.Pages_Reservations);
  const canCheckIn = isGranted(PermissionNames.Pages_CheckIn);
  const arrivalsWithPastDue = arrivals ?? [];
  const pastDueArrivalsCount = arrivalsWithPastDue.filter((row) => row.isPastDue).length;
  const arrivalsTodayCount = data?.arrivalsToday ?? Math.max(0, arrivalsWithPastDue.length - pastDueArrivalsCount);
  const arrivalsTableRows = arrivalsWithPastDue.slice(0, 14);

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

        <section aria-label="Front desk KPIs" className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <button
            type="button"
            onClick={() => navigate('/front-desk/check-in')}
            className="flex flex-col justify-between rounded-lg bg-white p-4 text-left shadow-sm ring-1 ring-gray-200 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:ring-gray-700 dark:hover:bg-gray-700"
          >
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Arrivals Today</p>
            <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
              {arrivalsTodayCount}
              {pastDueArrivalsCount > 0 ? (
                <span className="ml-1 text-sm font-medium text-rose-600 dark:text-rose-400">
                  (+{pastDueArrivalsCount} past due)
                </span>
              ) : null}
            </p>
          </button>

          <button
            type="button"
            onClick={() => navigate('/front-desk/check-out')}
            className="flex flex-col justify-between rounded-lg bg-white p-4 text-left shadow-sm ring-1 ring-gray-200 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:ring-gray-700 dark:hover:bg-gray-700"
          >
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Departures Today</p>
            <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
              {data?.departuresToday ?? 0}
            </p>
          </button>

<button
  type="button"
  onClick={() => navigate('/front-desk/stays')}
  className="flex flex-col justify-between rounded-lg bg-white p-4 text-left shadow-sm ring-1 ring-gray-200 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:ring-gray-700 dark:hover:bg-gray-700"
>
  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Occupied Rooms</p>
  <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
    {data?.occupiedRooms ?? 0}
  </p>
</button>

          <div className="flex flex-col justify-between rounded-lg bg-white p-4 shadow-sm ring-1 ring-gray-200 dark:bg-gray-800 dark:ring-gray-700">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Vacant Rooms</p>
            <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
              {data?.vacantRooms ?? 0}
            </p>
          </div>

          <div className="flex flex-col justify-between rounded-lg bg-white p-4 shadow-sm ring-1 ring-gray-200 dark:bg-gray-800 dark:ring-gray-700">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Rooms Dirty</p>
            <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
              {data?.roomsDirty ?? 0}
            </p>
          </div>

          <div className="flex flex-col justify-between rounded-lg bg-white p-4 shadow-sm ring-1 ring-gray-200 dark:bg-gray-800 dark:ring-gray-700">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Rooms Out of Order</p>
            <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
              {data?.roomsOutOfOrder ?? 0}
            </p>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          {/* Arrivals grid */}
          <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-gray-200 dark:bg-gray-800 dark:ring-gray-700">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Arrivals</h2>
              <button
                type="button"
                onClick={() => navigate('/front-desk/check-in')}
                className="text-xs font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
              >
                View all
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-xs sm:text-sm">
                <thead className="border-b border-gray-200 text-gray-500 dark:border-gray-700 dark:text-gray-400">
                  <tr>
                    <th className="py-1.5 pr-3 font-medium">Guest</th>
                    <th className="py-1.5 pr-3 font-medium">Room</th>
                    <th className="py-1.5 pr-3 font-medium">ETA</th>
                    <th className="py-1.5 pr-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {arrivalsTableRows.length > 0 ? (
                    arrivalsTableRows.map((row) => (
                      <tr
                        key={row.reservationId}
                        className={row.isPastDue ? 'bg-rose-50/80 dark:bg-rose-900/20' : undefined}
                      >
                        <td className="py-1.5 pr-3 text-gray-900 dark:text-white">{row.guestName}</td>
                        <td className="py-1.5 pr-3 text-gray-700 dark:text-gray-300">
                          {row.roomNumber || '—'}
                        </td>
                        <td className="py-1.5 pr-3 text-gray-700 dark:text-gray-300">
                          {row.estimatedArrivalTime
                            ? new Date(row.estimatedArrivalTime).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : '—'}
                          {row.isPastDue ? (
                            <span className="ml-2 inline-flex rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-rose-700 dark:bg-rose-900/30 dark:text-rose-300">
                              Past Due
                            </span>
                          ) : null}
                        </td>
                        <td className="py-1.5 pr-0 text-right">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => navigate(`/front-desk/check-in/reservations/${row.reservationId}`)}
                              className="rounded border border-emerald-600 px-2 py-1 text-[11px] font-medium text-emerald-700 hover:bg-emerald-50 dark:border-emerald-400 dark:text-emerald-200 dark:hover:bg-emerald-900/30"
                            >
                              Check-In
                            </button>
                            <button
                              type="button"
                              onClick={() => navigate(`/front-desk/reservations/${row.reservationId}`)}
                              className="rounded border border-gray-300 px-2 py-1 text-[11px] font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-500 dark:text-gray-200 dark:hover:bg-gray-700"
                            >
                              View
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={4}
                        className="py-4 pr-3 text-center text-xs text-gray-500 dark:text-gray-400"
                      >
                        No arrivals scheduled for today or past due.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Departures grid */}
          <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-gray-200 dark:bg-gray-800 dark:ring-gray-700">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Departures</h2>
              <button
                type="button"
                onClick={() => navigate('/front-desk/check-out')}
                className="text-xs font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
              >
                View all
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-xs sm:text-sm">
                <thead className="border-b border-gray-200 text-gray-500 dark:border-gray-700 dark:text-gray-400">
                  <tr>
                    <th className="py-1.5 pr-3 font-medium">Guest</th>
                    <th className="py-1.5 pr-3 font-medium">Room</th>
                    <th className="py-1.5 pr-3 font-medium">ETD</th>
                    <th className="py-1.5 pr-3 font-medium text-right">Balance</th>
                    <th className="py-1.5 pr-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {departures && departures.length > 0 ? (
                    departures.map((row) => (
                      <tr key={row.stayId}>
                        <td className="py-1.5 pr-3 text-gray-900 dark:text-white">{row.guestName}</td>
                        <td className="py-1.5 pr-3 text-gray-700 dark:text-gray-300">
                          {row.roomNumber || '—'}
                        </td>
                        <td className="py-1.5 pr-3 text-gray-700 dark:text-gray-300">
                          {row.estimatedDepartureTime
                            ? new Date(row.estimatedDepartureTime).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : '—'}
                        </td>
                        <td className="py-1.5 pr-3 text-right text-gray-700 dark:text-gray-300">
                          {typeof row.balance === 'number'
                            ? row.balance.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })
                            : '—'}
                        </td>
                        <td className="py-1.5 pr-0 text-right">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => navigate('/front-desk/check-out')}
                              className="rounded border border-emerald-600 px-2 py-1 text-[11px] font-medium text-emerald-700 hover:bg-emerald-50 dark:border-emerald-400 dark:text-emerald-200 dark:hover:bg-emerald-900/30"
                            >
                              Check-Out
                            </button>
                            <button
                              type="button"
                              onClick={() => navigate('/front-desk/stays')}
                              className="rounded border border-gray-300 px-2 py-1 text-[11px] font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-500 dark:text-gray-200 dark:hover:bg-gray-700"
                            >
                              View Folio
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={4}
                        className="py-4 pr-3 text-center text-xs text-gray-500 dark:text-gray-400"
                      >
                        No departures scheduled for today.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

