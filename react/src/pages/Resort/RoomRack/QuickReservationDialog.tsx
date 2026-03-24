import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogPanel } from '@headlessui/react';
import { resortService } from '@services/resort.service';
import { formatMoney } from '@utils/helpers';

export type QuickReservationPayload = {
  checkInDate: string;
  checkOutDate: string;
  roomTypeName: string;
  roomTypeId: string;
  roomNumber: string;
  roomId: string;
  baseRate?: number;
};

type QuickReservationDialogProps = {
  open: boolean;
  onClose: () => void;
  payload: QuickReservationPayload | null;
};

const round2 = (n: number) => Math.round(n * 100) / 100;
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const controlClassName = 'h-[42px] w-full rounded border border-gray-300 px-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white';

const getErrorMessage = (error: unknown, fallback: string) => {
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

    return apiError.response?.data?.error?.message || apiError.response?.data?.error?.details || apiError.message || fallback;
  }

  return fallback;
};

export const QuickReservationDialog = ({ open, onClose, payload }: QuickReservationDialogProps) => {
  const queryClient = useQueryClient();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [email, setEmail] = useState('');
  const [depositPaymentAmount, setDepositPaymentAmount] = useState('0');
  const [showDepositDialog, setShowDepositDialog] = useState(false);
  const [depositPaymentMethodId, setDepositPaymentMethodId] = useState('');
  const [depositReferenceNo, setDepositReferenceNo] = useState('');
  const [depositPaymentAmountDraft, setDepositPaymentAmountDraft] = useState('0');
  const [depositPaymentMethodIdDraft, setDepositPaymentMethodIdDraft] = useState('');
  const [depositReferenceNoDraft, setDepositReferenceNoDraft] = useState('');
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [notes, setNotes] = useState('');
  const [selectedChannelId, setSelectedChannelId] = useState('');
  const [selectedAgencyId, setSelectedAgencyId] = useState('');
  const [selectedRatePlanId, setSelectedRatePlanId] = useState('');

  const { data: channels } = useQuery({
    queryKey: ['resort-channels'],
    queryFn: () => resortService.getChannels(),
    enabled: open,
  });

  const { data: paymentMethods } = useQuery({
    queryKey: ['resort-payment-methods'],
    queryFn: () => resortService.getPaymentMethods(),
    enabled: open,
  });

  const ratePlanOptionsQuery = useQuery({
    queryKey: ['quick-reservation-rate-plans', payload?.roomTypeId, payload?.checkInDate, payload?.checkOutDate, selectedChannelId],
    enabled: open && !!payload && !!selectedChannelId,
    queryFn: async () => {
      if (!payload) {
        throw new Error('Missing reservation data.');
      }

      return resortService.getRoomTypeRatePlanOptions(
        payload.roomTypeId,
        payload.checkInDate,
        payload.checkOutDate,
        selectedChannelId || undefined,
      );
    },
  });

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    setSelectedChannelId('');
    setSelectedAgencyId('');
    setSelectedRatePlanId('');
    setDepositPaymentAmount('0');
    setDepositPaymentMethodId('');
    setDepositReferenceNo('');
    setDepositPaymentAmountDraft('0');
    setDepositPaymentMethodIdDraft('');
    setDepositReferenceNoDraft('');
    setShowDepositDialog(false);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const options = channels ?? [];
    if (options.length === 0) return;

    setSelectedChannelId((current) => {
      if (current && options.some((channel) => channel.id === current)) {
        return current;
      }

      return options[0].id;
    });
  }, [channels, open]);

  useEffect(() => {
    const options = ratePlanOptionsQuery.data ?? [];
    if (options.length === 0) {
      setSelectedRatePlanId('');
      return;
    }

    setSelectedRatePlanId((current) => {
      if (current && options.some((option) => option.roomRatePlanId === current)) {
        return current;
      }

      return options[0].roomRatePlanId;
    });
  }, [ratePlanOptionsQuery.data]);

  useEffect(() => {
    if (!open) return;
    const methods = paymentMethods ?? [];
    if (methods.length === 0) return;
    setDepositPaymentMethodId((current) => current || methods[0].id);
    setDepositPaymentMethodIdDraft((current) => current || methods[0].id);
  }, [open, paymentMethods]);

  const createMutation = useMutation({
    mutationFn: async (isTemp: boolean) => {
      if (!payload) throw new Error('Missing reservation data.');
      if (!firstName.trim()) throw new Error('First name is required.');
      if (!lastName.trim()) throw new Error('Last name is required.');
      if (!contactNumber.trim()) throw new Error('Contact number is required.');
      if (!selectedChannelId) throw new Error('Reservation channel is required.');

      const checkInTime = '14:00:00';
      const checkOutTime = '12:00:00';
      const arrivalDate = payload.checkInDate.includes('T') ? payload.checkInDate : `${payload.checkInDate}T${checkInTime}`;
      const departureDate = payload.checkOutDate.includes('T') ? payload.checkOutDate : `${payload.checkOutDate}T${checkOutTime}`;
      const nights = Math.max(1, Math.ceil((new Date(departureDate).getTime() - new Date(arrivalDate).getTime()) / (24 * 60 * 60 * 1000)));
      const selectedRatePlan = (ratePlanOptionsQuery.data ?? []).find((option) => option.roomRatePlanId === selectedRatePlanId);
      const ratePerNight = selectedRatePlan?.pricePerNight ?? 0;
      const amount = round2(ratePerNight * nights);
      const parsedDepositPayment = Number.parseFloat(depositPaymentAmount || '0');
      const safeDepositPaymentAmount = Number.isFinite(parsedDepositPayment)
        ? round2(clamp(parsedDepositPayment, 0, amount))
        : 0;

      if (safeDepositPaymentAmount > 0 && !depositPaymentMethodId) {
        throw new Error('Payment method is required when payment amount is entered.');
      }

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

      const reservationId = await resortService.createReservation({
        arrivalDate,
        departureDate,
        adults,
        children,
        roomRatePlanCode: selectedRatePlan?.code,
        channelId: selectedChannelId,
        agencyId: selectedAgencyId || undefined,
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

      if (safeDepositPaymentAmount > 0 && depositPaymentMethodId) {
        await resortService.recordReservationDeposit({
          reservationId,
          amount: safeDepositPaymentAmount,
          paymentMethodId: depositPaymentMethodId,
          referenceNo: depositReferenceNo.trim() || undefined,
        });
      }

      return reservationId;
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

  const handleWalkInCheckIn = () => {
    createMutation.mutate(true);
  };

  const handleOpenDepositDialog = () => {
    setDepositPaymentAmountDraft(depositPaymentAmount);
    setDepositPaymentMethodIdDraft(depositPaymentMethodId);
    setDepositReferenceNoDraft(depositReferenceNo);
    setShowDepositDialog(true);
  };

  const handleSaveDeposit = () => {
    const parsedAmount = Number.parseFloat(depositPaymentAmountDraft || '0');
    const safeAmount = Number.isFinite(parsedAmount) ? Math.max(0, parsedAmount) : 0;
    setDepositPaymentAmount(String(round2(safeAmount)));
    setDepositPaymentMethodId(depositPaymentMethodIdDraft);
    setDepositReferenceNo(depositReferenceNoDraft.trim());
    setShowDepositDialog(false);
  };

  if (!payload) return null;

  const ratePlanOptions = ratePlanOptionsQuery.data ?? [];
  const selectedRatePlan = ratePlanOptions.find((option) => option.roomRatePlanId === selectedRatePlanId) ?? ratePlanOptions[0];
  const ratePerNight = selectedRatePlan?.pricePerNight ?? 0;

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
    selectedChannelId !== '' &&
    selectedRatePlanId !== '' &&
    !ratePlanOptionsQuery.isLoading &&
    !ratePlanOptionsQuery.isError &&
    ratePerNight > 0 &&
    !createMutation.isPending;

  return (
    <Dialog open={open} onClose={() => { }} className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50 pointer-events-none" aria-hidden />
      <div className="relative flex min-h-screen items-start justify-center p-4 pt-8 pointer-events-none">
        <DialogPanel className="w-full max-w-3xl rounded-lg bg-white p-5 shadow-xl dark:bg-gray-800 pointer-events-auto">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Quick reservation</h2>
            <button
              type="button"
              className="rounded bg-gray-200 px-2 py-1 text-sm dark:bg-gray-700"
              onClick={onClose}
            >
              Close
            </button>
          </div>
          <hr className="my-4" />
          <dl className="mt-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:gap-4">
              <div className="sm:min-w-[170px]">
                <dt className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Dates</dt>
                <dd className="mt-0.5 font-medium text-gray-900 dark:text-white">{dateRangeLabel}</dd>
              </div>
              <div className="sm:min-w-[170px]">
                <dt className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Room type</dt>
                <dd className="mt-0.5 font-medium text-gray-900 dark:text-white">{payload.roomTypeName}</dd>
              </div>
              <div className="sm:min-w-[166px]">
                <dt className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Room</dt>
                <dd className="mt-0.5 font-medium text-gray-900 dark:text-white">{payload.roomNumber}</dd>
              </div>
              <div className="sm:min-w-[100px] sm:flex-1">
                <select
                  className={controlClassName}
                  value={selectedChannelId}
                  onChange={(e) => setSelectedChannelId(e.target.value)}
                >
                  {(channels ?? []).map((channel) => (
                    <option key={channel.id} value={channel.id}>{channel.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </dl>

          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
              <div>
                <label className="mb-1 block text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Adults</label>
                <div className="flex h-[42px] items-center overflow-hidden rounded border border-gray-300 dark:border-gray-600">
                  <button
                    type="button"
                    onClick={() => setAdults((value) => clamp(value - 1, 1, 20))}
                    className="h-full px-3 text-base font-semibold text-gray-700 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                  >
                    -
                  </button>
                  <div className="flex h-full flex-1 items-center justify-center bg-white px-3 text-center text-sm text-gray-900 dark:bg-gray-700 dark:text-white">
                    {adults}
                  </div>
                  <button
                    type="button"
                    onClick={() => setAdults((value) => clamp(value + 1, 1, 20))}
                    className="h-full px-3 text-base font-semibold text-gray-700 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                  >
                    +
                  </button>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Children</label>
                <div className="flex h-[42px] items-center overflow-hidden rounded border border-gray-300 dark:border-gray-600">
                  <button
                    type="button"
                    onClick={() => setChildren((value) => clamp(value - 1, 0, 10))}
                    className="h-full px-3 text-base font-semibold text-gray-700 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                  >
                    -
                  </button>
                  <div className="flex h-full flex-1 items-center justify-center bg-white px-3 text-center text-sm text-gray-900 dark:bg-gray-700 dark:text-white">
                    {children}
                  </div>
                  <button
                    type="button"
                    onClick={() => setChildren((value) => clamp(value + 1, 0, 10))}
                    className="h-full px-3 text-base font-semibold text-gray-700 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                  >
                    +
                  </button>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Rate plan</label>
                <select
                  className={controlClassName}
                  value={selectedRatePlanId}
                  onChange={(e) => setSelectedRatePlanId(e.target.value)}
                  disabled={!selectedChannelId || ratePlanOptionsQuery.isLoading || ratePlanOptions.length === 0}
                >
                  <option value="">Select rate plan</option>
                  {ratePlanOptions.map((ratePlan) => (
                    <option key={ratePlan.roomRatePlanId} value={ratePlan.roomRatePlanId}>
                      {ratePlan.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Rate per night</label>
                <div className="flex h-[42px] w-full items-center rounded border border-gray-300 bg-gray-50 px-3 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                  {!selectedChannelId
                    ? 'Select channel first'
                    : ratePlanOptionsQuery.isLoading
                      ? 'Loading rate plans...'
                      : formatMoney(ratePerNight)}
                </div>
                {ratePerNight > 0 && !ratePlanOptionsQuery.isLoading && (
                  <>
                    <p className="mt-0.5 text-end text-xs text-gray-500 dark:text-gray-400">
                      x {nights} night{nights !== 1 ? 's' : ''} = {formatMoney(ratePerNight * nights)}
                    </p>
                    <p className="mt-0.5 text-end text-xs text-gray-500 dark:text-gray-400">
                      Payment: {' '}
                      <button
                        type="button"
                        className="text-xs font-medium text-primary-600 underline hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                        onClick={handleOpenDepositDialog}
                      >
                        {formatMoney(Number.parseFloat(depositPaymentAmount || '0') || 0)}
                      </button>
                    </p>
                  </>

                )}
                {ratePlanOptionsQuery.isError && (
                  <p className="mt-0.5 text-xs text-red-600 dark:text-red-400">
                    {getErrorMessage(ratePlanOptionsQuery.error, 'Unable to load room rate plans.')}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
              <div>
                <label className="mb-1 block text-xs font-medium uppercase text-gray-500 dark:text-gray-400">First Name</label>
                <input
                  type="text"
                  className={controlClassName}
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Last Name</label>
                <input
                  type="text"
                  className={controlClassName}
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Phone</label>
                <input
                  type="text"
                  className={controlClassName}
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Email (optional)</label>
                <input
                  type="email"
                  className={controlClassName}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
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
              {getErrorMessage(createMutation.error, 'Failed to create reservation.')}
            </p>
          )}

          <div className="mt-6 flex flex-wrap justify-between gap-2">
            <button
              type="button"
              onClick={handleWalkInCheckIn}
              disabled={!canSubmit || createMutation.isPending}
              className="rounded border border-primary-600 bg-white px-3 py-2 text-sm font-medium text-primary-600 hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-primary-500 dark:bg-transparent dark:text-primary-400 dark:hover:bg-primary-900/20"
              title="Create a walk-in/check-in draft"
            >
              Walk In/Check In
            </button>
            <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={handleCreateTempReservation}
                disabled={!canSubmit || createMutation.isPending}
                className="rounded border border-primary-600 bg-white px-3 py-2 text-sm font-medium text-primary-600 hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-primary-500 dark:bg-transparent dark:text-primary-400 dark:hover:bg-primary-900/20"
                title="Create a draft reservation with no room assigned"
              >
                Draft Reserve
              </button>
              <button
                type="button"
                onClick={handleCreateReservation}
                disabled={!canSubmit || createMutation.isPending}
                className="rounded bg-primary-600 px-3 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Reserve
              </button>
            </div>
          </div>
        </DialogPanel>
      </div>

      <Dialog open={showDepositDialog} onClose={() => setShowDepositDialog(false)} className="fixed inset-0 z-[60] overflow-y-auto">
        <div className="fixed inset-0 bg-black/50 pointer-events-none" aria-hidden />
        <div className="relative flex min-h-screen items-center justify-center p-4 pointer-events-none">
          <DialogPanel className="w-full max-w-xs rounded-lg bg-white p-5 shadow-xl dark:bg-gray-800 pointer-events-auto">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Deposit Payment</h3>
            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Payment Method</label>
                <select
                  className={controlClassName}
                  value={depositPaymentMethodIdDraft}
                  onChange={(e) => setDepositPaymentMethodIdDraft(e.target.value)}
                >
                  <option value="">Select payment method</option>
                  {(paymentMethods ?? []).map((method) => (
                    <option key={method.id} value={method.id}>{method.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Amount</label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  className={controlClassName}
                  value={depositPaymentAmountDraft}
                  onChange={(e) => setDepositPaymentAmountDraft(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Ref No</label>
                <input
                  type="text"
                  className={controlClassName}
                  value={depositReferenceNoDraft}
                  onChange={(e) => setDepositReferenceNoDraft(e.target.value)}
                />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowDepositDialog(false)}
                className="rounded border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveDeposit}
                className="rounded bg-primary-600 px-3 py-2 text-sm font-medium text-white hover:bg-primary-700"
              >
                Ok
              </button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </Dialog>
  );
};
