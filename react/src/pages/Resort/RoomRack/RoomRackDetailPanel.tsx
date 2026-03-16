import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { resortService } from '@services/resort.service';
import { ReservationStatus } from '@/types/resort.types';
import { LogoSpinner } from '@components/common/LogoSpinner';

const reservationStatusLabel: Record<number, string> = {
  [ReservationStatus.Draft]: 'Draft',
  [ReservationStatus.Pending]: 'Pending',
  [ReservationStatus.Confirmed]: 'Confirmed',
  [ReservationStatus.Cancelled]: 'Cancelled',
  [ReservationStatus.NoShow]: 'No Show',
  [ReservationStatus.CheckedIn]: 'Checked In',
  [ReservationStatus.Completed]: 'Completed',
};

export type RoomRackPanelItem =
  | { type: 'reservation'; reservationId: string; reservationNo: string; guestName: string; status?: number; dateRange: string }
  | { type: 'stay'; stayId: string; stayNo: string; guestName: string; dateRange: string };

interface RoomRackDetailPanelProps {
  open: boolean;
  onClose: () => void;
  item: RoomRackPanelItem | null;
}

function formatDate(value?: string) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n);
}

export const RoomRackDetailPanel: React.FC<RoomRackDetailPanelProps> = ({ open, onClose, item }) => {
  const navigate = useNavigate();

  const reservationId = item?.type === 'reservation' ? item.reservationId : null;
  const { data: reservation, isLoading: loadingReservation } = useQuery({
    queryKey: ['reservation-detail', reservationId],
    queryFn: () => resortService.getReservation(reservationId!),
    enabled: open && !!reservationId,
  });

  const [entered, setEntered] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = useCallback(() => {
    setIsClosing((prev) => {
      if (prev) return prev;
      return true;
    });
  }, []);

  const handleTransitionEnd = useCallback(
    (e: React.TransitionEvent) => {
      if (e.propertyName === 'transform' && isClosing) {
        onClose();
      }
    },
    [isClosing, onClose]
  );

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    if (open) document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, handleClose]);

  useEffect(() => {
    if (open) {
      setIsClosing(false);
      setEntered(false);
      const id = requestAnimationFrame(() => {
        requestAnimationFrame(() => setEntered(true));
      });
      return () => cancelAnimationFrame(id);
    }
  }, [open]);

  if (!open) return null;

  const isVisible = entered && !isClosing;

  return (
    <aside
      className={`fixed top-14 right-4 bottom-4 z-40 w-full max-w-md flex flex-col bg-white dark:bg-gray-800 shadow-xl rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden sm:top-16 transition-transform duration-300 ease-out ${
        isVisible ? 'translate-x-0' : 'translate-x-full'
      }`}
      role="complementary"
      aria-labelledby="room-rack-panel-title"
      aria-label="Reservation or stay details"
      onTransitionEnd={handleTransitionEnd}
    >
        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 dark:border-gray-700 px-4 py-3">
          <h2 id="room-rack-panel-title" className="text-lg font-semibold text-gray-900 dark:text-white">
            {item?.type === 'reservation' ? 'Reservation' : item?.type === 'stay' ? 'In-house stay' : 'Details'}
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
            aria-label="Close panel"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!item && (
            <p className="text-sm text-gray-500 dark:text-gray-400">Select a reservation or stay from the grid.</p>
          )}

          {item?.type === 'reservation' && (
            <>
              {loadingReservation && (
                <div className="flex justify-center py-8">
                  <LogoSpinner sizeClassName="h-8 w-8" logoSizeClassName="h-5 w-5" />
                </div>
              )}
              {!loadingReservation && reservation && (
                <div className="space-y-4">
                  <div className="rounded-lg border border-gray-200 dark:border-gray-600 p-3 space-y-2">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{reservation.reservationNo}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Status: <span className="font-medium">{reservationStatusLabel[reservation.status] ?? 'Unknown'}</span>
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Guest: {reservation.guestName || '—'}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {formatDate(reservation.arrivalDate)} – {formatDate(reservation.departureDate)}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{reservation.nights} night(s)</p>
                  </div>
                  {reservation.rooms?.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rooms</h3>
                      <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-0.5">
                        {reservation.rooms.map((r) => (
                          <li key={r.id}>
                            {r.roomTypeName}
                            {r.roomNumber ? ` · ${r.roomNumber}` : ''}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <p>Total: {formatCurrency(reservation.totalAmount)}</p>
                    {reservation.depositRequired > 0 && (
                      <p>Deposit: {formatCurrency(reservation.depositPaid)} / {formatCurrency(reservation.depositRequired)}</p>
                    )}
                  </div>
                </div>
              )}
              {!loadingReservation && !reservation && item && (
                <div className="space-y-4">
                  <div className="rounded-lg border border-gray-200 dark:border-gray-600 p-3 space-y-2">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{item.reservationNo}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Status: <span className="font-medium">{item.status != null ? reservationStatusLabel[item.status] : '—'}</span>
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Guest: {item.guestName || '—'}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{item.dateRange}</p>
                  </div>
                </div>
              )}
            </>
          )}

          {item?.type === 'stay' && (
            <div className="space-y-4">
              <div className="rounded-lg border border-gray-200 dark:border-gray-600 p-3 space-y-2">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{item.stayNo}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">Guest: {item.guestName || '—'}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">{item.dateRange}</p>
              </div>
            </div>
          )}
        </div>

        {item && (
          <div className="shrink-0 border-t border-gray-200 dark:border-gray-700 p-4 space-y-2">
            {item.type === 'reservation' && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate(`/front-desk/reservations/${item.reservationId}`);
                  }}
                  className="w-full rounded bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600"
                >
                  View reservation
                </button>
                {item.status === ReservationStatus.Confirmed && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      navigate(`/front-desk/check-in/reservations/${item.reservationId}`);
                    }}
                    className="w-full rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                  >
                    Check-in
                  </button>
                )}
              </>
            )}
            {item.type === 'stay' && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate(`/front-desk/stays/${item.stayId}`);
                  }}
                  className="w-full rounded bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600"
                >
                  View stay
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate(`/front-desk/check-out`);
                  }}
                  className="w-full rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                >
                  Check-out
                </button>
              </>
            )}
          </div>
        )}
    </aside>
  );
};
