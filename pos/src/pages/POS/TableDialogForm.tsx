import { useEffect } from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import type { UpdatePosTableDto } from '@/types/pos.types';

type FormState = UpdatePosTableDto;

type TableDialogFormProps = {
  isOpen: boolean;
  editingId: string | null;
  form: FormState;
  isSaving: boolean;
  onClose: () => void;
  onFormChange: (updater: (prev: FormState) => FormState) => void;
  onSave: () => void;
};

export const TableDialogForm = ({
  isOpen,
  editingId,
  form,
  isSaving,
  onClose,
  onFormChange,
  onSave,
}: TableDialogFormProps) => {
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
              {editingId ? 'Edit Table' : 'New Table'}
            </DialogTitle>
            <button type="button" className="rounded bg-gray-200 px-2 py-1 text-sm dark:bg-gray-700" onClick={onClose}>
              Close
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Table number</label>
              <input
                className="w-full rounded border p-2 dark:bg-gray-700 dark:border-gray-600"
                value={form.tableNumber}
                onChange={(e) => onFormChange((s) => ({ ...s, tableNumber: e.target.value }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Capacity</label>
              <input
                type="number"
                min={1}
                max={99}
                className="w-full rounded border p-2 dark:bg-gray-700 dark:border-gray-600"
                value={form.capacity}
                onChange={(e) => onFormChange((s) => ({ ...s, capacity: Math.max(1, parseInt(e.target.value, 10) || 1) }))}
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button type="button" className="rounded bg-gray-200 px-3 py-1.5 text-sm dark:bg-gray-700" onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              className="rounded bg-primary-600 px-3 py-1.5 text-white hover:bg-primary-700 disabled:opacity-50"
              disabled={isSaving || !form.tableNumber.trim()}
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

export function defaultTableForm(): FormState {
  return { tableNumber: '', capacity: 2 };
}
