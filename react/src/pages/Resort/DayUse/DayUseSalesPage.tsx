import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { resortService } from '@services/resort.service';
import { SearchGuestDialog, type SelectedGuest } from '@pages/Resort/Shared/SearchGuestDialog';
import { notifyError, notifySuccess } from '@/utils/alerts';
import { formatMoney } from '@utils/helpers';
import type { StayListDto } from '@/types/stay.types';
import {
  DayUseGuestContext,
} from '@/types/day-use.types';
import { DayUseAddItemDialog } from './DayUseAddItemDialog';
import { DayUsePaymentDialog, type DayUsePaymentEntry } from './DayUsePaymentDialog';
import { dayUseContextLabel, dayUseOfferLabel } from './dayUseUi';

const formatDateOnly = (value: Date) => {
  const pad = (input: number) => input.toString().padStart(2, '0');
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
};

const createPaymentEntry = (): DayUsePaymentEntry => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  paymentMethodId: '',
  amount: '',
  referenceNo: '',
});

const createDraftPaymentEntry = (amount?: number): DayUsePaymentEntry => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  paymentMethodId: '',
  amount: amount && amount > 0 ? amount.toString() : '',
  referenceNo: '',
});

export const DayUseSalesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [guestContext, setGuestContext] = useState<DayUseGuestContext>(DayUseGuestContext.WalkIn);
  const [selectedGuest, setSelectedGuest] = useState<SelectedGuest | null>(null);
  const [selectedStayId, setSelectedStayId] = useState('');
  const [showGuestDialog, setShowGuestDialog] = useState(false);
  const [showAddItemDialog, setShowAddItemDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [visitDate, setVisitDate] = useState(() => formatDateOnly(new Date()));
  const [accessStartTime, setAccessStartTime] = useState('08:00');
  const [accessEndTime, setAccessEndTime] = useState('17:00');
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [remarks, setRemarks] = useState('');
  const [payments, setPayments] = useState<DayUsePaymentEntry[]>([createPaymentEntry()]);
  const [draftPayment, setDraftPayment] = useState<DayUsePaymentEntry>(createPaymentEntry());
  const [resultMessage, setResultMessage] = useState('');

  const { data: offers = [], isLoading: offersLoading } = useQuery({
    queryKey: ['day-use-active-offers', guestContext],
    queryFn: () => resortService.getDayUseActiveOffers({ guestContext }),
  });

  const { data: paymentMethods = [] } = useQuery({
    queryKey: ['resort-payment-methods', 'day-use'],
    queryFn: () => resortService.getPaymentMethods(),
    enabled: guestContext === DayUseGuestContext.WalkIn,
  });

  const { data: inHouseStays } = useQuery({
    queryKey: ['day-use-in-house-stays'],
    queryFn: () => resortService.getInHouseStays('', 0, 100),
    enabled: guestContext === DayUseGuestContext.InHouse,
  });

  const selectedStay = useMemo(
    () => (inHouseStays?.items ?? []).find((stay: StayListDto) => stay.id === selectedStayId),
    [inHouseStays?.items, selectedStayId],
  );

  const selectedLines = useMemo(
    () => offers.map((offer) => ({ offer, quantity: quantities[offer.id] ?? 0 })).filter((item) => item.quantity > 0),
    [offers, quantities],
  );

  const totalAmount = useMemo(
    () => selectedLines.reduce((sum, item) => sum + item.quantity * item.offer.amount, 0),
    [selectedLines],
  );

  const normalizedPayments = useMemo(
    () => payments
      .map((payment) => ({
        ...payment,
        amountNumber: Number(payment.amount || 0),
      }))
      .filter((payment) => payment.amountNumber > 0),
    [payments],
  );

  const totalPaidAmount = useMemo(
    () => normalizedPayments.reduce((sum, payment) => sum + payment.amountNumber, 0),
    [normalizedPayments],
  );

  const remainingBalance = useMemo(
    () => Math.max(0, totalAmount - totalPaidAmount),
    [totalAmount, totalPaidAmount],
  );

  const changeAmount = useMemo(
    () => Math.max(0, totalPaidAmount - totalAmount),
    [totalAmount, totalPaidAmount],
  );

  const isDraftPaymentSaveDisabled = !draftPayment.paymentMethodId || Number(draftPayment.amount || 0) <= 0;

  const createSaleMutation = useMutation({
    mutationFn: () => {
      const guestId = guestContext === DayUseGuestContext.InHouse ? selectedStay?.guestId : selectedGuest?.id;

      if (!guestId) {
        throw new Error('Select a guest before saving the day-use sale.');
      }

      return resortService.createDayUseSale({
        guestId,
        stayId: guestContext === DayUseGuestContext.InHouse ? selectedStayId : undefined,
        visitDate,
        accessStartTime,
        accessEndTime,
        guestContext,
        remarks,
        lines: selectedLines.map((item) => ({ offerId: item.offer.id, quantity: item.quantity })),
        payments:
          guestContext === DayUseGuestContext.WalkIn && normalizedPayments.length > 0
            ? normalizedPayments.map((payment) => ({
                paymentMethodId: payment.paymentMethodId,
                amount: payment.amountNumber,
                referenceNo: payment.referenceNo || undefined,
              }))
            : [],
      });
    },
    onSuccess: (result) => {
      const summary = result.postedToFolio
        ? `Sale ${result.visitNo} saved and posted to folio.`
        : `Sale ${result.visitNo} saved. Paid ${formatMoney(result.paidAmount)} with balance ${formatMoney(result.balanceAmount)}.`;
      setResultMessage(summary);
      notifySuccess('Day-use sale saved successfully.');
      setQuantities({});
      setRemarks('');
      setPayments([createPaymentEntry()]);
      setDraftPayment(createDraftPaymentEntry());
      setShowAddItemDialog(false);
      setShowPaymentDialog(false);
      void queryClient.invalidateQueries({ queryKey: ['day-use-list-page'] });
    },
    onError: (error) => {
      notifyError(error instanceof Error ? error.message : 'Failed to save day-use sale.');
    },
  });

  const canSubmit =
    selectedLines.length > 0
    && (guestContext === DayUseGuestContext.InHouse ? Boolean(selectedStayId && selectedStay?.guestId) : Boolean(selectedGuest?.id))
    && (guestContext !== DayUseGuestContext.WalkIn || normalizedPayments.every((payment) => Boolean(payment.paymentMethodId)));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Day Use</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Sell entrance fees and activity packages for walk-in and in-house guests.</p>
        </div>
        <Link to="/front-desk/day-use" className="rounded bg-slate-700 px-4 py-2 text-white hover:bg-slate-800">
          View Visits
        </Link>
      </div>

      <section className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Visit Setup</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2 flex flex-wrap gap-2">
                  {[DayUseGuestContext.WalkIn, DayUseGuestContext.InHouse].map((context) => (
                    <button
                      key={context}
                      type="button"
                      onClick={() => {
                        setGuestContext(context);
                        setQuantities({});
                        setResultMessage('');
                        setPayments([createPaymentEntry()]);
                        setDraftPayment(createDraftPaymentEntry());
                      }}
                      className={`rounded px-4 py-2 text-sm ${guestContext === context ? 'bg-primary-600 text-white' : 'border border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-200'}`}
                    >
                      {dayUseContextLabel(context)}
                    </button>
                  ))}
                </div>

                {guestContext === DayUseGuestContext.WalkIn ? (
                  <div className="md:col-span-2 rounded-lg border border-dashed border-gray-300 p-4 dark:border-gray-600">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">Guest</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {selectedGuest ? selectedGuest.fullName : 'Select or create a guest profile for this day-use sale.'}
                        </p>
                      </div>
                      <button type="button" className="rounded bg-primary-600 px-3 py-2 text-sm text-white hover:bg-primary-700" onClick={() => setShowGuestDialog(true)}>
                        {selectedGuest ? 'Change Guest' : 'Select Guest'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="md:col-span-2">
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">In-House Stay</label>
                    <select
                      value={selectedStayId}
                      onChange={(e) => setSelectedStayId(e.target.value)}
                      className="w-full rounded border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                    >
                      <option value="">Select active stay</option>
                      {(inHouseStays?.items ?? []).map((stay: StayListDto) => (
                        <option key={stay.id} value={stay.id}>{`${stay.stayNo} - ${stay.guestName} - ${stay.roomNumber}`}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Visit Date</label>
                  <input type="date" value={visitDate} onChange={(e) => setVisitDate(e.target.value)} className="w-full rounded border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Start</label>
                    <input type="time" value={accessStartTime} onChange={(e) => setAccessStartTime(e.target.value)} className="w-full rounded border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100" />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">End</label>
                    <input type="time" value={accessEndTime} onChange={(e) => setAccessEndTime(e.target.value)} className="w-full rounded border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100" />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Remarks</label>
                  <textarea rows={3} value={remarks} onChange={(e) => setRemarks(e.target.value)} className="w-full rounded border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100" placeholder="Optional notes for the visit" />
                </div>
              </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Summary</h2>
                <button
                  type="button"
                  className="rounded bg-primary-600 px-3 py-2 text-sm text-white hover:bg-primary-700"
                  onClick={() => setShowAddItemDialog(true)}
                >
                  Add Item
                </button>
              </div>
              <div className="mt-4 space-y-3">
                {selectedLines.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">Select one or more entrance fees or activities.</p>
                ) : selectedLines.map(({ offer, quantity }) => (
                  <div key={offer.id} className="rounded-lg bg-gray-50 p-3 dark:bg-gray-900/30">
                    <div className="flex items-start justify-between gap-3">
                      <p className="min-w-0 flex-1 text-gray-900 dark:text-white">{dayUseOfferLabel(offer)}</p>
                      <span className="shrink-0 font-medium text-gray-900 dark:text-white">{formatMoney(quantity * offer.amount)}</span>
                    </div>
                    <div className="mt-2 inline-flex items-center gap-2">
                        <button
                          type="button"
                          className="flex h-8 w-8 items-center justify-center rounded bg-gray-100 text-base font-semibold text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                          onClick={() => setQuantities((current) => ({
                            ...current,
                            [offer.id]: Math.max(0, (current[offer.id] ?? 0) - 1),
                          }))}
                        >
                          -
                        </button>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={String(quantity)}
                          onChange={(e) => {
                            const sanitized = e.target.value.replace(/[^\d.]/g, '');
                            const parsed = Number(sanitized);
                            setQuantities((current) => ({
                              ...current,
                              [offer.id]: sanitized === '' ? 0 : (Number.isFinite(parsed) ? parsed : current[offer.id] ?? 0),
                            }));
                          }}
                          className="h-8 w-16 bg-transparent px-2 text-center text-gray-900 outline-none dark:text-gray-100"
                        />
                        <button
                          type="button"
                          className="flex h-8 w-8 items-center justify-center rounded bg-gray-100 text-base font-semibold text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                          onClick={() => setQuantities((current) => ({
                            ...current,
                            [offer.id]: (current[offer.id] ?? 0) + 1,
                          }))}
                        >
                          +
                        </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 border-t border-gray-200 pt-4 dark:border-gray-700">
                <div className="flex items-center justify-between text-base font-semibold text-gray-900 dark:text-white">
                  <span>Total</span>
                  <span>{formatMoney(totalAmount)}</span>
                </div>
              </div>
            </div>

            {guestContext === DayUseGuestContext.WalkIn ? (
              <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Payment Status</h2>
                  <button
                    type="button"
                    className="rounded bg-primary-600 px-3 py-2 text-sm text-white hover:bg-primary-700"
                    onClick={() => {
                      setDraftPayment(createDraftPaymentEntry(remainingBalance));
                      setShowPaymentDialog(true);
                    }}
                  >
                    Add Payment
                  </button>
                </div>

                <div className="mt-4 overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="p-2">Method</th>
                        <th className="p-2">Reference</th>
                        <th className="p-2 text-right">Amount</th>
                        <th className="p-2 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {normalizedPayments.map((payment) => (
                        <tr className="border-b" key={payment.id}>
                          <td className="p-2 text-gray-900 dark:text-white">
                            {paymentMethods.find((paymentMethod) => paymentMethod.id === payment.paymentMethodId)?.name || 'Unassigned'}
                          </td>
                          <td className="p-2 text-gray-600 dark:text-gray-300">{payment.referenceNo || 'None'}</td>
                          <td className="p-2 text-right text-gray-900 dark:text-white">{formatMoney(payment.amountNumber)}</td>
                          <td className="p-2 text-right">
                            <button
                              type="button"
                              className="text-sm text-rose-600 hover:text-rose-700"
                              onClick={() => setPayments((current) => current.filter((item) => item.id !== payment.id))}
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                      {normalizedPayments.length === 0 ? (
                        <tr>
                          <td className="p-3 text-gray-500 dark:text-gray-400" colSpan={4}>No payment entries added yet.</td>
                        </tr>
                      ) : null}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td className="p-2 font-medium text-gray-500 dark:text-gray-400" colSpan={2}>Paid</td>
                        <td className="p-2 text-right font-medium text-gray-900 dark:text-white">{formatMoney(totalPaidAmount)}</td>
                        <td className="p-2" />
                      </tr>
                      <tr>
                        <td className="p-2 font-medium text-gray-500 dark:text-gray-400" colSpan={2}>Balance</td>
                        <td className="p-2 text-right font-semibold text-gray-900 dark:text-white">{formatMoney(remainingBalance)}</td>
                        <td className="p-2" />
                      </tr>
                      <tr>
                        <td className="p-2 font-medium text-gray-500 dark:text-gray-400" colSpan={2}>Change</td>
                        <td className="p-2 text-right font-semibold text-gray-900 dark:text-white">{formatMoney(changeAmount)}</td>
                        <td className="p-2" />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-700/50 dark:bg-amber-900/20 dark:text-amber-100">
                Selected items will be posted to the guest folio for the chosen active stay.
              </div>
            )}

            {resultMessage ? (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 dark:border-emerald-700/50 dark:bg-emerald-900/20 dark:text-emerald-100">
                {resultMessage}
              </div>
            ) : null}

            <button
              type="button"
              disabled={!canSubmit || createSaleMutation.isPending}
              onClick={() => void createSaleMutation.mutate()}
              className="w-full rounded bg-primary-600 px-4 py-3 text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {createSaleMutation.isPending ? 'Saving Sale...' : guestContext === DayUseGuestContext.WalkIn ? 'Save Day-Use Sale' : 'Post Day-Use Charges'}
            </button>
          </div>
        </div>
      </section>

      <SearchGuestDialog open={showGuestDialog} onClose={() => setShowGuestDialog(false)} onSelectGuest={setSelectedGuest} />
      <DayUseAddItemDialog
        open={showAddItemDialog}
        offers={offers}
        isLoading={offersLoading}
        onClose={() => setShowAddItemDialog(false)}
        onAddItems={(items) => {
          setQuantities((current) => {
            const next = { ...current };
            items.forEach((item) => {
              next[item.offerId] = (next[item.offerId] ?? 0) + item.quantity;
            });
            return next;
          });
          setShowAddItemDialog(false);
        }}
      />
      <DayUsePaymentDialog
        open={showPaymentDialog && guestContext === DayUseGuestContext.WalkIn}
        paymentMethods={paymentMethods}
        payment={draftPayment}
        isSaveDisabled={isDraftPaymentSaveDisabled}
        onClose={() => {
          setShowPaymentDialog(false);
          setDraftPayment(createDraftPaymentEntry());
        }}
        onSave={() => {
          setPayments((current) => [...current.filter((item) => Number(item.amount || 0) > 0), { ...draftPayment }]);
          setDraftPayment(createDraftPaymentEntry());
          setShowPaymentDialog(false);
        }}
        onPaymentChange={(field, value) => {
          setDraftPayment((current) => ({ ...current, [field]: value }));
        }}
      />
    </div>
  );
};