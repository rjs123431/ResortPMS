import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { resortService } from '@services/resort.service';
import { ReservationStatus } from '@/types/resort.types';

const getStatusBadgeClass = (status: ReservationStatus) => {
  switch (status) {
    case ReservationStatus.Draft:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    case ReservationStatus.Pending:
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200';
    case ReservationStatus.Confirmed:
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200';
    case ReservationStatus.CheckedIn:
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200';
    case ReservationStatus.NoShow:
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200';
    case ReservationStatus.Cancelled:
      return 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200';
    case ReservationStatus.Completed:
      return 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
  }
};

export const ReservationListPage = () => {
  const [filter, setFilter] = useState('');

  const { data: reservationsData, isLoading } = useQuery({
    queryKey: ['resort-reservations', filter],
    queryFn: () => resortService.getReservations(filter),
  });

  const reservations = useMemo(() => reservationsData?.items ?? [], [reservationsData]);

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reservations</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Confirm, cancel, and inspect reservation details.</p>
          </div>

          <Link to="/front-desk/reservations/new" className="rounded bg-primary-600 px-4 py-2 text-white hover:bg-primary-700">
            New Reservation
          </Link>
        </div>

        <section className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Reservation List</h2>
            <div className="flex w-full max-w-2xl items-end justify-end gap-2">
              <div className="w-full max-w-sm">
                <input className="w-full rounded border p-2 dark:bg-gray-700" placeholder="Search reservations..." value={filter} onChange={(e) => setFilter(e.target.value)} />
              </div>
            </div>
          </div>
          {isLoading ? <p className="text-sm text-gray-500">Loading...</p> : null}
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="p-2">Reservation No.</th>
                  <th className="p-2">Guest</th>
                  <th className="p-2">Channel</th>
                  <th className="p-2">Agency</th>
                  <th className="p-2">Check-In</th>
                  <th className="p-2">Check-Out</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {reservations.map((r) => (
                  <tr className="border-b" key={r.id}>
                    <td className="p-2">{r.reservationNo}</td>
                    <td className="p-2">{r.guestName}</td>
                    <td className="p-2">{r.channelName || '-'}</td>
                    <td className="p-2">{r.agencyName || '-'}</td>
                    <td className="p-2">{new Date(r.arrivalDate).toLocaleDateString()}</td>
                    <td className="p-2">{new Date(r.departureDate).toLocaleDateString()}</td>
                    <td className="p-2">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${getStatusBadgeClass(r.status)}`}>
                        {ReservationStatus[r.status]}
                      </span>
                    </td>
                    <td className="p-2">
                      <div className="flex flex-wrap gap-2">
                        <Link to={`/front-desk/reservations/${r.id}`} className="rounded bg-slate-700 px-2 py-1 text-white">View</Link>
                        {r.status === ReservationStatus.Confirmed ? (
                          <Link to={`/front-desk/check-in/reservations/${r.id}`} className="rounded bg-primary-600 px-2 py-1 text-white hover:bg-primary-700">Check-In</Link>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </>
  );
};
