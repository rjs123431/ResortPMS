import { useEffect } from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import type { MenuItemListDto } from '@/types/pos.types';

export type PromoFormState = {
  promoName: string;
  dateFrom: string;
  dateTo: string;
  percentageDiscount: number;
  menuItemIds: string[];
};

type PromoDialogFormProps = {
  isOpen: boolean;
  form: PromoFormState;
  menuItems: MenuItemListDto[];
  isSaving: boolean;
  onClose: () => void;
  onFormChange: (updater: (prev: PromoFormState) => PromoFormState) => void;
  onSave: () => void;
};

export const PromoDialogForm = ({
  isOpen,
  form,
  menuItems,
  isSaving,
  onClose,
  onFormChange,
  onSave,
}: PromoDialogFormProps) => {
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

  const toggleMenuItem = (id: string) => {
    onFormChange((s) => ({
      ...s,
      menuItemIds: s.menuItemIds.includes(id)
        ? s.menuItemIds.filter((x) => x !== id)
        : [...s.menuItemIds, id],
    }));
  };

  const byCategory = menuItems.reduce<Record<string, MenuItemListDto[]>>((acc, m) => {
    const key = m.categoryName || 'Other';
    if (!acc[key]) acc[key] = [];
    acc[key].push(m);
    return acc;
  }, {});

  return (
    <Dialog open={isOpen} onClose={() => {}} className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50 pointer-events-none" aria-hidden />
      <div className="relative flex min-h-screen items-center justify-center p-4 pointer-events-none">
        <DialogPanel className="w-full max-w-lg rounded-lg bg-white p-5 shadow-xl dark:bg-gray-800 pointer-events-auto max-h-[90vh] overflow-y-auto">
          <div className="mb-4 flex items-center justify-between">
            <DialogTitle as="h3" className="text-lg font-semibold text-gray-900 dark:text-white">
              Promo
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
                Promo Name
              </label>
              <input
                type="text"
                required
                maxLength={128}
                value={form.promoName}
                onChange={(e) => onFormChange((s) => ({ ...s, promoName: e.target.value }))}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                placeholder="e.g. Happy Hour"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Date From
                </label>
                <input
                  type="date"
                  required
                  value={form.dateFrom}
                  onChange={(e) => onFormChange((s) => ({ ...s, dateFrom: e.target.value }))}
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Date To
                </label>
                <input
                  type="date"
                  required
                  value={form.dateTo}
                  onChange={(e) => onFormChange((s) => ({ ...s, dateTo: e.target.value }))}
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Discount (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                required
                value={form.percentageDiscount === 0 ? '' : form.percentageDiscount}
                onChange={(e) =>
                  onFormChange((s) => ({
                    ...s,
                    percentageDiscount: parseFloat(e.target.value) || 0,
                  }))
                }
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                placeholder="e.g. 10"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Percentage off the item price (0–100). Applied only within the date range.
              </p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Menu Items
              </label>
              <div className="max-h-48 overflow-y-auto rounded border border-gray-200 p-2 dark:border-gray-600">
                {Object.entries(byCategory).map(([categoryName, items]) => (
                  <div key={categoryName} className="mb-2">
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      {categoryName}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1">
                      {items.map((m) => (
                        <label key={m.id} className="flex items-center gap-1.5 text-sm">
                          <input
                            type="checkbox"
                            checked={form.menuItemIds.includes(m.id)}
                            onChange={() => toggleMenuItem(m.id)}
                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                          <span className="dark:text-gray-200">{m.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
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
                disabled={
                  isSaving ||
                  !form.promoName.trim() ||
                  !form.dateFrom ||
                  !form.dateTo ||
                  form.percentageDiscount < 0 ||
                  form.percentageDiscount > 100
                }
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

export const defaultPromoForm = (): PromoFormState => ({
  promoName: '',
  dateFrom: new Date().toISOString().slice(0, 10),
  dateTo: new Date().toISOString().slice(0, 10),
  percentageDiscount: 0,
  menuItemIds: [],
});
