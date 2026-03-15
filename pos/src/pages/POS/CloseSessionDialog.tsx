import { useState } from 'react';
import { Dialog, DialogPanel } from '@headlessui/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { posService } from '@services/pos.service';
import { invalidatePosQueries, posKeys } from '@/lib/posQueries';
import type { PosSessionListDto } from '@/types/pos.types';
import { notifySuccess, notifyError } from '@/utils/alerts';

const formatMoney = (value: number) =>
  value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

type Props = {
  open: boolean;
  onClose: () => void;
  session: PosSessionListDto;
  onSuccess: () => void;
};

export function CloseSessionDialog({ open, onClose, session, onSuccess }: Props) {
  const queryClient = useQueryClient();
  const [closingCash, setClosingCash] = useState<string>('');

  const closeMutation = useMutation({
    mutationFn: (cash: number) =>
      posService.closePosSession({ sessionId: session.id, closingCash: cash }),
    onSuccess: () => {
      invalidatePosQueries(queryClient, 'session');
      void queryClient.invalidateQueries({ queryKey: posKeys.mySessions() });
      void queryClient.invalidateQueries({ queryKey: posKeys.currentSession() });
      notifySuccess('Session closed. End of shift recorded.');
      onSuccess();
      onClose();
      setClosingCash('');
    },
    onError: (err: Error) => notifyError(err.message || 'Failed to close session.'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cash = parseFloat(closingCash);
    if (Number.isNaN(cash) || cash < 0) {
      notifyError('Enter a valid closing cash amount.');
      return;
    }
    closeMutation.mutate(cash);
  };

  return (
    <Dialog open={open} onClose={() => {}} className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50 pointer-events-none" aria-hidden />
      <div className="relative flex min-h-screen items-center justify-center p-4 pointer-events-none">
        <DialogPanel className="w-full max-w-md rounded-lg bg-white p-5 shadow dark:bg-gray-800 pointer-events-auto">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Close Session (End of Shift)</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Count the cash in the drawer and enter the closing amount. This will end your current POS session.
          </p>
          <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm dark:border-gray-600 dark:bg-gray-700/50">
            <p className="font-medium text-gray-900 dark:text-white">
              {session.outletName ?? session.outletId} · {session.terminalName ?? session.terminalId}
            </p>
            <p className="mt-0.5 text-gray-500 dark:text-gray-400">
              Opening cash: ₱{formatMoney(session.openingCash)}
            </p>
          </div>
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Closing cash (amount in drawer)
              </label>
              <input
                type="number"
                min={0}
                step={0.01}
                required
                className="w-full rounded border border-gray-300 p-2.5 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                placeholder="0.00"
                value={closingCash}
                onChange={(e) => setClosingCash(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 dark:border-gray-600 dark:text-gray-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={closeMutation.isPending}
                className="rounded bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
              >
                {closeMutation.isPending ? 'Closing…' : 'Close session'}
              </button>
            </div>
          </form>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
