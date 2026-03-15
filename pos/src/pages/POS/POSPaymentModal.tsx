import { useEffect } from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';

export type PaymentMethodOption = { id: string; name: string };

export type POSPaymentModalProps = {
  open: boolean;
  onClose: () => void;
  paymentMethodId: string;
  setPaymentMethodId: (id: string) => void;
  paymentAmount: string;
  setPaymentAmount: (value: string) => void;
  referenceNo: string;
  setReferenceNo: (value: string) => void;
  paymentMethods: PaymentMethodOption[];
  onAddPayment: () => void;
  isPending: boolean;
};

export const POSPaymentModal = ({
  open,
  onClose,
  paymentMethodId,
  setPaymentMethodId,
  paymentAmount,
  setPaymentAmount,
  referenceNo,
  setReferenceNo,
  paymentMethods,
  onAddPayment,
  isPending,
}: POSPaymentModalProps) => {
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
    <Dialog open={open} onClose={() => {}} className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 z-0 bg-black/50 pointer-events-none" aria-hidden />
      <div className="relative z-10 flex min-h-full items-start justify-center pt-6 pb-6 px-4 pointer-events-none">
        <DialogPanel className="w-full max-w-sm rounded-lg bg-white p-4 shadow-xl dark:bg-gray-800 pointer-events-auto">
          <DialogTitle as="h3" className="text-lg font-semibold text-gray-900 dark:text-white">
            Settle
          </DialogTitle>
          <div className="mt-3 space-y-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Payment Method</label>
              <select
                value={paymentMethodId}
                onChange={(e) => setPaymentMethodId(e.target.value)}
                className="mt-1 w-full rounded border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Select</option>
                {paymentMethods.map((pm) => (
                  <option key={pm.id} value={pm.id}>
                    {pm.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Amount</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                className="mt-1 w-full rounded border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Reference No</label>
              <input
                type="text"
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
                placeholder="e.g. cheque no, card last 4"
                maxLength={64}
                className="mt-1 w-full rounded border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded border border-gray-300 px-3 py-1.5 dark:border-gray-600"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onAddPayment}
              disabled={!paymentMethodId || Number(paymentAmount) <= 0 || isPending}
              className="rounded bg-indigo-600 px-3 py-1.5 text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              Settle
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
};
