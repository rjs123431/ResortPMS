import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MainLayout } from '@components/layout/MainLayout';
import { resortService } from '@services/resort.service';
import { ReservationStatus, RoomOperationalStatus } from '@/types/resort.types';
import { AddExtraBedDialog } from '../Shared/AddExtraBedDialog';
import { AddPaymentDialog } from '../Shared/AddPaymentDialog';
import { AssignRoomDialog } from '../Shared/AssignRoomDialog';

type ReservationRoomEdit = {
  reservationRoomId: string;
  roomTypeId: string;
  roomId: string;
};

type ExtraBedEdit = {
  id: string;
  extraBedTypeId: string;
  extraBedTypeName: string;
  arrivalDate: string;
  departureDate: string;
  quantity: number;
  nights: number;
  ratePerNight: number;
};

type PaymentRow = {
  id: string;
  amount: number;
  paymentMethodId: string;
  paidDate: string;
  referenceNo: string;
};

const toDateInputValue = (value?: string) => {
  if (!value) return '';
  const [dateOnly] = value.split('T');
  return dateOnly;
};

const round2 = (value: number) => Math.round(value * 100) / 100;
const formatMoney = (value: number) => round2(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const getErrorMessage = (error: unknown) => {
  if (error && typeof error === 'object') {
    const apiError = error as {
      message?: string;
      response?: {
        data?: {
          error?: {
            message?: string;
            details?: string;
          };
        };
      };
    };

    return apiError.response?.data?.error?.message || apiError.response?.data?.error?.details || apiError.message || 'Unable to complete check-in.';
  }

  return 'Unable to complete check-in.';
};

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

export const CheckInReservationPage = () => {
  const { reservationId } = useParams<{ reservationId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [expectedCheckOutDate, setExpectedCheckOutDate] = useState('');
  const [roomEdits, setRoomEdits] = useState<ReservationRoomEdit[]>([]);
  const [selectedReservationRoomId, setSelectedReservationRoomId] = useState('');
  const [assignDialogReservationRoomId, setAssignDialogReservationRoomId] = useState('');
  const [assignDialogSelectedRoomId, setAssignDialogSelectedRoomId] = useState('');
  const [extraBeds, setExtraBeds] = useState<ExtraBedEdit[]>([]);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [showAddExtraBedDialog, setShowAddExtraBedDialog] = useState(false);
  const [showAddPaymentDialog, setShowAddPaymentDialog] = useState(false);
  const [refundableDepositAmount, setRefundableDepositAmount] = useState('');
  const [refundableDepositPaymentMethodId, setRefundableDepositPaymentMethodId] = useState('');
  const [refundableDepositReference, setRefundableDepositReference] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const { data: reservationDetail, isLoading: isReservationLoading } = useQuery({
    queryKey: ['resort-reservation-detail', reservationId],
    queryFn: () => resortService.getReservation(reservationId as string),
    enabled: Boolean(reservationId),
  });

  const { data: extraBedTypes } = useQuery({
    queryKey: ['resort-extra-bed-types'],
    queryFn: () => resortService.getExtraBedTypes(),
  });

  const { data: paymentMethods } = useQuery({
    queryKey: ['resort-payment-methods'],
    queryFn: () => resortService.getPaymentMethods(),
  });

  const arrivalDate = toDateInputValue(reservationDetail?.arrivalDate);
  const departureDate = toDateInputValue(reservationDetail?.departureDate);

  const { data: availableRooms } = useQuery({
    queryKey: ['resort-checkin-available-rooms', reservationId, arrivalDate, departureDate],
    queryFn: () => resortService.getAvailableRooms(undefined, arrivalDate, departureDate, reservationId, false, true),
    enabled: Boolean(reservationId && arrivalDate && departureDate),
  });

  const paymentMethodNameById = useMemo(() => {
    const map = new Map<string, string>();
    (paymentMethods ?? []).forEach((row) => map.set(row.id, row.name));
    return map;
  }, [paymentMethods]);

  const selectedReservationRoom = useMemo(
    () => roomEdits.find((row) => row.reservationRoomId === selectedReservationRoomId),
    [roomEdits, selectedReservationRoomId],
  );

  const selectedStayRoomId = selectedReservationRoom?.roomId ?? '';

  const assignDialogRoomLine = useMemo(
    () => reservationDetail?.rooms?.find((room) => room.id === assignDialogReservationRoomId),
    [reservationDetail, assignDialogReservationRoomId],
  );

  const assignDialogAvailableRooms = useMemo(() => {
    if (!assignDialogRoomLine) return [];

    const assignedRoomIds = new Set(
      roomEdits
        .filter((row) => row.reservationRoomId !== assignDialogRoomLine.id)
        .map((row) => row.roomId)
        .filter((id) => Boolean(id)),
    );

    return (availableRooms ?? []).filter(
      (room) =>
        room.roomTypeId === assignDialogRoomLine.roomTypeId &&
        room.operationalStatus === RoomOperationalStatus.Vacant &&
        !assignedRoomIds.has(room.id),
    );
  }, [assignDialogRoomLine, roomEdits, availableRooms]);

  const isChangeRoomDialog = useMemo(() => {
    if (!assignDialogReservationRoomId) return false;
    const mapped = roomEdits.find((row) => row.reservationRoomId === assignDialogReservationRoomId);
    return Boolean(mapped?.roomId);
  }, [assignDialogReservationRoomId, roomEdits]);

  useEffect(() => {
    if (!reservationDetail) return;

    setExpectedCheckOutDate(toDateInputValue(reservationDetail.departureDate));

    const initialRoomEdits = (reservationDetail.rooms ?? []).map((room) => ({
      reservationRoomId: room.id,
      roomTypeId: room.roomTypeId,
      roomId: room.roomId ?? '',
    }));
    setRoomEdits(initialRoomEdits);

    if (initialRoomEdits.length > 0) {
      const preferred = initialRoomEdits.find((row) => row.roomId)?.reservationRoomId;
      setSelectedReservationRoomId(preferred ?? initialRoomEdits[0].reservationRoomId);
    }

    const initialExtraBeds = (reservationDetail.extraBeds ?? []).map((row) => ({
      id: row.id,
      extraBedTypeId: row.extraBedTypeId ?? '',
      extraBedTypeName: row.extraBedTypeName ?? 'Extra Bed',
      arrivalDate: toDateInputValue(row.arrivalDate) || toDateInputValue(reservationDetail.arrivalDate),
      departureDate: toDateInputValue(row.departureDate) || toDateInputValue(reservationDetail.departureDate),
      quantity: row.quantity,
      nights: row.numberOfNights,
      ratePerNight: row.ratePerNight,
    }));
    setExtraBeds(initialExtraBeds);
  }, [reservationDetail]);

  const cannotCheckInMessage = useMemo(() => {
    if (!reservationDetail) return '';

    if (reservationDetail.status === ReservationStatus.CheckedIn) return 'This reservation is already checked in.';
    if (reservationDetail.status === ReservationStatus.Completed) return 'This reservation is already completed.';
    if (reservationDetail.status === ReservationStatus.Cancelled || reservationDetail.status === ReservationStatus.NoShow) {
      return 'Cancelled or no-show reservations cannot be checked in.';
    }
    if (reservationDetail.status !== ReservationStatus.Confirmed) return 'Only confirmed reservations can be checked in.';
    return '';
  }, [reservationDetail]);

  const totalExtraBed = useMemo(
    () => round2(extraBeds.reduce((sum, row) => sum + row.quantity * row.ratePerNight * row.nights, 0)),
    [extraBeds],
  );

  const totalRoom = useMemo(
    () => round2((reservationDetail?.rooms ?? []).reduce((sum, row) => sum + row.netAmount, 0)),
    [reservationDetail],
  );

  const reservationPaymentsMade = useMemo(() => {
    if (!reservationDetail) return 0;
    const depositsTotal = round2((reservationDetail.deposits ?? []).reduce((sum, row) => sum + row.amount, 0));
    return depositsTotal > 0 ? depositsTotal : round2(reservationDetail.depositPaid || 0);
  }, [reservationDetail]);

  const totalPayments = useMemo(
    () => round2(payments.reduce((sum, row) => sum + row.amount, 0)),
    [payments],
  );

  const updatedBalance = useMemo(
    () => round2(totalRoom + totalExtraBed - reservationPaymentsMade - totalPayments),
    [totalRoom, totalExtraBed, reservationPaymentsMade, totalPayments],
  );

  const refundableDeposit = Number(refundableDepositAmount || 0);

  const addExtraBed = (extraBedTypeId: string, quantity: number) => {
    const type = (extraBedTypes ?? []).find((row) => row.id === extraBedTypeId);
    if (!type) return;
    setExtraBeds((prev) => [
      ...prev,
      {
        id: `eb-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        extraBedTypeId: type.id,
        extraBedTypeName: type.name,
        arrivalDate: toDateInputValue(reservationDetail?.arrivalDate),
        departureDate: toDateInputValue(reservationDetail?.departureDate),
        quantity: Math.max(1, Math.floor(quantity)),
        nights: reservationDetail?.nights ?? 1,
        ratePerNight: type.basePrice,
      },
    ]);
  };

  const updateExtraBed = (id: string, patch: Partial<ExtraBedEdit>) => {
    setExtraBeds((prev) => prev.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  };

  const removeExtraBed = (id: string) => {
    setExtraBeds((prev) => prev.filter((row) => row.id !== id));
  };

  const removePayment = (id: string) => {
    setPayments((prev) => prev.filter((row) => row.id !== id));
  };

  const openAssignRoomDialog = (reservationRoomId: string) => {
    const mapped = roomEdits.find((row) => row.reservationRoomId === reservationRoomId);
    setAssignDialogReservationRoomId(reservationRoomId);
    setAssignDialogSelectedRoomId(mapped?.roomId ?? '');
  };

  const closeAssignRoomDialog = () => {
    setAssignDialogReservationRoomId('');
    setAssignDialogSelectedRoomId('');
  };

  const confirmAssignRoom = () => {
    if (!assignDialogReservationRoomId || !assignDialogSelectedRoomId) return;

    setRoomEdits((prev) =>
      prev.map((row) =>
        row.reservationRoomId === assignDialogReservationRoomId
          ? { ...row, roomId: assignDialogSelectedRoomId }
          : row,
      ),
    );
    setSelectedReservationRoomId(assignDialogReservationRoomId);
    closeAssignRoomDialog();
  };

  const checkInMutation = useMutation({
    mutationFn: () =>
      resortService.checkInFromReservation({
        reservationId: reservationId as string,
        reservationRoomId: selectedReservationRoomId || undefined,
        roomId: selectedStayRoomId,
        expectedCheckOutDate: expectedCheckOutDate || undefined,
        reservationRooms: roomEdits.filter((r) => r.roomId && r.roomTypeId),
        extraBeds: extraBeds.map((row) => ({
          extraBedTypeId: row.extraBedTypeId || undefined,
          arrivalDate: row.arrivalDate,
          departureDate: row.departureDate,
          quantity: row.quantity,
          ratePerNight: row.ratePerNight,
          numberOfNights: row.nights,
          amount: round2(row.quantity * row.ratePerNight * row.nights),
        })),
        payments: payments.map((row) => ({
          paymentMethodId: row.paymentMethodId,
          amount: row.amount,
          paidDate: row.paidDate,
          referenceNo: row.referenceNo || undefined,
        })),
        refundableCashDepositAmount: refundableDeposit > 0 ? refundableDeposit : undefined,
        refundableCashDepositPaymentMethodId: refundableDepositPaymentMethodId || undefined,
        refundableCashDepositReference: refundableDepositReference || undefined,
      }),
    onSuccess: (result) => {
      setErrorMessage('');
      void queryClient.invalidateQueries({ queryKey: ['resort-reservations'] });
      void queryClient.invalidateQueries({ queryKey: ['resort-reservation-detail', reservationId] });
      void queryClient.invalidateQueries({ queryKey: ['resort-stays'] });
      void queryClient.invalidateQueries({ queryKey: ['resort-reservations-checkin'] });
      void queryClient.invalidateQueries({ queryKey: ['resort-available-rooms'] });
      navigate('/check-in/confirmation', {
        replace: true,
        state: {
          stayId: result.stayId,
          stayNo: result.stayNo,
          folioId: result.folioId,
          folioNo: result.folioNo,
        },
      });
    },
    onError: (error) => {
      setSuccessMessage('');
      setErrorMessage(getErrorMessage(error));
    },
  });

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reservation Detail Check-In</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Review reservation details and process check-in.</p>
          </div>
        </div>

        <section className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
          {isReservationLoading ? <p className="text-sm text-gray-500">Loading reservation...</p> : null}
          {!isReservationLoading && !reservationDetail ? <p className="text-sm text-rose-600">Reservation not found.</p> : null}

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
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${getStatusBadgeClass(reservationDetail.status)}`}>
                      {ReservationStatus[reservationDetail.status]}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="mb-2 font-medium">Rooms</h4>
                {(reservationDetail.rooms ?? []).length === 0 ? (
                  <p className="text-gray-500">No rooms.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b text-left">
                          <th className="p-2">Room Type</th>
                          <th className="p-2">Room No.</th>
                          <th className="p-2 text-center">Action</th>
                          <th className="p-2 text-right">Rate/Night</th>
                          <th className="p-2 text-right">Nights</th>
                          <th className="p-2 text-right">Amount</th>
                          <th className="p-2 text-right">Net Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(reservationDetail.rooms ?? []).map((room) => {
                          const mapped = roomEdits.find((r) => r.reservationRoomId === room.id);
                          const roomNumber = room.roomNumber || (mapped?.roomId ? (availableRooms ?? []).find((x) => x.id === mapped.roomId)?.roomNumber : undefined);
                          return (
                            <tr key={room.id} className="border-b">
                              <td className="p-2">{room.roomTypeName}</td>
                              <td className="p-2">{roomNumber || 'Unassigned'}</td>
                              <td className="p-2 text-center">
                                <button
                                  type="button"
                                  className="rounded bg-primary-600 px-2 py-1 text-xs text-white hover:bg-primary-700 disabled:opacity-50"
                                  disabled={Boolean(cannotCheckInMessage)}
                                  onClick={() => openAssignRoomDialog(room.id)}
                                >
                                  {roomNumber ? 'Change Room' : 'Assign Room'}
                                </button>
                              </td>
                              <td className="p-2 text-right tabular-nums">{formatMoney(room.ratePerNight)}</td>
                              <td className="p-2 text-right tabular-nums">{room.numberOfNights}</td>
                              <td className="p-2 text-right tabular-nums">{formatMoney(room.amount)}</td>
                              <td className="p-2 text-right tabular-nums">{formatMoney(room.netAmount)}</td>
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
                  <h4 className="font-medium">Extra Beds</h4>
                  <button
                    type="button"
                    className="rounded bg-slate-700 px-3 py-1 text-xs text-white"
                    onClick={() => setShowAddExtraBedDialog(true)}
                    disabled={Boolean(cannotCheckInMessage)}
                  >
                    Add Extra Bed
                  </button>
                </div>
                {extraBeds.length === 0 ? <p className="text-sm text-gray-500">No extra beds.</p> : null}
                {extraBeds.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b text-left">
                          <th className="p-2">Type</th>
                          <th className="p-2 text-right">Qty</th>
                          <th className="p-2 text-right">Nights</th>
                          <th className="p-2 text-right">Rate/Night</th>
                          <th className="p-2 text-right">Amount</th>
                          <th className="p-2 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {extraBeds.map((row) => {
                          const rowAmount = round2(row.quantity * row.ratePerNight * row.nights);
                          return (
                            <tr key={row.id} className="border-b">
                              <td className="p-2">{row.extraBedTypeName}</td>
                              <td className="p-2 text-right">
                                <input className="w-20 rounded border p-1 text-right dark:bg-gray-700" type="number" min={1} value={row.quantity} onChange={(e) => updateExtraBed(row.id, { quantity: Math.max(1, Math.floor(Number(e.target.value || 1))) })} />
                              </td>
                              <td className="p-2 text-right">
                                <span className="tabular-nums">{row.nights}</span>
                              </td>
                              <td className="p-2 text-right">
                                <input className="w-28 rounded border p-1 text-right dark:bg-gray-700" type="number" min={0} value={row.ratePerNight} onChange={(e) => updateExtraBed(row.id, { ratePerNight: Math.max(0, Number(e.target.value || 0)) })} />
                              </td>
                              <td className="p-2 text-right">{formatMoney(rowAmount)}</td>
                              <td className="p-2 text-right">
                                <button type="button" className="rounded bg-rose-600 px-2 py-1 text-xs text-white" onClick={() => removeExtraBed(row.id)}>Remove</button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : null}
                <p className="mt-2 text-right text-sm font-semibold">Extra Bed Total: {formatMoney(totalExtraBed)}</p>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <h4 className="font-medium">Additional / Full Payment</h4>
                  <button
                    type="button"
                    className="rounded bg-primary-600 px-3 py-1 text-xs text-white"
                    onClick={() => setShowAddPaymentDialog(true)}
                    disabled={Boolean(cannotCheckInMessage)}
                  >
                    Add Payment
                  </button>
                </div>
                {payments.length === 0 ? <p className="text-sm text-gray-500">No payments added.</p> : null}
                {payments.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b text-left">
                          <th className="p-2">Date</th>
                          <th className="p-2">Method</th>
                          <th className="p-2">Reference</th>
                          <th className="p-2 text-right">Amount</th>
                          <th className="p-2 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payments.map((row) => (
                          <tr key={row.id} className="border-b">
                            <td className="p-2">{row.paidDate}</td>
                            <td className="p-2">{paymentMethodNameById.get(row.paymentMethodId) || '-'}</td>
                            <td className="p-2">{row.referenceNo || '-'}</td>
                            <td className="p-2 text-right">{formatMoney(row.amount)}</td>
                            <td className="p-2 text-right"><button type="button" className="rounded bg-rose-600 px-2 py-1 text-xs text-white" onClick={() => removePayment(row.id)}>Remove</button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : null}
                <p className="mt-2 text-right text-sm font-semibold">Payment Total: {formatMoney(totalPayments)}</p>
              </div>

              <div className="rounded border p-3 dark:border-gray-700">
                <h4 className="mb-2 font-medium">Summary</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center justify-between gap-3"><div className="font-medium">Total Room:</div><div className="text-right font-semibold tabular-nums">{formatMoney(totalRoom)}</div></div>
                  <div className="flex items-center justify-between gap-3"><div className="font-medium">Total Extra Bed:</div><div className="text-right font-semibold tabular-nums">{formatMoney(totalExtraBed)}</div></div>
                  <div className="flex items-center justify-between gap-3"><div className="font-medium">Reservation Payments:</div><div className="text-right font-semibold tabular-nums">({formatMoney(reservationPaymentsMade)})</div></div>
                  <div className="flex items-center justify-between gap-3"><div className="font-medium">Check-In Payments:</div><div className="text-right font-semibold tabular-nums">{formatMoney(totalPayments)}</div></div>
                </div>
                <div className="mt-3 border-t pt-3 dark:border-gray-700">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-semibold">Updated Balance:</div>
                    <div className="text-right text-base font-bold tabular-nums">{formatMoney(updatedBalance)}</div>
                  </div>
                </div>
              </div>

              <div className="rounded border p-3 dark:border-gray-700">
                <h4 className="mb-2 font-medium">Refundable Cash Deposit</h4>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <input className="rounded border p-2 dark:bg-gray-700" type="number" min={0} value={refundableDepositAmount} onChange={(e) => setRefundableDepositAmount(e.target.value)} placeholder="Amount" />
                  <select className="rounded border p-2 dark:bg-gray-700" value={refundableDepositPaymentMethodId} onChange={(e) => setRefundableDepositPaymentMethodId(e.target.value)}>
                    <option value="">Payment method</option>
                    {(paymentMethods ?? []).map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                  <input className="rounded border p-2 dark:bg-gray-700" value={refundableDepositReference} onChange={(e) => setRefundableDepositReference(e.target.value)} placeholder="Reference" />
                </div>
              </div>

              {cannotCheckInMessage ? (
                <p className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:border-amber-700/40 dark:bg-amber-900/20 dark:text-amber-200">
                  {cannotCheckInMessage}
                </p>
              ) : null}

              {errorMessage ? (
                <p className="rounded border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-700/40 dark:bg-rose-900/20 dark:text-rose-200">
                  {errorMessage}
                </p>
              ) : null}

              {successMessage ? (
                <div className="rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-700/40 dark:bg-emerald-900/20 dark:text-emerald-200">
                  <p>{successMessage}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button type="button" className="rounded bg-emerald-700 px-3 py-1.5 text-xs font-medium text-white" onClick={() => navigate('/stays')}>Open In-House Stays</button>
                    <button type="button" className="rounded border border-emerald-700 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-200" onClick={() => navigate(`/reservations/${reservationId}`)}>Return to Reservation</button>
                  </div>
                </div>
              ) : null}

              <div className="flex flex-wrap justify-end gap-2 border-t pt-3 dark:border-gray-700">
                {reservationDetail.status === ReservationStatus.CheckedIn ? (
                  <button
                    type="button"
                    className="rounded bg-emerald-700 px-4 py-2 text-sm text-white"
                    onClick={() => navigate('/stays')}
                  >
                    Open Stay Information
                  </button>
                ) : (
                  <button
                    type="button"
                    className="rounded bg-primary-600 px-4 py-2 text-sm text-white disabled:opacity-50"
                    disabled={
                      checkInMutation.isPending ||
                      Boolean(cannotCheckInMessage) ||
                      !reservationId ||
                      !selectedReservationRoomId ||
                      !selectedStayRoomId ||
                      !expectedCheckOutDate ||
                      (refundableDeposit > 0 && !refundableDepositPaymentMethodId)
                    }
                    onClick={() => checkInMutation.mutate()}
                  >
                    {checkInMutation.isPending ? 'Checking In...' : 'Complete Check-In'}
                  </button>
                )}
              </div>
            </div>
          ) : null}
        </section>
      </div>

      <AddExtraBedDialog
        open={showAddExtraBedDialog}
        extraBedTypes={extraBedTypes ?? []}
        onClose={() => setShowAddExtraBedDialog(false)}
        onAdd={(extraBedTypeId, quantity) => {
          addExtraBed(extraBedTypeId, quantity);
          setShowAddExtraBedDialog(false);
        }}
      />

      <AddPaymentDialog
        open={showAddPaymentDialog}
        paymentMethods={paymentMethods ?? []}
        onClose={() => setShowAddPaymentDialog(false)}
        onSave={(values) => {
          setPayments((prev) => [
            ...prev,
            {
              id: `pay-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              amount: values.amount,
              paymentMethodId: values.paymentMethodId,
              paidDate: values.paidDate,
              referenceNo: values.referenceNo,
            },
          ]);
          setShowAddPaymentDialog(false);
        }}
      />

      <AssignRoomDialog
        open={Boolean(assignDialogReservationRoomId)}
        isChangeRoom={isChangeRoomDialog}
        roomTypeName={assignDialogRoomLine?.roomTypeName}
        rooms={assignDialogAvailableRooms}
        selectedRoomId={assignDialogSelectedRoomId}
        onSelectRoom={setAssignDialogSelectedRoomId}
        onClose={closeAssignRoomDialog}
        onConfirm={confirmAssignRoom}
      />
    </MainLayout>
  );
};
