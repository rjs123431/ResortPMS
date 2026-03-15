import { useEffect } from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import type { PosOutletDto, CreatePosOutletDto } from '@/types/pos.types';
import { RoomServiceChargeType, ServiceChargeType } from '@/types/pos.types';

type FormState = CreatePosOutletDto;

type OutletDialogFormProps = {
  isOpen: boolean;
  editingId: string | null;
  form: FormState;
  chargeTypeOptions: { id: string; name: string }[];
  isSaving: boolean;
  onClose: () => void;
  onFormChange: (updater: (prev: FormState) => FormState) => void;
  onSave: () => void;
};

export const OutletDialogForm = ({
  isOpen,
  editingId,
  form,
  chargeTypeOptions,
  isSaving,
  onClose,
  onFormChange,
  onSave,
}: OutletDialogFormProps) => {
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
        <DialogPanel className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl dark:bg-gray-800 pointer-events-auto">
          <div className="mb-4 flex items-center justify-between">
            <DialogTitle as="h3" className="text-lg font-semibold text-gray-900 dark:text-white">
              {editingId ? 'Edit Outlet' : 'New Outlet'}
            </DialogTitle>
            <button type="button" className="rounded bg-gray-200 px-2 py-1 text-sm dark:bg-gray-700" onClick={onClose}>
              Close
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
              <input
                className="w-full rounded border p-2 dark:bg-gray-700 dark:border-gray-600"
                value={form.name}
                onChange={(e) => onFormChange((s) => ({ ...s, name: e.target.value }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Location</label>
              <input
                className="w-full rounded border p-2 dark:bg-gray-700 dark:border-gray-600"
                value={form.location}
                onChange={(e) => onFormChange((s) => ({ ...s, location: e.target.value }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Charge type (for Room Charge)</label>
              <select
                className="w-full rounded border p-2 dark:bg-gray-700 dark:border-gray-600"
                value={form.chargeTypeId ?? ''}
                onChange={(e) => onFormChange((s) => ({ ...s, chargeTypeId: e.target.value || null }))}
              >
                <option value="">— None —</option>
                {chargeTypeOptions.map((ct) => (
                  <option key={ct.id} value={ct.id}>{ct.name}</option>
                ))}
              </select>
            </div>

            <div className="border-t border-gray-200 pt-3 dark:border-gray-700">
              <div className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Room service charge</div>
              <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">Applied only when order type is Room Service.</p>
              <div className="space-y-2">
                <div>
                  <label className="mb-1 block text-xs text-gray-600 dark:text-gray-400">Type</label>
                  <select
                    className="w-full rounded border p-2 dark:bg-gray-700 dark:border-gray-600"
                    value={form.roomServiceChargeType}
                    onChange={(e) => onFormChange((s) => ({ ...s, roomServiceChargeType: Number(e.target.value) }))}
                  >
                    <option value={RoomServiceChargeType.None}>None</option>
                    <option value={RoomServiceChargeType.Percent}>Percent</option>
                    <option value={RoomServiceChargeType.FixedAmount}>Fixed amount</option>
                  </select>
                </div>
                {form.roomServiceChargeType === RoomServiceChargeType.Percent && (
                  <div>
                    <label className="mb-1 block text-xs text-gray-600 dark:text-gray-400">Percent (%)</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step={0.01}
                      className="w-full rounded border p-2 dark:bg-gray-700 dark:border-gray-600"
                      value={form.roomServiceChargePercent}
                      onChange={(e) => onFormChange((s) => ({ ...s, roomServiceChargePercent: Number(e.target.value) || 0 }))}
                    />
                  </div>
                )}
                {form.roomServiceChargeType === RoomServiceChargeType.FixedAmount && (
                  <div>
                    <label className="mb-1 block text-xs text-gray-600 dark:text-gray-400">Amount</label>
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      className="w-full rounded border p-2 dark:bg-gray-700 dark:border-gray-600"
                      value={form.roomServiceChargeAmount}
                      onChange={(e) => onFormChange((s) => ({ ...s, roomServiceChargeAmount: Number(e.target.value) || 0 }))}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-gray-200 pt-3 dark:border-gray-700">
              <div className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Service charge</div>
              <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">Applied to all orders from this outlet.</p>
              <div className="space-y-2">
                <div>
                  <label className="mb-1 block text-xs text-gray-600 dark:text-gray-400">Type</label>
                  <select
                    className="w-full rounded border p-2 dark:bg-gray-700 dark:border-gray-600"
                    value={form.serviceChargeType}
                    onChange={(e) => onFormChange((s) => ({ ...s, serviceChargeType: Number(e.target.value) }))}
                  >
                    <option value={ServiceChargeType.None}>None</option>
                    <option value={ServiceChargeType.Percent}>Percent</option>
                    <option value={ServiceChargeType.FixedAmount}>Fixed amount</option>
                  </select>
                </div>
                {form.serviceChargeType === ServiceChargeType.Percent && (
                  <div>
                    <label className="mb-1 block text-xs text-gray-600 dark:text-gray-400">Percent (%)</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step={0.01}
                      className="w-full rounded border p-2 dark:bg-gray-700 dark:border-gray-600"
                      value={form.serviceChargePercent}
                      onChange={(e) => onFormChange((s) => ({ ...s, serviceChargePercent: Number(e.target.value) || 0 }))}
                    />
                  </div>
                )}
                {form.serviceChargeType === ServiceChargeType.FixedAmount && (
                  <div>
                    <label className="mb-1 block text-xs text-gray-600 dark:text-gray-400">Amount</label>
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      className="w-full rounded border p-2 dark:bg-gray-700 dark:border-gray-600"
                      value={form.serviceChargeFixedAmount}
                      onChange={(e) => onFormChange((s) => ({ ...s, serviceChargeFixedAmount: Number(e.target.value) || 0 }))}
                    />
                  </div>
                )}
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.hasKitchen}
                onChange={(e) => onFormChange((s) => ({ ...s, hasKitchen: e.target.checked }))}
              />
              Has kitchen (send to kitchen)
            </label>
            {editingId ? (
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => onFormChange((s) => ({ ...s, isActive: e.target.checked }))}
                />
                Active
              </label>
            ) : null}
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button type="button" className="rounded bg-gray-200 px-3 py-1.5 text-sm dark:bg-gray-700" onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              className="rounded bg-primary-600 px-3 py-1.5 text-white hover:bg-primary-700 disabled:opacity-50"
              disabled={isSaving || !form.name.trim()}
              onClick={onSave}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
};

export function defaultOutletForm(): FormState {
  return {
    name: '',
    location: '',
    isActive: true,
    hasKitchen: false,
    chargeTypeId: null,
    roomServiceChargeType: RoomServiceChargeType.None,
    roomServiceChargePercent: 0,
    roomServiceChargeAmount: 0,
    serviceChargeType: ServiceChargeType.None,
    serviceChargePercent: 0,
    serviceChargeFixedAmount: 0,
  };
}

export function outletToForm(d: PosOutletDto): FormState {
  return {
    name: d.name,
    location: d.location,
    isActive: d.isActive,
    hasKitchen: d.hasKitchen,
    chargeTypeId: d.chargeTypeId ?? null,
    roomServiceChargeType: d.roomServiceChargeType ?? RoomServiceChargeType.None,
    roomServiceChargePercent: d.roomServiceChargePercent ?? 0,
    roomServiceChargeAmount: d.roomServiceChargeAmount ?? 0,
    serviceChargeType: d.serviceChargeType ?? ServiceChargeType.None,
    serviceChargePercent: d.serviceChargePercent ?? 0,
    serviceChargeFixedAmount: d.serviceChargeFixedAmount ?? 0,
  };
}
