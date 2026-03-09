import { useEffect, useState } from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';

export type ExtraBedPricingValues = {
  quantity: number;
  ratePerNight: number;
  numberOfNights: number;
  amount: number;
  discountPercent: number;
  discountAmount: number;
  seniorCitizenCount: number;
  seniorCitizenPercent: number;
  seniorCitizenDiscountAmount: number;
  netAmount: number;
};

type EditExtraBedDialogProps = {
  open: boolean;
  initialValues: ExtraBedPricingValues | null;
  onClose: () => void;
  onSave: (values: ExtraBedPricingValues) => void;
};

const VAT_RATE = 0.12;

const round2 = (value: number) => Math.round(value * 100) / 100;
const formatMoney = (value: number) =>
  round2(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const toNumber = (value: string, fallback = 0) => {
  const parsed = Number(value.replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : fallback;
};

const computeSeniorPricing = (
  amount: number,
  discountAmount: number,
  scPercent: number,
  scCount: number
) => {
  const amountAfterDiscount = Math.max(0, amount - discountAmount);
  const sharePerOccupant = amountAfterDiscount;

  if (scCount <= 0 || scPercent <= 0) {
    return {
      scDiscountAmount: 0,
      netAmount: round2(amountAfterDiscount),
    };
  }

  const seniorVatExclusive = sharePerOccupant / (1 + VAT_RATE);
  const scDiscountAmount = seniorVatExclusive * (scPercent / 100);
  const netAmount = seniorVatExclusive - scDiscountAmount;

  return {
    scDiscountAmount: round2(Math.max(0, scDiscountAmount)),
    netAmount: round2(Math.max(0, netAmount)),
  };
};

export const EditExtraBedDialog = ({ open, initialValues, onClose, onSave }: EditExtraBedDialogProps) => {
  const [form, setForm] = useState<ExtraBedPricingValues>({
    quantity: 1,
    ratePerNight: 0,
    numberOfNights: 1,
    amount: 0,
    discountPercent: 0,
    discountAmount: 0,
    seniorCitizenCount: 0,
    seniorCitizenPercent: 20,
    seniorCitizenDiscountAmount: 0,
    netAmount: 0,
  });

  useEffect(() => {
    if (open && initialValues) {
      setForm(initialValues);
    }
  }, [open, initialValues]);

  const recompute = (next: ExtraBedPricingValues) => {
    const amount = round2(next.ratePerNight * next.numberOfNights * next.quantity);
    const discountAmount = round2(amount * (next.discountPercent / 100));
    const pricing = computeSeniorPricing(amount, discountAmount, next.seniorCitizenPercent, next.seniorCitizenCount);
    return {
      ...next,
      amount,
      discountAmount,
      seniorCitizenDiscountAmount: pricing.scDiscountAmount,
      netAmount: pricing.netAmount,
    };
  };

  return (
    <Dialog open={open} onClose={onClose} className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center bg-black/50 p-4">
        <DialogPanel className="w-full max-w-2xl rounded-lg bg-white p-5 shadow-xl dark:bg-gray-800">
          <div className="mb-4 flex items-center justify-between">
            <DialogTitle as="h3" className="text-lg font-semibold text-gray-900 dark:text-white">
              Edit Extra Bed
            </DialogTitle>
            <button type="button" className="rounded bg-gray-200 px-2 py-1 text-sm dark:bg-gray-700" onClick={onClose}>
              Close
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <label className="text-sm text-gray-700 dark:text-gray-300">
              Quantity
              <input
                type="number"
                min={1}
                className="mt-1 w-full rounded border p-2 text-right dark:bg-gray-700"
                value={form.quantity}
                onChange={(e) => setForm((s) => recompute({ ...s, quantity: Math.max(1, Math.floor(Number(e.target.value || 1))) }))}
              />
            </label>
            <label className="text-sm text-gray-700 dark:text-gray-300">
              Price/Night
              <input
                type="number"
                className="mt-1 w-full rounded border p-2 text-right dark:bg-gray-700"
                value={form.ratePerNight}
                onChange={(e) => setForm((s) => recompute({ ...s, ratePerNight: Math.max(0, Number(e.target.value || 0)) }))}
              />
            </label>
            <label className="text-sm text-gray-700 dark:text-gray-300">
              No. of Night
              <input
                type="number"
                min={1}
                className="mt-1 w-full rounded border p-2 text-right dark:bg-gray-700"
                value={form.numberOfNights}
                onChange={(e) => setForm((s) => recompute({ ...s, numberOfNights: Math.max(1, Math.floor(Number(e.target.value || 1))) }))}
              />
            </label>
            <label className="text-sm text-gray-700 dark:text-gray-300">
              Amount
              <input className="mt-1 w-full rounded border bg-gray-100 p-2 text-right dark:bg-gray-700/60" value={formatMoney(form.amount)} readOnly />
            </label>
            <label className="text-sm text-gray-700 dark:text-gray-300">
              Disc. %
              <input
                type="number"
                min={0}
                className="mt-1 w-full rounded border p-2 text-right dark:bg-gray-700"
                value={form.discountPercent}
                onChange={(e) => setForm((s) => recompute({ ...s, discountPercent: Math.max(0, Number(e.target.value || 0)) }))}
              />
            </label>
            <label className="text-sm text-gray-700 dark:text-gray-300">
              Disc. Amount
              <input
                className="mt-1 w-full rounded border p-2 text-right dark:bg-gray-700"
                value={formatMoney(form.discountAmount)}
                onChange={(e) => {
                  const discountAmount = round2(Math.max(0, toNumber(e.target.value)));
                  setForm((s) => {
                    const discountPercent = s.amount > 0 ? round2((discountAmount / s.amount) * 100) : 0;
                    const pricing = computeSeniorPricing(s.amount, discountAmount, s.seniorCitizenPercent, s.seniorCitizenCount);
                    return {
                      ...s,
                      discountPercent,
                      discountAmount,
                      seniorCitizenDiscountAmount: pricing.scDiscountAmount,
                      netAmount: pricing.netAmount,
                    };
                  });
                }}
              />
            </label>
            <label className="text-sm text-gray-700 dark:text-gray-300">
              SC Count
              <input
                type="number"
                min={0}
                className="mt-1 w-full rounded border p-2 text-right dark:bg-gray-700"
                value={form.seniorCitizenCount}
                onChange={(e) => setForm((s) => recompute({ ...s, seniorCitizenCount: Math.max(0, Math.floor(Number(e.target.value || 0)) ) }))}
              />
            </label>
            <label className="text-sm text-gray-700 dark:text-gray-300">
              SC %
              <input
                type="number"
                min={0}
                className="mt-1 w-full rounded border p-2 text-right dark:bg-gray-700"
                value={form.seniorCitizenPercent}
                onChange={(e) => setForm((s) => recompute({ ...s, seniorCitizenPercent: Math.max(0, Number(e.target.value || 0)) }))}
              />
            </label>
            <label className="text-sm text-gray-700 dark:text-gray-300">
              SC Disc. Amount
              <input className="mt-1 w-full rounded border bg-gray-100 p-2 text-right dark:bg-gray-700/60" value={formatMoney(form.seniorCitizenDiscountAmount)} readOnly />
            </label>
            <label className="text-sm text-gray-700 dark:text-gray-300 md:col-span-3">
              Net Amount
              <input
                className="mt-1 w-full rounded border p-2 text-right dark:bg-gray-700"
                value={formatMoney(form.netAmount)}
                onChange={(e) => setForm((s) => ({ ...s, netAmount: round2(Math.max(0, toNumber(e.target.value))) }))}
              />
            </label>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button type="button" className="rounded border border-gray-300 px-4 py-2 text-sm" onClick={onClose}>
              Cancel
            </button>
            <button type="button" className="rounded bg-primary-600 px-4 py-2 text-sm text-white" onClick={() => onSave(form)}>
              Save
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
};
