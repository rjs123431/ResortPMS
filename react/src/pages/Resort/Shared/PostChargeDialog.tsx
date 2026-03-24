import { useEffect, useState } from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';

type ChargeTypeOption = {
  id: string;
  name: string;
};

type PostChargeValues = {
  chargeTypeId: string;
  amount: number;
  description: string;
};

type PostChargeDialogProps = {
  open: boolean;
  chargeTypes: ChargeTypeOption[];
  initialValues?: Partial<PostChargeValues>;
  isSaving?: boolean;
  onClose: () => void;
  onSave: (values: PostChargeValues) => void;
};

const defaultForm = (): PostChargeValues => ({
  chargeTypeId: '',
  amount: 0,
  description: '',
});

export const PostChargeDialog = ({
  open,
  chargeTypes,
  initialValues,
  isSaving = false,
  onClose,
  onSave,
}: PostChargeDialogProps) => {
  const [form, setForm] = useState<PostChargeValues>(defaultForm());

  useEffect(() => {
    if (open) {
      setForm({
        ...defaultForm(),
        ...initialValues,
        amount: initialValues?.amount ?? 0,
      });
    }
  }, [open, initialValues]);

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
          <DialogTitle as="h3" className="text-lg font-semibold text-gray-900 dark:text-white">Post Charge</DialogTitle>
          <div className="mt-3 space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Charge Type</label>
              <select
                value={form.chargeTypeId}
                onChange={(e) => setForm((s) => ({ ...s, chargeTypeId: e.target.value }))}
                className="w-full rounded border border-gray-300 p-2 text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              >
                <option value="">Select charge type</option>
                {chargeTypes.map((chargeType) => (
                  <option key={chargeType.id} value={chargeType.id}>{chargeType.name}</option>
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
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
                className="w-full rounded border border-gray-300 p-2 text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                placeholder="Optional notes"
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
              disabled={isSaving || !form.chargeTypeId || !form.amount}
              className="rounded bg-primary-600 px-3 py-2 text-sm text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {isSaving ? 'Posting...' : 'Post Charge'}
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
};
