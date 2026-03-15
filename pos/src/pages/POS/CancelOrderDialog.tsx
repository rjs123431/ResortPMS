import { useEffect, useState } from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { OrderCancelReasonType } from '@/types/pos.types';
import type { PosOrderListDto } from '@/types/pos.types';

const REASON_TYPE_LABELS: Record<OrderCancelReasonType, string> = {
  [OrderCancelReasonType.GuestRequest]: 'Guest request',
  [OrderCancelReasonType.WrongOrder]: 'Wrong order',
  [OrderCancelReasonType.OutOfStock]: 'Out of stock',
  [OrderCancelReasonType.Duplicate]: 'Duplicate',
  [OrderCancelReasonType.Other]: 'Other',
};

export type CancelOrderDialogProps = {
  open: boolean;
  onClose: () => void;
  order: PosOrderListDto | null;
  onConfirm: (reasonType: number, reason: string) => void;
  isPending?: boolean;
};

export const CancelOrderDialog = ({
  open,
  onClose,
  order,
  onConfirm,
  isPending = false,
}: CancelOrderDialogProps) => {
  const [reasonType, setReasonType] = useState<OrderCancelReasonType>(OrderCancelReasonType.GuestRequest);
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (open) {
      setReasonType(OrderCancelReasonType.GuestRequest);
      setReason('');
    }
  }, [open]);

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

  const handleConfirm = () => {
    onConfirm(reasonType, reason.trim());
  };

  if (!order) return null;

  return (
    <Dialog open={open} onClose={() => {}} className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 z-0 bg-black/50 pointer-events-none" aria-hidden />
      <div className="relative z-10 flex min-h-full items-start justify-center pt-6 pb-6 px-4 pointer-events-none">
        <DialogPanel className="w-full max-w-md rounded-xl bg-white shadow-xl dark:bg-gray-800 pointer-events-auto">
          <div className="border-b border-gray-100 px-5 py-4 dark:border-gray-700">
            <DialogTitle as="h2" className="text-lg font-semibold text-gray-900 dark:text-white">
              Cancel order
            </DialogTitle>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Order #{order.orderNumber}. This cannot be undone.
            </p>
          </div>
          <div className="space-y-4 px-5 py-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Reason type
              </label>
              <select
                value={reasonType}
                onChange={(e) => setReasonType(Number(e.target.value) as OrderCancelReasonType)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                {(Object.entries(REASON_TYPE_LABELS) as unknown as [OrderCancelReasonType, string][]).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Reason <span className="font-normal text-gray-400 dark:text-gray-500">(optional)</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Additional details…"
                rows={3}
                className="w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-500"
              />
            </div>
          </div>
          <div className="flex gap-3 border-t border-gray-100 px-5 py-4 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
            >
              Keep order
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isPending}
              className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
            >
              {isPending ? 'Cancelling…' : 'Cancel order'}
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
};
