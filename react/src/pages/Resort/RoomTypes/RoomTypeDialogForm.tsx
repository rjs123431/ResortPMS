import { useEffect } from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import type { RoomTypeDto } from '@/types/resort.types';

export type RoomTypeForm = RoomTypeDto & {
  plainDescription: string;
  bedTypeSummary: string;
  featureTagsText: string;
  amenityItemsText: string;
};

type RoomTypeDialogFormProps = {
  isOpen: boolean;
  editingId: string | null;
  form: RoomTypeForm;
  canCreate: boolean;
  canEdit: boolean;
  isSaving: boolean;
  onClose: () => void;
  onFormChange: (updater: (prev: RoomTypeForm) => RoomTypeForm) => void;
  onSave: () => void;
};

export const RoomTypeDialogForm = ({
  isOpen,
  editingId,
  form,
  canCreate,
  canEdit,
  isSaving,
  onClose,
  onFormChange,
  onSave,
}: RoomTypeDialogFormProps) => {
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
              {editingId ? 'Edit Room Type' : 'New Room Type'}
            </DialogTitle>
            <button className="rounded bg-gray-200 px-2 py-1 text-sm dark:bg-gray-700" onClick={onClose}>
              Close
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Room Type Name</label>
              <input className="w-full rounded border p-2 dark:bg-gray-700" value={form.name} onChange={(e) => onFormChange((s) => ({ ...s, name: e.target.value }))} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Base Rate Per Night</label>
              <input className="w-full rounded border p-2 dark:bg-gray-700" type="number" min={0} value={form.baseRate} onChange={(e) => onFormChange((s) => ({ ...s, baseRate: Number(e.target.value || 0) }))} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Maximum Adults</label>
              <input className="w-full rounded border p-2 dark:bg-gray-700" type="number" min={1} value={form.maxAdults} onChange={(e) => onFormChange((s) => ({ ...s, maxAdults: Number(e.target.value || 1) }))} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Maximum Children</label>
              <input className="w-full rounded border p-2 dark:bg-gray-700" type="number" min={0} value={form.maxChildren} onChange={(e) => onFormChange((s) => ({ ...s, maxChildren: Number(e.target.value || 0) }))} />
            </div>
          </div>
          <div className="mt-3">
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Bed Configuration</label>
            <input
              className="w-full rounded border p-2 dark:bg-gray-700"
              value={form.bedTypeSummary}
              onChange={(e) => onFormChange((s) => ({ ...s, bedTypeSummary: e.target.value }))}
            />
          </div>
          <div className="mt-3">
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Room Feature Tags</label>
            <textarea
              className="w-full rounded border p-2 dark:bg-gray-700"
              value={form.featureTagsText}
              onChange={(e) => onFormChange((s) => ({ ...s, featureTagsText: e.target.value }))}
            />
          </div>
          <div className="mt-3">
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Room Amenities</label>
            <textarea
              className="w-full rounded border p-2 dark:bg-gray-700"
              value={form.amenityItemsText}
              onChange={(e) => onFormChange((s) => ({ ...s, amenityItemsText: e.target.value }))}
            />
          </div>
          <div className="mt-3">
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Room Type Description</label>
            <textarea
              className="w-full rounded border p-2 dark:bg-gray-700"
              value={form.plainDescription}
              onChange={(e) => onFormChange((s) => ({ ...s, plainDescription: e.target.value }))}
            />
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
