import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { resortService } from '@services/resort.service';
import { MainLayout } from '@components/layout/MainLayout';
import { QuotationStatus } from '@/types/quotation.types';
import { formatDate, formatMoney } from '@utils/helpers';

const STATUS_TABS: { label: string; value: QuotationStatus | undefined }[] = [
  { label: 'All', value: undefined },
  { label: 'Active', value: QuotationStatus.Active },
  { label: 'Draft', value: QuotationStatus.Draft },
  { label: 'Converted', value: QuotationStatus.Converted },
  { label: 'Expired', value: QuotationStatus.Expired },
  { label: 'Cancelled', value: QuotationStatus.Cancelled },
];

const STATUS_BADGE: Record<QuotationStatus, { label: string; className: string }> = {
  [QuotationStatus.Draft]: { label: 'Draft', className: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' },
  [QuotationStatus.Active]: { label: 'Active', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  [QuotationStatus.Converted]: { label: 'Converted', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  [QuotationStatus.Expired]: { label: 'Expired', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  [QuotationStatus.Cancelled]: { label: 'Cancelled', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
};

export const QuotationsPage = () => {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('');
  const [statusTab, setStatusTab] = useState<QuotationStatus | undefined>(undefined);
  const [cancelTargetId, setCancelTargetId] = useState<string | null>(null);

  const { data, isFetching } = useQuery({
    queryKey: ['resort-quotations', filter, statusTab],
    queryFn: () =>
      resortService.getQuotations({
        filter: filter || undefined,
        status: statusTab,
        includeExpired: true,
        maxResultCount: 200,
      }),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => resortService.cancelQuotation(id),
    onSuccess: () => {
      setCancelTargetId(null);
      void queryClient.invalidateQueries({ queryKey: ['resort-quotations'] });
    },
  });

  const quotations = data?.items ?? [];

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quotations</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Review and manage guest quotations.</p>
          </div>
        </div>

        <section className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
          {/* Filters */}
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <input
              type="text"
              className="w-full max-w-xs rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              placeholder="Search by guest or quotation no..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>

          {/* Status tabs */}
          <div className="mb-4 flex flex-wrap gap-2">
            {STATUS_TABS.map((tab) => (
              <button
                key={String(tab.value)}
                type="button"
                onClick={() => setStatusTab(tab.value)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  statusTab === tab.value
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b text-left dark:border-gray-700">
                  <th className="p-3">Quotation No</th>
                  <th className="p-3">Guest</th>
                  <th className="p-3">Arrival</th>
                  <th className="p-3">Departure</th>
                  <th className="p-3">Nights</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Total</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isFetching ? (
                  <tr>
                    <td colSpan={8} className="p-4 text-center text-gray-500">Loading quotations…</td>
                  </tr>
                ) : quotations.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-4 text-center text-gray-500">No quotations found.</td>
                  </tr>
                ) : (
                  quotations.map((q) => {
                    const badge = STATUS_BADGE[q.status];
                    return (
                      <tr key={q.id} className="border-b hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/50">
                        <td className="p-3 font-medium">{q.quotationNo}</td>
                        <td className="p-3">{q.guestName || '—'}</td>
                        <td className="p-3">{formatDate(q.arrivalDate)}</td>
                        <td className="p-3">{formatDate(q.departureDate)}</td>
                        <td className="p-3">{q.nights}</td>
                        <td className="p-3">
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.className}`}>
                            {badge.label}
                          </span>
                        </td>
                        <td className="p-3 text-right">{formatMoney(q.totalAmount)}</td>
                        <td className="p-3">
                          {q.status === QuotationStatus.Active || q.status === QuotationStatus.Draft ? (
                            <button
                              type="button"
                              className="rounded bg-red-600 px-2.5 py-1 text-xs text-white hover:bg-red-700 disabled:opacity-50"
                              disabled={cancelMutation.isPending}
                              onClick={() => setCancelTargetId(q.id)}
                            >
                              Cancel
                            </button>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Cancel confirmation */}
      {cancelTargetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
            <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">Cancel Quotation</h2>
            <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">Are you sure you want to cancel this quotation? This cannot be undone.</p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="rounded border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
                onClick={() => setCancelTargetId(null)}
              >
                Keep
              </button>
              <button
                type="button"
                disabled={cancelMutation.isPending}
                className="rounded bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-50"
                onClick={() => cancelMutation.mutate(cancelTargetId)}
              >
                {cancelMutation.isPending ? 'Cancelling…' : 'Cancel Quotation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};
