import { useEffect } from 'react';
import { Dialog, DialogPanel } from '@headlessui/react';
import { useNavigate } from 'react-router-dom';

export type QuickReservationPayload = {
  checkInDate: string;
  checkOutDate: string;
  roomTypeName: string;
  roomTypeId: string;
  roomNumber: string;
  roomId: string;
};

type QuickReservationDialogProps = {
  open: boolean;
  onClose: () => void;
  payload: QuickReservationPayload | null;
};

export const QuickReservationDialog = ({ open, onClose, payload }: QuickReservationDialogProps) => {
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  const handleCreateReservation = () => {
    if (!payload) return;
    onClose();
    navigate('/reservations/new', {
      state: {
        arrivalDate: payload.checkInDate,
        departureDate: payload.checkOutDate,
        roomTypeId: payload.roomTypeId,
        roomId: payload.roomId,
      },
    });
  };

  if (!payload) return null;

  const checkInFormatted = new Date(payload.checkInDate + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const checkOutFormatted = new Date(payload.checkOutDate + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <Dialog open={open} onClose={() => {}} className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50 pointer-events-none" aria-hidden />
      <div className="relative flex min-h-screen items-start justify-center p-4 pt-8 pointer-events-none">
        <DialogPanel className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl dark:bg-gray-800 pointer-events-auto">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Quick reservation</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Create a reservation for the selected dates and room.
          </p>
          <dl className="mt-4 space-y-3">
            <div>
              <dt className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Check-in</dt>
              <dd className="mt-0.5 font-medium text-gray-900 dark:text-white">{checkInFormatted}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Check-out</dt>
              <dd className="mt-0.5 font-medium text-gray-900 dark:text-white">{checkOutFormatted}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Room type</dt>
              <dd className="mt-0.5 font-medium text-gray-900 dark:text-white">{payload.roomTypeName}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Room</dt>
              <dd className="mt-0.5 font-medium text-gray-900 dark:text-white">{payload.roomNumber}</dd>
            </div>
          </dl>
          <div className="mt-6 flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreateReservation}
              className="rounded bg-primary-600 px-3 py-2 text-sm font-medium text-white hover:bg-primary-700"
            >
              Create reservation
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
};
