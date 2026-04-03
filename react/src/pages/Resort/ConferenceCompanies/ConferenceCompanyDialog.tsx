import { useEffect } from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import type { CreateConferenceCompanyDto } from '@/types/conference.types';

type ConferenceCompanyDialogProps = {
  isOpen: boolean;
  editingCompanyId: string | null;
  form: CreateConferenceCompanyDto;
  isSaving: boolean;
  onChange: (value: CreateConferenceCompanyDto) => void;
  onSubmit: () => void;
  onClose: () => void;
};

export function ConferenceCompanyDialog({
  isOpen,
  editingCompanyId,
  form,
  isSaving,
  onChange,
  onSubmit,
  onClose,
}: ConferenceCompanyDialogProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
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
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <DialogTitle as="h2" className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingCompanyId ? 'Edit Company' : 'New Company'}
              </DialogTitle>
              <p className="text-sm text-gray-500 dark:text-gray-400">Maintain company profiles and primary event contacts used during booking.</p>
            </div>
            <button type="button" className="rounded bg-gray-200 px-3 py-1.5 text-sm dark:bg-gray-700 dark:text-gray-100" onClick={onClose}>
              Close
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm text-gray-700 dark:text-gray-300 sm:col-span-2">
              Company Name
              <input className="mt-1 w-full rounded border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" value={form.name} onChange={(event) => onChange({ ...form, name: event.target.value })} />
            </label>
            <label className="block text-sm text-gray-700 dark:text-gray-300">
              Contact Person
              <input className="mt-1 w-full rounded border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" value={form.contactPerson ?? ''} onChange={(event) => onChange({ ...form, contactPerson: event.target.value })} />
            </label>
            <label className="block text-sm text-gray-700 dark:text-gray-300">
              Phone
              <input className="mt-1 w-full rounded border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" value={form.phone ?? ''} onChange={(event) => onChange({ ...form, phone: event.target.value })} />
            </label>
            <label className="block text-sm text-gray-700 dark:text-gray-300 sm:col-span-2">
              Email
              <input className="mt-1 w-full rounded border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" value={form.email ?? ''} onChange={(event) => onChange({ ...form, email: event.target.value })} />
            </label>
            <label className="block text-sm text-gray-700 dark:text-gray-300 sm:col-span-2">
              Notes
              <textarea className="mt-1 w-full rounded border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" rows={4} value={form.notes ?? ''} onChange={(event) => onChange({ ...form, notes: event.target.value })} />
            </label>
          </div>

          <label className="mt-3 flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input type="checkbox" checked={form.isActive} onChange={(event) => onChange({ ...form, isActive: event.target.checked })} />
            Company is active for booking lookup
          </label>

          <div className="mt-4 flex justify-end gap-2">
            <button type="button" className="rounded border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700" onClick={onClose}>
              Cancel
            </button>
            <button type="button" className="rounded bg-primary-600 px-4 py-2 text-sm text-white hover:bg-primary-700 disabled:opacity-50" onClick={onSubmit} disabled={isSaving || !form.name.trim()}>
              {isSaving ? 'Saving...' : editingCompanyId ? 'Update Company' : 'Create Company'}
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}