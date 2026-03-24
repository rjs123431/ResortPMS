import { useEffect } from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import type { ExtraBedTypeDto } from '@/types/resort.types';

type ExtraBedTypeDialogFormProps = {
  isOpen: boolean;
  editingId: string | null;
  form: ExtraBedTypeDto;
  canCreate: boolean;
  canEdit: boolean;
  isSaving: boolean;
  onClose: () => void;
  onFormChange: (updater: (prev: ExtraBedTypeDto) => ExtraBedTypeDto) => void;
  onSave: () => void;
};

export const ExtraBedTypeDialogForm = ({
  isOpen,
  editingId,
  form,
  canCreate,
  canEdit,
  isSaving,
  onClose,
  onFormChange,
  onSave,
}: ExtraBedTypeDialogFormProps) => {
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
        <DialogPanel className="w-full max-w-lg rounded-lg bg-white p-5 shadow-xl dark:bg-gray-800 pointer-events-auto">
          <div className="mb-4 flex items-center justify-between">
            <DialogTitle as="h3" className="text-lg font-semibold">
              {editingId ? 'Edit Extra Bed Type' : 'New Extra Bed Type'}
            </DialogTitle>
            <button className="rounded bg-gray-200 px-2 py-1 text-sm dark:bg-gray-700" onClick={onClose}>
              Close
            </button>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Type Name</label>
            <input className="w-full rounded border p-2 dark:bg-gray-700" value={form.name} onChange={(e) => onFormChange((s) => ({ ...s, name: e.target.value }))} />
          </div>
          {editingId ? (
            <label className="mt-3 flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.isActive} onChange={(e) => onFormChange((s) => ({ ...s, isActive: e.target.checked }))} />
              Active
            </label>
          ) : null}
          <button
            type="button"
            className="mt-3 rounded bg-primary-600 px-4 py-2 text-white hover:bg-primary-700 disabled:opacity-50"
            disabled={isSaving || !form.name || (editingId ? !canEdit : !canCreate)}
            onClick={onSave}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </DialogPanel>
      </div>
    </Dialog>
  );
};
