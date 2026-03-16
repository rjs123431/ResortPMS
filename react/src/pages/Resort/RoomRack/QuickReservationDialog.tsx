import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogPanel } from '@headlessui/react';
import { resortService } from '@services/resort.service';

export type QuickReservationPayload = {
  checkInDate: string;
  checkOutDate: string;
  roomTypeName: string;
  roomTypeId: string;
  roomNumber: string;
  roomId: string;
  /** Base rate per night for this room type (from room rack). */
  baseRate?: number;
};

type QuickReservationDialogProps = {
  open: boolean;
  onClose: () => void;
  payload: QuickReservationPayload | null;
};

const round2 = (n: number) => Math.round(n * 100) / 100;

export const QuickReservationDialog = ({ open, onClose, payload }: QuickReservationDialogProps) => {
  const queryClient = useQueryClient();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [email, setEmail] = useState('');
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [ratePerNight, setRatePerNight] = useState(0);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (open && payload?.baseRate != null && payload.baseRate >= 0) {
      setRatePerNight(payload.baseRate);
    }
  }, [open, payload?.baseRate]);

  const createMutation = useMutation({
    mutationFn: async (isTemp: boolean) => {
      if (!payload) throw new Error('Missing reservation data.');
      if (!firstName.trim()) throw new Error('First name is required.');
      if (!lastName.trim()) throw new Error('Last name is required.');
      if (!contactNumber.trim()) throw new Error('Contact number is required.');
      const checkInTime = '14:00:00';
      const checkOutTime = '12:00:00';
      const arrivalDate = payload.checkInDate.includes('T') ? payload.checkInDate : `${payload.checkInDate}T${checkInTime}`;
      const departureDate = payload.checkOutDate.includes('T') ? payload.checkOutDate : `${payload.checkOutDate}T${checkOutTime}`;
      const nights = Math.max(1, Math.ceil((new Date(departureDate).getTime() - new Date(arrivalDate).getTime()) / (24 * 60 * 60 * 1000)));
      const amount = round2(ratePerNight * nights);
      const roomEntry = {
        roomTypeId: payload.roomTypeId,
        roomId: payload.roomId || undefined,
        ratePerNight: round2(ratePerNight),
        numberOfNights: nights,
        amount,
        discountPercent: 0,
        discountAmount: 0,
        seniorCitizenCount: 0,
        seniorCitizenPercent: 20,
        seniorCitizenDiscountAmount: 0,
        netAmount: amount,
      };
      const tempRoomEntry = {
        roomTypeId: payload.roomTypeId,
        ratePerNight: round2(ratePerNight),
        numberOfNights: nights,
        amount,
        discountPercent: 0,
        discountAmount: 0,
        seniorCitizenCount: 0,
        seniorCitizenPercent: 20,
        seniorCitizenDiscountAmount: 0,
        netAmount: amount,
      };
      return resortService.createReservation({
        arrivalDate,
        departureDate,
        adults,
        children,
        totalAmount: isTemp ? 0 : amount,
        depositPercentage: 0,
        depositRequired: 0,
        notes: notes.trim() || undefined,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: contactNumber.trim(),
        email: email.trim() || undefined,
        isTempReservation: isTemp,
        rooms: isTemp ? [tempRoomEntry] : [roomEntry],
        extraBeds: [],
        additionalGuestIds: [],
      });
    },
    onSuccess: () => {
      onClose();
      void queryClient.invalidateQueries({ queryKey: ['resort-reservations'] });
      void queryClient.invalidateQueries({ queryKey: ['frontdesk-grid-reservations-with-rooms'] });
      void queryClient.invalidateQueries({ queryKey: ['room-rack-info'] });
    },
  });

  const handleCreateReservation = () => {
    createMutation.mutate(false);
  };

  const handleCreateTempReservation = () => {
    createMutation.mutate(true);
  };

  if (!payload) return null;

  const checkIn = new Date(payload.checkInDate + 'T12:00:00');
  const checkOut = new Date(payload.checkOutDate + 'T12:00:00');
  const sameYear = checkIn.getFullYear() === checkOut.getFullYear();
  const sameMonth = sameYear && checkIn.getMonth() === checkOut.getMonth();
  const monthDay = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const dateRangeLabel = sameMonth
    ? `${monthDay(checkIn)}-${checkOut.getDate()}`
    : sameYear
      ? `${monthDay(checkIn)} – ${monthDay(checkOut)}`
      : `${monthDay(checkIn)} – ${monthDay(checkOut)}, ${checkOut.getFullYear()}`;

  const nights = Math.max(1, Math.ceil((checkOut.getTime() - checkIn.getTime()) / (24 * 60 * 60 * 1000)));
  const canSubmit =
    firstName.trim() !== '' &&
    lastName.trim() !== '' &&
    contactNumber.trim() !== '' &&
    !createMutation.isPending;

  return (
    <Dialog open={open} onClose={() => {}} className="fixed inset-0 z-50 overflow-y-auto">
        <div className="fixed inset-0 bg-black/50 pointer-events-none" aria-hidden />
        <div className="relative flex min-h-screen items-start justify-center p-4 pt-8 pointer-events-none">
          <DialogPanel className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl dark:bg-gray-800 pointer-events-auto">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Quick reservation</h2>
            <hr className="my-4" />
            <dl className="mt-4 space-y-3">
              <div className="flex flex-wrap gap-4">
                <div>
                  <dt className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Dates</dt>
                  <dd className="mt-0.5 font-medium text-gray-900 dark:text-white">{dateRangeLabel}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Room type</dt>
                  <dd className="mt-0.5 font-medium text-gray-900 dark:text-white">{payload.roomTypeName}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Room</dt>
                  <dd className="mt-0.5 font-medium text-gray-900 dark:text-white">{payload.roomNumber}</dd>
                </div>
              </div>
            </dl>

            <div className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium uppercase text-gray-500 dark:text-gray-400">First name</label>
                  <input
                    type="text"
                    className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Last name</label>
                  <input
                    type="text"
                    className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Contact number</label>
                <input
                  type="text"
                  className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Email (optional)</label>
                <input
                  type="email"
                  className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Adults</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    value={adults}
                    onChange={(e) => setAdults(Math.max(1, Math.min(20, Number(e.target.value) || 1)))}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Children</label>
                  <input
                    type="number"
                    min={0}
                    max={10}
                    className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    value={children}
                    onChange={(e) => setChildren(Math.max(0, Math.min(10, Number(e.target.value) || 0)))}
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Rate per night</label>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  value={ratePerNight || ''}
                  onChange={(e) => setRatePerNight(Math.max(0, Number(e.target.value) || 0))}
                />
                {ratePerNight > 0 && (
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                    {nights} night{nights !== 1 ? 's' : ''} × {ratePerNight.toFixed(2)} = {(ratePerNight * nights).toFixed(2)}
                  </p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Notes</label>
                <textarea
                  rows={2}
                  className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional"
                />
              </div>
            </div>

            {createMutation.isError && (
              <p className="mt-3 text-sm text-red-600 dark:text-red-400">
                {createMutation.error instanceof Error ? createMutation.error.message : 'Failed to create reservation.'}
              </p>
            )}

            <div className="mt-6 flex flex-wrap gap-2 justify-end">
              <button
                type="button"
                onClick={onClose}
                className="rounded border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateTempReservation}
                disabled={!canSubmit || createMutation.isPending}
                className="rounded border border-primary-600 bg-white px-3 py-2 text-sm font-medium text-primary-600 hover:bg-primary-50 dark:border-primary-500 dark:bg-transparent dark:text-primary-400 dark:hover:bg-primary-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Create a draft reservation with no room assigned"
              >
                Temp Reserve
              </button>
              <button
                type="button"
                onClick={handleCreateReservation}
                disabled={!canSubmit || createMutation.isPending}
                className="rounded bg-primary-600 px-3 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Reserve
              </button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
  );
};
