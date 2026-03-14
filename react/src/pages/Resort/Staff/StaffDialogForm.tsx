import { useEffect } from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import type { StaffDto } from '@/types/resort.types';

type StaffDialogFormProps = {
  isOpen: boolean;
  editingId: string | null;
  form: StaffDto;
  canCreate: boolean;
  canEdit: boolean;
  isSaving: boolean;
  onClose: () => void;
  onFormChange: (updater: (prev: StaffDto) => StaffDto) => void;
  onSave: () => void;
};

export const StaffDialogForm = ({
  isOpen,
  editingId,
  form,
  canCreate,
  canEdit,
  isSaving,
  onClose,
  onFormChange,
  onSave,
}: StaffDialogFormProps) => {
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
        <DialogPanel className="w-full max-w-2xl rounded-lg bg-white p-5 shadow-xl dark:bg-gray-800 pointer-events-auto">
          <div className="mb-4 flex items-center justify-between">
            <DialogTitle as="h3" className="text-lg font-semibold">
              {editingId ? 'Edit Staff' : 'New Staff'}
            </DialogTitle>
            <button className="rounded bg-gray-200 px-2 py-1 text-sm dark:bg-gray-700" onClick={onClose}>
              Close
            </button>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Staff Code</label>
              <input
                className="w-full rounded border p-2 dark:bg-gray-700"
                value={form.staffCode}
                onChange={(e) => onFormChange((s) => ({ ...s, staffCode: e.target.value }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
              <input
                className="w-full rounded border p-2 dark:bg-gray-700"
                value={form.fullName}
                onChange={(e) => onFormChange((s) => ({ ...s, fullName: e.target.value }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Department</label>
              <input
                className="w-full rounded border p-2 dark:bg-gray-700"
                value={form.department ?? ''}
                onChange={(e) => onFormChange((s) => ({ ...s, department: e.target.value }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Position</label>
              <input
                className="w-full rounded border p-2 dark:bg-gray-700"
                value={form.position ?? ''}
                onChange={(e) => onFormChange((s) => ({ ...s, position: e.target.value }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Phone Number</label>
              <input
                className="w-full rounded border p-2 dark:bg-gray-700"
                value={form.phoneNumber ?? ''}
                onChange={(e) => onFormChange((s) => ({ ...s, phoneNumber: e.target.value }))}
              />
            </div>
          </div>
          {editingId ? (
            <label className="mt-3 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => onFormChange((s) => ({ ...s, isActive: e.target.checked }))}
              />
              Active
            </label>
          ) : null}
          <button
            type="button"
            className="mt-3 rounded bg-primary-600 px-4 py-2 text-white hover:bg-primary-700 disabled:opacity-50"
            disabled={isSaving || !form.staffCode || !form.fullName || (editingId ? !canEdit : !canCreate)}
            onClick={onSave}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </DialogPanel>
      </div>
    </Dialog>
  );
};
