import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MainLayout } from '@components/layout/MainLayout';
import { resortService } from '@services/resort.service';
import { ReservationStatus } from '@/types/resort.types';

export const ReservationListPage = () => {
  const [filter, setFilter] = useState('');

  const { data: reservationsData, isLoading } = useQuery({
    queryKey: ['resort-reservations', filter],
    queryFn: () => resortService.getReservations(filter),
  });

  const reservations = useMemo(() => reservationsData?.items ?? [], [reservationsData]);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reservations</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Confirm, cancel, and inspect reservation details.</p>
        </div>

        <section className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Reservation List</h2>
            <div className="flex w-full max-w-2xl items-end justify-end gap-2">
              <div className="w-full max-w-sm">
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Search Reservations</label>
                <input className="w-full rounded border p-2 dark:bg-gray-700" value={filter} onChange={(e) => setFilter(e.target.value)} />
              </div>
              <Link to="/find-available-rooms" className="rounded border px-4 py-2 dark:border-gray-600">
                Find Rooms
              </Link>
              <Link to="/reservations/new" className="rounded bg-primary-600 px-4 py-2 text-white hover:bg-primary-700">
                New Reservation
              </Link>
            </div>
          </div>
          {isLoading ? <p className="text-sm text-gray-500">Loading...</p> : null}
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="p-2">Reservation No.</th>
                  <th className="p-2">Guest</th>
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
                    <td className="p-2">{new Date(r.arrivalDate).toLocaleDateString()}</td>
                    <td className="p-2">{new Date(r.departureDate).toLocaleDateString()}</td>
                    <td className="p-2">{ReservationStatus[r.status]}</td>
                    <td className="p-2">
                      <div className="flex flex-wrap gap-2">
                        <Link to={`/reservations/${r.id}`} className="rounded bg-slate-700 px-2 py-1 text-white">View</Link>
                        {r.status === ReservationStatus.Confirmed ? (
                          <Link to={`/check-in/reservations/${r.id}`} className="rounded bg-primary-600 px-2 py-1 text-white hover:bg-primary-700">Check-In</Link>
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
    </MainLayout>
  );
};
