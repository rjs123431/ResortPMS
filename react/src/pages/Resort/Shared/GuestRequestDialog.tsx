import { useEffect, useState } from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { GuestRequestType } from '@/types/stay.types';

export const GUEST_REQUEST_TYPE_OPTIONS: Array<{ value: GuestRequestType; label: string }> = [
  { value: GuestRequestType.PickupCleaning, label: 'Pickup Cleaning' },
  { value: GuestRequestType.StayoverCleaning, label: 'Stayover Cleaning' },
  { value: GuestRequestType.ExtraTowels, label: 'Extra Towels' },
  { value: GuestRequestType.ExtraPillows, label: 'Extra Pillows' },
  { value: GuestRequestType.DrinkingWater, label: 'Drinking Water' },
  { value: GuestRequestType.Toiletries, label: 'Toiletries' },
  { value: GuestRequestType.LateCheckoutAssistance, label: 'Late Checkout Assistance' },
  { value: GuestRequestType.MaintenanceVisit, label: 'Maintenance Visit' },
  { value: GuestRequestType.Other, label: 'Other' },
];

type GuestRequestValues = {
  requestTypes: GuestRequestType[];
  description: string;
};

type GuestRequestDialogProps = {
  open: boolean;
  isSaving?: boolean;
  onClose: () => void;
  onSave: (values: GuestRequestValues) => void;
};

const defaultForm = (): GuestRequestValues => ({
  requestTypes: [],
  description: '',
});

export const GuestRequestDialog = ({ open, isSaving = false, onClose, onSave }: GuestRequestDialogProps) => {
  const [form, setForm] = useState<GuestRequestValues>(defaultForm());

  useEffect(() => {
    if (open) {
      setForm(defaultForm());
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  const toggleRequestType = (value: GuestRequestType) => {
    setForm((prev) => ({
      ...prev,
      requestTypes: prev.requestTypes.includes(value)
        ? prev.requestTypes.filter((item) => item !== value)
        : [...prev.requestTypes, value],
    }));
  };

  return (
    <Dialog open={open} onClose={() => {}} className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50 pointer-events-none" aria-hidden />
      <div className="relative flex min-h-screen items-center justify-center p-4 pointer-events-none">
        <DialogPanel className="w-full max-w-lg rounded-lg bg-white p-4 shadow-xl dark:bg-gray-800 pointer-events-auto">
          <DialogTitle as="h3" className="text-lg font-semibold text-gray-900 dark:text-white">Create Guest Request</DialogTitle>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Selecting Pickup Cleaning or Stayover Cleaning automatically creates a housekeeping task.
          </p>

          <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
            {GUEST_REQUEST_TYPE_OPTIONS.map((option) => (
              <label key={option.value} className="flex items-center gap-2 rounded border border-gray-200 px-2 py-1 text-sm dark:border-gray-600">
                <input
                  type="checkbox"
                  checked={form.requestTypes.includes(option.value)}
                  onChange={() => toggleRequestType(option.value)}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>

          <div className="mt-3">
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
              className="w-full rounded border border-gray-300 p-2 text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              placeholder="Optional notes"
            />
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onSave(form)}
              disabled={isSaving || form.requestTypes.length === 0}
              className="rounded bg-amber-600 px-3 py-2 text-sm text-white hover:bg-amber-700 disabled:opacity-50"
            >
              {isSaving ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
};
