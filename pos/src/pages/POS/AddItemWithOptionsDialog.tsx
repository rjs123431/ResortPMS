import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import type { MenuItemListDto, OptionGroupDto } from '@/types/pos.types';

const formatMoney = (value: number) =>
  value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export interface AddItemWithOptionsDialogProps {
  open: boolean;
  onClose: () => void;
  menuItem: MenuItemListDto;
  onConfirm: (quantity: number, notes: string, selectedOptionIds: string[], totalPrice: number) => void;
  isPending?: boolean;
}

export const AddItemWithOptionsDialog = ({
  open,
  onClose,
  menuItem,
  onConfirm,
  isPending = false,
}: AddItemWithOptionsDialogProps) => {
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [selectedOptionIds, setSelectedOptionIds] = useState<Record<string, string>>({}); // groupId -> optionId (single) or we support multi later

  const optionGroups = menuItem.optionGroups ?? [];

  useEffect(() => {
    if (open) {
      setQuantity(1);
      setNotes('');
      const initial: Record<string, string> = {};
      for (const group of menuItem.optionGroups ?? []) {
        const defaultOpt = group.options?.find((o) => o.isDefault);
        if (defaultOpt) initial[group.id] = defaultOpt.id;
      }
      setSelectedOptionIds(initial);
    }
  }, [open, menuItem.optionGroups]);

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

  const computedPrice = useMemo(() => {
    let total = menuItem.price;
    for (const group of optionGroups) {
      const optionId = selectedOptionIds[group.id];
      if (optionId) {
        const opt = group.options.find((o) => o.id === optionId);
        if (opt) total += opt.priceAdjustment;
      }
    }
    return total;
  }, [menuItem.price, optionGroups, selectedOptionIds]);

  const lineTotal = computedPrice * quantity;
  const allSelectedOptionIds = useMemo(
    () => optionGroups.flatMap((g) => (selectedOptionIds[g.id] ? [selectedOptionIds[g.id]] : [])),
    [optionGroups, selectedOptionIds]
  );

  const canSubmit = optionGroups.every((g) => {
    const selected = selectedOptionIds[g.id];
    if (g.minSelections === 0) return true;
    return !!selected;
  });

  const handleConfirm = () => {
    if (quantity < 1 || !canSubmit) return;
    onConfirm(quantity, notes.trim(), allSelectedOptionIds, computedPrice);
    onClose();
  };

  const setGroupSelection = (groupId: string, optionId: string | null) => {
    setSelectedOptionIds((prev) => {
      if (optionId == null) {
        const next = { ...prev };
        delete next[groupId];
        return next;
      }
      return { ...prev, [groupId]: optionId };
    });
  };

  return (
    <Dialog open={open} onClose={() => {}} className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 z-0 bg-black/50 pointer-events-none" aria-hidden />
      <div className="relative z-10 flex min-h-full items-start justify-center pt-6 pb-6 px-4 pointer-events-none">
        <DialogPanel className="w-full max-w-md rounded-xl bg-white shadow-xl dark:bg-gray-800 pointer-events-auto">
          <div className="border-b border-gray-100 px-5 py-4 dark:border-gray-700">
            <DialogTitle as="h2" className="text-lg font-semibold text-gray-900 dark:text-white">
              Add item
            </DialogTitle>
            <div className="mt-2 flex items-baseline justify-between gap-2">
              <p className="min-w-0 flex-1 truncate text-base font-medium text-gray-900 dark:text-white">
                {menuItem.name}
              </p>
              <p className="shrink-0 text-sm text-gray-500 dark:text-gray-400">
                {menuItem.originalPrice != null && menuItem.originalPrice !== menuItem.price ? (
                  <>
                    <span className="line-through">₱{formatMoney(menuItem.originalPrice)}</span>
                    {' '}
                    ₱{formatMoney(menuItem.price)}
                  </>
                ) : (
                  <>₱{formatMoney(menuItem.price)}</>
                )}
              </p>
            </div>
          </div>

          <div className="space-y-5 px-5 py-5">
            {optionGroups.map((group: OptionGroupDto) => (
              <div key={group.id}>
                <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  {group.name}
                  {group.minSelections > 0 && (
                    <span className="ml-1 font-normal text-gray-500 dark:text-gray-400">(required)</span>
                  )}
                </p>
                <div className="space-y-1.5">
                  {group.options.map((opt) => (
                    <label
                      key={opt.id}
                      className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 p-2.5 dark:border-gray-600 dark:bg-gray-700/30 has-[:checked]:border-primary-500 has-[:checked]:ring-1 has-[:checked]:ring-primary-500"
                    >
                      <input
                        type="radio"
                        name={`group-${group.id}`}
                        checked={selectedOptionIds[group.id] === opt.id}
                        onChange={() => setGroupSelection(group.id, opt.id)}
                        className="text-primary-600"
                      />
                      <span className="flex-1 text-gray-900 dark:text-white">{opt.name}</span>
                      {opt.priceAdjustment !== 0 && (
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {opt.priceAdjustment > 0 ? '+' : ''}₱{formatMoney(opt.priceAdjustment)}
                        </span>
                      )}
                    </label>
                  ))}
                </div>
              </div>
            ))}

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Quantity</label>
              <div className="inline-flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-1 dark:border-gray-600 dark:bg-gray-700/50">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-lg font-medium text-gray-600 transition hover:bg-white hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-600 dark:hover:text-white"
                  aria-label="Decrease quantity"
                >
                  −
                </button>
                <span className="min-w-[3rem] text-center text-xl font-semibold tabular-nums text-gray-900 dark:text-white">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-lg font-medium text-gray-600 transition hover:bg-white hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-600 dark:hover:text-white"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Special instructions <span className="font-normal text-gray-400 dark:text-gray-500">(optional)</span>
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. No ice, extra sauce"
                rows={2}
                className="w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div className="flex items-center justify-between rounded-lg bg-gray-50 py-3 px-4 dark:bg-gray-700/50">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Line total</span>
              <span className="text-lg font-semibold tabular-nums text-gray-900 dark:text-white">
                ₱{formatMoney(lineTotal)}
              </span>
            </div>
          </div>

          <div className="flex gap-3 border-t border-gray-100 px-5 py-4 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isPending || quantity < 1 || !canSubmit}
              className="flex-1 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {isPending ? 'Saving…' : 'Add to order'}
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
};
