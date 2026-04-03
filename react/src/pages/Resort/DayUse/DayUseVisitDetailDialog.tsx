import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { formatDate, formatMoney } from '@utils/helpers';
import type { DayUseVisitDto } from '@/types/day-use.types';
import {
  dayUseContextLabel,
  dayUseFormatTimeValue,
  dayUseOfferLabel,
  dayUseStatusBadgeClass,
  dayUseStatusLabel,
} from './dayUseUi';

type DayUseVisitDetailDialogProps = {
  open: boolean;
  visit: DayUseVisitDto | null;
  isLoading: boolean;
  onClose: () => void;
};

export const DayUseVisitDetailDialog = ({ open, visit, isLoading, onClose }: DayUseVisitDetailDialogProps) => {
  return (
    <Dialog open={open} onClose={() => {}} className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50 pointer-events-none" aria-hidden />
      <div className="relative flex min-h-screen items-center justify-center p-4 pointer-events-none">
        <DialogPanel className="w-full max-w-3xl rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800 pointer-events-auto">
          <div className="mb-4 flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-white">Day-Use Visit Detail</DialogTitle>
            <button className="rounded bg-gray-200 px-2 py-1 text-sm dark:bg-gray-700" onClick={onClose}>
              Close
            </button>
          </div>

          {isLoading ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">Loading visit detail...</p>
          ) : !visit ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">Visit detail could not be loaded.</p>
          ) : (
            <div className="space-y-5 text-sm">
              <div className="flex flex-col gap-3 rounded-lg border border-gray-200 p-4 dark:border-gray-700 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-base font-semibold text-gray-900 dark:text-white">{visit.visitNo}</p>
                  <p className="text-gray-600 dark:text-gray-300">{visit.guestName}</p>
                  <p className="text-gray-500 dark:text-gray-400">{formatDate(visit.visitDate)} • {dayUseFormatTimeValue(visit.accessStartTime)} - {dayUseFormatTimeValue(visit.accessEndTime)}</p>
                  <p className="text-gray-500 dark:text-gray-400">{dayUseContextLabel(visit.guestContext)}</p>
                </div>
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${dayUseStatusBadgeClass(visit.status)}`}>
                  {dayUseStatusLabel(visit.status)}
                </span>
              </div>

              <div>
                <h3 className="mb-2 font-semibold text-gray-900 dark:text-white">Charges</h3>
                <div className="space-y-2">
                  {visit.lines.map((line) => (
                    <div key={line.id} className="flex items-start justify-between gap-3 rounded border border-gray-200 p-3 dark:border-gray-700">
                      <div>
                        <p className="text-gray-900 dark:text-white">
                          {line.description || dayUseOfferLabel({
                            id: line.dayUseOfferId,
                            code: line.offerCode,
                            name: line.offerName,
                            variantName: line.variantName,
                            description: line.description,
                            offerType: line.offerType,
                            guestContext: line.guestContext,
                            guestCategory: line.guestCategory,
                            durationMinutes: line.durationMinutes,
                            chargeTypeId: line.chargeTypeId,
                            chargeTypeName: line.chargeTypeName,
                            amount: line.unitPrice,
                            sortOrder: 0,
                            isActive: true,
                          })}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Qty {line.quantity} • {line.chargeTypeName}</p>
                      </div>
                      <span className="font-medium text-gray-900 dark:text-white">{formatMoney(line.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="mb-2 font-semibold text-gray-900 dark:text-white">Payments</h3>
                {visit.payments.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400">No direct payment records. Charges may have been posted to folio.</p>
                ) : (
                  <div className="space-y-2">
                    {visit.payments.map((payment) => (
                      <div key={payment.id} className="flex items-start justify-between gap-3 rounded border border-gray-200 p-3 dark:border-gray-700">
                        <div>
                          <p className="text-gray-900 dark:text-white">{payment.paymentMethodName}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{payment.referenceNo || 'No reference'}</p>
                        </div>
                        <span className="font-medium text-gray-900 dark:text-white">{formatMoney(payment.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t border-gray-200 pt-3 dark:border-gray-700">
                <div className="flex items-center justify-between text-gray-700 dark:text-gray-300">
                  <span>Total</span>
                  <span>{formatMoney(visit.totalAmount)}</span>
                </div>
                <div className="mt-1 flex items-center justify-between text-gray-700 dark:text-gray-300">
                  <span>Paid</span>
                  <span>{formatMoney(visit.paidAmount)}</span>
                </div>
                <div className="mt-1 flex items-center justify-between font-semibold text-gray-900 dark:text-white">
                  <span>Balance</span>
                  <span>{formatMoney(visit.balanceAmount)}</span>
                </div>
              </div>
            </div>
          )}
        </DialogPanel>
      </div>
    </Dialog>
  );
};