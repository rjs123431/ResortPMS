import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { MainLayout } from '@components/layout/MainLayout';
import { resortService } from '@services/resort.service';

export const StaysPage = () => {
  const [selectedStayId, setSelectedStayId] = useState('');
  const [showFolio, setShowFolio] = useState(false);
  const [charge, setCharge] = useState({ chargeTypeId: '', amount: '', description: '' });
  const [payment, setPayment] = useState({ paymentMethodId: '', amount: '', referenceNo: '' });

  const { data: staysData, refetch } = useQuery({
    queryKey: ['resort-stays'],
    queryFn: () => resortService.getInHouseStays(),
  });

  const { data: folioSummary } = useQuery({
    queryKey: ['resort-folio-summary', selectedStayId],
    queryFn: () => resortService.getFolioSummary(selectedStayId),
    enabled: !!selectedStayId,
  });

  const { data: folioDetail, isFetching: isFetchingFolio } = useQuery({
    queryKey: ['resort-folio-detail', selectedStayId, showFolio],
    queryFn: () => resortService.getFolio(selectedStayId),
    enabled: !!selectedStayId && showFolio,
  });

  const { data: chargeTypes } = useQuery({
    queryKey: ['resort-charge-types'],
    queryFn: () => resortService.getChargeTypes(),
  });

  const { data: paymentMethods } = useQuery({
    queryKey: ['resort-payment-methods'],
    queryFn: () => resortService.getPaymentMethods(),
  });

  const chargeMutation = useMutation({
    mutationFn: () =>
      resortService.postCharge({
        stayId: selectedStayId,
        chargeTypeId: charge.chargeTypeId,
        amount: Number(charge.amount),
        description: charge.description,
      }),
    onSuccess: () => {
      void refetch();
      setCharge((s) => ({ ...s, amount: '', description: '' }));
    },
  });

  const paymentMutation = useMutation({
    mutationFn: () =>
      resortService.postPayment({
        stayId: selectedStayId,
        paymentMethodId: payment.paymentMethodId,
        amount: Number(payment.amount),
        referenceNo: payment.referenceNo,
      }),
    onSuccess: () => {
      void refetch();
      setPayment((s) => ({ ...s, amount: '', referenceNo: '' }));
    },
  });

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">In-House Stays</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Monitor active stays and post folio transactions.</p>
        </div>

        <section className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
          <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">Active Stays</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="p-2">Stay No</th>
                  <th className="p-2">Guest</th>
                  <th className="p-2">Room</th>
                  <th className="p-2">Expected Check-Out</th>
                  <th className="p-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {(staysData?.items ?? []).map((stay) => (
                  <tr className="border-b" key={stay.id}>
                    <td className="p-2">{stay.stayNo}</td>
                    <td className="p-2">{stay.guestName}</td>
                    <td className="p-2">{stay.roomNumber}</td>
                    <td className="p-2">{new Date(stay.expectedCheckOutDateTime).toLocaleDateString()}</td>
                    <td className="p-2">
                      <div className="flex gap-2">
                        <button type="button" className="rounded bg-slate-700 px-2 py-1 text-white" onClick={() => setSelectedStayId(String(stay.id))}>Select</button>
                        <button type="button" className="rounded bg-indigo-700 px-2 py-1 text-white" onClick={() => { setSelectedStayId(String(stay.id)); setShowFolio(true); }}>Folio</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
          <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">Folio Actions</h2>
          <p className="mb-3 text-sm text-gray-500">Selected Stay ID: {selectedStayId || '-'}</p>
          {folioSummary ? <p className="mb-4 text-sm text-gray-700 dark:text-gray-300">Folio {folioSummary.folioNo} | Balance: {folioSummary.balance.toFixed(2)}</p> : null}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded border p-3">
              <h3 className="mb-2 font-medium">Post Charge</h3>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Charge Type</label>
              <select className="mb-2 w-full rounded border p-2 dark:bg-gray-700" value={charge.chargeTypeId} onChange={(e) => setCharge((s) => ({ ...s, chargeTypeId: e.target.value }))}>
                <option value="">Select charge type</option>
                {(chargeTypes ?? []).map((ct) => (
                  <option key={ct.id} value={ct.id}>{ct.name}</option>
                ))}
              </select>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Amount</label>
              <input className="mb-2 w-full rounded border p-2 dark:bg-gray-700" value={charge.amount} onChange={(e) => setCharge((s) => ({ ...s, amount: e.target.value }))} />
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
              <input className="mb-2 w-full rounded border p-2 dark:bg-gray-700" value={charge.description} onChange={(e) => setCharge((s) => ({ ...s, description: e.target.value }))} />
              <button type="button" className="rounded bg-primary-600 px-3 py-2 text-white disabled:opacity-50" disabled={chargeMutation.isPending || !selectedStayId || !charge.amount || !charge.chargeTypeId} onClick={() => chargeMutation.mutate()}>
                {chargeMutation.isPending ? 'Posting...' : 'Post Charge'}
              </button>
            </div>

            <div className="rounded border p-3">
              <h3 className="mb-2 font-medium">Post Payment</h3>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Payment Method</label>
              <select className="mb-2 w-full rounded border p-2 dark:bg-gray-700" value={payment.paymentMethodId} onChange={(e) => setPayment((s) => ({ ...s, paymentMethodId: e.target.value }))}>
                <option value="">Select payment method</option>
                {(paymentMethods ?? []).map((pm) => (
                  <option key={pm.id} value={pm.id}>{pm.name}</option>
                ))}
              </select>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Amount</label>
              <input className="mb-2 w-full rounded border p-2 dark:bg-gray-700" value={payment.amount} onChange={(e) => setPayment((s) => ({ ...s, amount: e.target.value }))} />
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Reference</label>
              <input className="mb-2 w-full rounded border p-2 dark:bg-gray-700" value={payment.referenceNo} onChange={(e) => setPayment((s) => ({ ...s, referenceNo: e.target.value }))} />
              <button type="button" className="rounded bg-emerald-600 px-3 py-2 text-white disabled:opacity-50" disabled={paymentMutation.isPending || !selectedStayId || !payment.amount || !payment.paymentMethodId} onClick={() => paymentMutation.mutate()}>
                {paymentMutation.isPending ? 'Posting...' : 'Post Payment'}
              </button>
            </div>
          </div>
        </section>

        {showFolio ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="max-h-[90vh] w-full max-w-4xl overflow-auto rounded-lg bg-white p-5 shadow-xl dark:bg-gray-800">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold">Folio Ledger</h3>
                <button className="rounded bg-gray-200 px-2 py-1 text-sm dark:bg-gray-700" onClick={() => setShowFolio(false)}>Close</button>
              </div>
              {isFetchingFolio || !folioDetail ? <p>Loading...</p> : (
                <div className="space-y-4 text-sm">
                  <p><span className="font-medium">Folio:</span> {folioDetail.folioNo}</p>
                  <p><span className="font-medium">Balance:</span> {folioDetail.balance.toFixed(2)}</p>

                  <div>
                    <h4 className="mb-2 font-medium">Transactions</h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="border-b text-left">
                            <th className="p-2">Date</th>
                            <th className="p-2">Type</th>
                            <th className="p-2">Description</th>
                            <th className="p-2">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {folioDetail.transactions.map((t) => (
                            <tr className="border-b" key={t.id}>
                              <td className="p-2">{new Date(t.transactionDate).toLocaleString()}</td>
                              <td className="p-2">{t.chargeTypeName || t.transactionType}</td>
                              <td className="p-2">{t.description}</td>
                              <td className="p-2">{t.netAmount.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div>
                    <h4 className="mb-2 font-medium">Payments</h4>
                    <ul className="list-disc pl-5">
                      {folioDetail.payments.map((p) => (
                        <li key={p.id}>{new Date(p.paidDate).toLocaleDateString()} - {p.paymentMethodName}: {p.amount.toFixed(2)}</li>
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
