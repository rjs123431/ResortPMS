import { useEffect } from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { formatMoney } from '@utils/helpers';
import type { DayUseOfferListDto } from '@/types/day-use.types';
import { dayUseOfferLabel } from './dayUseUi';

type DayUseOfferSelectionDialogProps = {
  open: boolean;
  title: string;
  offers: DayUseOfferListDto[];
  quantities: Record<string, number>;
  contextLabel: string;
  isLoading: boolean;
  emptyMessage: string;
  onClose: () => void;
  onQuantityChange: (offerId: string, quantity: number) => void;
};

export const DayUseOfferSelectionDialog = ({
  open,
  title,
  offers,
  quantities,
  contextLabel,
  isLoading,
  emptyMessage,
  onClose,
  onQuantityChange,
}: DayUseOfferSelectionDialogProps) => {
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
        <DialogPanel className="w-full max-w-4xl rounded-lg bg-white p-5 shadow-xl dark:bg-gray-800 pointer-events-auto">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <DialogTitle as="h3" className="text-lg font-semibold text-gray-900 dark:text-white">{title}</DialogTitle>
              <p className="text-sm text-gray-500 dark:text-gray-400">{contextLabel} pricing</p>
            </div>
            <button className="rounded bg-gray-200 px-2 py-1 text-sm dark:bg-gray-700" onClick={onClose}>
              Close
            </button>
          </div>

          <div className="max-h-[70vh] overflow-y-auto space-y-3 pr-1">
            {isLoading ? <p className="text-sm text-gray-500 dark:text-gray-400">Loading offers...</p> : null}
            {!isLoading && offers.length === 0 ? <p className="text-sm text-gray-500 dark:text-gray-400">{emptyMessage}</p> : null}
            {offers.map((offer) => (
              <div key={offer.id} className="grid gap-3 rounded-lg border border-gray-200 p-3 md:grid-cols-[1fr_auto_auto] md:items-center dark:border-gray-700">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{dayUseOfferLabel(offer)}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{offer.description || offer.chargeTypeName}</p>
                </div>
                <div className="text-right text-sm font-semibold text-gray-900 dark:text-white">{formatMoney(offer.amount)}</div>
                <input
                  type="number"
                  min={0}
                  value={quantities[offer.id] ?? 0}
                  onChange={(e) => onQuantityChange(offer.id, Math.max(0, Number(e.target.value || 0)))}
                  className="w-24 rounded border border-gray-300 p-2 text-right dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
            ))}
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
};