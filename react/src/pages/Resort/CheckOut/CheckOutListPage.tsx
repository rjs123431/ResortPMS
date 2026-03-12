import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MainLayout } from '@components/layout/MainLayout';
import { resortService } from '@services/resort.service';

const toDate = (value?: string) => {
  if (!value) return '-';
  return new Date(value).toLocaleString();
};

const parseRooms = (roomValue?: string) => {
  if (!roomValue) return [];
  const parts = roomValue
    .split(/[\n,|;/+&]+/)
    .map((item) => item.trim())
    .filter(Boolean);
  return Array.from(new Set(parts));
};

const CheckoutCountdown = ({ expectedCheckOutDateTime }: { expectedCheckOutDateTime?: string }) => {
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  if (!expectedCheckOutDateTime) return <span className="text-gray-400">-</span>;

  const now = new Date();
  const target = new Date(expectedCheckOutDateTime);
  const diffMs = target.getTime() - now.getTime();

  const isOverdue = diffMs < 0;
  const absDiffMs = Math.abs(diffMs);

  const totalMinutes = Math.floor(absDiffMs / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  let timeText = '';
  if (hours > 0 && minutes > 0) {
    timeText = `${hours}h ${minutes}m`;
  } else if (hours > 0) {
    timeText = `${hours}h`;
  } else {
    timeText = `${minutes}m`;
  }

  if (isOverdue) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-red-500" />
        {timeText} overdue
      </span>
    );
  }

  if (hours < 1) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500" />
        {timeText} left
      </span>
    );
  }

  if (hours < 3) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2.5 py-1 text-xs font-medium text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-yellow-500" />
        {timeText} left
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
      {timeText} left
    </span>
  );
};

export const CheckOutListPage = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const { data: inHouseData, isFetching } = useQuery({
    queryKey: ['resort-stays-checkout-list', search],
    queryFn: () => resortService.getInHouseStays(search, 0, 100),
  });

  const stays = inHouseData?.items ?? [];

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Check-Out</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Select an in-house stay to process checkout.
            </p>
          </div>
        </div>

        <section className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <input
              type="text"
              className="w-full max-w-md rounded border p-2 dark:bg-gray-700"
              placeholder="Search by stay no, guest name, or room..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b text-left dark:border-gray-700">
                  <th className="p-3">Stay No</th>
                  <th className="p-3">Guest</th>
                  <th className="p-3">Room</th>
                  <th className="p-3">Check-In</th>
                  <th className="p-3">Expected Check-Out</th>
                  <th className="p-3">Time Remaining</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {isFetching ? (
                  <tr>
                    <td colSpan={7} className="p-4 text-center text-gray-500">
                      Loading stays...
                    </td>
                  </tr>
                ) : stays.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-4 text-center text-gray-500">
                      No in-house stays found.
                    </td>
                  </tr>
                ) : (
                  stays.map((stay) => (
                    <tr key={stay.id} className="border-b hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/50">
                      <td className="p-3 font-medium">{stay.stayNo}</td>
                      <td className="p-3">{stay.guestName}</td>
                      <td className="p-3">{parseRooms(stay.roomNumber).join(', ') || '-'}</td>
                      <td className="p-3">{toDate(stay.checkInDateTime)}</td>
                      <td className="p-3">{toDate(stay.expectedCheckOutDateTime)}</td>
                      <td className="p-3">
                        <CheckoutCountdown expectedCheckOutDateTime={stay.expectedCheckOutDateTime} />
                      </td>
                      <td className="p-3">
                        <button
                          type="button"
                          className="rounded bg-primary-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-primary-700"
                          onClick={() => navigate(`/check-out/${stay.id}`)}
                        >
                          Check-Out
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {!isFetching && stays.length > 0 && (
            <p className="mt-4 text-sm text-gray-500">
              Showing {stays.length} in-house stay{stays.length !== 1 ? 's' : ''}
            </p>
          )}
        </section>
      </div>
    </MainLayout>
  );
};
