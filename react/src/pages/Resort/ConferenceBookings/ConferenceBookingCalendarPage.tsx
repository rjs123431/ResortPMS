import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { conferenceBookingService } from '@services/conference-booking.service';
import { conferenceVenueBlackoutService } from '@services/conference-venue-blackout.service';
import { conferenceVenueService } from '@services/conference-venue.service';
import { ConferenceBookingStatus } from '@/types/conference.types';

const STATUS_BADGE: Record<ConferenceBookingStatus, string> = {
  [ConferenceBookingStatus.Inquiry]: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
  [ConferenceBookingStatus.Tentative]: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  [ConferenceBookingStatus.Confirmed]: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  [ConferenceBookingStatus.InProgress]: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  [ConferenceBookingStatus.Completed]: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200',
  [ConferenceBookingStatus.Cancelled]: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
};

export function ConferenceBookingCalendarPage() {
  const [weekStart, setWeekStart] = useState(() => getStartOfWeek(new Date()));
  const [selectedVenueId, setSelectedVenueId] = useState('all');

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)),
    [weekStart],
  );

  const weekRange = useMemo(
    () => ({
      startFrom: weekStart.toISOString(),
      endTo: addDays(weekStart, 7).toISOString(),
    }),
    [weekStart],
  );

  const venuesQuery = useQuery({
    queryKey: ['conference-venues-active'],
    queryFn: conferenceVenueService.getActiveConferenceVenues,
  });

  const bookingsQuery = useQuery({
    queryKey: ['conference-bookings-calendar', selectedVenueId, weekRange.startFrom, weekRange.endTo],
    queryFn: () =>
      conferenceBookingService.getConferenceBookings({
        venueId: selectedVenueId === 'all' ? undefined : selectedVenueId,
        startFrom: weekRange.startFrom,
        endTo: weekRange.endTo,
        maxResultCount: 300,
      }),
  });

  const blackoutsQuery = useQuery({
    queryKey: ['conference-venue-blackouts-calendar', selectedVenueId, weekRange.startFrom, weekRange.endTo],
    queryFn: () =>
      conferenceVenueBlackoutService.getConferenceVenueBlackouts({
        venueId: selectedVenueId === 'all' ? undefined : selectedVenueId,
        startFrom: weekRange.startFrom,
        endTo: weekRange.endTo,
      }),
  });

  const venues = useMemo(() => {
    const activeVenues = venuesQuery.data ?? [];
    if (selectedVenueId === 'all') return activeVenues;
    return activeVenues.filter((venue) => venue.id === selectedVenueId);
  }, [selectedVenueId, venuesQuery.data]);

  const bookings = bookingsQuery.data?.items ?? [];
  const blackouts = blackoutsQuery.data?.items ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Event Calendar</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Weekly view of conference halls and meeting-room utilization.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/front-desk/conference-bookings" className="rounded border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700">
            Booking List
          </Link>
          <Link to="/front-desk/conference-bookings/new" className="rounded bg-primary-600 px-4 py-2 text-sm text-white hover:bg-primary-700">
            New Booking
          </Link>
        </div>
      </div>

      <section className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="rounded border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
              onClick={() => setWeekStart((current) => addDays(current, -7))}
            >
              Previous Week
            </button>
            <button
              type="button"
              className="rounded border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
              onClick={() => setWeekStart(getStartOfWeek(new Date()))}
            >
              Current Week
            </button>
            <button
              type="button"
              className="rounded border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
              onClick={() => setWeekStart((current) => addDays(current, 7))}
            >
              Next Week
            </button>
            <div className="ml-1 text-sm font-medium text-gray-700 dark:text-gray-300">
              {formatRangeLabel(weekStart, addDays(weekStart, 6))}
            </div>
          </div>

          <label className="block w-full max-w-xs text-sm text-gray-700 dark:text-gray-300">
            Venue Filter
            <select
              className="mt-1 w-full rounded border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              value={selectedVenueId}
              onChange={(event) => setSelectedVenueId(event.target.value)}
            >
              <option value="all">All active venues</option>
              {(venuesQuery.data ?? []).map((venue) => (
                <option key={venue.id} value={venue.id}>
                  {venue.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[1100px]">
            <div className="grid grid-cols-[220px_repeat(7,minmax(0,1fr))] gap-2">
              <div className="rounded bg-gray-50 p-3 text-sm font-semibold text-gray-700 dark:bg-gray-700/60 dark:text-gray-200">
                Venue
              </div>
              {weekDays.map((day) => (
                <div key={day.toISOString()} className="rounded bg-gray-50 p-3 text-sm font-semibold text-gray-700 dark:bg-gray-700/60 dark:text-gray-200">
                  <div>{day.toLocaleDateString([], { weekday: 'short' })}</div>
                  <div className="text-xs font-normal text-gray-500 dark:text-gray-400">{day.toLocaleDateString([], { month: 'short', day: 'numeric' })}</div>
                </div>
              ))}

              {bookingsQuery.isLoading || blackoutsQuery.isLoading ? (
                <div className="col-span-8 rounded border border-gray-200 p-6 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                  Loading weekly schedule...
                </div>
              ) : venues.length === 0 ? (
                <div className="col-span-8 rounded border border-gray-200 p-6 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                  No active venues available for the selected filter.
                </div>
              ) : (
                venues.map((venue) => (
                  <WeekRow
                    key={venue.id}
                    venueName={venue.name}
                    days={weekDays}
                    bookings={bookings.filter((booking) => booking.venueId === venue.id)}
                    blackouts={blackouts.filter((blackout) => blackout.venueId === venue.id)}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-3 text-xs text-gray-600 dark:text-gray-300">
          <div className="flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded bg-primary-100 ring-1 ring-primary-300 dark:bg-primary-900/30 dark:ring-primary-700" />
            Event booking
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded bg-rose-100 ring-1 ring-rose-300 dark:bg-rose-900/30 dark:ring-rose-700" />
            Venue blackout
          </div>
        </div>
      </section>
    </div>
  );
}

function WeekRow({
  venueName,
  days,
  bookings,
  blackouts,
}: {
  venueName: string;
  days: Date[];
  bookings: Array<{
    id: string;
    bookingNo: string;
    eventName: string;
    organizerName: string;
    companyName: string;
    startDateTime: string;
    endDateTime: string;
    status: ConferenceBookingStatus;
  }>;
  blackouts: Array<{
    id: string;
    title: string;
    notes: string;
    startDateTime: string;
    endDateTime: string;
  }>;
}) {
  return (
    <>
      <div className="rounded border border-gray-200 p-3 text-sm font-medium text-gray-900 dark:border-gray-700 dark:text-white">
        {venueName}
      </div>
      {days.map((day) => {
        const dayStart = new Date(day);
        const dayEnd = addDays(dayStart, 1);
        const bookingItems = bookings.filter((booking) => {
          const bookingStart = new Date(booking.startDateTime);
          const bookingEnd = new Date(booking.endDateTime);
          return bookingStart < dayEnd && bookingEnd > dayStart;
        });
        const blackoutItems = blackouts.filter((blackout) => {
          const blackoutStart = new Date(blackout.startDateTime);
          const blackoutEnd = new Date(blackout.endDateTime);
          return blackoutStart < dayEnd && blackoutEnd > dayStart;
        });

        return (
          <div key={`${venueName}-${day.toISOString()}`} className="min-h-[120px] rounded border border-gray-200 p-2 dark:border-gray-700">
            {bookingItems.length === 0 && blackoutItems.length === 0 ? (
              <div className="text-xs text-gray-400 dark:text-gray-500">No bookings</div>
            ) : (
              <div className="space-y-2">
                {blackoutItems.map((blackout) => (
                  <div
                    key={blackout.id}
                    className="block rounded border border-rose-200 bg-rose-50 p-2 dark:border-rose-800/60 dark:bg-rose-900/20"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-xs font-semibold text-rose-800 dark:text-rose-200">{blackout.title}</div>
                        <div className="truncate text-[11px] text-rose-600 dark:text-rose-300">Venue blocked</div>
                      </div>
                      <span className="rounded-full bg-rose-100 px-1.5 py-0.5 text-[10px] font-medium text-rose-700 dark:bg-rose-900/40 dark:text-rose-200">
                        Blackout
                      </span>
                    </div>
                    <div className="mt-1 text-[11px] text-rose-700 dark:text-rose-200">
                      {new Date(blackout.startDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {' - '}
                      {new Date(blackout.endDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    {blackout.notes ? <div className="mt-1 line-clamp-2 text-[11px] text-rose-600 dark:text-rose-300">{blackout.notes}</div> : null}
                  </div>
                ))}

                {bookingItems.map((booking) => (
                  <Link
                    key={booking.id}
                    to={`/front-desk/conference-bookings/${booking.id}`}
                    className="block rounded border border-gray-200 bg-gray-50 p-2 hover:border-primary-400 hover:bg-primary-50 dark:border-gray-600 dark:bg-gray-700/50 dark:hover:border-primary-500 dark:hover:bg-primary-900/20"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-xs font-semibold text-gray-900 dark:text-white">{booking.eventName}</div>
                        <div className="truncate text-[11px] text-gray-500 dark:text-gray-400">{booking.companyName || booking.organizerName}</div>
                      </div>
                      <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${STATUS_BADGE[booking.status]}`}>
                        {ConferenceBookingStatus[booking.status]}
                      </span>
                    </div>
                    <div className="mt-1 text-[11px] text-gray-600 dark:text-gray-300">
                      {new Date(booking.startDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {' - '}
                      {new Date(booking.endDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}

function getStartOfWeek(date: Date) {
  const result = new Date(date);
  const day = result.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  result.setDate(result.getDate() + diff);
  result.setHours(0, 0, 0, 0);
  return result;
}

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function formatRangeLabel(start: Date, end: Date) {
  return `${start.toLocaleDateString([], { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}`;
}