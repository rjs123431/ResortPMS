import { useEffect } from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { RoomChargeType, type ChargeTypeDto } from '@/types/resort.types';

type ChargeTypeDialogFormProps = {
  isOpen: boolean;
  editingId: string | null;
  form: ChargeTypeDto;
  canCreate: boolean;
  canEdit: boolean;
  isSaving: boolean;
  onClose: () => void;
  onFormChange: (updater: (prev: ChargeTypeDto) => ChargeTypeDto) => void;
  onSave: () => void;
};

export const ChargeTypeDialogForm = ({
  isOpen,
  editingId,
  form,
  canCreate,
  canEdit,
  isSaving,
  onClose,
  onFormChange,
  onSave,
}: ChargeTypeDialogFormProps) => {
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
        <DialogPanel className="w-full max-w-lg rounded-lg bg-white p-5 shadow-xl dark:bg-gray-800">
          <div className="mb-4 flex items-center justify-between">
            <DialogTitle as="h3" className="text-lg font-semibold">
              {editingId ? 'Edit Charge Type' : 'New Charge Type'}
            </DialogTitle>
            <button className="rounded bg-gray-200 px-2 py-1 text-sm dark:bg-gray-700" onClick={onClose}>
              Close
            </button>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Charge Type Name</label>
            <input className="w-full rounded border p-2 dark:bg-gray-700" value={form.name ?? ''} onChange={(e) => onFormChange((s) => ({ ...s, name: e.target.value }))} />
          </div>
          <div className="mt-3">
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
            <input className="w-full rounded border p-2 dark:bg-gray-700" value={form.category ?? ''} onChange={(e) => onFormChange((s) => ({ ...s, category: e.target.value }))} />
          </div>
          <div className="mt-3">
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Room Charge Type</label>
            <select
              className="w-full rounded border p-2 dark:bg-gray-700"
              value={form.roomChargeType}
              onChange={(e) => onFormChange((s) => ({ ...s, roomChargeType: Number(e.target.value) as RoomChargeType }))}
            >
              <option value={RoomChargeType.None}>None</option>
              <option value={RoomChargeType.Room}>Room</option>
              <option value={RoomChargeType.ExtraBed}>Extra Bed</option>
            </select>
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
            disabled={isSaving || !(form.name ?? '').trim() || !(form.category ?? '').trim() || (editingId ? !canEdit : !canCreate)}
            onClick={onSave}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </DialogPanel>
      </div>
    </Dialog>
  );
};
