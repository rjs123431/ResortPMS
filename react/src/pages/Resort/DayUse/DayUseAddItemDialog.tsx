import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { formatMoney } from '@utils/helpers';
import { DayUseOfferType, type DayUseOfferListDto } from '@/types/day-use.types';
import { dayUseOfferLabel } from './dayUseUi';

type DayUseAddItemDialogProps = {
  open: boolean;
  offers: DayUseOfferListDto[];
  isLoading: boolean;
  onClose: () => void;
  onAddItems: (items: Array<{ offerId: string; quantity: number }>) => void;
};

export const DayUseAddItemDialog = ({
  open,
  offers,
  isLoading,
  onClose,
  onAddItems,
}: DayUseAddItemDialogProps) => {
  const [selectedCategory, setSelectedCategory] = useState<DayUseOfferType>(DayUseOfferType.EntranceFee);
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!open) return;

    setSelectedCategory(DayUseOfferType.EntranceFee);
    setQuantities({});

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  const filteredOffers = useMemo(
    () => offers.filter((offer) => offer.offerType === selectedCategory),
    [offers, selectedCategory],
  );

  const selectedItems = useMemo(
    () => Object.entries(quantities)
      .map(([offerId, quantity]) => ({ offerId, quantity }))
      .filter((item) => item.quantity > 0),
    [quantities],
  );

  const selectionSummary = useMemo(
    () => selectedItems
      .map((item) => {
        const offer = offers.find((candidate) => candidate.id === item.offerId);
        if (!offer) return null;
        return {
          label: dayUseOfferLabel(offer),
          quantity: item.quantity,
        };
      })
      .filter((item): item is { label: string; quantity: number } => Boolean(item)),
    [offers, selectedItems],
  );

  return (
    <Dialog open={open} onClose={() => {}} className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50 pointer-events-none" aria-hidden />
      <div className="relative flex min-h-screen items-center justify-center p-4 pointer-events-none">
        <DialogPanel className="w-full max-w-4xl rounded-lg bg-white p-5 shadow-xl dark:bg-gray-800 pointer-events-auto">
          <div className="mb-4 flex items-center justify-between">
            <DialogTitle as="h3" className="text-lg font-semibold text-gray-900 dark:text-white">Add Item</DialogTitle>
            <button className="rounded bg-gray-200 px-2 py-1 text-sm dark:bg-gray-700" onClick={onClose}>
              Close
            </button>
          </div>

          <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
            <div className="min-w-0">
              <div className="mb-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  className={`rounded px-4 py-2 text-sm ${selectedCategory === DayUseOfferType.EntranceFee ? 'bg-primary-600 text-white' : 'border border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-200'}`}
                  onClick={() => setSelectedCategory(DayUseOfferType.EntranceFee)}
                >
                  Entrance Fee
                </button>
                <button
                  type="button"
                  className={`rounded px-4 py-2 text-sm ${selectedCategory === DayUseOfferType.Activity ? 'bg-primary-600 text-white' : 'border border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-200'}`}
                  onClick={() => setSelectedCategory(DayUseOfferType.Activity)}
                >
                  Activities
                </button>
              </div>

              <div className="max-h-[60vh] overflow-y-auto space-y-3 pr-1">
                {isLoading ? <p className="text-sm text-gray-500 dark:text-gray-400">Loading offers...</p> : null}
                {!isLoading && filteredOffers.length === 0 ? <p className="text-sm text-gray-500 dark:text-gray-400">No offers available for this category.</p> : null}
                {filteredOffers.map((offer) => (
                  <div key={offer.id} className="grid gap-3 rounded-lg border border-gray-200 p-3 md:grid-cols-[1fr_auto_auto] md:items-center dark:border-gray-700">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{dayUseOfferLabel(offer)}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{offer.description || offer.chargeTypeName}</p>
                    </div>
                    <div className="text-right text-sm font-semibold text-gray-900 dark:text-white">{formatMoney(offer.amount)}</div>
                    <div className="inline-flex items-center gap-2 justify-self-end rounded-lg border border-gray-200 p-1 dark:border-gray-700">
                      <button
                        type="button"
                        className="flex h-8 w-8 items-center justify-center rounded bg-gray-100 text-base font-semibold text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                        onClick={() => setQuantities((current) => ({
                          ...current,
                          [offer.id]: Math.max(0, (current[offer.id] ?? 0) - 1),
                        }))}
                      >
                        -
                      </button>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={String(quantities[offer.id] ?? 0)}
                        onChange={(e) => {
                          const sanitized = e.target.value.replace(/[^\d.]/g, '');
                          const parsed = Number(sanitized);
                          setQuantities((current) => ({
                            ...current,
                            [offer.id]: sanitized === '' ? 0 : (Number.isFinite(parsed) ? parsed : current[offer.id] ?? 0),
                          }));
                        }}
                        className="h-8 w-16 bg-transparent px-2 text-center text-gray-900 outline-none dark:text-gray-100"
                      />
                      <button
                        type="button"
                        className="flex h-8 w-8 items-center justify-center rounded bg-gray-100 text-base font-semibold text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                        onClick={() => setQuantities((current) => ({
                          ...current,
                          [offer.id]: (current[offer.id] ?? 0) + 1,
                        }))}
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex min-h-0 flex-col rounded-lg border border-gray-200 p-4 dark:border-gray-700">
              <div className="min-h-0 flex-1 overflow-y-auto text-sm text-gray-600 dark:text-gray-300">
                <h4 className="mb-3 font-semibold text-gray-900 dark:text-white">Selection Summary</h4>
                {selectionSummary.length === 0 ? (
                  <span>No items selected yet.</span>
                ) : (
                  <div className="space-y-1">
                    {selectionSummary.map((item) => (
                      <div key={`${item.label}-${item.quantity}`} className="flex items-start justify-between gap-3">
                        <span className="min-w-0 flex-1">{item.label}</span>
                        <span className="shrink-0 text-right">x {item.quantity}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-4 flex justify-end gap-2 border-t border-gray-200 pt-4 dark:border-gray-700">
                <button type="button" className="rounded border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700" onClick={onClose}>
                  Close
                </button>
                <button
                  type="button"
                  className="rounded bg-primary-600 px-4 py-2 text-white hover:bg-primary-700 disabled:opacity-50"
                  disabled={selectedItems.length === 0}
                  onClick={() => onAddItems(selectedItems)}
                >
                  Okay
                </button>
              </div>
            </div>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
};