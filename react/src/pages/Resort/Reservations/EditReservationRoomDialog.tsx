import { useEffect, useState } from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';

export type ReservationRoomPricingValues = {
  ratePerNight: number;
  nights: number;
  occupantCount: number;
  amount: number;
  discountPercent: number;
  discountAmount: number;
  scCount: number;
  scPercent: number;
  scDiscountAmount: number;
  netAmount: number;
};

type EditReservationRoomDialogProps = {
  open: boolean;
  roomLabel: string;
  initialValues: ReservationRoomPricingValues | null;
  onClose: () => void;
  onSave: (values: ReservationRoomPricingValues) => void;
};

const toNumber = (value: string, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const round2 = (value: number) => Math.round(value * 100) / 100;
const formatMoney = (value: number) =>
  round2(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const parseMoneyInput = (value: string, fallback = 0) => toNumber(value.replace(/,/g, ''), fallback);

const VAT_RATE = 0.12;

const computeSeniorPricing = (
  amount: number,
  discountAmount: number,
  scPercent: number,
  scCount: number,
  occupantCount: number
) => {
  const safeOccupantCount = Math.max(1, Math.floor(occupantCount));
  const effectiveScCount = Math.max(0, Math.min(scCount, safeOccupantCount));

  const amountAfterDiscount = Math.max(0, amount - discountAmount);
  const sharePerOccupant = amountAfterDiscount / safeOccupantCount;

  if (effectiveScCount === 0 || scPercent <= 0) {
    return {
      scDiscountAmount: 0,
      netAmount: round2(amountAfterDiscount),
    };
  }

  const seniorShare = sharePerOccupant * effectiveScCount;
  const seniorVatExclusive = seniorShare / (1 + VAT_RATE);
  const scDiscountAmount = seniorVatExclusive * (scPercent / 100);
  const seniorPays = seniorVatExclusive - scDiscountAmount;
  const nonSeniorPays = sharePerOccupant * (safeOccupantCount - effectiveScCount);
  const netAmount = seniorPays + nonSeniorPays;

  return {
    scDiscountAmount: round2(Math.max(0, scDiscountAmount)),
    netAmount: round2(Math.max(0, netAmount)),
  };
};

export const EditReservationRoomDialog = ({
  open,
  roomLabel,
  initialValues,
  onClose,
  onSave,
}: EditReservationRoomDialogProps) => {
  const [form, setForm] = useState<ReservationRoomPricingValues>({
    ratePerNight: 0,
    nights: 0,
    occupantCount: 1,
    amount: 0,
    discountPercent: 0,
    discountAmount: 0,
    scCount: 0,
    scPercent: 20,
    scDiscountAmount: 0,
    netAmount: 0,
  });

  useEffect(() => {
    if (open && initialValues) {
      setForm(initialValues);
    }
  }, [open, initialValues]);

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
      <div className="fixed inset-0 bg-black/50" aria-hidden />
      <div className="flex min-h-screen items-center justify-center p-4">
        <DialogPanel className="w-full max-w-2xl rounded-lg bg-white p-5 shadow-xl dark:bg-gray-800">
          <div className="mb-4 flex items-center justify-between">
            <DialogTitle as="h3" className="text-lg font-semibold text-gray-900 dark:text-white">
              Edit Reservation Room
            </DialogTitle>
            <button
              type="button"
              className="rounded bg-gray-200 px-2 py-1 text-sm dark:bg-gray-700"
              onClick={onClose}
            >
              Close
            </button>
          </div>

          <p className="mb-3 text-sm text-gray-600 dark:text-gray-300">{roomLabel}</p>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <label className="text-sm text-gray-700 dark:text-gray-300">
              Price/Night
              <input
                className="mt-1 w-full rounded border bg-gray-100 p-2 text-right text-sm dark:bg-gray-700/60"
                type="text"
                inputMode="decimal"
                value={formatMoney(form.ratePerNight)}
                readOnly
              />
            </label>
            <label className="text-sm text-gray-700 dark:text-gray-300">
              No. of Night
              <input
                className="mt-1 w-full rounded border bg-gray-100 p-2 text-right text-sm dark:bg-gray-700/60"
                type="number"
                value={form.nights}
                readOnly
              />
            </label>
            <label className="text-sm text-gray-700 dark:text-gray-300">
              Amount
              <input
                className="mt-1 w-full rounded border bg-gray-100 p-2 text-right text-sm tabular-nums dark:bg-gray-700/60"
                type="text"
                inputMode="decimal"
                value={formatMoney(form.amount)}
                readOnly
              />
            </label>
            <label className="text-sm text-gray-700 dark:text-gray-300 md:col-start-2">
              Disc. %
              <input
                className="mt-1 w-full rounded border p-2 text-right text-sm dark:bg-gray-700"
                type="number"
                value={form.discountPercent}
                onChange={(e) => {
                  const discountPercent = Math.max(0, toNumber(e.target.value));
                  setForm((s) => {
                    const discountAmount = round2(s.amount * (discountPercent / 100));
                    const pricing = computeSeniorPricing(
                      s.amount,
                      discountAmount,
                      s.scPercent,
                      s.scCount,
                      s.occupantCount
                    );
                    return {
                      ...s,
                      discountPercent,
                      discountAmount,
                      scDiscountAmount: pricing.scDiscountAmount,
                      netAmount: pricing.netAmount,
                    };
                  });
                }}
              />
            </label>
            <label className="text-sm text-gray-700 dark:text-gray-300 md:col-start-3">
              Disc. Amount
              <input
                className="mt-1 w-full rounded border p-2 text-right text-sm tabular-nums dark:bg-gray-700"
                type="text"
                inputMode="decimal"
                value={formatMoney(form.discountAmount)}
                onChange={(e) => {
                  const discountAmount = round2(Math.max(0, parseMoneyInput(e.target.value)));
                  setForm((s) => {
                    const discountPercent = round2(s.amount > 0 ? (discountAmount / s.amount) * 100 : 0);
                    const pricing = computeSeniorPricing(
                      s.amount,
                      discountAmount,
                      s.scPercent,
                      s.scCount,
                      s.occupantCount
                    );
                    return {
                      ...s,
                      discountPercent,
                      discountAmount,
                      scDiscountAmount: pricing.scDiscountAmount,
                      netAmount: pricing.netAmount,
                    };
                  });
                }}
              />
            </label>
            <label className="text-sm text-gray-700 dark:text-gray-300">
              SC Count
              <input
                className="mt-1 w-full rounded border p-2 text-right text-sm dark:bg-gray-700"
                type="number"
                value={form.scCount}
                onChange={(e) => {
                  const scCount = Math.max(0, Math.floor(toNumber(e.target.value)));
                  setForm((s) => {
                    const pricing = computeSeniorPricing(
                      s.amount,
                      s.discountAmount,
                      s.scPercent,
                      scCount,
                      s.occupantCount
                    );
                    return {
                      ...s,
                      scCount,
                      scDiscountAmount: pricing.scDiscountAmount,
                      netAmount: pricing.netAmount,
                    };
                  });
                }}
              />
            </label>
            <label className="text-sm text-gray-700 dark:text-gray-300">
              SC Percent
              <input
                className="mt-1 w-full rounded border p-2 text-right text-sm dark:bg-gray-700"
                type="number"
                value={form.scPercent}
                onChange={(e) => {
                  const scPercent = Math.max(0, toNumber(e.target.value));
                  setForm((s) => {
                    const pricing = computeSeniorPricing(
                      s.amount,
                      s.discountAmount,
                      scPercent,
                      s.scCount,
                      s.occupantCount
                    );
                    return {
                      ...s,
                      scPercent,
                      scDiscountAmount: pricing.scDiscountAmount,
                      netAmount: pricing.netAmount,
                    };
                  });
                }}
              />
            </label>
            <label className="text-sm text-gray-700 dark:text-gray-300 md:col-start-3">
              SC Disc. Amount
              <input
                className="mt-1 w-full rounded border bg-gray-100 p-2 text-right text-sm tabular-nums dark:bg-gray-700/60"
                type="text"
                inputMode="decimal"
                value={formatMoney(form.scDiscountAmount)}
                readOnly
              />
            </label>
            <div className="text-sm text-gray-700 dark:text-gray-300 md:col-span-3">
              <div className="flex items-center justify-between gap-3">
                <span className="w-40">Net Amount</span>
                <input
                  className="w-56 rounded border p-2 text-right text-sm tabular-nums dark:bg-gray-700"
                  type="text"
                  inputMode="decimal"
                  value={formatMoney(form.netAmount)}
                  onChange={(e) => setForm((s) => ({ ...s, netAmount: round2(parseMoneyInput(e.target.value)) }))}
                />
              </div>
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              className="rounded border border-gray-300 px-4 py-2 text-sm text-gray-700 dark:border-gray-600 dark:text-gray-200"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="button"
              className="rounded bg-primary-600 px-4 py-2 text-sm text-white hover:bg-primary-700"
              onClick={() => onSave(form)}
            >
              Save
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
};
