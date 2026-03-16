import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Dialog, DialogPanel } from '@headlessui/react';
import { ReservationStatus } from '@/types/resort.types';

export type BookingsDialogItem =
  | { type: 'reservation'; id: string; number: string; guestName: string; roomNumber: string; status?: number }
  | { type: 'stay'; id: string; number: string; guestName: string; roomNumber: string };

const reservationStatusLabel: Record<number, string> = {
  [ReservationStatus.Draft]: 'Draft',
  [ReservationStatus.Pending]: 'Pending',
  [ReservationStatus.Confirmed]: 'Confirmed',
  [ReservationStatus.Cancelled]: 'Cancelled',
  [ReservationStatus.NoShow]: 'No Show',
  [ReservationStatus.CheckedIn]: 'Checked In',
  [ReservationStatus.Completed]: 'Completed',
};

export type RoomRackBookingsDialogProps = {
  open: boolean;
  onClose: () => void;
  roomTypeName: string | null;
  dateKey: string | null;
  items: BookingsDialogItem[];
};

export const RoomRackBookingsDialog = ({
  open,
  onClose,
  roomTypeName,
  dateKey,
  items,
}: RoomRackBookingsDialogProps) => {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  const dateLabel =
    dateKey != null
      ? new Date(dateKey + 'T12:00:00').toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      : null;

  return (
    <Dialog open={open} onClose={() => {}} className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50 pointer-events-none" aria-hidden />
      <div className="relative flex min-h-screen items-center justify-center p-4 pointer-events-none">
        <DialogPanel className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl dark:bg-gray-800 pointer-events-auto">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {roomTypeName != null ? `Bookings — ${roomTypeName}` : 'Bookings'}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-300"
              aria-label="Close"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {roomTypeName != null && dateKey != null ? (
            <>
              {dateLabel != null && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{dateLabel}</p>
              )}
              <ul className="space-y-2 max-h-[60vh] overflow-y-auto">
                {items.map((item) => (
                  <li key={item.type === 'reservation' ? `r-${item.id}` : `s-${item.id}`}>
                    {item.type === 'reservation' ? (
                      <Link
                        to={`/front-desk/reservations/${item.id}`}
                        className="flex flex-col gap-0.5 rounded-lg border border-gray-200 dark:border-gray-600 p-3 hover:bg-gray-50 hover:border-primary-300 dark:hover:bg-gray-700 dark:hover:border-primary-600 transition-colors"
                        onClick={onClose}
                      >
                        <span className="font-medium text-gray-900 dark:text-white">
                          Reservation {item.number}
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          Room {item.roomNumber} · {item.guestName}
                        </span>
                        {item.status != null && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {reservationStatusLabel[item.status] ?? 'Unknown'}
                          </span>
                        )}
                      </Link>
                    ) : (
                      <Link
                        to={`/front-desk/stays/${item.id}`}
                        className="flex flex-col gap-0.5 rounded-lg border border-gray-200 dark:border-gray-600 p-3 hover:bg-gray-50 hover:border-primary-300 dark:hover:bg-gray-700 dark:hover:border-primary-600 transition-colors"
                        onClick={onClose}
                      >
                        <span className="font-medium text-gray-900 dark:text-white">Stay {item.number}</span>
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          Room {item.roomNumber} · {item.guestName}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">In-house</span>
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">No bookings selected.</p>
          )}
        </DialogPanel>
      </div>
    </Dialog>
  );
};
