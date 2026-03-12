import { useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Dialog } from '@headlessui/react';
import { MainLayout } from '@components/layout/MainLayout';
import { LogoSpinner } from '@components/common/LogoSpinner';
import { ClearRoomDialog } from '@pages/Resort/Shared/ClearRoomDialog';
import { PostChargeDialog } from '@pages/Resort/Shared/PostChargeDialog';
import { AddPaymentDialog } from '@pages/Resort/Shared/AddPaymentDialog';
import { resortService } from '@services/resort.service';
import type { FolioTransactionDto, StayRoomRecordDto } from '@/types/resort.types';

const formatMoney = (value: number) =>
  value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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

const getFolioStatusBadge = (status?: number) => {
  switch (status) {
    case 2:
      return { label: 'Settled', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' };
    case 3:
      return { label: 'Written Off', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' };
    case 4:
      return { label: 'Voided', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' };
    default:
      return null;
  }
};

export const CheckOutPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id: stayId } = useParams<{ id: string }>();

  const [refundAmount, setRefundAmount] = useState('');
  const [refundDescription, setRefundDescription] = useState('');
  const [writeOffReason, setWriteOffReason] = useState('');

  const [clearingRoom, setClearingRoom] = useState<StayRoomRecordDto | null>(null);
  const [showChargeDialog, setShowChargeDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showSettleConfirm, setShowSettleConfirm] = useState(false);

  const { data: paymentMethods } = useQuery({
    queryKey: ['resort-payment-methods-checkout'],
    queryFn: () => resortService.getPaymentMethods(),
  });

  const { data: chargeTypes } = useQuery({
    queryKey: ['resort-charge-types-checkout'],
    queryFn: () => resortService.getChargeTypes(),
  });

  const { data: statement, refetch, isFetching: isFetchingStatement, isError: isStatementError } = useQuery({
    queryKey: ['resort-checkout-statement', stayId],
    queryFn: () => resortService.getCheckoutStatement(stayId!),
    enabled: !!stayId,
  });

  const { data: folio, refetch: refetchFolio, isFetching: isFetchingFolio } = useQuery({
    queryKey: ['resort-checkout-folio', stayId],
    queryFn: () => resortService.getFolio(stayId!),
    enabled: !!stayId,
  });

  const chargeMutation = useMutation({
    mutationFn: (values: { chargeTypeId: string; amount: number; description: string }) =>
      resortService.postCharge({
        stayId: stayId!,
        chargeTypeId: values.chargeTypeId,
        amount: values.amount,
        description: values.description,
      }),
    onSuccess: () => {
      setShowChargeDialog(false);
      void refetch();
      void refetchFolio();
    },
  });

  const paymentMutation = useMutation({
    mutationFn: (values: { paymentMethodId: string; amount: number; referenceNo: string }) =>
      resortService.postPayment({
        stayId: stayId!,
        paymentMethodId: values.paymentMethodId,
        amount: values.amount,
        referenceNo: values.referenceNo,
      }),
    onSuccess: async () => {
      setShowPaymentDialog(false);
      void refetch();
      const { data: updatedFolio } = await refetchFolio();
      if (updatedFolio && Math.abs(updatedFolio.balance) < 0.005 && updatedFolio.status < 2) {
        setShowSettleConfirm(true);
      }
    },
  });

  const settleMutation = useMutation({
    mutationFn: () => resortService.settleFolio(stayId!),
    onSuccess: () => {
      setShowSettleConfirm(false);
      void refetchFolio();
    },
  });

  const refundMutation = useMutation({
    mutationFn: () =>
      resortService.postRefund({
        stayId: stayId!,
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

  const clearRoomMutation = useMutation({
    mutationFn: ({ stayRoomId, staffId }: { stayRoomId: string; staffId?: string }) =>
      resortService.clearStayRoom({ stayRoomId, staffId }),
    onSuccess: (updatedRoom) => {
      setClearingRoom(null);
      queryClient.setQueryData(['resort-checkout-statement', stayId], (oldData: typeof statement) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          stayRooms: oldData.stayRooms?.map((room) =>
            room.stayRoomId === updatedRoom.stayRoomId ? updatedRoom : room
          ),
        };
      });
    },
  });

  const checkoutMutation = useMutation({
    mutationFn: () => resortService.processCheckout({ stayId: stayId!, payments: [] }),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ['resort-stays-checkout-list'] });
      navigate(`/check-out/confirmation/${data.checkOutRecordId}`, { replace: true });
    },
  });

  const writeOffMutation = useMutation({
    mutationFn: () => resortService.writeOffBalance(stayId!, writeOffReason),
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

    return parseRooms(statement?.roomNumber).map((roomNumber): StayRoomRecordDto => ({
      stayRoomId: roomNumber,
      roomId: '',
      roomNumber,
      assignedAt: statement?.checkInDateTime ?? '',
      releasedAt: undefined,
      isCleared: false,
    }));
  }, [statement?.checkInDateTime, statement?.roomNumber, statement?.stayRooms]);

  const rooms = useMemo(
    () => Array.from(new Set(stayRoomRecords.map((record) => record.roomNumber).filter(Boolean))),
    [stayRoomRecords],
  );

  const allRoomsCleared = stayRoomRecords.length > 0 && stayRoomRecords.every((record) => record.isCleared);
  const zeroBalance = !!folio && Math.abs(folio.balance) < 0.005;
  const isFolioSettled = !!folio && folio.status === 2;
  const canSettleFolio = zeroBalance && !isFolioSettled && folio?.status !== undefined && folio.status < 2;
  const hasOverpayment = !!folio && folio.balance < -0.005;
  const hasDepositPayment = !!folio && folio.transactions.some((t) => t.transactionType === 5 && !t.isVoided);
  const hasDepositRefundTransaction = !!folio && folio.transactions.some((t) => t.transactionType === 6 && !t.isVoided);
  const canProcessDepositRefund = hasOverpayment && hasDepositPayment;
  const canProcessRefund = hasOverpayment && !hasDepositPayment && !hasDepositRefundTransaction;
  const canProcessAnyRefund = canProcessDepositRefund || canProcessRefund;
  const refundTransactionLabel = canProcessDepositRefund ? 'DepositRefund' : 'Refund';
  const canCheckout = !!stayId && allRoomsCleared && isFolioSettled && !checkoutMutation.isPending;

  const setOverpaymentAsRefund = () => {
    if (!folio) return;
    const overpayment = Math.max(0, Math.abs(folio.balance));
    setRefundAmount(overpayment.toFixed(2));
  };

  if (!stayId) {
    return <Navigate to="/check-out" replace />;
  }

  if (isFetchingStatement) {
    return (
      <MainLayout>
        <div className="flex min-h-[50vh] items-center justify-center">
          <LogoSpinner spinnerClassName="border-b-2 border-blue-500" />
        </div>
      </MainLayout>
    );
  }

  if (isStatementError || !statement) {
    return (
      <MainLayout>
        <div className="mx-auto max-w-3xl space-y-6">
          <section className="rounded-lg border border-red-200 bg-white p-6 shadow dark:border-red-700/40 dark:bg-gray-800">
            <h1 className="text-xl font-bold text-red-700 dark:text-red-300">Stay Not Found</h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              The stay could not be found or may have already been checked out.
            </p>
            <button
              type="button"
              className="mt-4 rounded bg-gray-600 px-4 py-2 text-sm font-medium text-white"
              onClick={() => navigate('/check-out', { replace: true })}
            >
              Back to Check-Out List
            </button>
          </section>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Checkout</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Settle folio, clear rooms, and complete departure.</p>
          </div>
          <button
            type="button"
            className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 dark:border-gray-600 dark:text-gray-200"
            onClick={() => navigate('/check-out')}
          >
            Back to List
          </button>
        </div>

        <section className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
          <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">Stay Details</h2>

          <div className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm md:grid-cols-2 lg:grid-cols-3">
            <div className="flex"><span className="w-40 shrink-0 font-medium text-gray-500 dark:text-gray-400">Stay No</span><span className="text-gray-900 dark:text-white">{statement.stayNo}</span></div>
            <div className="flex"><span className="w-40 shrink-0 font-medium text-gray-500 dark:text-gray-400">Guest</span><span className="text-gray-900 dark:text-white">{statement.guestName}</span></div>
            <div className="flex"><span className="w-40 shrink-0 font-medium text-gray-500 dark:text-gray-400">Check-In</span><span className="text-gray-900 dark:text-white">{toDate(statement.checkInDateTime)}</span></div>
            <div className="flex"><span className="w-40 shrink-0 font-medium text-gray-500 dark:text-gray-400">Expected Check-Out</span><span className="text-gray-900 dark:text-white">{toDate(statement.expectedCheckOutDateTime)}</span></div>
            <div className="flex"><span className="w-40 shrink-0 font-medium text-gray-500 dark:text-gray-400">Folio</span><span className="text-gray-900 dark:text-white">{statement.folioNo}</span></div>
            <div className="flex"><span className="w-40 shrink-0 font-medium text-gray-500 dark:text-gray-400">Rooms</span><span className="text-gray-900 dark:text-white">{rooms.length > 0 ? rooms.join(', ') : '-'}</span></div>
            <div className="flex"><span className="w-40 shrink-0 font-medium text-gray-500 dark:text-gray-400">Total Charges</span><span className="text-gray-900 dark:text-white">{formatMoney(statement.totalCharges)}</span></div>
            <div className="flex"><span className="w-40 shrink-0 font-medium text-gray-500 dark:text-gray-400">Total Payments</span><span className="text-gray-900 dark:text-white">{formatMoney(statement.totalPayments)}</span></div>
            <div className="flex"><span className="w-40 shrink-0 font-medium text-gray-500 dark:text-gray-400">Balance Due</span><span className="text-gray-900 dark:text-white">{formatMoney(statement.balanceDue)}</span></div>
            <div className="flex"><span className="w-40 shrink-0 font-medium text-gray-500 dark:text-gray-400">Overpayment</span><span className="text-gray-900 dark:text-white">{formatMoney(statement.overPayment)}</span></div>
          </div>
        </section>

        <section className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
          <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">Room Clearance</h2>

          <div className="space-y-3">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b text-left dark:border-gray-700">
                    <th className="p-2">Room</th>
                    <th className="p-2">Assigned</th>
                    <th className="p-2">Released</th>
                    <th className="p-2">Status</th>
                    <th className="p-2">Cleared By</th>
                    <th className="p-2">Cleared At</th>
                    <th className="p-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {stayRoomRecords.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-3 text-gray-500">No stay room records found.</td>
                    </tr>
                  ) : (
                    stayRoomRecords.map((record) => (
                      <tr key={record.stayRoomId} className="border-b dark:border-gray-700">
                        <td className="p-2 font-medium">{record.roomNumber || '-'}</td>
                        <td className="p-2">{toDate(record.assignedAt)}</td>
                        <td className="p-2">{record.releasedAt ? toDate(record.releasedAt) : 'Active'}</td>
                        <td className="p-2">
                          {record.isCleared ? (
                            <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                              Cleared
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="p-2">{record.clearedByStaffName || '-'}</td>
                        <td className="p-2">{record.clearedAt ? toDate(record.clearedAt) : '-'}</td>
                        <td className="p-2">
                          {!record.isCleared && (
                            <button
                              type="button"
                              className="rounded bg-emerald-600 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-700"
                              onClick={() => setClearingRoom(record)}
                            >
                              Mark Cleared
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-300">
              Checkout rule: all rooms must be cleared after inspection and folio must be settled.
            </p>
          </div>
        </section>

        <section className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
          <div className="mb-3 flex items-center gap-2">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Folio And Balance</h2>
            {folio && getFolioStatusBadge(folio.status) && (
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getFolioStatusBadge(folio.status)!.className}`}>
                {getFolioStatusBadge(folio.status)!.label}
              </span>
            )}
          </div>

          {isFetchingFolio ? <p className="text-sm text-gray-500">Loading folio...</p> : null}

          {folio ? (
            <div className="space-y-4 text-sm">
              <p><span className="font-medium">Folio No:</span> {folio.folioNo}</p>
              <div className="flex items-center gap-3">
                <p><span className="font-medium">Current Balance:</span> {formatMoney(folio.balance)}</p>
                {canSettleFolio && (
                  <button
                    type="button"
                    className="rounded bg-emerald-600 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-700"
                    onClick={() => setShowSettleConfirm(true)}
                  >
                    Settle Folio
                  </button>
                )}
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="font-medium">Folio Transactions</h3>
                  {folio.status < 2 && (
                    <button
                      type="button"
                      className="rounded bg-primary-600 px-3 py-1 text-xs font-medium text-white hover:bg-primary-700"
                      onClick={() => setShowChargeDialog(true)}
                    >
                      Post Charge
                    </button>
                  )}
                </div>
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
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="font-medium">Payments</h3>
                  {folio.status < 2 && (
                    <button
                      type="button"
                      className="rounded bg-emerald-600 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-700"
                      onClick={() => setShowPaymentDialog(true)}
                    >
                      Post Payment
                    </button>
                  )}
                </div>
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
                disabled={refundMutation.isPending || Number(refundAmount) <= 0 || !canProcessAnyRefund}
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

        {statement.balanceDue > 0 ? (
          <section className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
            <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">Write-Off</h2>
            <div className="flex flex-col gap-3 md:flex-row">
              <div className="w-full">
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Write-Off Reason</label>
                <input className="w-full rounded border p-2 dark:bg-gray-700" value={writeOffReason} onChange={(e) => setWriteOffReason(e.target.value)} />
              </div>
              <button type="button" className="rounded bg-rose-600 px-4 py-2 text-white disabled:opacity-50" disabled={writeOffMutation.isPending || !writeOffReason} onClick={() => writeOffMutation.mutate()}>
                {writeOffMutation.isPending ? 'Applying...' : 'Add Write-Off'}
              </button>
            </div>
            <p className="mt-2 text-xs text-gray-500">This posts a write-off transaction to folio and sets remaining balance to zero.</p>
          </section>
        ) : null}

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

        <ClearRoomDialog
          open={!!clearingRoom}
          roomNumber={clearingRoom?.roomNumber ?? ''}
          isClearing={clearRoomMutation.isPending}
          onClose={() => setClearingRoom(null)}
          onConfirm={(staffId) => {
            if (clearingRoom) {
              clearRoomMutation.mutate({ stayRoomId: clearingRoom.stayRoomId, staffId });
            }
          }}
        />

        <PostChargeDialog
          open={showChargeDialog}
          chargeTypes={(chargeTypes ?? []).map((ct) => ({ id: ct.id, name: ct.name }))}
          isSaving={chargeMutation.isPending}
          onClose={() => setShowChargeDialog(false)}
          onSave={(values) => chargeMutation.mutate(values)}
        />

        <AddPaymentDialog
          open={showPaymentDialog}
          paymentMethods={(paymentMethods ?? []).map((pm) => ({ id: pm.id, name: pm.name }))}
          defaultAmount={statement.balanceDue > 0 ? statement.balanceDue : undefined}
          onClose={() => setShowPaymentDialog(false)}
          onSave={(values) => paymentMutation.mutate({
            paymentMethodId: values.paymentMethodId,
            amount: values.amount,
            referenceNo: values.referenceNo,
          })}
        />

        <Dialog open={showSettleConfirm} onClose={() => setShowSettleConfirm(false)} className="relative z-50">
          <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className="mx-auto max-w-sm rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
              <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white">
                Settle Folio
              </Dialog.Title>
              <Dialog.Description className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                The folio balance is zero. Do you want to mark this folio as settled? This action will close the folio and prevent further charges or payments.
              </Dialog.Description>
              <div className="mt-4 flex justify-end gap-3">
                <button
                  type="button"
                  className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                  onClick={() => setShowSettleConfirm(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                  disabled={settleMutation.isPending}
                  onClick={() => settleMutation.mutate()}
                >
                  {settleMutation.isPending ? 'Settling...' : 'Settle Folio'}
                </button>
              </div>
            </Dialog.Panel>
          </div>
        </Dialog>
      </div>
    </MainLayout>
  );
};
