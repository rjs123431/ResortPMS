import { useEffect, useState } from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import type { ConferenceBookingAddOnDto, ConferenceExtraDto } from '@/types/conference.types';
import { formatMoney } from '@utils/helpers';

type ConferenceBookingAddOnDialogProps = {
  open: boolean;
  extraCatalog: ConferenceExtraDto[];
  onClose: () => void;
  onSave: (addOn: ConferenceBookingAddOnDto) => void;
};

type AddOnFormState = {
  extraId: string;
  name: string;
  quantity: number;
  unitPrice: number;
};

const createDefaultState = (): AddOnFormState => ({
  extraId: '',
  name: '',
  quantity: 1,
  unitPrice: 0,
});

const buildExtraLabel = (extra: ConferenceExtraDto) => (extra.unitLabel ? `${extra.name} (${extra.unitLabel})` : extra.name);

export function ConferenceBookingAddOnDialog({
  open,
  extraCatalog,
  onClose,
  onSave,
}: ConferenceBookingAddOnDialogProps) {
  const [form, setForm] = useState<AddOnFormState>(createDefaultState());

  useEffect(() => {
    if (!open) return;

    setForm(createDefaultState());

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  const lineTotal = (Number(form.quantity) || 0) * (Number(form.unitPrice) || 0);

  return (
    <Dialog open={open} onClose={() => {}} className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50 pointer-events-none" aria-hidden />
      <div className="relative flex min-h-screen items-center justify-center p-4 pointer-events-none">
        <DialogPanel className="w-full max-w-lg rounded-lg bg-white p-5 shadow-xl dark:bg-gray-800 pointer-events-auto">
          <div className="flex items-center justify-between gap-3">
            <DialogTitle as="h3" className="text-lg font-semibold text-gray-900 dark:text-white">Add Add-On Service</DialogTitle>
            <button type="button" className="rounded border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700" onClick={onClose}>
              Close
            </button>
          </div>

          <div className="mt-4 space-y-4">
            <label className="block text-sm text-gray-700 dark:text-gray-300">
              Configured Service
              <select
                className="mt-1 w-full rounded border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                value={form.extraId}
                onChange={(event) => {
                  const extraId = event.target.value;
                  const extra = extraCatalog.find((item) => item.id === extraId);

                  setForm((current) => ({
                    ...current,
                    extraId,
                    name: extra ? buildExtraLabel(extra) : current.name,
                    unitPrice: extra ? extra.defaultPrice : current.unitPrice,
                  }));
                }}
              >
                <option value="">Select from setup</option>
                {extraCatalog.map((extra) => (
                  <option key={extra.id} value={extra.id}>
                    {buildExtraLabel(extra)} - {formatMoney(extra.defaultPrice)}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm text-gray-700 dark:text-gray-300">
              Service Name
              <input
                className="mt-1 w-full rounded border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm text-gray-700 dark:text-gray-300">
                Quantity
                <input
                  type="number"
                  min={1}
                  step="1"
                  className="mt-1 w-full rounded border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  value={Number.isFinite(form.quantity) ? form.quantity : 1}
                  onChange={(event) => setForm((current) => ({ ...current, quantity: Math.max(1, Number(event.target.value || 1)) }))}
                />
              </label>

              <label className="block text-sm text-gray-700 dark:text-gray-300">
                Unit Price
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  className="mt-1 w-full rounded border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  value={Number.isFinite(form.unitPrice) ? form.unitPrice : 0}
                  onChange={(event) => setForm((current) => ({ ...current, unitPrice: Math.max(0, Number(event.target.value || 0)) }))}
                />
              </label>
            </div>

            <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900/20">
              <div className="flex items-center justify-between gap-4">
                <span className="text-gray-500 dark:text-gray-400">Line Total</span>
                <span className="font-medium text-gray-900 dark:text-white">{formatMoney(lineTotal)}</span>
              </div>
            </div>
          </div>

          <div className="mt-5 flex justify-end gap-2">
            <button type="button" className="rounded border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700" onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              className="rounded bg-primary-600 px-3 py-2 text-sm text-white hover:bg-primary-700 disabled:opacity-50"
              disabled={!form.name.trim() || form.quantity <= 0 || form.unitPrice < 0}
              onClick={() => onSave({
                name: form.name.trim(),
                quantity: Number(form.quantity) || 1,
                unitPrice: Number(form.unitPrice) || 0,
              })}
            >
              Add Add-On
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}