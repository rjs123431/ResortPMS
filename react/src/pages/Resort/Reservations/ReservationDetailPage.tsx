import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { MainLayout } from '@components/layout/MainLayout';
import { resortService } from '@services/resort.service';
import { ReservationStatus } from '@/types/resort.types';

const formatDateLocal = (value: Date) => {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
};

const formatMoney = (value: number) =>
  value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const getStatusBadgeClass = (status: ReservationStatus) => {
  switch (status) {
    case ReservationStatus.Pending:
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200';
    case ReservationStatus.Confirmed:
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200';
    case ReservationStatus.CheckedIn:
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200';
    case ReservationStatus.NoShow:
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200';
    case ReservationStatus.Cancelled:
      return 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200';
    case ReservationStatus.Completed:
      return 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
  }
};

export const ReservationDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [depositAmount, setDepositAmount] = useState('');
  const [depositPaymentMethodId, setDepositPaymentMethodId] = useState('');
  const [depositPaidDate, setDepositPaidDate] = useState(formatDateLocal(new Date()));
  const [depositReferenceNo, setDepositReferenceNo] = useState('');
  const [isDepositDialogOpen, setIsDepositDialogOpen] = useState(false);
  const [isGuestDialogOpen, setIsGuestDialogOpen] = useState(false);
  const [guestFilter, setGuestFilter] = useState('');
  const [selectedGuestsForAdd, setSelectedGuestsForAdd] = useState<Record<string, string>>({});
  const [guestAgeDrafts, setGuestAgeDrafts] = useState<Record<string, string>>({});
  const guestAgeSaveTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const [showCreateGuest, setShowCreateGuest] = useState(false);
  const [newGuest, setNewGuest] = useState({
    guestCode: `GST${Date.now().toString().slice(-6)}`,
    firstName: '',
    lastName: '',
    middleName: '',
    email: '',
    phone: '',
    nationality: '',
    notes: '',
  });

  const { data: reservationDetail, isLoading } = useQuery({
    queryKey: ['resort-reservation-detail', id],
    queryFn: () => resortService.getReservation(id as string),
    enabled: Boolean(id),
  });

  const { data: paymentMethods } = useQuery({
    queryKey: ['resort-payment-methods'],
    queryFn: () => resortService.getPaymentMethods(),
  });

  const { data: roomLookup } = useQuery({
    queryKey: ['resort-rooms-lookup'],
    queryFn: async () => {
      const result = await resortService.getRooms('', 0, 500);
      return result.items;
    },
  });

  const { data: guestLookup, isLoading: isGuestLookupLoading } = useQuery({
    queryKey: ['reservation-guest-search', guestFilter],
    queryFn: () => resortService.getGuests(guestFilter, 0, 50),
    enabled: isGuestDialogOpen,
  });

  const confirmMutation = useMutation({
    mutationFn: resortService.confirmReservation,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['resort-reservations'] });
      void queryClient.invalidateQueries({ queryKey: ['resort-reservation-detail', id] });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => resortService.cancelReservation(id as string, 'Cancelled from reservation detail'),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['resort-reservations'] });
      void queryClient.invalidateQueries({ queryKey: ['resort-reservation-detail', id] });
    },
  });

  const noShowMutation = useMutation({
    mutationFn: () => resortService.markReservationNoShow(id as string),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['resort-reservations'] });
      void queryClient.invalidateQueries({ queryKey: ['resort-reservation-detail', id] });
    },
  });

  const recordDepositMutation = useMutation({
    mutationFn: resortService.recordReservationDeposit,
    onSuccess: () => {
      setIsDepositDialogOpen(false);
      setDepositAmount('');
      setDepositPaymentMethodId('');
      setDepositPaidDate(formatDateLocal(new Date()));
      setDepositReferenceNo('');
      void queryClient.invalidateQueries({ queryKey: ['resort-reservations'] });
      void queryClient.invalidateQueries({ queryKey: ['resort-reservation-detail', id] });
    },
  });

  const addGuestsMutation = useMutation({
    mutationFn: (guestRows: { guestId: string; age: number }[]) => resortService.addReservationGuests(id as string, guestRows),
    onSuccess: () => {
      setIsGuestDialogOpen(false);
      setGuestFilter('');
      setSelectedGuestsForAdd({});
      void queryClient.invalidateQueries({ queryKey: ['resort-reservations'] });
      void queryClient.invalidateQueries({ queryKey: ['resort-reservation-detail', id] });
    },
  });

  const createGuestMutation = useMutation({
    mutationFn: () => resortService.createGuest(newGuest),
    onSuccess: () => {
      setShowCreateGuest(false);
      setGuestFilter('');
      setNewGuest({
        guestCode: `GST${Date.now().toString().slice(-6)}`,
        firstName: '',
        lastName: '',
        middleName: '',
        email: '',
        phone: '',
        nationality: '',
        notes: '',
      });
      void queryClient.invalidateQueries({ queryKey: ['reservation-guest-search'] });
    },
  });

  const updateGuestAgeMutation = useMutation({
    mutationFn: (input: { reservationGuestId: string; age: number }) =>
      resortService.updateReservationGuestAge(id as string, input.reservationGuestId, input.age),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['resort-reservation-detail', id] });
    },
  });

  const removeGuestMutation = useMutation({
    mutationFn: (reservationGuestId: string) => resortService.removeReservationGuest(id as string, reservationGuestId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['resort-reservations'] });
      void queryClient.invalidateQueries({ queryKey: ['resort-reservation-detail', id] });
    },
  });

  const rooms = reservationDetail?.rooms ?? [];
  const extraBeds = reservationDetail?.extraBeds ?? [];
  const guests = reservationDetail?.guests ?? [];
  const deposits = reservationDetail?.deposits ?? [];
  const depositAmountValue = Number(depositAmount || 0);
  const depositBalance = useMemo(() => {
    if (!reservationDetail) return 0;
    return Math.max(0, reservationDetail.depositRequired - reservationDetail.depositPaid);
  }, [reservationDetail]);

  const totalAmountBalance = useMemo(() => {
    if (!reservationDetail) return 0;
    return Math.max(0, reservationDetail.totalAmount - reservationDetail.depositPaid);
  }, [reservationDetail]);

  const canAddGuests = useMemo(() => {
    if (!reservationDetail) return false;
    return ![
      ReservationStatus.Cancelled,
      ReservationStatus.NoShow,
      ReservationStatus.CheckedIn,
      ReservationStatus.Completed,
    ].includes(reservationDetail.status);
  }, [reservationDetail]);

  const existingGuestIds = useMemo(() => new Set(guests.map((g) => g.guestId)), [guests]);

  const selectableGuests = useMemo(
    () => (guestLookup?.items ?? []).filter((g) => !existingGuestIds.has(g.id)),
    [guestLookup?.items, existingGuestIds],
  );

  const roomNumberById = useMemo(() => {
    const map = new Map<string, string>();
    (roomLookup ?? []).forEach((room) => {
      map.set(room.id, room.roomNumber);
    });
    return map;
  }, [roomLookup]);

  useEffect(() => {
    const nextDrafts: Record<string, string> = {};
    guests.forEach((g) => {
      nextDrafts[g.id] = String(g.age ?? 0);
    });
    setGuestAgeDrafts(nextDrafts);
  }, [guests]);

  useEffect(() => {
    return () => {
      Object.values(guestAgeSaveTimersRef.current).forEach((timerId) => clearTimeout(timerId));
    };
  }, []);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reservation Detail</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Review and manage reservation details.</p>
          </div>
          {reservationDetail?.status === ReservationStatus.Pending ? (
            <div className="flex gap-2">
              <button
                type="button"
                className="rounded bg-emerald-600 px-3 py-2 text-sm text-white disabled:opacity-50"
                disabled={confirmMutation.isPending}
                onClick={() => confirmMutation.mutate(id as string)}
              >
                Confirm
              </button>
              <button
                type="button"
                className="rounded bg-rose-600 px-3 py-2 text-sm text-white disabled:opacity-50"
                disabled={cancelMutation.isPending}
                onClick={() => cancelMutation.mutate()}
              >
                Cancel
              </button>
            </div>
          ) : null}

          {reservationDetail?.status === ReservationStatus.Confirmed ? (
            <div className="flex gap-2">
              <button
                type="button"
                className="rounded bg-primary-600 px-3 py-2 text-sm text-white"
                onClick={() => navigate(`/check-in/reservations/${id}`)}
              >
                Check-In
              </button>
              <button
                type="button"
                className="rounded bg-amber-600 px-3 py-2 text-sm text-white disabled:opacity-50"
                disabled={noShowMutation.isPending}
                onClick={() => noShowMutation.mutate()}
              >
                No Show
              </button>
            </div>
          ) : null}
        </div>

        <section className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
          {isLoading ? <p className="text-sm text-gray-500">Loading...</p> : null}
          {!isLoading && !reservationDetail ? <p className="text-sm text-rose-600">Reservation not found.</p> : null}

          {reservationDetail ? (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                <div className="grid grid-cols-[140px_1fr] items-center gap-2"><div className="font-medium">No:</div><div className="font-semibold">{reservationDetail.reservationNo}</div></div>
                <div className="grid grid-cols-[140px_1fr] items-center gap-2"><div className="font-medium">Check-In:</div><div className="font-semibold">{new Date(reservationDetail.arrivalDate).toLocaleDateString()}</div></div>
                <div className="grid grid-cols-[140px_1fr] items-center gap-2"><div className="font-medium">Guest:</div><div className="font-semibold">{reservationDetail.guestName}</div></div>
                <div className="grid grid-cols-[140px_1fr] items-center gap-2"><div className="font-medium">Check-Out:</div><div className="font-semibold">{new Date(reservationDetail.departureDate).toLocaleDateString()}</div></div>
                <div className="grid grid-cols-[140px_1fr] items-center gap-2"><div className="font-medium">Contact No.:</div><div className="font-semibold">{reservationDetail.phone?.trim() ? reservationDetail.phone : '-'}</div></div>
                <div className="grid grid-cols-[140px_1fr] items-center gap-2"><div className="font-medium">Email:</div><div className="font-semibold">{reservationDetail.email?.trim() ? reservationDetail.email : '-'}</div></div>
                <div className="grid grid-cols-[140px_1fr] items-center gap-2"><div className="font-medium">Adults:</div><div className="font-semibold">{reservationDetail.adults}</div></div>
                <div className="grid grid-cols-[140px_1fr] items-center gap-2"><div className="font-medium">Nights:</div><div className="font-semibold">{reservationDetail.nights}</div></div>
                <div className="grid grid-cols-[140px_1fr] items-center gap-2"><div className="font-medium">Children:</div><div className="font-semibold">{reservationDetail.children}</div></div>
                <div className="grid grid-cols-[140px_1fr] items-center gap-2">
                  <div className="font-medium">Status:</div>
                  <div>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${getStatusBadgeClass(reservationDetail.status)}`}
                    >
                      {ReservationStatus[reservationDetail.status]}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-[140px_1fr] items-center gap-2"><div className="font-medium">Deposit %:</div><div className="font-semibold">{reservationDetail.depositPercentage.toFixed(2)}%</div></div>
                <div className="grid grid-cols-[140px_1fr] items-center gap-2"><div className="font-medium">TOTAL:</div><div className="font-semibold">{formatMoney(reservationDetail.totalAmount)}</div></div>
                <div className="grid grid-cols-[140px_1fr] items-center gap-2"><div className="font-medium">Deposit Required:</div><div className="font-semibold">{formatMoney(reservationDetail.depositRequired)}</div></div>
                <div className="grid grid-cols-[140px_1fr] items-center gap-2"><div className="font-medium">Deposit Paid:</div><div className="font-semibold">{formatMoney(reservationDetail.depositPaid)}</div></div>
                <div className="grid grid-cols-[140px_1fr] items-center gap-2"><div className="font-medium">Deposit Balance:</div><div className="font-semibold">{formatMoney(depositBalance)}</div></div>
                <div className="grid grid-cols-[140px_1fr] items-center gap-2"><div className="font-medium">BALANCE:</div><div className="font-semibold">{formatMoney(totalAmountBalance)}</div></div>
                <div className="grid grid-cols-[140px_1fr] items-start gap-2 md:col-span-2">
                  <div className="font-medium">Notes:</div>
                  <div className="font-semibold whitespace-pre-line">{reservationDetail.notes?.trim() ? reservationDetail.notes : '-'}</div>
                </div>
                <div className="grid grid-cols-[140px_1fr] items-start gap-2 md:col-span-2">
                  <div className="font-medium">Reservation Conditions:</div>
                  <div className="font-semibold whitespace-pre-line">{reservationDetail.reservationConditions?.trim() ? reservationDetail.reservationConditions : '-'}</div>
                </div>
                <div className="grid grid-cols-[140px_1fr] items-start gap-2 md:col-span-2">
                  <div className="font-medium">Special Requests:</div>
                  <div className="font-semibold whitespace-pre-line">{reservationDetail.specialRequests?.trim() ? reservationDetail.specialRequests : '-'}</div>
                </div>
              </div>

              <div>
                <h4 className="mb-2 font-medium">Rooms</h4>
                {rooms.length === 0 ? (
                  <p className="text-gray-500">No rooms.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b text-left">
                          <th className="p-2">Room Type</th>
                          <th className="p-2">Room No.</th>
                          <th className="p-2 text-right">Rate/Night</th>
                          <th className="p-2 text-right">Nights</th>
                          <th className="p-2 text-right">Amount</th>
                          <th className="p-2 text-right">Net Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rooms.map((room) => (
                          <tr key={room.id} className="border-b">
                            <td className="p-2">{room.roomTypeName}</td>
                            <td className="p-2">{room.roomNumber || (room.roomId ? roomNumberById.get(room.roomId) : undefined) || 'Unassigned'}</td>
                            <td className="p-2 text-right tabular-nums">{formatMoney(room.ratePerNight)}</td>
                            <td className="p-2 text-right tabular-nums">{room.numberOfNights}</td>
                            <td className="p-2 text-right tabular-nums">{formatMoney(room.amount)}</td>
                            <td className="p-2 text-right tabular-nums">{formatMoney(room.netAmount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div>
                <h4 className="mb-2 font-medium">Extra Beds</h4>
                {extraBeds.length === 0 ? (
                  <p className="text-gray-500">No extra beds.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b text-left">
                          <th className="p-2">Extra Bed Type</th>
                          <th className="p-2 text-right">Quantity</th>
                          <th className="p-2 text-right">Rate/Night</th>
                          <th className="p-2 text-right">Nights</th>
                          <th className="p-2 text-right">Amount</th>
                          <th className="p-2 text-right">Net Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {extraBeds.map((bed) => (
                          <tr key={bed.id} className="border-b">
                            <td className="p-2">{bed.extraBedTypeName || '-'}</td>
                            <td className="p-2 text-right tabular-nums">{bed.quantity}</td>
                            <td className="p-2 text-right tabular-nums">{formatMoney(bed.ratePerNight)}</td>
                            <td className="p-2 text-right tabular-nums">{bed.numberOfNights}</td>
                            <td className="p-2 text-right tabular-nums">{formatMoney(bed.amount)}</td>
                            <td className="p-2 text-right tabular-nums">{formatMoney(bed.netAmount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <h4 className="font-medium">Guests</h4>
                  <button
                    type="button"
                    className="rounded bg-primary-600 px-3 py-1 text-sm text-white disabled:opacity-50"
                    disabled={!canAddGuests}
                    onClick={() => setIsGuestDialogOpen(true)}
                  >
                    Add Guest(s)
                  </button>
                </div>
                {guests.length === 0 ? (
                  <p className="text-gray-500">No guests.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b text-left">
                          <th className="p-2">Guest</th>
                          <th className="p-2 text-right">Age</th>
                          <th className="p-2 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {guests.map((g) => {
                          const draftAge = guestAgeDrafts[g.id] ?? String(g.age ?? 0);
                          const canRemove = canAddGuests && !g.isPrimary;
                          return (
                            <tr key={g.id} className="border-b">
                              <td className="p-2">{g.guestName}{g.isPrimary ? ' (Primary)' : ''}</td>
                              <td className="p-2 text-right">
                                <input
                                  type="number"
                                  min={0}
                                  max={150}
                                  className="w-20 rounded border p-1 text-right dark:bg-gray-700"
                                  disabled={!canAddGuests}
                                  value={draftAge}
                                  onChange={(e) => {
                                    const v = e.target.value;
                                    setGuestAgeDrafts((prev) => ({ ...prev, [g.id]: v }));

                                    if (!canAddGuests) return;

                                    const parsed = Number(v || 0);
                                    if (!Number.isFinite(parsed) || parsed < 0 || parsed > 150) return;
                                    if (parsed === (g.age ?? 0)) return;

                                    const existing = guestAgeSaveTimersRef.current[g.id];
                                    if (existing) clearTimeout(existing);

                                    guestAgeSaveTimersRef.current[g.id] = setTimeout(() => {
                                      updateGuestAgeMutation.mutate({ reservationGuestId: g.id, age: parsed });
                                      delete guestAgeSaveTimersRef.current[g.id];
                                    }, 450);
                                  }}
                                />
                              </td>
                              <td className="p-2 text-right">
                                <div className="flex justify-end gap-2">
                                  <button
                                    type="button"
                                    className="rounded bg-rose-600 px-2 py-1 text-xs text-white disabled:opacity-50"
                                    disabled={!canRemove || removeGuestMutation.isPending}
                                    onClick={() => removeGuestMutation.mutate(g.id)}
                                  >
                                    Remove
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <h4 className="mb-2 font-medium">Deposits</h4>
                  <button
                    type="button"
                    className="rounded bg-primary-600 px-3 py-1 text-sm text-white disabled:opacity-50"
                    disabled={!canAddGuests}
                    onClick={() => setIsDepositDialogOpen(true)}
                  >
                    Add Deposit
                  </button>
                </div>
                {deposits.length === 0 ? (
                  <p className="text-gray-500">No deposits yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b text-left">
                          <th className="p-2">Payment Method</th>
                          <th className="p-2 text-right">Amount</th>
                          <th className="p-2">Paid Date</th>
                          <th className="p-2">Reference No</th>
                        </tr>
                      </thead>
                      <tbody>
                        {deposits.map((d) => (
                          <tr key={d.id} className="border-b">
                            <td className="p-2">{d.paymentMethodName}</td>
                            <td className="p-2 text-right tabular-nums">{formatMoney(d.amount)}</td>
                            <td className="p-2">{new Date(d.paidDate).toLocaleDateString()}</td>
                            <td className="p-2">{d.referenceNo || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </section>

        {reservationDetail?.status === ReservationStatus.Pending ? (
          <Dialog open={isDepositDialogOpen} onClose={setIsDepositDialogOpen} className="relative z-50">
            <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
            <div className="fixed inset-0 flex items-center justify-center p-4">
              <DialogPanel className="w-full max-w-2xl rounded-lg bg-white p-5 shadow-xl dark:bg-gray-800">
                <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-white">Add Deposit</DialogTitle>
                <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Amount</label>
                    <input
                      type="number"
                      min={0.01}
                      step={0.01}
                      className="w-full rounded border p-2 dark:bg-gray-700"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Payment Method</label>
                    <select
                      className="w-full rounded border p-2 dark:bg-gray-700"
                      value={depositPaymentMethodId}
                      onChange={(e) => setDepositPaymentMethodId(e.target.value)}
                    >
                      <option value="">Select payment method</option>
                      {(paymentMethods ?? []).map((method) => (
                        <option key={method.id} value={method.id}>{method.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Paid Date</label>
                    <input
                      type="date"
                      className="w-full rounded border p-2 dark:bg-gray-700"
                      value={depositPaidDate}
                      onChange={(e) => setDepositPaidDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Reference No</label>
                    <input
                      className="w-full rounded border p-2 dark:bg-gray-700"
                      value={depositReferenceNo}
                      onChange={(e) => setDepositReferenceNo(e.target.value)}
                    />
                  </div>
                </div>
                {depositAmountValue > totalAmountBalance ? (
                  <p className="mt-2 text-sm text-rose-600">Deposit amount cannot exceed remaining total amount.</p>
                ) : null}
                <div className="mt-4 flex justify-end gap-2">
                  <button
                    type="button"
                    className="rounded border px-3 py-2 text-sm dark:border-gray-600"
                    onClick={() => setIsDepositDialogOpen(false)}
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    className="rounded bg-primary-600 px-3 py-2 text-sm text-white hover:bg-primary-700 disabled:opacity-50"
                    disabled={
                      recordDepositMutation.isPending ||
                      !reservationDetail ||
                      depositAmountValue <= 0 ||
                      depositAmountValue > totalAmountBalance ||
                      !depositPaymentMethodId ||
                      !depositPaidDate
                    }
                    onClick={() => {
                      if (!reservationDetail) return;
                      recordDepositMutation.mutate({
                        reservationId: reservationDetail.id,
                        amount: Number(depositAmount),
                        paymentMethodId: depositPaymentMethodId,
                        paidDate: depositPaidDate,
                        referenceNo: depositReferenceNo || undefined,
                      });
                    }}
                  >
                    {recordDepositMutation.isPending ? 'Saving...' : 'Record Deposit'}
                  </button>
                </div>
              </DialogPanel>
            </div>
          </Dialog>
        ) : null}

        <Dialog
          open={isGuestDialogOpen}
          onClose={(open) => {
            setIsGuestDialogOpen(open);
            if (!open) {
              setGuestFilter('');
              setSelectedGuestsForAdd({});
              setShowCreateGuest(false);
            }
          }}
          className="relative z-50"
        >
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center bg-black/50 p-4">
              <DialogPanel className="w-full max-w-3xl rounded-lg bg-white p-5 shadow-xl dark:bg-gray-800">
                <div className="mb-4 flex items-center justify-between">
                  <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-white">Search Guests</DialogTitle>
                  <button className="rounded bg-gray-200 px-2 py-1 text-sm dark:bg-gray-700" onClick={() => setIsGuestDialogOpen(false)}>
                    Close
                  </button>
                </div>

                <div className="mb-3 flex items-end gap-2">
                  <div className="w-full">
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Search Guests</label>
                    <input
                      className="w-full rounded border p-2 dark:bg-gray-700"
                      value={guestFilter}
                      onChange={(e) => setGuestFilter(e.target.value)}
                    />
                  </div>
                  <button
                    type="button"
                    className="rounded bg-primary-600 px-3 py-2 text-white hover:bg-primary-700"
                    onClick={() => setShowCreateGuest((prev) => !prev)}
                  >
                    {showCreateGuest ? 'Cancel New Guest' : 'New Guest'}
                  </button>
                </div>

                {showCreateGuest ? (
                  <div className="mb-4 rounded border p-3 dark:border-gray-700">
                    <p className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">Create Guest</p>
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Guest Code</label>
                        <input className="w-full rounded border p-2 dark:bg-gray-700" value={newGuest.guestCode} onChange={(e) => setNewGuest((s) => ({ ...s, guestCode: e.target.value }))} />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">First Name</label>
                        <input className="w-full rounded border p-2 dark:bg-gray-700" value={newGuest.firstName} onChange={(e) => setNewGuest((s) => ({ ...s, firstName: e.target.value }))} />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Last Name</label>
                        <input className="w-full rounded border p-2 dark:bg-gray-700" value={newGuest.lastName} onChange={(e) => setNewGuest((s) => ({ ...s, lastName: e.target.value }))} />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Middle Name</label>
                        <input className="w-full rounded border p-2 dark:bg-gray-700" value={newGuest.middleName} onChange={(e) => setNewGuest((s) => ({ ...s, middleName: e.target.value }))} />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                        <input className="w-full rounded border p-2 dark:bg-gray-700" value={newGuest.email} onChange={(e) => setNewGuest((s) => ({ ...s, email: e.target.value }))} />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Phone</label>
                        <input className="w-full rounded border p-2 dark:bg-gray-700" value={newGuest.phone} onChange={(e) => setNewGuest((s) => ({ ...s, phone: e.target.value }))} />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Nationality</label>
                        <input className="w-full rounded border p-2 dark:bg-gray-700" value={newGuest.nationality} onChange={(e) => setNewGuest((s) => ({ ...s, nationality: e.target.value }))} />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Notes</label>
                        <input className="w-full rounded border p-2 dark:bg-gray-700" value={newGuest.notes} onChange={(e) => setNewGuest((s) => ({ ...s, notes: e.target.value }))} />
                      </div>
                    </div>
                    <button
                      type="button"
                      className="mt-3 rounded bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700 disabled:opacity-50"
                      disabled={createGuestMutation.isPending || !newGuest.guestCode || !newGuest.firstName || !newGuest.lastName}
                      onClick={() => createGuestMutation.mutate()}
                    >
                      {createGuestMutation.isPending ? 'Saving Guest...' : 'Save Guest'}
                    </button>
                  </div>
                ) : null}

                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="p-2">Code</th>
                        <th className="p-2">Name</th>
                        <th className="p-2">Phone</th>
                        <th className="p-2">Email</th>
                        <th className="p-2 text-right">Age</th>
                        <th className="p-2 text-right">Add</th>
                      </tr>
                    </thead>
                    <tbody>
                      {isGuestLookupLoading ? (
                        <tr>
                          <td className="p-2 text-gray-500" colSpan={6}>Loading guests...</td>
                        </tr>
                      ) : selectableGuests.length === 0 ? (
                        <tr>
                          <td className="p-2 text-gray-500" colSpan={6}>No available guests to add.</td>
                        </tr>
                      ) : (
                        selectableGuests.map((guest) => (
                          <tr key={guest.id} className="border-b">
                            <td className="p-2">{guest.guestCode}</td>
                            <td className="p-2">{guest.fullName}</td>
                            <td className="p-2">{guest.phone || '-'}</td>
                            <td className="p-2">{guest.email || '-'}</td>
                            <td className="p-2 text-right">
                              <input
                                type="number"
                                min={0}
                                max={150}
                                className="w-20 rounded border p-1 text-right dark:bg-gray-700"
                                disabled={!Object.prototype.hasOwnProperty.call(selectedGuestsForAdd, guest.id)}
                                value={selectedGuestsForAdd[guest.id] ?? '0'}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  setSelectedGuestsForAdd((prev) => ({ ...prev, [guest.id]: value }));
                                }}
                              />
                            </td>
                            <td className="p-2 text-right">
                              <input
                                type="checkbox"
                                checked={Object.prototype.hasOwnProperty.call(selectedGuestsForAdd, guest.id)}
                                onChange={(e) => {
                                  setSelectedGuestsForAdd((prev) => {
                                    if (e.target.checked) {
                                      return { ...prev, [guest.id]: prev[guest.id] ?? '0' };
                                    }
                                    const next = { ...prev };
                                    delete next[guest.id];
                                    return next;
                                  });
                                }}
                              />
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 flex justify-end gap-2">
                  <button
                    type="button"
                    className="rounded bg-primary-600 px-3 py-2 text-sm text-white hover:bg-primary-700 disabled:opacity-50"
                    disabled={
                      addGuestsMutation.isPending ||
                      Object.keys(selectedGuestsForAdd).length === 0 ||
                      Object.values(selectedGuestsForAdd).some((age) => Number(age || 0) < 0 || Number(age || 0) > 150)
                    }
                    onClick={() => {
                      const rows = Object.entries(selectedGuestsForAdd).map(([guestId, age]) => ({
                        guestId,
                        age: Math.max(0, Number(age || 0)),
                      }));
                      addGuestsMutation.mutate(rows);
                    }}
                  >
                    {addGuestsMutation.isPending ? 'Saving...' : `Add ${Object.keys(selectedGuestsForAdd).length} Guest(s)`}
                  </button>
                </div>
              </DialogPanel>
            </div>
          </div>
        </Dialog>
      </div>
    </MainLayout>
  );
};
