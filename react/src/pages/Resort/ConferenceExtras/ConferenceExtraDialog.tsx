import { useEffect } from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import type { CreateConferenceExtraDto } from '@/types/conference.types';

type ConferenceExtraDialogProps = {
  isOpen: boolean;
  editingExtraId: string | null;
  form: CreateConferenceExtraDto;
  isSaving: boolean;
  onChange: (value: CreateConferenceExtraDto) => void;
  onSubmit: () => void;
  onClose: () => void;
};

export function ConferenceExtraDialog({
  isOpen,
  editingExtraId,
  form,
  isSaving,
  onChange,
  onSubmit,
  onClose,
}: ConferenceExtraDialogProps) {
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
        <DialogPanel className="pointer-events-auto w-full max-w-3xl rounded-lg bg-white p-5 shadow-xl dark:bg-gray-800">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <DialogTitle as="h2" className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingExtraId ? 'Edit Add-On Service' : 'New Add-On Service'}
              </DialogTitle>
              <p className="text-sm text-gray-500 dark:text-gray-400">Set up reusable conference add-on services and their default selling prices.</p>
            </div>
            <button type="button" className="rounded bg-gray-200 px-3 py-1.5 text-sm dark:bg-gray-700 dark:text-gray-100" onClick={onClose}>
              Close
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm text-gray-700 dark:text-gray-300">
              Code
              <input className="mt-1 w-full rounded border border-gray-300 p-2 uppercase dark:border-gray-600 dark:bg-gray-700 dark:text-white" value={form.code} onChange={(event) => onChange({ ...form, code: event.target.value.toUpperCase() })} />
            </label>
            <label className="block text-sm text-gray-700 dark:text-gray-300">
              Service Name
              <input className="mt-1 w-full rounded border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" value={form.name} onChange={(event) => onChange({ ...form, name: event.target.value })} />
            </label>
            <label className="block text-sm text-gray-700 dark:text-gray-300">
              Category
              <input className="mt-1 w-full rounded border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" value={form.category ?? ''} onChange={(event) => onChange({ ...form, category: event.target.value })} />
            </label>
            <label className="block text-sm text-gray-700 dark:text-gray-300">
              Unit Label
              <input className="mt-1 w-full rounded border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" value={form.unitLabel ?? ''} onChange={(event) => onChange({ ...form, unitLabel: event.target.value })} placeholder="per pax, per event, per unit" />
            </label>
            <label className="block text-sm text-gray-700 dark:text-gray-300">
              Default Price
              <input type="number" min={0} step="0.01" className="mt-1 w-full rounded border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" value={Number.isFinite(form.defaultPrice) ? form.defaultPrice : 0} onChange={(event) => onChange({ ...form, defaultPrice: Number(event.target.value) })} />
            </label>
            <label className="block text-sm text-gray-700 dark:text-gray-300">
              Sort Order
              <input type="number" step="1" className="mt-1 w-full rounded border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" value={Number.isFinite(form.sortOrder) ? form.sortOrder : 0} onChange={(event) => onChange({ ...form, sortOrder: Number(event.target.value) })} />
            </label>
          </div>

          <label className="mt-3 flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input type="checkbox" checked={form.isActive} onChange={(event) => onChange({ ...form, isActive: event.target.checked })} />
            Service is active for booking lookup
          </label>

          <div className="mt-4 flex justify-end gap-2">
            <button type="button" className="rounded border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700" onClick={onClose}>
              Cancel
            </button>
            <button type="button" className="rounded bg-primary-600 px-4 py-2 text-sm text-white hover:bg-primary-700 disabled:opacity-50" onClick={onSubmit} disabled={isSaving || !form.code.trim() || !form.name.trim()}>
              {isSaving ? 'Saving...' : editingExtraId ? 'Update Service' : 'Create Service'}
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}