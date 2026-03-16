import { useQuery } from '@tanstack/react-query';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { resortService } from '@services/resort.service';

const formatMoney = (value: number) =>
  value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const CheckOutConfirmationPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const { data: checkOutRecord, isLoading, isError } = useQuery({
    queryKey: ['checkout-record', id],
    queryFn: () => resortService.getCheckOutRecord(id!),
    enabled: !!id,
  });

  if (!id) {
    return <Navigate to="/front-desk/check-out" replace />;
  }

  if (isLoading) {
    return (
      <>
        <div className="flex min-h-[50vh] items-center justify-center">
          <p className="text-gray-500">Loading checkout details...</p>
        </div>
      </>
    );
  }

  if (isError || !checkOutRecord) {
    return (
      <>
        <div className="mx-auto max-w-3xl space-y-6">
          <section className="rounded-lg border border-red-200 bg-white p-6 shadow dark:border-red-700/40 dark:bg-gray-800">
            <h1 className="text-xl font-bold text-red-700 dark:text-red-300">Checkout Record Not Found</h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              The checkout record could not be found. It may have been deleted or you may not have access to it.
            </p>
            <button
              type="button"
              className="mt-4 rounded bg-gray-600 px-4 py-2 text-sm font-medium text-white"
              onClick={() => navigate('/front-desk/check-out', { replace: true })}
            >
              Back to Check-Out
            </button>
          </section>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="mx-auto max-w-3xl space-y-6">
        <section className="rounded-lg border border-emerald-200 bg-white p-6 shadow dark:border-emerald-700/40 dark:bg-gray-800">
          <h1 className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">Check-Out Completed</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            Guest check-out has been completed successfully.
          </p>

          <div className="mt-5 grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
            <div className="rounded border p-3 dark:border-gray-700">
              <p className="text-gray-500 dark:text-gray-400">Stay No</p>
              <p className="font-semibold text-gray-900 dark:text-white">{checkOutRecord.stayNo}</p>
            </div>
            <div className="rounded border p-3 dark:border-gray-700">
              <p className="text-gray-500 dark:text-gray-400">Receipt No</p>
              <p className="font-semibold text-gray-900 dark:text-white">{checkOutRecord.receipt?.receiptNo ?? '-'}</p>
            </div>
            <div className="rounded border p-3 dark:border-gray-700">
              <p className="text-gray-500 dark:text-gray-400">Guest</p>
              <p className="font-semibold text-gray-900 dark:text-white">{checkOutRecord.guestName}</p>
            </div>
            <div className="rounded border p-3 dark:border-gray-700">
              <p className="text-gray-500 dark:text-gray-400">Room</p>
              <p className="font-semibold text-gray-900 dark:text-white">{checkOutRecord.roomNumber}</p>
            </div>
            <div className="rounded border p-3 dark:border-gray-700">
              <p className="text-gray-500 dark:text-gray-400">Check-Out Time</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {new Date(checkOutRecord.checkOutDateTime).toLocaleString()}
              </p>
            </div>
            <div className="rounded border p-3 dark:border-gray-700">
              <p className="text-gray-500 dark:text-gray-400">Total Settled</p>
              <p className="font-semibold text-gray-900 dark:text-white">{formatMoney(checkOutRecord.settledAmount)}</p>
            </div>
          </div>

          {checkOutRecord.receipt && checkOutRecord.receipt.payments.length > 0 && (
            <div className="mt-5">
              <h3 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Payment Summary</h3>
              <div className="rounded border dark:border-gray-700">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50 dark:border-gray-700 dark:bg-gray-700/50">
                      <th className="p-2 text-left font-medium">Payment Method</th>
                      <th className="p-2 text-right font-medium">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {checkOutRecord.receipt.payments.map((payment, idx) => (
                      <tr key={idx} className="border-b last:border-0 dark:border-gray-700">
                        <td className="p-2">{payment.paymentMethodName}</td>
                        <td className="p-2 text-right">{formatMoney(payment.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded bg-emerald-700 px-4 py-2 text-sm font-medium text-white"
              onClick={() => navigate('/front-desk/stays', { replace: true })}
            >
              View Stays
            </button>
            <button
              type="button"
              className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 dark:border-gray-600 dark:text-gray-200"
              onClick={() => navigate('/front-desk/check-out', { replace: true })}
            >
              New Check-Out
            </button>
            <button
              type="button"
              className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 dark:border-gray-600 dark:text-gray-200"
              onClick={() => navigate('/', { replace: true })}
            >
              Dashboard
            </button>
          </div>
        </section>
      </div>
    </>
  );
};
