import { useEffect } from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import type { StayListDto } from '@/types/resort.types';

const formatMoney = (value: number) =>
  value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export type POSRoomChargeModalProps = {
  open: boolean;
  onClose: () => void;
  /** Amount to charge (balance due). */
  amountToCharge: number;
  inHouseStays: StayListDto[];
  isFetchingStays: boolean;
  selectedStay: StayListDto | null;
  onSelectStay: (stay: StayListDto | null) => void;
  onCharge: () => void;
  isPending: boolean;
};

export const POSRoomChargeModal = ({
  open,
  onClose,
  amountToCharge,
  inHouseStays,
  isFetchingStays,
  selectedStay,
  onSelectStay,
  onCharge,
  isPending,
}: POSRoomChargeModalProps) => {
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
      <div className="fixed inset-0 z-0 bg-black/50 pointer-events-none" aria-hidden />
      <div className="relative z-10 flex min-h-full items-center justify-center p-4 pointer-events-none">
        <DialogPanel className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-lg bg-white shadow-xl dark:bg-gray-800 pointer-events-auto">
          <div className="border-b border-gray-200 p-4 dark:border-gray-700">
            <DialogTitle as="h3" className="text-lg font-semibold text-gray-900 dark:text-white">
              Charge to Room
            </DialogTitle>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Select a stay to charge this order to the guest folio.
            </p>
            <p className="mt-2 text-base font-semibold text-gray-900 dark:text-white">
              Amount to charge: ₱{formatMoney(amountToCharge)}
            </p>
          </div>
          <div className="flex-1 overflow-auto p-4">
            {isFetchingStays ? (
              <p className="py-6 text-center text-gray-500 dark:text-gray-400">Loading stays…</p>
            ) : inHouseStays.length === 0 ? (
              <p className="py-6 text-center text-gray-500 dark:text-gray-400">No in-house stays found.</p>
            ) : (
              <ul className="space-y-1">
                {inHouseStays.map((stay) => (
                  <li key={stay.id}>
                    <button
                      type="button"
                      onClick={() => onSelectStay(selectedStay?.id === stay.id ? null : stay)}
                      className={`w-full rounded-lg border p-3 text-left transition ${
                        selectedStay?.id === stay.id
                          ? 'border-indigo-500 bg-indigo-50 dark:border-indigo-400 dark:bg-indigo-900/30'
                          : 'border-gray-200 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium text-gray-900 dark:text-white">Room {stay.roomNumber}</span>
                          <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">({stay.stayNo})</span>
                        </div>
                        {selectedStay?.id === stay.id && (
                          <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">Selected</span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">{stay.guestName}</p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="flex justify-end gap-2 border-t border-gray-200 p-4 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="rounded border border-gray-300 px-3 py-1.5 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onCharge}
              disabled={!selectedStay || isPending}
              className="rounded bg-indigo-600 px-3 py-1.5 text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              Charge to Room
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
};
