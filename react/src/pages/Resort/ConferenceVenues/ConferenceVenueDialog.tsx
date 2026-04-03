import { useEffect } from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import type { CreateConferenceVenueDto } from '@/types/conference.types';

type ConferenceVenueDialogProps = {
  isOpen: boolean;
  editingVenueId: string | null;
  form: CreateConferenceVenueDto;
  isSaving: boolean;
  onChange: (value: CreateConferenceVenueDto) => void;
  onSubmit: () => void;
  onClose: () => void;
};

export function ConferenceVenueDialog({
  isOpen,
  editingVenueId,
  form,
  isSaving,
  onChange,
  onSubmit,
  onClose,
}: ConferenceVenueDialogProps) {
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

  const setValue = <K extends keyof CreateConferenceVenueDto>(key: K, value: CreateConferenceVenueDto[K]) => {
    onChange({ ...form, [key]: value });
  };

  const numericFields: Array<{ key: keyof CreateConferenceVenueDto; label: string; min?: number; step?: string }> = [
    { key: 'capacity', label: 'Capacity', min: 1, step: '1' },
    { key: 'hourlyRate', label: 'Hourly Rate', min: 0, step: '0.01' },
    { key: 'halfDayRate', label: 'Half-Day Rate', min: 0, step: '0.01' },
    { key: 'fullDayRate', label: 'Full-Day Rate', min: 0, step: '0.01' },
    { key: 'setupBufferMinutes', label: 'Setup Buffer (mins)', min: 0, step: '1' },
    { key: 'teardownBufferMinutes', label: 'Teardown Buffer (mins)', min: 0, step: '1' },
  ];

  return (
    <Dialog open={isOpen} onClose={() => {}} className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50 pointer-events-none" aria-hidden />
      <div className="relative flex min-h-screen items-center justify-center p-4 pointer-events-none">
        <DialogPanel className="w-full max-w-3xl rounded-lg bg-white p-5 shadow-xl dark:bg-gray-800 pointer-events-auto">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <DialogTitle as="h2" className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingVenueId ? 'Edit Venue' : 'New Venue'}
              </DialogTitle>
              <p className="text-sm text-gray-500 dark:text-gray-400">Configure hall capacity, package pricing, and booking buffers.</p>
            </div>
            <button type="button" className="rounded bg-gray-200 px-3 py-1.5 text-sm dark:bg-gray-700 dark:text-gray-100" onClick={onClose}>
              Close
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm text-gray-700 dark:text-gray-300">
              Code
              <input className="mt-1 w-full rounded border border-gray-300 p-2 uppercase dark:border-gray-600 dark:bg-gray-700 dark:text-white" value={form.code} onChange={(event) => setValue('code', event.target.value.toUpperCase())} />
            </label>
            <label className="block text-sm text-gray-700 dark:text-gray-300">
              Category
              <input className="mt-1 w-full rounded border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" value={form.category ?? ''} onChange={(event) => setValue('category', event.target.value)} />
            </label>
            <label className="block text-sm text-gray-700 dark:text-gray-300 sm:col-span-2">
              Name
              <input className="mt-1 w-full rounded border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" value={form.name} onChange={(event) => setValue('name', event.target.value)} />
            </label>
            {numericFields.map((field) => (
              <label key={field.key} className="block text-sm text-gray-700 dark:text-gray-300">
                {field.label}
                <input
                  type="number"
                  min={field.min}
                  step={field.step}
                  className="mt-1 w-full rounded border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  value={String(form[field.key] ?? 0)}
                  onChange={(event) => setValue(field.key, Number(event.target.value) as CreateConferenceVenueDto[typeof field.key])}
                />
              </label>
            ))}
            <label className="block text-sm text-gray-700 dark:text-gray-300 sm:col-span-2">
              Description
              <textarea className="mt-1 w-full rounded border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" rows={4} value={form.description ?? ''} onChange={(event) => setValue('description', event.target.value)} />
            </label>
          </div>

          <label className="mt-3 flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input type="checkbox" checked={form.isActive} onChange={(event) => setValue('isActive', event.target.checked)} />
            Venue is active for booking
          </label>

          <div className="mt-4 flex justify-end gap-2">
            <button type="button" className="rounded border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700" onClick={onClose}>
              Cancel
            </button>
            <button type="button" className="rounded bg-primary-600 px-4 py-2 text-sm text-white hover:bg-primary-700 disabled:opacity-50" onClick={onSubmit} disabled={isSaving || !form.code.trim() || !form.name.trim()}>
              {isSaving ? 'Saving...' : editingVenueId ? 'Update Venue' : 'Create Venue'}
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}