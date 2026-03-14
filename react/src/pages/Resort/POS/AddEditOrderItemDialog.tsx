import { useEffect, useState } from 'react';

const formatMoney = (value: number) =>
  value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export interface AddEditOrderItemDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  itemName: string;
  itemPrice: number;
  initialQuantity: number;
  initialNotes: string;
  confirmLabel: string;
  onConfirm: (quantity: number, notes: string) => void;
  isPending?: boolean;
}

export const AddEditOrderItemDialog = ({
  open,
  onClose,
  title,
  itemName,
  itemPrice,
  initialQuantity,
  initialNotes,
  confirmLabel,
  onConfirm,
  isPending = false,
}: AddEditOrderItemDialogProps) => {
  const [quantity, setQuantity] = useState(initialQuantity);
  const [notes, setNotes] = useState(initialNotes);

  useEffect(() => {
    if (open) {
      setQuantity(initialQuantity);
      setNotes(initialNotes);
    }
  }, [open, initialQuantity, initialNotes]);

  const handleConfirm = () => {
    if (quantity < 1) return;
    onConfirm(quantity, notes.trim());
    onClose();
  };

  if (!open) return null;

  const lineTotal = itemPrice * quantity;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-edit-order-item-title"
    >
      <div
        className="w-full max-w-md rounded-xl bg-white shadow-xl dark:bg-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-gray-100 px-5 py-4 dark:border-gray-700">
          <h2 id="add-edit-order-item-title" className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h2>
          <div className="mt-2 flex items-baseline justify-between gap-2">
            <p className="min-w-0 flex-1 truncate text-base font-medium text-gray-900 dark:text-white">
              {itemName}
            </p>
            <p className="shrink-0 text-sm text-gray-500 dark:text-gray-400">
              ₱{formatMoney(itemPrice)} <span className="text-gray-400 dark:text-gray-500">each</span>
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="space-y-5 px-5 py-5">
          {/* Quantity */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Quantity
            </label>
            <div className="inline-flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-1 dark:border-gray-600 dark:bg-gray-700/50">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-lg font-medium text-gray-600 transition hover:bg-white hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-600 dark:hover:text-white"
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span
                className="min-w-[3rem] text-center text-xl font-semibold tabular-nums text-gray-900 dark:text-white"
                aria-live="polite"
              >
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

          {/* Notes */}
          <div>
            <label
              htmlFor="add-edit-order-item-notes"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Special instructions <span className="font-normal text-gray-400 dark:text-gray-500">(optional)</span>
            </label>
            <textarea
              id="add-edit-order-item-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. No ice, extra sauce, allergies…"
              rows={3}
              className="w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-500"
            />
          </div>

          {/* Line total */}
          <div className="flex items-center justify-between rounded-lg bg-gray-50 py-3 px-4 dark:bg-gray-700/50">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Line total</span>
            <span className="text-lg font-semibold tabular-nums text-gray-900 dark:text-white">
              ₱{formatMoney(lineTotal)}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 border-t border-gray-100 px-5 py-4 dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isPending || quantity < 1}
            className="flex-1 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600"
          >
            {isPending ? 'Saving…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
