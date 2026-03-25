import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { resortService } from '@services/resort.service';
import { ReservationStatus } from '@/types/reservation.types';
import { LoadPreCheckInDialog } from '../Shared/LoadPreCheckInDialog';
import { formatMoney } from '@utils/helpers';

const formatDateOnly = (value: Date) => {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
};

const toDateOnly = (value: string) => {
  if (!value) return '';
  return value.split('T')[0];
};

export const CheckInPage = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [showPreCheckInDialog, setShowPreCheckInDialog] = useState(false);
  const serverFilter = search.trim();

  const { data: reservationsData, isLoading } = useQuery({
    queryKey: ['resort-reservations-checkin-today', serverFilter],
    queryFn: () => resortService.getReservations(serverFilter, 0, 300),
    staleTime: 30 * 1000,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });

  const todayDateOnly = useMemo(() => formatDateOnly(new Date()), []);

  const todaysArrivals = useMemo(() => {
    return (reservationsData?.items ?? [])
      .filter((reservation) => reservation.status === ReservationStatus.Confirmed)
      .filter((reservation) => toDateOnly(reservation.arrivalDate) <= todayDateOnly)
      .map((reservation) => ({
        ...reservation,
        isPastDue: toDateOnly(reservation.arrivalDate) < todayDateOnly,
      }))
      .sort((a, b) => {
        if (a.isPastDue !== b.isPastDue) return a.isPastDue ? -1 : 1;
        return a.reservationNo.localeCompare(b.reservationNo);
      });
  }, [reservationsData?.items, todayDateOnly]);

  const pastDueCount = useMemo(
    () => todaysArrivals.filter((reservation) => reservation.isPastDue).length,
    [todaysArrivals],
  );

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Check-In</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Confirmed reservations arriving today and past due.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowPreCheckInDialog(true)}
              className="rounded border border-amber-600 bg-white px-4 py-2 text-sm font-medium text-amber-600 hover:bg-amber-50 dark:border-amber-500 dark:bg-gray-800 dark:text-amber-500 dark:hover:bg-amber-900/20"
            >
              Pre-Check-In
            </button>
            <Link
              to="/front-desk/walk-in"
              className="rounded bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
            >
              Walk-In
            </Link>
          </div>
        </div>

        <section className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
          <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:items-end">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Today's & Past-Due Arrivals</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Date: {todayDateOnly}
                {pastDueCount > 0 ? (
                  <span className="ml-2 font-medium text-rose-600 dark:text-rose-400">(+{pastDueCount} past due)</span>
                ) : null}
              </p>
            </div>
            <div className="w-full sm:w-80 sm:justify-self-end">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Reservation no, guest, or date"
                className="w-full rounded border border-gray-300 p-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200 text-sm dark:border-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700/40">
                <tr>
                  <th className="border border-gray-200 p-2 text-left dark:border-gray-700">Reservation No</th>
                  <th className="border border-gray-200 p-2 text-left dark:border-gray-700">Guest</th>
                  <th className="border border-gray-200 p-2 text-left dark:border-gray-700">Arrival</th>
                  <th className="border border-gray-200 p-2 text-left dark:border-gray-700">Departure</th>
                  <th className="border border-gray-200 p-2 text-right dark:border-gray-700">Nights</th>
                  <th className="border border-gray-200 p-2 text-right dark:border-gray-700">Total Amount</th>
                  <th className="border border-gray-200 p-2 text-left dark:border-gray-700">Action</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="border border-gray-200 p-3 text-center text-gray-500 dark:border-gray-700 dark:text-gray-400">
                      Loading reservations...
                    </td>
                  </tr>
                ) : todaysArrivals.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="border border-gray-200 p-3 text-center text-gray-500 dark:border-gray-700 dark:text-gray-400">
                      No confirmed arrivals for today or past due.
                    </td>
                  </tr>
                ) : (
                  todaysArrivals.map((reservation) => (
                    <tr key={reservation.id} className={reservation.isPastDue ? 'bg-rose-50/80 dark:bg-rose-900/20' : undefined}>
                      <td className="border border-gray-200 p-2 dark:border-gray-700">{reservation.reservationNo}</td>
                      <td className="border border-gray-200 p-2 dark:border-gray-700">{reservation.guestName}</td>
                      <td className="border border-gray-200 p-2 dark:border-gray-700">
                        {toDateOnly(reservation.arrivalDate)}
                        {reservation.isPastDue ? (
                          <span className="ml-2 inline-flex rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-rose-700 dark:bg-rose-900/30 dark:text-rose-300">
                            Past Due
                          </span>
                        ) : null}
                      </td>
                      <td className="border border-gray-200 p-2 dark:border-gray-700">{toDateOnly(reservation.departureDate)}</td>
                      <td className="border border-gray-200 p-2 text-right dark:border-gray-700">{reservation.nights}</td>
                      <td className="border border-gray-200 p-2 text-right dark:border-gray-700">{formatMoney(reservation.totalAmount)}</td>
                      <td className="border border-gray-200 p-2 dark:border-gray-700">
                        <button
                          type="button"
                          onClick={() => navigate(`/front-desk/check-in/reservations/${reservation.id}`)}
                          className="rounded bg-primary-600 px-3 py-1 text-xs font-medium text-white hover:bg-primary-700"
                        >
                          Open
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <LoadPreCheckInDialog
          open={showPreCheckInDialog}
          onSelect={(preCheckInId) => {
            setShowPreCheckInDialog(false);
            navigate(`/front-desk/walk-in/${preCheckInId}`);
          }}
          onClose={() => setShowPreCheckInDialog(false)}
        />
      </div>
    </>
  );
};
