import { useEffect, useState } from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';

type PaymentMethodOption = {
  id: string;
  name: string;
};

type PaymentFormValues = {
  amount: number;
  paymentMethodId: string;
  paidDate: string;
  referenceNo: string;
};

type AddPaymentDialogProps = {
  open: boolean;
  paymentMethods: PaymentMethodOption[];
  defaultAmount?: number;
  onClose: () => void;
  onSave: (values: PaymentFormValues) => void;
};

const formatDateLocal = (value: Date) => {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
};

const createDefaultForm = (amount: number = 0): PaymentFormValues => ({
  amount,
  paymentMethodId: '',
  paidDate: formatDateLocal(new Date()),
  referenceNo: '',
});

export const AddPaymentDialog = ({ open, paymentMethods, defaultAmount, onClose, onSave }: AddPaymentDialogProps) => {
  const [form, setForm] = useState<PaymentFormValues>(createDefaultForm(defaultAmount));

  useEffect(() => {
    if (open) {
      setForm(createDefaultForm(defaultAmount));
    }
  }, [open, defaultAmount]);

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
      <div className="fixed inset-0 bg-black/50 pointer-events-none" aria-hidden />
      <div className="relative flex min-h-screen items-center justify-center p-4 pointer-events-none">
        <DialogPanel className="w-full max-w-md rounded-lg bg-white p-4 shadow-xl dark:bg-gray-800 pointer-events-auto">
          <DialogTitle as="h3" className="text-lg font-semibold text-gray-900 dark:text-white">Add Payment</DialogTitle>
          <div className="mt-3 space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Paid Date</label>
              <input
                type="date"
                value={form.paidDate}
                onChange={(e) => setForm((s) => ({ ...s, paidDate: e.target.value }))}
                className="w-full rounded border border-gray-300 p-2 text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Payment Method</label>
              <select
                value={form.paymentMethodId}
                onChange={(e) => setForm((s) => ({ ...s, paymentMethodId: e.target.value }))}
                className="w-full rounded border border-gray-300 p-2 text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              >
                <option value="">Select payment method</option>
                {paymentMethods.map((method) => (
                  <option key={method.id} value={method.id}>{method.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Amount</label>
              <input
                type="number"
                min={0}
                value={form.amount}
                onChange={(e) => setForm((s) => ({ ...s, amount: Math.max(0, Number(e.target.value || 0)) }))}
                className="w-full rounded border border-gray-300 p-2 text-right text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Reference No.</label>
              <input
                type="text"
                value={form.referenceNo}
                onChange={(e) => setForm((s) => ({ ...s, referenceNo: e.target.value }))}
                className="w-full rounded border border-gray-300 p-2 text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onSave(form)}
              disabled={!form.amount || !form.paymentMethodId || !form.paidDate}
              className="rounded bg-primary-600 px-3 py-2 text-sm text-white hover:bg-primary-700 disabled:opacity-50"
            >
              Save
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
};
