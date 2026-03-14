import { useEffect, useState } from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';

type ExtraBedTypeOption = {
  id: string;
  name: string;
  basePrice: number;
};

type AddExtraBedDialogProps = {
  open: boolean;
  extraBedTypes: ExtraBedTypeOption[];
  onClose: () => void;
  onAdd: (extraBedTypeId: string, quantity: number) => void;
};

const round2 = (value: number) => Math.round(value * 100) / 100;
const formatMoney = (value: number) =>
  round2(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const AddExtraBedDialog = ({ open, extraBedTypes, onClose, onAdd }: AddExtraBedDialogProps) => {
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  useEffect(() => {
    if (open) {
      setQuantities({});
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

  return (
    <Dialog open={open} onClose={() => {}} className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50 pointer-events-none" aria-hidden />
      <div className="relative flex min-h-screen items-center justify-center p-4 pointer-events-none">
        <DialogPanel className="w-full max-w-2xl rounded-lg bg-white p-4 shadow-xl dark:bg-gray-800 pointer-events-auto">
          <DialogTitle as="h3" className="text-lg font-semibold text-gray-900 dark:text-white">Add Extra Bed</DialogTitle>
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full border border-gray-200 text-sm dark:border-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700/40">
                <tr>
                  <th className="border border-gray-200 p-2 text-left dark:border-gray-700">Extra Bed Type</th>
                  <th className="border border-gray-200 p-2 text-right dark:border-gray-700">Base Price/Night</th>
                  <th className="border border-gray-200 p-2 text-right dark:border-gray-700">Quantity</th>
                  <th className="border border-gray-200 p-2 text-right dark:border-gray-700">Action</th>
                </tr>
              </thead>
              <tbody>
                {extraBedTypes.map((item) => {
                  const quantity = Math.max(1, Math.floor(quantities[item.id] ?? 1));
                  return (
                    <tr key={item.id}>
                      <td className="border border-gray-200 p-2 dark:border-gray-700">{item.name}</td>
                      <td className="border border-gray-200 p-2 text-right dark:border-gray-700">{formatMoney(item.basePrice)}</td>
                      <td className="border border-gray-200 p-2 text-right dark:border-gray-700">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            className="rounded border border-gray-300 px-2 py-1 text-sm font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                            disabled={quantity <= 1}
                            onClick={() =>
                              setQuantities((prev) => ({
                                ...prev,
                                [item.id]: Math.max(1, quantity - 1),
                              }))
                            }
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min={1}
                            value={quantity}
                            onChange={(e) =>
                              setQuantities((prev) => ({
                                ...prev,
                                [item.id]: Math.max(1, Math.floor(Number(e.target.value || 1))),
                              }))
                            }
                            className="w-20 rounded border border-gray-300 p-1 text-right text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                          />
                          <button
                            type="button"
                            className="rounded border border-gray-300 px-2 py-1 text-sm font-semibold text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                            onClick={() =>
                              setQuantities((prev) => ({
                                ...prev,
                                [item.id]: quantity + 1,
                              }))
                            }
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="border border-gray-200 p-2 text-right dark:border-gray-700">
                        <button
                          type="button"
                          onClick={() => onAdd(item.id, quantity)}
                          className="rounded bg-primary-600 px-3 py-1 text-xs text-white hover:bg-primary-700"
                        >
                          Add
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
};
