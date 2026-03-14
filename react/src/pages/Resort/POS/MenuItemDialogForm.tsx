import { useEffect } from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import type { UpdateMenuItemDto } from '@/types/pos.types';
import type { MenuCategoryListDto } from '@/types/pos.types';

type FormState = UpdateMenuItemDto;

type MenuItemDialogFormProps = {
  isOpen: boolean;
  editingId: string | null;
  form: FormState;
  categories: MenuCategoryListDto[];
  isSaving: boolean;
  onClose: () => void;
  onFormChange: (updater: (prev: FormState) => FormState) => void;
  onSave: () => void;
};

export const MenuItemDialogForm = ({
  isOpen,
  editingId,
  form,
  categories,
  isSaving,
  onClose,
  onFormChange,
  onSave,
}: MenuItemDialogFormProps) => {
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
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button type="button" className="rounded bg-gray-200 px-3 py-1.5 text-sm dark:bg-gray-700" onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              className="rounded bg-primary-600 px-3 py-1.5 text-white hover:bg-primary-700 disabled:opacity-50"
              disabled={isSaving || !form.name.trim() || !form.categoryId}
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

export function defaultMenuItemForm(): FormState {
  return { categoryId: '', name: '', price: 0, isAvailable: true };
}
