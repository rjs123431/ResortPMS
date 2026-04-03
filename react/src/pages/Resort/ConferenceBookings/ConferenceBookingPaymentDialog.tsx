import { useEffect, useState } from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import type { RecordConferenceBookingPaymentDto } from '@/types/conference.types';

type PaymentMethodOption = {
  id: string;
  name: string;
};

type ConferenceBookingPaymentDialogProps = {
  open: boolean;
  paymentMethods: PaymentMethodOption[];
  isSaving: boolean;
  onClose: () => void;
  onSave: (payment: RecordConferenceBookingPaymentDto) => void;
};

const createDefaultPayment = (): RecordConferenceBookingPaymentDto => ({
  conferenceBookingId: '',
  paymentMethodId: '',
  amount: 0,
  paidDate: toDateTimeLocalValue(new Date().toISOString()),
  referenceNo: '',
});

export function ConferenceBookingPaymentDialog({
  open,
  paymentMethods,
  isSaving,
  onClose,
  onSave,
}: ConferenceBookingPaymentDialogProps) {
  const [form, setForm] = useState<RecordConferenceBookingPaymentDto>(createDefaultPayment());

  useEffect(() => {
    if (!open) return;

    setForm(createDefaultPayment());

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
          <div className="flex items-center justify-between gap-3">
            <DialogTitle as="h3" className="text-lg font-semibold text-gray-900 dark:text-white">Add Payment</DialogTitle>
            <button type="button" className="rounded border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700" onClick={onClose}>
              Close
            </button>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="block text-sm text-gray-700 dark:text-gray-300">
              Payment Method
              <select
                className="mt-1 w-full rounded border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                value={form.paymentMethodId}
                onChange={(event) => setForm((current) => ({ ...current, paymentMethodId: event.target.value }))}
              >
                <option value="">Select payment method</option>
                {paymentMethods.map((method) => (
                  <option key={method.id} value={method.id}>{method.name}</option>
                ))}
              </select>
            </label>

            <label className="block text-sm text-gray-700 dark:text-gray-300">
              Amount
              <input
                type="number"
                min={0}
                step="0.01"
                className="mt-1 w-full rounded border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                value={Number.isFinite(form.amount) ? form.amount : 0}
                onChange={(event) => setForm((current) => ({ ...current, amount: Math.max(0, Number(event.target.value || 0)) }))}
              />
            </label>

            <label className="block text-sm text-gray-700 dark:text-gray-300">
              Paid Date
              <input
                type="datetime-local"
                className="mt-1 w-full rounded border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                value={form.paidDate}
                onChange={(event) => setForm((current) => ({ ...current, paidDate: event.target.value }))}
              />
            </label>

            <label className="block text-sm text-gray-700 dark:text-gray-300">
              Reference No
              <input
                className="mt-1 w-full rounded border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                value={form.referenceNo ?? ''}
                onChange={(event) => setForm((current) => ({ ...current, referenceNo: event.target.value }))}
              />
            </label>
          </div>

          <div className="mt-5 flex justify-end gap-2">
            <button type="button" className="rounded border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700" onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              className="rounded bg-emerald-600 px-3 py-2 text-sm text-white hover:bg-emerald-700 disabled:opacity-50"
              disabled={isSaving || !form.paymentMethodId || form.amount <= 0}
              onClick={() => onSave(form)}
            >
              {isSaving ? 'Recording...' : 'Record Payment'}
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}

function toDateTimeLocalValue(value: string) {
  const date = new Date(value);
  const timezoneOffset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16);
}