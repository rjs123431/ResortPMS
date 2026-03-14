import { useEffect } from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import type { GuestDto } from '@/types/resort.types';

type GuestDialogFormProps = {
  isOpen: boolean;
  editingId: string | null;
  form: GuestDto;
  canCreate: boolean;
  canEdit: boolean;
  isSaving: boolean;
  onClose: () => void;
  onFormChange: (updater: (prev: GuestDto) => GuestDto) => void;
  onSave: () => void;
};

export const GuestDialogForm = ({
  isOpen,
  editingId,
  form,
  canCreate,
  canEdit,
  isSaving,
  onClose,
  onFormChange,
  onSave,
}: GuestDialogFormProps) => {
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
      <div className="fixed inset-0 bg-black/50" aria-hidden />
      <div className="flex min-h-screen items-center justify-center p-4">
        <DialogPanel className="w-full max-w-2xl rounded-lg bg-white p-5 shadow-xl dark:bg-gray-800">
          <div className="mb-4 flex items-center justify-between">
            <DialogTitle as="h3" className="text-lg font-semibold">
              {editingId ? 'Edit Guest' : 'New Guest'}
            </DialogTitle>
            <button className="rounded bg-gray-200 px-2 py-1 text-sm dark:bg-gray-700" onClick={onClose}>
              Close
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Guest Code</label>
              <input className="w-full rounded border p-2 dark:bg-gray-700" value={form.guestCode} onChange={(e) => onFormChange((s) => ({ ...s, guestCode: e.target.value }))} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">First Name</label>
              <input className="w-full rounded border p-2 dark:bg-gray-700" value={form.firstName} onChange={(e) => onFormChange((s) => ({ ...s, firstName: e.target.value }))} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Last Name</label>
              <input className="w-full rounded border p-2 dark:bg-gray-700" value={form.lastName} onChange={(e) => onFormChange((s) => ({ ...s, lastName: e.target.value }))} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
              <input className="w-full rounded border p-2 dark:bg-gray-700" value={form.email ?? ''} onChange={(e) => onFormChange((s) => ({ ...s, email: e.target.value }))} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Phone</label>
              <input className="w-full rounded border p-2 dark:bg-gray-700" value={form.phone ?? ''} onChange={(e) => onFormChange((s) => ({ ...s, phone: e.target.value }))} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Nationality</label>
              <input className="w-full rounded border p-2 dark:bg-gray-700" value={form.nationality ?? ''} onChange={(e) => onFormChange((s) => ({ ...s, nationality: e.target.value }))} />
            </div>
          </div>
          <div className="mt-3">
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Notes</label>
            <textarea className="w-full rounded border p-2 dark:bg-gray-700" value={form.notes ?? ''} onChange={(e) => onFormChange((s) => ({ ...s, notes: e.target.value }))} />
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
            disabled={isSaving || !form.guestCode || !form.firstName || !form.lastName || (editingId ? !canEdit : !canCreate)}
            onClick={onSave}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </DialogPanel>
      </div>
    </Dialog>
  );
};
