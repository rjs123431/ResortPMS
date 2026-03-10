import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MainLayout } from '@components/layout/MainLayout';
import { resortService } from '@services/resort.service';
import type { FolioTransactionDto, StayListDto, StayRoomRecordDto } from '@/types/resort.types';

const round2 = (value: number) => Math.round(value * 100) / 100;
const formatMoney = (value: number) =>
  round2(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const toDate = (value?: string) => {
  if (!value) return '-';
  return new Date(value).toLocaleString();
};

const getTransactionTypeLabel = (transaction: FolioTransactionDto) => {
  switch (transaction.transactionType) {
    case 0:
      return 'Charge';
    case 1:
      return 'Payment';
    case 2:
      return 'Discount';
    case 3:
      return 'Adjustment';
    case 4:
      return 'Refund';
    case 5:
      return 'Deposit Payment';
    case 6:
      return 'Deposit Refund';
    case 7:
      return 'Write-Off';
    default:
      return `Type ${transaction.transactionType}`;
  }
};

const parseRooms = (roomValue?: string) => {
  if (!roomValue) return [];
  const parts = roomValue
    .split(/[\n,|;/+&]+/)
    .map((item) => item.trim())
    .filter(Boolean);
  return Array.from(new Set(parts));
};

export const CheckOutPage = () => {
  const queryClient = useQueryClient();
  const [selectedStay, setSelectedStay] = useState<StayListDto | null>(null);
  const [showStaySearch, setShowStaySearch] = useState(false);
  const [staySearch, setStaySearch] = useState('');

  const [roomCleared, setRoomCleared] = useState<Record<string, boolean>>({});

  const [chargeTypeId, setChargeTypeId] = useState('');
  const [chargeAmount, setChargeAmount] = useState('');
  const [chargeDescription, setChargeDescription] = useState('');

  const [paymentMethodId, setPaymentMethodId] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [referenceNo, setReferenceNo] = useState('');

  const [refundAmount, setRefundAmount] = useState('');
  const [refundDescription, setRefundDescription] = useState('');

  const [writeOffReason, setWriteOffReason] = useState('');
  const [showReceipt, setShowReceipt] = useState(false);

  const stayId = selectedStay?.id ?? '';

  const { data: inHouseData, isFetching: isFetchingStays } = useQuery({
    queryKey: ['resort-stays-checkout-search', staySearch],
    queryFn: () => resortService.getInHouseStays(staySearch, 0, 100),
    enabled: showStaySearch,
  });

  const { data: paymentMethods } = useQuery({
    queryKey: ['resort-payment-methods-checkout'],
    queryFn: () => resortService.getPaymentMethods(),
  });

  const { data: chargeTypes } = useQuery({
    queryKey: ['resort-charge-types-checkout'],
    queryFn: () => resortService.getChargeTypes(),
  });

  const { data: statement, refetch, isFetching: isFetchingStatement } = useQuery({
    queryKey: ['resort-checkout-statement', stayId],
    queryFn: () => resortService.getCheckoutStatement(stayId),
    enabled: !!stayId,
  });

  const { data: folio, refetch: refetchFolio, isFetching: isFetchingFolio } = useQuery({
    queryKey: ['resort-checkout-folio', stayId],
    queryFn: () => resortService.getFolio(stayId),
    enabled: !!stayId,
  });

  const { data: receipt, isFetching: isFetchingReceipt } = useQuery({
    queryKey: ['resort-receipt', stayId, showReceipt],
    queryFn: () => resortService.getLatestReceiptByStay(stayId),
    enabled: !!stayId && showReceipt,
  });

  const chargeMutation = useMutation({
    mutationFn: () =>
      resortService.postCharge({
        stayId,
        chargeTypeId,
        amount: Number(chargeAmount),
        description: chargeDescription,
      }),
    onSuccess: () => {
      setChargeAmount('');
      setChargeDescription('');
      void refetch();
      void refetchFolio();
    },
  });

  const paymentMutation = useMutation({
    mutationFn: () =>
      resortService.postPayment({
        stayId,
        paymentMethodId,
        amount: Number(paymentAmount),
        referenceNo,
      }),
    onSuccess: () => {
      setPaymentAmount('');
      setReferenceNo('');
      void refetch();
      void refetchFolio();
    },
  });

  const refundMutation = useMutation({
    mutationFn: () =>
      resortService.postRefund({
        stayId,
        amount: Number(refundAmount),
        description: refundDescription,
      }),
    onSuccess: () => {
      setRefundAmount('');
      setRefundDescription('');
      void refetch();
      void refetchFolio();
    },
  });

  const checkoutMutation = useMutation({
    mutationFn: () => resortService.processCheckout({ stayId, payments: [] }),
    onSuccess: () => {
      void refetch();
      void refetchFolio();
      void queryClient.invalidateQueries({ queryKey: ['resort-stays-checkout-search'] });
      setShowReceipt(true);
    },
  });

  const writeOffMutation = useMutation({
    mutationFn: () => resortService.writeOffBalance(stayId, writeOffReason),
    onSuccess: () => {
      setWriteOffReason('');
      void refetch();
      void refetchFolio();
    },
  });

  const stayRoomRecords = useMemo(() => {
    const records = statement?.stayRooms ?? [];
    if (records.length > 0) {
      return records;
    }

    return parseRooms(statement?.roomNumber ?? selectedStay?.roomNumber).map((roomNumber): StayRoomRecordDto => ({
      stayRoomId: roomNumber,
      roomId: '',
      roomNumber,
      assignedAt: selectedStay?.checkInDateTime ?? '',
      releasedAt: undefined,
    }));
  }, [selectedStay?.checkInDateTime, selectedStay?.roomNumber, statement?.roomNumber, statement?.stayRooms]);

  const rooms = useMemo(
    () => Array.from(new Set(stayRoomRecords.map((record) => record.roomNumber).filter(Boolean))),
    [stayRoomRecords],
  );

  useEffect(() => {
    if (!stayId) {
      setRoomCleared({});
      return;
    }

    setRoomCleared((prev) => {
      const next: Record<string, boolean> = {};
      for (const room of rooms) {
        next[room] = prev[room] ?? false;
      }
      return next;
    });
  }, [rooms, stayId]);

  const allRoomsCleared = rooms.length > 0 && rooms.every((room) => roomCleared[room]);
  const zeroBalance = !!statement && Math.abs(statement.balanceDue) < 0.005;
  const hasOverpayment = !!folio && folio.balance < -0.005;
  const hasDepositPayment = !!folio && folio.transactions.some((t) => t.transactionType === 5 && !t.isVoided);
  const hasDepositRefundTransaction = !!folio && folio.transactions.some((t) => t.transactionType === 6 && !t.isVoided);
  const canProcessDepositRefund = hasOverpayment && hasDepositPayment;
  const canProcessRefund = hasOverpayment && !hasDepositPayment && !hasDepositRefundTransaction;
  const canProcessAnyRefund = canProcessDepositRefund || canProcessRefund;
  const refundTransactionLabel = canProcessDepositRefund ? 'DepositRefund' : 'Refund';
  const canCheckout = !!stayId && allRoomsCleared && zeroBalance && !checkoutMutation.isPending;

  const setRemainingBalanceAsPayment = () => {
    if (!statement) return;
    const remaining = Math.max(0, round2(statement.balanceDue));
    setPaymentAmount(remaining.toFixed(2));
  };

  const setOverpaymentAsRefund = () => {
    if (!folio) return;
    const overpayment = Math.max(0, round2(Math.abs(folio.balance)));
    setRefundAmount(overpayment.toFixed(2));
  };

  const selectStay = (stay: StayListDto) => {
    setSelectedStay(stay);
    setShowStaySearch(false);
    setStaySearch('');
    setShowReceipt(false);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Checkout</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Select stay, settle folio, clear rooms, and complete departure.</p>
        </div>

        <section className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
          <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">Select Stay</h2>
          <div className="flex flex-wrap items-end gap-2">
            <div className="w-full max-w-xs">
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Stay</label>
              <input
                readOnly
                className="w-full rounded border p-2 dark:bg-gray-700"
                value={selectedStay ? `${selectedStay.stayNo} - ${selectedStay.guestName}` : ''}
                placeholder="No stay selected"
              />
            </div>
            <div className="w-full max-w-xs">
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Stay Rooms</label>
              <input
                readOnly
                className="w-full rounded border p-2 dark:bg-gray-700"
                value={rooms.length > 0 ? rooms.join(', ') : ''}
                placeholder="No rooms"
              />
            </div>
            <button type="button" className="rounded bg-slate-700 px-4 py-2 text-white" onClick={() => setShowStaySearch(true)}>
              Search Stay
            </button>
            <button
              type="button"
              className="rounded bg-indigo-700 px-4 py-2 text-white disabled:opacity-50"
              onClick={() => setShowReceipt(true)}
              disabled={!stayId}
            >
              Latest Receipt
            </button>
            <button
              type="button"
              className="rounded bg-gray-200 px-4 py-2 text-gray-800 disabled:opacity-50 dark:bg-gray-700 dark:text-gray-100"
              onClick={() => {
                setSelectedStay(null);
                setRoomCleared({});
              }}
              disabled={!stayId}
            >
              Clear
            </button>
          </div>

          {isFetchingStatement ? <p className="mt-4 text-sm text-gray-500">Loading statement...</p> : null}

          {statement && selectedStay ? (
            <div className="mt-4 grid grid-cols-1 gap-2 text-sm md:grid-cols-3">
              <p><span className="font-medium">Stay No:</span> {statement.stayNo}</p>
              <p><span className="font-medium">Guest:</span> {statement.guestName}</p>
              <p><span className="font-medium">Check-In:</span> {toDate(selectedStay.checkInDateTime)}</p>
              <p><span className="font-medium">Expected Check-Out:</span> {toDate(selectedStay.expectedCheckOutDateTime)}</p>
              <p><span className="font-medium">Folio:</span> {statement.folioNo}</p>
              <p><span className="font-medium">Rooms:</span> {rooms.length > 0 ? rooms.join(', ') : '-'}</p>
              <p><span className="font-medium">Total Charges:</span> {statement.totalCharges.toFixed(2)}</p>
              <p><span className="font-medium">Total Payments:</span> {statement.totalPayments.toFixed(2)}</p>
              <p><span className="font-medium">Balance Due:</span> {statement.balanceDue.toFixed(2)}</p>
              <p><span className="font-medium">Overpayment:</span> {statement.overPayment.toFixed(2)}</p>
            </div>
          ) : null}
        </section>

        <section className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
          <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">Stay Details And Rooms</h2>

          {stayId ? (
            <div className="space-y-3">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b text-left dark:border-gray-700">
                      <th className="p-2">Room</th>
                      <th className="p-2">Assigned</th>
                      <th className="p-2">Released</th>
                      <th className="p-2">Cleared</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stayRoomRecords.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-3 text-gray-500">No stay room records found.</td>
                      </tr>
                    ) : (
                      stayRoomRecords.map((record) => (
                        <tr key={record.stayRoomId} className="border-b dark:border-gray-700">
                          <td className="p-2">{record.roomNumber || '-'}</td>
                          <td className="p-2">{toDate(record.assignedAt)}</td>
                          <td className="p-2">{record.releasedAt ? toDate(record.releasedAt) : 'Active'}</td>
                          <td className="p-2">
                            <label className="inline-flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={!!roomCleared[record.roomNumber]}
                                onChange={(e) =>
                                  setRoomCleared((prev) => ({
                                    ...prev,
                                    [record.roomNumber]: e.target.checked,
                                  }))
                                }
                              />
                              <span>Cleared</span>
                            </label>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-300">
                Checkout rule: all rooms must be cleared and balance must be exactly 0.00.
              </p>
            </div>
          ) : (
            <p className="text-sm text-gray-500">Select a stay to view room clearance checklist.</p>
          )}
        </section>

        <section className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
          <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">Folio And Balance</h2>

          {!stayId ? <p className="text-sm text-gray-500">Select a stay to view folio details.</p> : null}

          {isFetchingFolio ? <p className="text-sm text-gray-500">Loading folio...</p> : null}

          {folio ? (
            <div className="space-y-4 text-sm">
              <p><span className="font-medium">Folio No:</span> {folio.folioNo}</p>
              <p><span className="font-medium">Current Balance:</span> {formatMoney(folio.balance)}</p>

              <div>
                <h3 className="mb-2 font-medium">Folio Transactions</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b text-left dark:border-gray-700">
                        <th className="p-2">Date</th>
                        <th className="p-2">Type</th>
                        <th className="p-2">Description</th>
                        <th className="p-2 text-right">Net Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {folio.transactions.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-3 text-gray-500">No folio transactions yet.</td>
                        </tr>
                      ) : (
                        folio.transactions.map((transaction) => (
                          <tr key={transaction.id} className="border-b dark:border-gray-700">
                            <td className="p-2">{toDate(transaction.transactionDate)}</td>
                            <td className="p-2">{transaction.chargeTypeName || getTransactionTypeLabel(transaction)}</td>
                            <td className="p-2">{transaction.description}</td>
                            <td className="p-2 text-right">{formatMoney(transaction.netAmount)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h3 className="mb-2 font-medium">Payments</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b text-left dark:border-gray-700">
                        <th className="p-2">Date</th>
                        <th className="p-2">Method</th>
                        <th className="p-2">Reference</th>
                        <th className="p-2 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {folio.payments.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-3 text-gray-500">No folio payments yet.</td>
                        </tr>
                      ) : (
                        folio.payments.map((payment) => (
                          <tr key={payment.id} className="border-b dark:border-gray-700">
                            <td className="p-2">{toDate(payment.paidDate)}</td>
                            <td className="p-2">{payment.paymentMethodName || '-'}</td>
                            <td className="p-2">{payment.referenceNo || '-'}</td>
                            <td className="p-2 text-right">{formatMoney(payment.amount)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : null}
        </section>

        <section className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
          <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">Additional Charges</h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Charge Type</label>
              <select
                className="w-full rounded border p-2 dark:bg-gray-700"
                value={chargeTypeId}
                onChange={(e) => setChargeTypeId(e.target.value)}
              >
                <option value="">Select charge type</option>
                {(chargeTypes ?? []).map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Amount</label>
              <input
                type="number"
                min={0}
                step="0.01"
                className="w-full rounded border p-2 dark:bg-gray-700"
                value={chargeAmount}
                onChange={(e) => setChargeAmount(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
              <input
                className="w-full rounded border p-2 dark:bg-gray-700"
                value={chargeDescription}
                onChange={(e) => setChargeDescription(e.target.value)}
              />
            </div>
            <button
              type="button"
              className="rounded bg-primary-600 px-4 py-2 text-white disabled:opacity-50"
              disabled={chargeMutation.isPending || !stayId || !chargeTypeId || Number(chargeAmount) <= 0}
              onClick={() => chargeMutation.mutate()}
            >
              {chargeMutation.isPending ? 'Posting...' : 'Add Charge'}
            </button>
          </div>
        </section>

        <section className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
          <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">Payments</h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Payment Method</label>
              <select className="w-full rounded border p-2 dark:bg-gray-700" value={paymentMethodId} onChange={(e) => setPaymentMethodId(e.target.value)}>
                <option value="">Select payment method</option>
                {(paymentMethods ?? []).map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Amount</label>
              <input
                type="number"
                min={0}
                step="0.01"
                className="w-full rounded border p-2 dark:bg-gray-700"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Reference</label>
              <input className="w-full rounded border p-2 dark:bg-gray-700" value={referenceNo} onChange={(e) => setReferenceNo(e.target.value)} />
            </div>
            <button
              type="button"
              className="rounded bg-emerald-600 px-4 py-2 text-white disabled:opacity-50"
              disabled={paymentMutation.isPending || !stayId || !paymentMethodId || Number(paymentAmount) <= 0}
              onClick={() => paymentMutation.mutate()}
            >
              {paymentMutation.isPending ? 'Posting...' : 'Add Payment'}
            </button>
            <button
              type="button"
              className="rounded bg-teal-700 px-4 py-2 text-white disabled:opacity-50"
              disabled={!stayId || !statement || statement.balanceDue <= 0}
              onClick={setRemainingBalanceAsPayment}
            >
              Set Remaining
            </button>
          </div>
        </section>

        {canProcessAnyRefund ? (
          <section className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
            <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">Refund Transaction ({refundTransactionLabel})</h2>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Refund Amount</label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  className="w-full rounded border p-2 dark:bg-gray-700"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                />
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                <input
                  className="w-full rounded border p-2 dark:bg-gray-700"
                  value={refundDescription}
                  onChange={(e) => setRefundDescription(e.target.value)}
                  placeholder="Deposit refund"
                />
              </div>
              <button
                type="button"
                className="rounded bg-amber-700 px-4 py-2 text-white disabled:opacity-50"
                disabled={refundMutation.isPending || !stayId || Number(refundAmount) <= 0 || !canProcessAnyRefund}
                onClick={() => refundMutation.mutate()}
              >
                {refundMutation.isPending ? 'Posting...' : 'Process Refund'}
              </button>
            </div>
            <div className="mt-2">
              <button
                type="button"
                className="rounded bg-amber-600 px-3 py-1.5 text-xs text-white disabled:opacity-50"
                disabled={!canProcessAnyRefund}
                onClick={setOverpaymentAsRefund}
              >
                Refund Full Overpayment
              </button>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              DepositRefund: shown when there is overpayment and DepositPayment exists. Refund: shown when there is overpayment and no DepositPayment and no DepositRefund transaction.
            </p>
          </section>
        ) : null}

        <section className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
          <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">Write-Off</h2>
          <div className="flex flex-col gap-3 md:flex-row">
            <div className="w-full">
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Write-Off Reason</label>
              <input className="w-full rounded border p-2 dark:bg-gray-700" value={writeOffReason} onChange={(e) => setWriteOffReason(e.target.value)} />
            </div>
            <button type="button" className="rounded bg-rose-600 px-4 py-2 text-white disabled:opacity-50" disabled={writeOffMutation.isPending || !stayId || !writeOffReason} onClick={() => writeOffMutation.mutate()}>
              {writeOffMutation.isPending ? 'Applying...' : 'Add Write-Off'}
            </button>
          </div>
          <p className="mt-2 text-xs text-gray-500">This posts a write-off transaction to folio and sets remaining balance to zero.</p>
        </section>

        <section className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
          <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">Process Checkout</h2>
          <div className="flex flex-col gap-2 text-sm">
            <p><span className="font-medium">Rooms Cleared:</span> {allRoomsCleared ? 'Yes' : 'No'}</p>
            <p><span className="font-medium">Zero Balance:</span> {zeroBalance ? 'Yes' : 'No'}</p>
          </div>
          <button
            type="button"
            className="mt-3 rounded bg-primary-600 px-4 py-2 text-white disabled:opacity-50"
            disabled={!canCheckout}
            onClick={() => checkoutMutation.mutate()}
          >
            {checkoutMutation.isPending ? 'Processing...' : 'Checkout'}
          </button>
          {checkoutMutation.data ? <p className="mt-2 text-sm text-emerald-600">Receipt: {checkoutMutation.data.receiptNo}</p> : null}
        </section>

        {showStaySearch ? (
          <Dialog open={showStaySearch} onClose={() => setShowStaySearch(false)} className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-start justify-center bg-black/50 p-4 pt-8">
              <DialogPanel className="w-full max-w-4xl rounded-lg bg-white p-5 shadow-xl dark:bg-gray-800">
                <div className="mb-4 flex items-center justify-between">
                  <DialogTitle as="h3" className="text-lg font-semibold text-gray-900 dark:text-white">Search In-House Stay</DialogTitle>
                  <button className="rounded bg-gray-200 px-2 py-1 text-sm dark:bg-gray-700" onClick={() => setShowStaySearch(false)}>Close</button>
                </div>

                <div className="mb-3">
                  <input
                    className="w-full rounded border p-2 dark:bg-gray-700"
                    placeholder="Stay no, guest, room"
                    value={staySearch}
                    onChange={(e) => setStaySearch(e.target.value)}
                  />
                </div>

                <div className="max-h-[65vh] overflow-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b text-left dark:border-gray-700">
                        <th className="p-2">Stay No</th>
                        <th className="p-2">Guest</th>
                        <th className="p-2">Room</th>
                        <th className="p-2">Expected Check-Out</th>
                        <th className="p-2">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {isFetchingStays ? (
                        <tr>
                          <td colSpan={5} className="p-3 text-center text-gray-500">Loading stays...</td>
                        </tr>
                      ) : (inHouseData?.items ?? []).length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-3 text-center text-gray-500">No in-house stay found.</td>
                        </tr>
                      ) : (
                        (inHouseData?.items ?? []).map((stay) => (
                          <tr key={stay.id} className="border-b dark:border-gray-700">
                            <td className="p-2">{stay.stayNo}</td>
                            <td className="p-2">{stay.guestName}</td>
                            <td className="p-2">{parseRooms(stay.roomNumber).join(', ') || '-'}</td>
                            <td className="p-2">{toDate(stay.expectedCheckOutDateTime)}</td>
                            <td className="p-2">
                              <button className="rounded bg-primary-600 px-3 py-1 text-white" onClick={() => selectStay(stay)}>
                                Select
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </DialogPanel>
            </div>
          </Dialog>
        ) : null}

        {showReceipt ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-lg bg-white p-5 shadow-xl dark:bg-gray-800">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold">Receipt</h3>
                <button className="rounded bg-gray-200 px-2 py-1 text-sm dark:bg-gray-700" onClick={() => setShowReceipt(false)}>Close</button>
              </div>
              {isFetchingReceipt || !receipt ? <p>Loading...</p> : (
                <div className="space-y-3 text-sm">
                  <p><span className="font-medium">Receipt No:</span> {receipt.receiptNo}</p>
                  <p><span className="font-medium">Stay:</span> {receipt.stayNo}</p>
                  <p><span className="font-medium">Guest:</span> {receipt.guestName}</p>
                  <p><span className="font-medium">Room:</span> {receipt.roomNumber}</p>
                  <p><span className="font-medium">Issued:</span> {new Date(receipt.issuedDate).toLocaleString()}</p>
                  <p><span className="font-medium">Amount:</span> {receipt.amount.toFixed(2)}</p>
                  <div>
                    <h4 className="mb-2 font-medium">Payments</h4>
                    <ul className="list-disc pl-5">
                      {receipt.payments.map((p, idx) => (
                        <li key={idx}>{p.paymentMethodName}: {p.amount.toFixed(2)}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </MainLayout>
  );
};
