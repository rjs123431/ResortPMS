import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import type { ExtraBedTypeListDto } from '@/types/resort.types';

type SelectExtraBedTypeDialogProps = {
  open: boolean;
  types: ExtraBedTypeListDto[];
  isLoading: boolean;
  onClose: () => void;
  onSelect: (type: ExtraBedTypeListDto) => void;
};

const formatMoney = (value: number) =>
  Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const SelectExtraBedTypeDialog = ({
  open,
  types,
  isLoading,
  onClose,
  onSelect,
}: SelectExtraBedTypeDialogProps) => {
  return (
    <Dialog open={open} onClose={onClose} className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center bg-black/50 p-4">
        <DialogPanel className="w-full max-w-2xl rounded-lg bg-white p-5 shadow-xl dark:bg-gray-800">
          <div className="mb-4 flex items-center justify-between">
            <DialogTitle as="h3" className="text-lg font-semibold">
              Select Extra Bed Type
            </DialogTitle>
            <button className="rounded bg-gray-200 px-2 py-1 text-sm dark:bg-gray-700" onClick={onClose}>
              Close
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="p-2">Type</th>
                  <th className="p-2 text-right">Base Price</th>
                  <th className="p-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td className="p-2 text-gray-500" colSpan={3}>Loading extra bed types...</td>
                  </tr>
                ) : types.length === 0 ? (
                  <tr>
                    <td className="p-2 text-gray-500" colSpan={3}>No extra bed types available.</td>
                  </tr>
                ) : (
                  types.map((type) => (
                    <tr key={type.id} className="border-b">
                      <td className="p-2">{type.name}</td>
                      <td className="p-2 text-right tabular-nums">{formatMoney(type.basePrice)}</td>
                      <td className="p-2">
                        <button
                          type="button"
                          className="rounded bg-primary-600 px-2 py-1 text-white hover:bg-primary-700"
                          onClick={() => onSelect(type)}
                        >
                          Use
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
};
