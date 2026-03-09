import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { MainLayout } from '@components/layout/MainLayout';
import { resortService } from '@services/resort.service';

export const CheckInPage = () => {
  const [reservationId, setReservationId] = useState('');
  const [reservationRoomId, setReservationRoomId] = useState('');
  const [walkIn, setWalkIn] = useState({
    guestId: '',
    roomId: '',
    expectedCheckOutDate: '',
    advancePaymentAmount: '',
    paymentMethodId: '',
    paymentReference: '',
  });

  const { data: reservations } = useQuery({
    queryKey: ['resort-reservations-checkin'],
    queryFn: () => resortService.getReservations('', 0, 100),
  });

  const { data: guests } = useQuery({
    queryKey: ['resort-guests-checkin'],
    queryFn: () => resortService.getGuests('', 0, 100),
  });

  const { data: availableRooms } = useQuery({
    queryKey: ['resort-available-rooms'],
    queryFn: () => resortService.getAvailableRooms(),
  });

  const { data: paymentMethods } = useQuery({
    queryKey: ['resort-payment-methods-checkin'],
    queryFn: () => resortService.getPaymentMethods(),
  });

  const fromReservationMutation = useMutation({
    mutationFn: () => resortService.checkInFromReservation(reservationId, reservationRoomId),
  });

  const walkInMutation = useMutation({
    mutationFn: () =>
      resortService.walkInCheckIn({
        guestId: walkIn.guestId,
        roomId: walkIn.roomId,
        expectedCheckOutDate: walkIn.expectedCheckOutDate,
        advancePaymentAmount: walkIn.advancePaymentAmount ? Number(walkIn.advancePaymentAmount) : undefined,
        paymentMethodId: walkIn.paymentMethodId || undefined,
        paymentReference: walkIn.paymentReference || undefined,
      }),
  });

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Check-In</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Process reservation and walk-in arrivals.</p>
        </div>

        <section className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
          <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">From Reservation</h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Reservation</label>
              <select className="w-full rounded border p-2 dark:bg-gray-700" value={reservationId} onChange={(e) => setReservationId(e.target.value)}>
                <option value="">Select reservation</option>
                {(reservations?.items ?? []).map((r) => (
                  <option key={r.id} value={r.id}>{r.reservationNo} - {r.guestName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Available Room</label>
              <select className="w-full rounded border p-2 dark:bg-gray-700" value={reservationRoomId} onChange={(e) => setReservationRoomId(e.target.value)}>
                <option value="">Select room</option>
                {(availableRooms ?? []).map((r) => (
                  <option key={r.id} value={r.id}>{r.roomNumber} - {r.roomTypeName}</option>
                ))}
              </select>
            </div>
            <button
              type="button"
              className="rounded bg-primary-600 px-4 py-2 text-white hover:bg-primary-700 disabled:opacity-50"
              disabled={fromReservationMutation.isPending || !reservationId || !reservationRoomId}
              onClick={() => fromReservationMutation.mutate()}
            >
              {fromReservationMutation.isPending ? 'Processing...' : 'Check In'}
            </button>
          </div>
          {fromReservationMutation.data ? (
            <p className="mt-2 text-sm text-emerald-600">Stay {fromReservationMutation.data.stayNo} created. Folio {fromReservationMutation.data.folioNo}.</p>
          ) : null}
        </section>

        <section className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
          <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">Walk-In</h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Guest</label>
              <select className="w-full rounded border p-2 dark:bg-gray-700" value={walkIn.guestId} onChange={(e) => setWalkIn((s) => ({ ...s, guestId: e.target.value }))}>
                <option value="">Select guest</option>
                {(guests?.items ?? []).map((g) => (
                  <option key={g.id} value={g.id}>{g.guestCode} - {g.fullName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Available Room</label>
              <select className="w-full rounded border p-2 dark:bg-gray-700" value={walkIn.roomId} onChange={(e) => setWalkIn((s) => ({ ...s, roomId: e.target.value }))}>
                <option value="">Select room</option>
                {(availableRooms ?? []).map((r) => (
                  <option key={r.id} value={r.id}>{r.roomNumber} - {r.roomTypeName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Expected Check-Out Date</label>
              <input className="w-full rounded border p-2 dark:bg-gray-700" type="date" value={walkIn.expectedCheckOutDate} onChange={(e) => setWalkIn((s) => ({ ...s, expectedCheckOutDate: e.target.value }))} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Advance Payment (Optional)</label>
              <input className="w-full rounded border p-2 dark:bg-gray-700" type="number" value={walkIn.advancePaymentAmount} onChange={(e) => setWalkIn((s) => ({ ...s, advancePaymentAmount: e.target.value }))} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Payment Method (Optional)</label>
              <select className="w-full rounded border p-2 dark:bg-gray-700" value={walkIn.paymentMethodId} onChange={(e) => setWalkIn((s) => ({ ...s, paymentMethodId: e.target.value }))}>
                <option value="">Select payment method</option>
                {(paymentMethods ?? []).map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Payment Reference</label>
              <input className="w-full rounded border p-2 dark:bg-gray-700" value={walkIn.paymentReference} onChange={(e) => setWalkIn((s) => ({ ...s, paymentReference: e.target.value }))} />
            </div>
            <button
              type="button"
              className="rounded bg-primary-600 px-4 py-2 text-white hover:bg-primary-700 disabled:opacity-50"
              disabled={walkInMutation.isPending || !walkIn.guestId || !walkIn.roomId || !walkIn.expectedCheckOutDate}
              onClick={() => walkInMutation.mutate()}
            >
              {walkInMutation.isPending ? 'Processing...' : 'Walk-In Check In'}
            </button>
          </div>
          {walkInMutation.data ? (
            <p className="mt-2 text-sm text-emerald-600">Stay {walkInMutation.data.stayNo} created. Folio {walkInMutation.data.folioNo}.</p>
          ) : null}
        </section>
      </div>
    </MainLayout>
  );
};
