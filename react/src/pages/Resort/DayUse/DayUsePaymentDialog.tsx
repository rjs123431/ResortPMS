import { useEffect } from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';

type PaymentMethodOption = {
  id: string;
  name: string;
};

export type DayUsePaymentEntry = {
  id: string;
  paymentMethodId: string;
  amount: string;
  referenceNo: string;
};

type DayUsePaymentDialogProps = {
  open: boolean;
  paymentMethods: PaymentMethodOption[];
  payment: DayUsePaymentEntry;
  isSaveDisabled: boolean;
  onClose: () => void;
  onSave: () => void;
  onPaymentChange: (field: 'paymentMethodId' | 'amount' | 'referenceNo', value: string) => void;
};

export const DayUsePaymentDialog = ({
  open,
  paymentMethods,
  payment,
  isSaveDisabled,
  onClose,
  onSave,
  onPaymentChange,
}: DayUsePaymentDialogProps) => {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  return (
    <Dialog open={open} onClose={() => {}} className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50 pointer-events-none" aria-hidden />
      <div className="relative flex min-h-screen items-center justify-center p-4 pointer-events-none">
        <DialogPanel className="w-full max-w-lg rounded-lg bg-white p-5 shadow-xl dark:bg-gray-800 pointer-events-auto">
          <div className="mb-4 flex items-center justify-between">
            <DialogTitle as="h3" className="text-lg font-semibold text-gray-900 dark:text-white">Payment</DialogTitle>
            <button className="rounded bg-gray-200 px-2 py-1 text-sm dark:bg-gray-700" onClick={onClose}>
              Close
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Payment Method</label>
              <select value={payment.paymentMethodId} onChange={(e) => onPaymentChange('paymentMethodId', e.target.value)} className="w-full rounded border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100">
                <option value="">Select payment method</option>
                {paymentMethods.map((paymentMethod) => (
                  <option key={paymentMethod.id} value={paymentMethod.id}>{paymentMethod.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Amount Received</label>
              <input type="number" min={0} value={payment.amount} onChange={(e) => onPaymentChange('amount', e.target.value)} className="w-full rounded border border-gray-300 p-2 text-right dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Reference No.</label>
              <input value={payment.referenceNo} onChange={(e) => onPaymentChange('referenceNo', e.target.value)} className="w-full rounded border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100" />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="rounded border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700" onClick={onClose}>
                Close
              </button>
              <button type="button" className="rounded bg-primary-600 px-4 py-2 text-white hover:bg-primary-700 disabled:opacity-50" disabled={isSaveDisabled} onClick={onSave}>
                Okay
              </button>
            </div>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
};