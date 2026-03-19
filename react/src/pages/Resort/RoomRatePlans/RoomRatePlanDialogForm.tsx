import React, { useEffect } from 'react';
import { Dialog, DialogPanel } from '@headlessui/react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import type { CreateRoomRatePlanDto, RoomTypeListDto, RatePlanDateOverrideDto } from '@/types/resort.types';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const parseDateOnly = (value: string) => {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const formatDateLocal = (d: Date) => {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

type FormState = CreateRoomRatePlanDto & { id?: string };

interface RoomRatePlanDialogFormProps {
  isOpen: boolean;
  isEditing: boolean;
  form: FormState;
  roomTypes: RoomTypeListDto[];
  canSave: boolean;
  isSaving: boolean;
  onClose: () => void;
  onFormChange: (updater: (prev: FormState) => FormState) => void;
  onSave: () => void;
}

export const RoomRatePlanDialogForm: React.FC<RoomRatePlanDialogFormProps> = ({
  isOpen,
  isEditing,
  form,
  roomTypes,
  canSave,
  isSaving,
  onClose,
  onFormChange,
  onSave,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const addDateOverride = () => {
    onFormChange((prev) => ({
      ...prev,
      dateOverrides: [
        ...prev.dateOverrides,
        { roomRatePlanId: prev.id ?? '00000000-0000-0000-0000-000000000000', rateDate: new Date().toISOString().slice(0, 10), overridePrice: 0, description: '' },
      ],
    }));
  };

  const removeDateOverride = (index: number) => {
    onFormChange((prev) => ({
      ...prev,
      dateOverrides: prev.dateOverrides.filter((_, i) => i !== index),
    }));
  };

  const updateDateOverride = (index: number, field: keyof RatePlanDateOverrideDto, value: string | number) => {
    onFormChange((prev) => {
      const next = [...prev.dateOverrides];
      next[index] = { ...next[index], [field]: value };
      return { ...prev, dateOverrides: next };
    });
  };

  const setDayRate = (dayIndex: number, basePrice: number) => {
    onFormChange((prev) => {
      const next = [...prev.dayRates];
      if (next[dayIndex]) next[dayIndex] = { ...next[dayIndex], basePrice };
      return { ...prev, dayRates: next };
    });
  };

  return (
    <Dialog open={isOpen} onClose={() => {}} className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50 pointer-events-none" aria-hidden />
      <div className="relative flex min-h-screen items-center justify-center p-4 pointer-events-none">
        <DialogPanel className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800 pointer-events-auto">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{isEditing ? 'Edit Rate Plan' : 'New Rate Plan'}</h2>

          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Room Type *</label>
                <select
                  className="w-full rounded border p-2 dark:bg-gray-700"
                  value={form.roomTypeId}
                  onChange={(e) => onFormChange((p) => ({ ...p, roomTypeId: e.target.value }))}
                  required
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
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Code *</label>
                <input
                  className="w-full rounded border p-2 dark:bg-gray-700"
                  value={form.code}
                  onChange={(e) => onFormChange((p) => ({ ...p, code: e.target.value }))}
                  placeholder="e.g. BAR"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Name *</label>
              <input
                className="w-full rounded border p-2 dark:bg-gray-700"
                value={form.name}
                onChange={(e) => onFormChange((p) => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Best Available Rate"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Start Date *</label>
                <DatePicker
                  selected={form.startDate ? parseDateOnly(form.startDate.slice(0, 10)) : null}
                  onChange={(date: Date | null) => onFormChange((p) => ({ ...p, startDate: date ? formatDateLocal(date) : '' }))}
                  dateFormat="MMM d, yyyy"
                  className="w-full rounded border p-2 dark:bg-gray-700"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">End Date</label>
                <DatePicker
                  selected={form.endDate ? parseDateOnly(form.endDate.slice(0, 10)) : null}
                  onChange={(date: Date | null) => onFormChange((p) => ({ ...p, endDate: date ? formatDateLocal(date) : undefined }))}
                  dateFormat="MMM d, yyyy"
                  isClearable
                  placeholderText="No end date"
                  className="w-full rounded border p-2 dark:bg-gray-700"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Priority</label>
                <input
                  type="number"
                  className="w-full rounded border p-2 dark:bg-gray-700"
                  value={form.priority}
                  onChange={(e) => onFormChange((p) => ({ ...p, priority: Number(e.target.value) || 0 }))}
                />
              </div>
              <div className="flex items-end gap-2">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={form.isDefault} onChange={(e) => onFormChange((p) => ({ ...p, isDefault: e.target.checked }))} />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Default</span>
                </label>
              </div>
              <div className="flex items-end gap-2">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={form.isActive} onChange={(e) => onFormChange((p) => ({ ...p, isActive: e.target.checked }))} />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Active</span>
                </label>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">Day-of-week base price</h3>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {DAY_NAMES.map((label, i) => (
                  <div key={i}>
                    <label className="mb-0.5 block text-xs text-gray-600 dark:text-gray-400">{label}</label>
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      className="w-full rounded border p-2 text-sm dark:bg-gray-700"
                      value={form.dayRates[i]?.basePrice ?? 0}
                      onChange={(e) => setDayRate(i, Number(e.target.value) || 0)}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-800 dark:text-gray-200">Date overrides</h3>
                <button type="button" className="rounded bg-slate-600 px-2 py-1 text-sm text-white" onClick={addDateOverride}>
                  Add override
                </button>
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {form.dateOverrides.map((ov, idx) => (
                  <div key={idx} className="flex flex-wrap items-center gap-2 rounded border p-2 dark:border-gray-600">
                    <DatePicker
                      selected={ov.rateDate ? parseDateOnly(ov.rateDate.slice(0, 10)) : null}
                      onChange={(date: Date | null) => updateDateOverride(idx, 'rateDate', date ? formatDateLocal(date) : '')}
                      dateFormat="MMM d, yyyy"
                      className="rounded border p-1.5 text-sm dark:bg-gray-700 w-36"
                    />
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      className="rounded border p-1.5 text-sm dark:bg-gray-700 w-24"
                      placeholder="Price"
                      value={ov.overridePrice}
                      onChange={(e) => updateDateOverride(idx, 'overridePrice', Number(e.target.value) || 0)}
                    />
                    <input
                      type="text"
                      className="flex-1 min-w-0 rounded border p-1.5 text-sm dark:bg-gray-700"
                      placeholder="Description"
                      value={ov.description ?? ''}
                      onChange={(e) => updateDateOverride(idx, 'description', e.target.value)}
                    />
                    <button type="button" className="rounded bg-red-600 px-2 py-1 text-sm text-white" onClick={() => removeDateOverride(idx)}>
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <button type="button" className="rounded border border-gray-300 px-4 py-2 dark:border-gray-600" onClick={onClose}>
              Cancel
            </button>
            {canSave ? (
              <button type="button" className="rounded bg-primary-600 px-4 py-2 text-white hover:bg-primary-700 disabled:opacity-50" onClick={onSave} disabled={isSaving || !form.roomTypeId || !form.code.trim() || !form.name.trim()}>
                {isSaving ? 'Saving...' : isEditing ? 'Update' : 'Create'}
              </button>
            ) : null}
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
};
