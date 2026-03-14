import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { resortService } from '@services/resort.service';
import { PreCheckInStatus } from '@/types/resort.types';

const formatMoney = (value: number) =>
  Math.round(value * 100) / 100
    .toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

type LoadPreCheckInDialogProps = {
  open: boolean;
  walkInOnly?: boolean;
  onSelect: (preCheckInId: string) => void;
  onClose: () => void;
};

export const LoadPreCheckInDialog = ({
  open,
  walkInOnly = false,
  onSelect,
  onClose,
}: LoadPreCheckInDialogProps) => {
  const { data: preCheckInsData, isLoading } = useQuery({
    queryKey: ['resort-precheckins-pending', walkInOnly],
    queryFn: () =>
      resortService.getPreCheckIns({
        status: PreCheckInStatus.Pending,
        walkInOnly: walkInOnly || undefined,
        maxResultCount: 100,
      }),
    enabled: open,
    staleTime: 30 * 1000,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });

  const items = preCheckInsData?.items ?? [];

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  return (
    <Dialog open={open} onClose={() => {}} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-2xl rounded-lg bg-white p-5 shadow-xl dark:bg-gray-800">
          <div className="mb-4 flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-white">
              Load Pre-Check-In
            </DialogTitle>
            <button
              type="button"
              className="rounded bg-gray-200 px-2 py-1 text-sm dark:bg-gray-700"
              onClick={onClose}
            >
              Close
            </button>
          </div>

          {isLoading ? (
            <p className="text-sm text-gray-500">Loading pre-check-ins...</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-gray-500">No pending pre-check-ins found.</p>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b text-left dark:border-gray-700">
                    <th className="p-2">Pre-Check-In No.</th>
                    <th className="p-2">Guest</th>
                    <th className="p-2">Dates</th>
                    <th className="p-2 text-right">Total</th>
                    {!walkInOnly && <th className="p-2">Type</th>}
                    <th className="p-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((preCheckIn) => (
                    <tr
                      key={preCheckIn.id}
                      className="border-b hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/50"
                    >
                      <td className="p-2 font-medium">{preCheckIn.preCheckInNo}</td>
                      <td className="p-2">{preCheckIn.guestName || '-'}</td>
                      <td className="p-2">
                        {preCheckIn.arrivalDate.split('T')[0]} - {preCheckIn.departureDate.split('T')[0]}
                      </td>
                      <td className="p-2 text-right tabular-nums">{formatMoney(preCheckIn.totalAmount)}</td>
                      {!walkInOnly && (
                        <td className="p-2">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                              preCheckIn.isFromReservation
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                            }`}
                          >
                            {preCheckIn.isFromReservation ? 'Reservation' : 'Walk-In'}
                          </span>
                        </td>
                      )}
                      <td className="p-2">
                        <button
                          type="button"
                          className="rounded bg-primary-600 px-3 py-1 text-xs text-white hover:bg-primary-700"
                          onClick={() => onSelect(preCheckIn.id)}
                        >
                          Load
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </DialogPanel>
      </div>
    </Dialog>
  );
};
