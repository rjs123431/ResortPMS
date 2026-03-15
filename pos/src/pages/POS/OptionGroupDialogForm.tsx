import { useEffect } from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import type { OptionInputDto } from '@/types/pos.types';

export type OptionGroupFormState = {
  name: string;
  displayOrder: number;
  minSelections: number;
  maxSelections: number;
  options: OptionInputDto[];
};

type OptionGroupDialogFormProps = {
  isOpen: boolean;
  editingId: string | null;
  form: OptionGroupFormState;
  isSaving: boolean;
  onClose: () => void;
  onFormChange: (updater: (prev: OptionGroupFormState) => OptionGroupFormState) => void;
  onSave: () => void;
};

export const OptionGroupDialogForm = ({
  isOpen,
  editingId,
  form,
  isSaving,
  onClose,
  onFormChange,
  onSave,
}: OptionGroupDialogFormProps) => {
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

  const addOption = () => {
    onFormChange((s) => ({
      ...s,
      options: [...s.options, { name: '', priceAdjustment: 0, displayOrder: s.options.length, isDefault: false }],
    }));
  };

  const setDefaultOption = (index: number) => {
    onFormChange((s) => ({
      ...s,
      options: s.options.map((o, i) => ({ ...o, isDefault: i === index })),
    }));
  };

  const updateOption = (index: number, field: keyof OptionInputDto, value: string | number) => {
    onFormChange((s) => ({
      ...s,
      options: s.options.map((o, i) => (i === index ? { ...o, [field]: value } : o)),
    }));
  };

  const removeOption = (index: number) => {
    onFormChange((s) => ({
      ...s,
      options: s.options.filter((_, i) => i !== index),
    }));
  };

  return (
    <Dialog open={isOpen} onClose={() => {}} className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50 pointer-events-none" aria-hidden />
      <div className="relative flex min-h-screen items-center justify-center p-4 pointer-events-none">
        <DialogPanel className="w-full max-w-lg rounded-lg bg-white p-5 shadow-xl dark:bg-gray-800 pointer-events-auto max-h-[90vh] overflow-y-auto">
          <div className="mb-4 flex items-center justify-between">
            <DialogTitle as="h3" className="text-lg font-semibold text-gray-900 dark:text-white">
              {editingId ? 'Edit Option Group' : 'New Option Group'}
            </DialogTitle>
            <button type="button" className="rounded bg-gray-200 px-2 py-1 text-sm dark:bg-gray-700" onClick={onClose}>
              Close
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
              <input
                className="w-full rounded border p-2 dark:bg-gray-700 dark:border-gray-600"
                value={form.name}
                onChange={(e) => onFormChange((s) => ({ ...s, name: e.target.value }))}
                placeholder="e.g. Sugar, Pearls"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Display order</label>
                <input
                  type="number"
                  className="w-full rounded border p-2 dark:bg-gray-700 dark:border-gray-600"
                  value={form.displayOrder}
                  onChange={(e) => onFormChange((s) => ({ ...s, displayOrder: parseInt(e.target.value, 10) || 0 }))}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Min selections</label>
                <input
                  type="number"
                  min={0}
                  className="w-full rounded border p-2 dark:bg-gray-700 dark:border-gray-600"
                  value={form.minSelections}
                  onChange={(e) => onFormChange((s) => ({ ...s, minSelections: Math.max(0, parseInt(e.target.value, 10) || 0) }))}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Max selections</label>
                <input
                  type="number"
                  min={1}
                  className="w-full rounded border p-2 dark:bg-gray-700 dark:border-gray-600"
                  value={form.maxSelections}
                  onChange={(e) => onFormChange((s) => ({ ...s, maxSelections: Math.max(1, parseInt(e.target.value, 10) || 1) }))}
                />
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Options</label>
                <button
                  type="button"
                  className="rounded bg-primary-600 px-2 py-1 text-sm text-white hover:bg-primary-700"
                  onClick={addOption}
                >
                  Add option
                </button>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {form.options.map((opt, index) => (
                  <div
                    key={index}
                    className="flex flex-wrap items-center gap-2 rounded border border-gray-200 p-2 dark:border-gray-600 dark:bg-gray-700/30"
                  >
                    <input
                      className="min-w-0 flex-1 rounded border p-1.5 text-sm dark:bg-gray-700 dark:border-gray-600"
                      value={opt.name}
                      onChange={(e) => updateOption(index, 'name', e.target.value)}
                      placeholder="Option name"
                    />
                    <input
                      type="number"
                      step="0.01"
                      className="w-20 rounded border p-1.5 text-sm dark:bg-gray-700 dark:border-gray-600"
                      value={opt.priceAdjustment}
                      onChange={(e) => updateOption(index, 'priceAdjustment', parseFloat(e.target.value) || 0)}
                      placeholder="+0"
                      title="Price adjustment"
                    />
                    <input
                      type="number"
                      className="w-14 rounded border p-1.5 text-sm dark:bg-gray-700 dark:border-gray-600"
                      value={opt.displayOrder}
                      onChange={(e) => updateOption(index, 'displayOrder', parseInt(e.target.value, 10) || 0)}
                      title="Order"
                    />
                    <label className="flex shrink-0 items-center gap-1 text-sm text-gray-600 dark:text-gray-400" title="Selected by default (one per group)">
                      <input
                        type="radio"
                        name="default-option"
                        checked={opt.isDefault === true}
                        onChange={() => setDefaultOption(index)}
                        className="text-primary-600"
                      />
                      Default
                    </label>
                    <button
                      type="button"
                      className="rounded bg-red-100 px-2 py-1 text-sm text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
                      onClick={() => removeOption(index)}
                      aria-label="Remove option"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                {form.options.length === 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No options. Add at least one.</p>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button type="button" className="rounded bg-gray-200 px-3 py-1.5 text-sm dark:bg-gray-700" onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              className="rounded bg-primary-600 px-3 py-1.5 text-white hover:bg-primary-700 disabled:opacity-50"
              disabled={isSaving || !form.name.trim() || form.options.length === 0 || form.options.some((o) => !o.name.trim())}
              onClick={onSave}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
};

export function defaultOptionGroupForm(): OptionGroupFormState {
  return {
    name: '',
    displayOrder: 0,
    minSelections: 1,
    maxSelections: 1,
    options: [],
  };
}
