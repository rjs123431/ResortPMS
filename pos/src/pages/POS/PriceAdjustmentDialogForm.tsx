import { useEffect } from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import type { MenuItemListDto } from '@/types/pos.types';

export type PriceAdjustmentFormState = {
  menuItemId: string;
  newPrice: number;
  effectiveDate: string;
};

type PriceAdjustmentDialogFormProps = {
  isOpen: boolean;
  editingId: string | null;
  form: PriceAdjustmentFormState;
  menuItems: MenuItemListDto[];
  isSaving: boolean;
  onClose: () => void;
  onFormChange: (updater: (prev: PriceAdjustmentFormState) => PriceAdjustmentFormState) => void;
  onSave: () => void;
};

export const PriceAdjustmentDialogForm = ({
  isOpen,
  editingId,
  form,
  menuItems,
  isSaving,
  onClose,
  onFormChange,
  onSave,
}: PriceAdjustmentDialogFormProps) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <Dialog open={isOpen} onClose={() => {}} className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50 pointer-events-none" aria-hidden />
      <div className="relative flex min-h-screen items-center justify-center p-4 pointer-events-none">
        <DialogPanel className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl dark:bg-gray-800 pointer-events-auto">
          <div className="mb-4 flex items-center justify-between">
            <DialogTitle as="h3" className="text-lg font-semibold text-gray-900 dark:text-white">
              Price Adjustment
            </DialogTitle>
            <button
              type="button"
              className="rounded p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={onClose}
            >
              ✕
            </button>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onSave();
            }}
            className="space-y-4"
          >
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Menu Item
              </label>
              <select
                required
                disabled={!!editingId}
                value={form.menuItemId}
                onChange={(e) => onFormChange((s) => ({ ...s, menuItemId: e.target.value }))}
                className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white disabled:opacity-70"
              >
                <option value="">Select item</option>
                {menuItems.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.categoryName}) — {m.price}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                New Price
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={form.newPrice === 0 ? '' : form.newPrice}
                onChange={(e) =>
                  onFormChange((s) => ({ ...s, newPrice: parseFloat(e.target.value) || 0 }))
                }
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Effective Date
              </label>
              <DatePicker
                selected={form.effectiveDate ? new Date(form.effectiveDate) : null}
                onChange={(date: Date | null) => onFormChange((s) => ({ ...s, effectiveDate: date ? date.toISOString().split('T')[0] : '' }))}
                dateFormat="MM-dd-yyyy"
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                This price applies on this date and moving forward.
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                className="rounded border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving || !form.menuItemId || form.newPrice < 0 || !form.effectiveDate}
                className="rounded bg-primary-600 px-3 py-2 text-sm text-white hover:bg-primary-700 disabled:opacity-50"
              >
                {isSaving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </form>
        </DialogPanel>
      </div>
    </Dialog>
  );
};

export const defaultPriceAdjustmentForm = (): PriceAdjustmentFormState => ({
  menuItemId: '',
  newPrice: 0,
  effectiveDate: new Date().toISOString().slice(0, 10),
});
