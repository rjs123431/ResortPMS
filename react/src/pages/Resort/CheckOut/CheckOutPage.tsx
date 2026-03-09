import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { MainLayout } from '@components/layout/MainLayout';
import { resortService } from '@services/resort.service';

export const CheckOutPage = () => {
  const [stayId, setStayId] = useState('');
  const [paymentMethodId, setPaymentMethodId] = useState('');
  const [amount, setAmount] = useState('');
  const [referenceNo, setReferenceNo] = useState('');
  const [writeOffReason, setWriteOffReason] = useState('');
  const [showReceipt, setShowReceipt] = useState(false);

  const { data: paymentMethods } = useQuery({
    queryKey: ['resort-payment-methods-checkout'],
    queryFn: () => resortService.getPaymentMethods(),
  });

  const { data: statement, refetch, isFetching } = useQuery({
    queryKey: ['resort-checkout-statement', stayId],
    queryFn: () => resortService.getCheckoutStatement(stayId),
    enabled: !!stayId,
  });

  const { data: receipt, isFetching: isFetchingReceipt } = useQuery({
    queryKey: ['resort-receipt', stayId, showReceipt],
    queryFn: () => resortService.getLatestReceiptByStay(stayId),
    enabled: !!stayId && showReceipt,
  });

  const checkoutMutation = useMutation({
    mutationFn: () => resortService.processCheckout(stayId, paymentMethodId, Number(amount), referenceNo),
    onSuccess: () => {
      void refetch();
      setShowReceipt(true);
    },
  });

  const writeOffMutation = useMutation({
    mutationFn: () => resortService.writeOffBalance(stayId, writeOffReason),
    onSuccess: () => void refetch(),
  });

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Checkout</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Settle folio, complete departure, and view receipt.</p>
        </div>

        <section className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
          <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">Statement</h2>
          <div className="flex items-end gap-2">
            <div className="w-full max-w-xs">
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Stay ID</label>
              <input className="w-full rounded border p-2 dark:bg-gray-700" value={stayId} onChange={(e) => setStayId(e.target.value)} />
            </div>
            <button type="button" className="rounded bg-slate-700 px-4 py-2 text-white" onClick={() => void refetch()} disabled={!stayId || isFetching}>Load</button>
            <button type="button" className="rounded bg-indigo-700 px-4 py-2 text-white" onClick={() => setShowReceipt(true)} disabled={!stayId}>Latest Receipt</button>
          </div>

          {statement ? (
            <div className="mt-4 grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
              <p><span className="font-medium">Stay No:</span> {statement.stayNo}</p>
              <p><span className="font-medium">Guest:</span> {statement.guestName}</p>
              <p><span className="font-medium">Room:</span> {statement.roomNumber}</p>
              <p><span className="font-medium">Folio:</span> {statement.folioNo}</p>
              <p><span className="font-medium">Total Charges:</span> {statement.totalCharges.toFixed(2)}</p>
              <p><span className="font-medium">Total Payments:</span> {statement.totalPayments.toFixed(2)}</p>
              <p><span className="font-medium">Balance Due:</span> {statement.balanceDue.toFixed(2)}</p>
            </div>
          ) : null}
        </section>

        <section className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
          <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">Process Checkout</h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
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
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Settlement Amount</label>
              <input className="w-full rounded border p-2 dark:bg-gray-700" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Reference</label>
              <input className="w-full rounded border p-2 dark:bg-gray-700" value={referenceNo} onChange={(e) => setReferenceNo(e.target.value)} />
            </div>
            <button type="button" className="rounded bg-primary-600 px-4 py-2 text-white disabled:opacity-50" disabled={checkoutMutation.isPending || !stayId || !amount || !paymentMethodId} onClick={() => checkoutMutation.mutate()}>
              {checkoutMutation.isPending ? 'Processing...' : 'Checkout'}
            </button>
          </div>
          {checkoutMutation.data ? <p className="mt-2 text-sm text-emerald-600">Receipt: {checkoutMutation.data.receiptNo}</p> : null}
        </section>

        <section className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
          <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">Write Off</h2>
          <div className="flex flex-col gap-3 md:flex-row">
            <div className="w-full">
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Write-Off Reason</label>
              <input className="w-full rounded border p-2 dark:bg-gray-700" value={writeOffReason} onChange={(e) => setWriteOffReason(e.target.value)} />
            </div>
            <button type="button" className="rounded bg-rose-600 px-4 py-2 text-white disabled:opacity-50" disabled={writeOffMutation.isPending || !stayId || !writeOffReason} onClick={() => writeOffMutation.mutate()}>
              {writeOffMutation.isPending ? 'Applying...' : 'Write Off Balance'}
            </button>
          </div>
        </section>

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
