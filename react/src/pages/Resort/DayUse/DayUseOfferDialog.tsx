import { useEffect } from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import type { ChargeTypeDto } from '@/types/charge-type.types';
import {
  DayUseGuestCategory,
  DayUseGuestContext,
  DayUseOfferType,
  type DayUseOfferDto,
} from '@/types/day-use.types';

type DayUseOfferDialogProps = {
  open: boolean;
  editingId: string | null;
  form: DayUseOfferDto;
  chargeTypes: ChargeTypeDto[];
  isSaving: boolean;
  onClose: () => void;
  onFormChange: (updater: (current: DayUseOfferDto) => DayUseOfferDto) => void;
  onSave: () => void;
};

export const DayUseOfferDialog = ({
  open,
  editingId,
  form,
  chargeTypes,
  isSaving,
  onClose,
  onFormChange,
  onSave,
}: DayUseOfferDialogProps) => {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  return (
    <Dialog open={open} onClose={() => {}} className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50 pointer-events-none" aria-hidden />
      <div className="relative flex min-h-screen items-center justify-center p-4 pointer-events-none">
        <DialogPanel className="w-full max-w-2xl rounded-lg bg-white p-5 shadow-xl dark:bg-gray-800 pointer-events-auto">
          <div className="mb-4 flex items-center justify-between">
            <DialogTitle as="h3" className="text-lg font-semibold text-gray-900 dark:text-white">
              {editingId ? 'Edit Day-Use Offer' : 'New Day-Use Offer'}
            </DialogTitle>
            <button className="rounded bg-gray-200 px-2 py-1 text-sm dark:bg-gray-700" onClick={onClose}>
              Close
            </button>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Code</label>
              <input value={form.code} onChange={(e) => onFormChange((current) => ({ ...current, code: e.target.value.toUpperCase() }))} className="w-full rounded border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
              <input value={form.name} onChange={(e) => onFormChange((current) => ({ ...current, name: e.target.value }))} className="w-full rounded border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Variant</label>
              <input value={form.variantName} onChange={(e) => onFormChange((current) => ({ ...current, variantName: e.target.value }))} className="w-full rounded border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100" placeholder="Optional, e.g. Small / Big" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Offer Type</label>
              <select value={form.offerType} onChange={(e) => onFormChange((current) => ({ ...current, offerType: Number(e.target.value) as DayUseOfferType }))} className="w-full rounded border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100">
                <option value={DayUseOfferType.EntranceFee}>Entrance Fee</option>
                <option value={DayUseOfferType.Activity}>Activity</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Guest Context</label>
              <select value={form.guestContext} onChange={(e) => onFormChange((current) => ({ ...current, guestContext: Number(e.target.value) as DayUseGuestContext }))} className="w-full rounded border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100">
                <option value={DayUseGuestContext.WalkIn}>Walk-In</option>
                <option value={DayUseGuestContext.InHouse}>In-House</option>
              </select>
            </div>
            {form.offerType === DayUseOfferType.EntranceFee ? (
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Guest Category</label>
                <select value={form.guestCategory ?? DayUseGuestCategory.General} onChange={(e) => onFormChange((current) => ({ ...current, guestCategory: Number(e.target.value) as DayUseGuestCategory }))} className="w-full rounded border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100">
                  <option value={DayUseGuestCategory.General}>General</option>
                  <option value={DayUseGuestCategory.Adult}>Adult</option>
                  <option value={DayUseGuestCategory.Kid}>Kid</option>
                  <option value={DayUseGuestCategory.SeniorPwd}>Senior / PWD</option>
                  <option value={DayUseGuestCategory.ChildBelowFour}>4 and below</option>
                </select>
              </div>
            ) : (
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Duration Minutes</label>
                <input type="number" min={0} value={form.durationMinutes ?? ''} onChange={(e) => onFormChange((current) => ({ ...current, durationMinutes: e.target.value ? Number(e.target.value) : undefined }))} className="w-full rounded border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100" />
              </div>
            )}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Charge Type</label>
              <select value={form.chargeTypeId} onChange={(e) => onFormChange((current) => ({ ...current, chargeTypeId: e.target.value }))} className="w-full rounded border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100">
                <option value="">Select charge type</option>
                {chargeTypes.map((chargeType) => (
                  <option key={chargeType.id} value={chargeType.id}>{chargeType.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Amount</label>
              <input type="number" min={0} value={form.amount} onChange={(e) => onFormChange((current) => ({ ...current, amount: Number(e.target.value || 0) }))} className="w-full rounded border border-gray-300 p-2 text-right dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Sort Order</label>
              <input type="number" value={form.sortOrder} onChange={(e) => onFormChange((current) => ({ ...current, sortOrder: Number(e.target.value || 0) }))} className="w-full rounded border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100" />
            </div>
            <div className="flex items-center gap-2 pt-7">
              <input id="day-use-offer-active" type="checkbox" checked={form.isActive} onChange={(e) => onFormChange((current) => ({ ...current, isActive: e.target.checked }))} />
              <label htmlFor="day-use-offer-active" className="text-sm text-gray-700 dark:text-gray-300">Active</label>
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
              <textarea rows={3} value={form.description} onChange={(e) => onFormChange((current) => ({ ...current, description: e.target.value }))} className="w-full rounded border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100" />
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <button type="button" className="rounded bg-primary-600 px-4 py-2 text-white hover:bg-primary-700 disabled:opacity-50" disabled={isSaving || !form.code || !form.name || !form.chargeTypeId} onClick={onSave}>
              {isSaving ? 'Saving...' : editingId ? 'Update Offer' : 'Create Offer'}
            </button>
            <button type="button" className="rounded border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700" onClick={onClose}>
              Cancel
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
};