import { useState } from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';

/**
 * Dialog for cancelling a work order with reason
 */
export const CancelOrderDialog = ({
  open,
  onClose,
  isLoading = false,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  isLoading?: boolean;
  onConfirm: (reason: string) => void;
}) => {
  const [reason, setReason] = useState('');

  const handleConfirm = () => {
    onConfirm(reason || 'Cancelled by user');
    setReason('');
  };

  return (
    <Dialog open={open} onClose={onClose} className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50 pointer-events-none" aria-hidden />
      <div className="relative flex min-h-screen items-center justify-center p-4 pointer-events-none">
        <DialogPanel className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl dark:bg-gray-800 pointer-events-auto">
          <DialogTitle as="h3" className="text-lg font-semibold text-gray-900 dark:text-white">
            Cancel Work Order
          </DialogTitle>

          <div className="mt-4">
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Cancellation reason
            </label>
            <textarea
              rows={3}
              className="w-full rounded border p-2 text-sm dark:bg-gray-700"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Issue resolved / No longer needed"
              disabled={isLoading}
            />
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              className="rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-600"
              onClick={onClose}
              disabled={isLoading}
            >
              Keep Order
            </button>
            <button
              type="button"
              className="rounded bg-red-600 px-3 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-50"
              onClick={handleConfirm}
              disabled={isLoading}
            >
              {isLoading ? 'Cancelling...' : 'Cancel Order'}
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
};
