import { useEffect } from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import type { UpdateMenuItemDto } from '@/types/pos.types';
import type { MenuCategoryListDto, OptionGroupDto, OptionGroupListDto } from '@/types/pos.types';

/** Form state: optionPriceOverrides and defaultOptionOverrides as Records for easy editing. */
export type MenuItemFormState = Omit<UpdateMenuItemDto, 'optionPriceOverrides' | 'defaultOptionOverrides'> & {
  optionPriceOverrides?: Record<string, number>;
  /** optionGroupId -> defaultOptionId (null = use group default). */
  defaultOptionOverrides?: Record<string, string | null>;
};

type MenuItemDialogFormProps = {
  isOpen: boolean;
  editingId: string | null;
  form: MenuItemFormState;
  categories: MenuCategoryListDto[];
  optionGroups: OptionGroupListDto[];
  /** Full option groups with options (for assigned groups only). Used to show per-option price overrides. */
  assignedGroupDetails: OptionGroupDto[];
  isSaving: boolean;
  onClose: () => void;
  onFormChange: (updater: (prev: MenuItemFormState) => MenuItemFormState) => void;
  onSave: () => void;
};

export const MenuItemDialogForm = ({
  isOpen,
  editingId,
  form,
  categories,
  optionGroups,
  assignedGroupDetails,
  isSaving,
  onClose,
  onFormChange,
  onSave,
}: MenuItemDialogFormProps) => {
  const assignedIds = form.assignedOptionGroupIds ?? [];
  const overrides = form.optionPriceOverrides ?? {};
  const defaultOverrides = form.defaultOptionOverrides ?? {};
  const toggleOptionGroup = (groupId: string) => {
    if (assignedIds.includes(groupId))
      onFormChange((s) => ({ ...s, assignedOptionGroupIds: assignedIds.filter((id) => id !== groupId) }));
    else
      onFormChange((s) => ({ ...s, assignedOptionGroupIds: [...assignedIds, groupId] }));
  };
  const setOptionPrice = (optionId: string, value: number) => {
    onFormChange((s) => ({
      ...s,
      optionPriceOverrides: { ...(s.optionPriceOverrides ?? {}), [optionId]: value },
    }));
  };
  const setDefaultOptionOverride = (groupId: string, optionId: string | null) => {
    onFormChange((s) => ({
      ...s,
      defaultOptionOverrides: { ...(s.defaultOptionOverrides ?? {}), [groupId]: optionId },
    }));
  };
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving || !form.name.trim() || !form.categoryId) return;
    onSave();
  };

  return (
    <Dialog open={isOpen} onClose={() => {}} className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50 pointer-events-none" aria-hidden />
      <div className="relative flex min-h-screen items-center justify-center p-4 pointer-events-none">
        <DialogPanel className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl dark:bg-gray-800 pointer-events-auto">
          <form onSubmit={handleSubmit}>
          <div className="mb-4 flex items-center justify-between">
            <DialogTitle as="h3" className="text-lg font-semibold text-gray-900 dark:text-white">
              {editingId ? 'Edit Menu Item' : 'New Menu Item'}
            </DialogTitle>
            <button type="button" className="rounded bg-gray-200 px-2 py-1 text-sm dark:bg-gray-700" onClick={onClose}>
              Close
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
              <select
                className="w-full rounded border p-2 dark:bg-gray-700 dark:border-gray-600"
                value={form.categoryId}
                onChange={(e) => onFormChange((s) => ({ ...s, categoryId: e.target.value }))}
              >
                <option value="">— Select —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
              <input
                className="w-full rounded border p-2 dark:bg-gray-700 dark:border-gray-600"
                value={form.name}
                onChange={(e) => onFormChange((s) => ({ ...s, name: e.target.value }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Price</label>
              <input
                type="number"
                step="0.01"
                min={0}
                className="w-full rounded border p-2 dark:bg-gray-700 dark:border-gray-600"
                value={form.price}
                onChange={(e) => onFormChange((s) => ({ ...s, price: parseFloat(e.target.value) || 0 }))}
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isAvailable}
                onChange={(e) => onFormChange((s) => ({ ...s, isAvailable: e.target.checked }))}
              />
              Available
            </label>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Assigned option groups
              </label>
              <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                Choose which option groups apply to this item (e.g. Sugar, Pearls). Define groups in Option Groups first.
              </p>
              <div className="max-h-32 space-y-1.5 overflow-y-auto rounded border border-gray-200 p-2 dark:border-gray-600 dark:bg-gray-700/30">
                {optionGroups.length === 0 ? (
                  <p className="text-xs text-gray-500 dark:text-gray-400">No option groups. Create them in Option Groups.</p>
                ) : (
                  optionGroups.map((g) => (
                    <label key={g.id} className="flex cursor-pointer items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={assignedIds.includes(g.id)}
                        onChange={() => toggleOptionGroup(g.id)}
                      />
                      <span className="text-gray-900 dark:text-white">{g.name}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">({g.optionCount} options)</span>
                    </label>
                  ))
                )}
              </div>
            </div>

            {assignedGroupDetails.length > 0 && (
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Option price overrides
                </label>
                <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                  Override the default price adjustment per option for this menu item. Leave as default or set a custom value.
                </p>
                <div className="max-h-48 space-y-3 overflow-y-auto rounded border border-gray-200 p-2 dark:border-gray-600 dark:bg-gray-700/30">
                  {assignedGroupDetails.map((g) => (
                    <div key={g.id} className="space-y-1.5">
                      <div className="text-xs font-medium text-gray-600 dark:text-gray-400">{g.name}</div>
                      {g.options.map((opt) => {
                        const base = opt.basePriceAdjustment ?? opt.priceAdjustment;
                        const value = overrides[opt.id] ?? base;
                        return (
                          <div key={opt.id} className="flex items-center gap-2 text-sm">
                            <span className="min-w-0 flex-1 truncate text-gray-700 dark:text-gray-300">{opt.name}</span>
                            <input
                              type="number"
                              step="0.01"
                              className="w-20 rounded border p-1.5 text-right dark:bg-gray-700 dark:border-gray-600"
                              value={value}
                              onChange={(e) => setOptionPrice(opt.id, parseFloat(e.target.value) || 0)}
                            />
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {assignedGroupDetails.length > 0 && (
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Default option (per group)
                </label>
                <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                  Override which option is selected by default when adding this item to an order. Use group default or pick one.
                </p>
                <div className="max-h-40 space-y-2 overflow-y-auto rounded border border-gray-200 p-2 dark:border-gray-600 dark:bg-gray-700/30">
                  {assignedGroupDetails.map((g) => (
                    <div key={g.id} className="flex items-center gap-2 text-sm">
                      <span className="w-24 shrink-0 text-gray-600 dark:text-gray-400">{g.name}</span>
                      <select
                        className="min-w-0 flex-1 rounded border p-1.5 dark:bg-gray-700 dark:border-gray-600"
                        value={defaultOverrides[g.id] ?? ''}
                        onChange={(e) => setDefaultOptionOverride(g.id, e.target.value === '' ? null : e.target.value)}
                      >
                        <option value="">Use group default</option>
                        {g.options.map((opt) => (
                          <option key={opt.id} value={opt.id}>{opt.name}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button type="button" className="rounded bg-gray-200 px-3 py-1.5 text-sm dark:bg-gray-700" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="rounded bg-primary-600 px-3 py-1.5 text-white hover:bg-primary-700 disabled:opacity-50"
              disabled={isSaving || !form.name.trim() || !form.categoryId}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
          </form>
        </DialogPanel>
      </div>
    </Dialog>
  );
};

export function defaultMenuItemForm(): MenuItemFormState {
  return {
    categoryId: '',
    name: '',
    price: 0,
    isAvailable: true,
    assignedOptionGroupIds: [],
    optionPriceOverrides: {},
    defaultOptionOverrides: {},
  };
}
