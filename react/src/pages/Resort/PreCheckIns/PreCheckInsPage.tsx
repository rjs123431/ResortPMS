import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { resortService } from '@services/resort.service';
import { PreCheckInStatus } from '@/types/resort.types';
import { formatDate, formatMoney } from '@utils/helpers';

const STATUS_TABS: { label: string; value: PreCheckInStatus | undefined }[] = [
  { label: 'All', value: undefined },
  { label: 'Pending', value: PreCheckInStatus.Pending },
  { label: 'Ready', value: PreCheckInStatus.ReadyForCheckIn },
  { label: 'Checked In', value: PreCheckInStatus.CheckedIn },
  { label: 'Cancelled', value: PreCheckInStatus.Cancelled },
  { label: 'Expired', value: PreCheckInStatus.Expired },
];

const STATUS_BADGE: Record<PreCheckInStatus, { label: string; className: string }> = {
  [PreCheckInStatus.Pending]: { label: 'Pending', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  [PreCheckInStatus.ReadyForCheckIn]: { label: 'Ready', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  [PreCheckInStatus.CheckedIn]: { label: 'Checked In', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  [PreCheckInStatus.Cancelled]: { label: 'Cancelled', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  [PreCheckInStatus.Expired]: { label: 'Expired', className: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400' },
};

export const PreCheckInsPage = () => {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('');
  const [statusTab, setStatusTab] = useState<PreCheckInStatus | undefined>(undefined);

  const { data, isFetching } = useQuery({
    queryKey: ['resort-pre-check-ins', filter, statusTab],
    queryFn: () =>
      resortService.getPreCheckIns({
        filter: filter || undefined,
        status: statusTab,
        includeExpired: true,
        maxResultCount: 200,
      }),
  });

  const markReadyMutation = useMutation({
    mutationFn: (id: string) => resortService.markPreCheckInReady(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['resort-pre-check-ins'] }),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => resortService.cancelPreCheckIn(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['resort-pre-check-ins'] }),
  });

  const preCheckIns = data?.items ?? [];

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Pre Check-In</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Manage online and advance check-in requests.</p>
          </div>
        </div>

        <section className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
          {/* Filters */}
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <input
              type="text"
              className="w-full max-w-xs rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              placeholder="Search by guest or pre check-in no..."
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
                  <th className="p-3">Pre Check-In No</th>
                  <th className="p-3">Guest</th>
                  <th className="p-3">Arrival</th>
                  <th className="p-3">Departure</th>
                  <th className="p-3">Nights</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Total</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isFetching ? (
                  <tr>
                    <td colSpan={9} className="p-4 text-center text-gray-500">Loading pre check-ins…</td>
                  </tr>
                ) : preCheckIns.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-4 text-center text-gray-500">No pre check-ins found.</td>
                  </tr>
                ) : (
                  preCheckIns.map((pci) => {
                    const badge = STATUS_BADGE[pci.status];
                    const canMarkReady = pci.status === PreCheckInStatus.Pending;
                    const canCancel = pci.status === PreCheckInStatus.Pending || pci.status === PreCheckInStatus.ReadyForCheckIn;
                    return (
                      <tr key={pci.id} className="border-b hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/50">
                        <td className="p-3 font-medium">{pci.preCheckInNo}</td>
                        <td className="p-3">{pci.guestName || '—'}</td>
                        <td className="p-3">{formatDate(pci.arrivalDate)}</td>
                        <td className="p-3">{formatDate(pci.departureDate)}</td>
                        <td className="p-3">{pci.nights}</td>
                        <td className="p-3">
                          <span className="text-xs text-gray-500">{pci.isFromReservation ? 'Reservation' : 'Walk-in'}</span>
                        </td>
                        <td className="p-3">
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.className}`}>
                            {badge.label}
                          </span>
                        </td>
                        <td className="p-3 text-right">{formatMoney(pci.totalAmount)}</td>
                        <td className="p-3">
                          <div className="flex gap-1.5">
                            {canMarkReady && (
                              <button
                                type="button"
                                disabled={markReadyMutation.isPending}
                                className="rounded bg-green-600 px-2.5 py-1 text-xs text-white hover:bg-green-700 disabled:opacity-50"
                                onClick={() => markReadyMutation.mutate(pci.id)}
                              >
                                Mark Ready
                              </button>
                            )}
                            {canCancel && (
                              <button
                                type="button"
                                disabled={cancelMutation.isPending}
                                className="rounded bg-red-600 px-2.5 py-1 text-xs text-white hover:bg-red-700 disabled:opacity-50"
                                onClick={() => cancelMutation.mutate(pci.id)}
                              >
                                Cancel
                              </button>
                            )}
                            {!canMarkReady && !canCancel && (
                              <span className="text-gray-400">—</span>
                            )}
                          </div>
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
    </>
  );
};
