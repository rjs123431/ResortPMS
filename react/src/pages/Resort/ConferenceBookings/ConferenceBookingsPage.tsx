import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { conferenceBookingService } from '@services/conference-booking.service';
import { ConferenceBookingStatus } from '@/types/conference.types';
import { formatDate, formatMoney } from '@utils/helpers';

const STATUS_TABS: Array<{ label: string; value: ConferenceBookingStatus | undefined }> = [
  { label: 'All', value: undefined },
  { label: 'Inquiry', value: ConferenceBookingStatus.Inquiry },
  { label: 'Tentative', value: ConferenceBookingStatus.Tentative },
  { label: 'Confirmed', value: ConferenceBookingStatus.Confirmed },
  { label: 'In Progress', value: ConferenceBookingStatus.InProgress },
  { label: 'Completed', value: ConferenceBookingStatus.Completed },
  { label: 'Cancelled', value: ConferenceBookingStatus.Cancelled },
];

const STATUS_BADGE: Record<ConferenceBookingStatus, string> = {
  [ConferenceBookingStatus.Inquiry]: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
  [ConferenceBookingStatus.Tentative]: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  [ConferenceBookingStatus.Confirmed]: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  [ConferenceBookingStatus.InProgress]: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  [ConferenceBookingStatus.Completed]: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200',
  [ConferenceBookingStatus.Cancelled]: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
};

export function ConferenceBookingsPage() {
  const [filter, setFilter] = useState('');
  const [status, setStatus] = useState<ConferenceBookingStatus | undefined>(undefined);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['conference-bookings', filter, status],
    queryFn: () => conferenceBookingService.getConferenceBookings({ filter: filter || undefined, status, maxResultCount: 100 }),
  });

  const items = useMemo(() => data?.items ?? [], [data]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Event Bookings</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage event inquiries, confirmed functions, deposits, and venue allocation.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/front-desk/conference-bookings/calendar" className="rounded border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700">
            Calendar View
          </Link>
          <Link to="/front-desk/conference-bookings/new" className="rounded bg-primary-600 px-4 py-2 text-sm text-white hover:bg-primary-700">
            New Booking
          </Link>
        </div>
      </div>

      <section className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div className="w-full max-w-sm">
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Search</label>
            <input className="w-full rounded border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="Booking no, event, organizer, company" />
          </div>
          <div className="flex flex-wrap gap-2">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.label}
                type="button"
                onClick={() => setStatus(tab.value)}
                className={`rounded-full px-3 py-1 text-xs font-medium ${status === tab.value ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b text-left dark:border-gray-700">
                <th className="p-2">Booking No</th>
                <th className="p-2">Venue</th>
                <th className="p-2">Event</th>
                <th className="p-2">Organizer</th>
                <th className="p-2">Schedule</th>
                <th className="p-2">Status</th>
                <th className="p-2 text-right">Total</th>
                <th className="p-2 text-right">Deposit</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading || isFetching ? (
                <tr>
                  <td colSpan={9} className="p-4 text-center text-gray-500">Loading bookings...</td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-4 text-center text-gray-500">No conference bookings found.</td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="border-b dark:border-gray-700">
                    <td className="p-2 font-medium">{item.bookingNo}</td>
                    <td className="p-2">{item.venueName}</td>
                    <td className="p-2">
                      <div className="font-medium text-gray-900 dark:text-white">{item.eventName}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{item.eventType || 'General event'}</div>
                    </td>
                    <td className="p-2">{item.companyName || item.organizerName}</td>
                    <td className="p-2">
                      <div>{formatDate(item.startDateTime)}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(item.startDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {' - '}
                        {new Date(item.endDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="p-2">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE[item.status]}`}>
                        {ConferenceBookingStatus[item.status]}
                      </span>
                    </td>
                    <td className="p-2 text-right">{formatMoney(item.totalAmount)}</td>
                    <td className="p-2 text-right">{formatMoney(item.depositPaid)}</td>
                    <td className="p-2">
                      <Link to={`/front-desk/conference-bookings/${item.id}`} className="rounded bg-slate-700 px-2 py-1 text-white hover:bg-slate-800">
                        Open
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}