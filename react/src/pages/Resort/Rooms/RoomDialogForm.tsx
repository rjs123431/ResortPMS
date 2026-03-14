import { useEffect } from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { RoomOperationalStatus, HousekeepingStatus } from '@/types/resort.types';
import type { RoomDto } from '@/types/resort.types';

type RoomTypeOption = {
  id: string;
  name: string;
};

type RoomDialogFormProps = {
  isOpen: boolean;
  editingId: string | null;
  form: RoomDto;
  roomTypes: RoomTypeOption[];
  canCreate: boolean;
  canEdit: boolean;
  isSaving: boolean;
  onClose: () => void;
  onFormChange: (updater: (prev: RoomDto) => RoomDto) => void;
  onSave: () => void;
};

export const RoomDialogForm = ({
  isOpen,
  editingId,
  form,
  roomTypes,
  canCreate,
  canEdit,
  isSaving,
  onClose,
  onFormChange,
  onSave,
}: RoomDialogFormProps) => {
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
            {editingId ? 'Edit Room' : 'New Room'}
          </DialogTitle>
          <button className="rounded bg-gray-200 px-2 py-1 text-sm dark:bg-gray-700" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Room Number</label>
            <input
              className="w-full rounded border p-2 dark:bg-gray-700"
              value={form.roomNumber}
              onChange={(e) => onFormChange((s) => ({ ...s, roomNumber: e.target.value }))}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Room Type</label>
            <select
              className="w-full rounded border p-2 dark:bg-gray-700"
              value={form.roomTypeId}
              onChange={(e) => onFormChange((s) => ({ ...s, roomTypeId: e.target.value }))}
            >
              <option value="">Select room type</option>
              {roomTypes.map((rt) => (
                <option key={rt.id} value={rt.id}>
                  {rt.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Floor</label>
            <input
              className="w-full rounded border p-2 dark:bg-gray-700"
              value={form.floor ?? ''}
              onChange={(e) => onFormChange((s) => ({ ...s, floor: e.target.value }))}
            />
          </div>
          {!editingId && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Operational Status</label>
              <select
                className="w-full rounded border p-2 dark:bg-gray-700"
                value={form.operationalStatus}
                onChange={(e) => onFormChange((s) => ({ ...s, operationalStatus: Number(e.target.value) as RoomOperationalStatus }))}
              >
                {Object.keys(RoomOperationalStatus)
                  .filter((k) => Number.isNaN(Number(k)))
                  .map((key) => (
                    <option key={key} value={RoomOperationalStatus[key as keyof typeof RoomOperationalStatus]}>
                      {key}
                    </option>
                  ))}
              </select>
            </div>
          )}
          {/* Hide Housekeeping Status on edit and create */}
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
          disabled={isSaving || !form.roomNumber || !form.roomTypeId || (editingId ? !canEdit : !canCreate)}
          onClick={onSave}
        >
          {isSaving ? 'Saving...' : 'Save'}
        </button>
        </DialogPanel>
      </div>
    </Dialog>
  );
};
