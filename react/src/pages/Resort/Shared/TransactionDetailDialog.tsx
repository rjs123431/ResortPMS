import React from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import type { FolioTransactionDto } from '@/types/resort.types';
import { formatMoney } from '@utils/helpers';

const getTransactionTypeLabel = (value: number) => {
  switch (value) {
    case 0: return 'Charge';
    case 1: return 'Payment';
    case 2: return 'Discount';
    case 3: return 'Adjustment';
    case 4: return 'Refund';
    case 5: return 'Deposit Payment';
    case 6: return 'Deposit Refund';
    case 7: return 'Write-Off';
    default: return `Type ${value}`;
  }
};

interface TransactionDetailDialogProps {
  open: boolean;
  transaction: FolioTransactionDto | null;
  onClose: () => void;
}

export const TransactionDetailDialog: React.FC<TransactionDetailDialogProps> = ({
  open,
  transaction,
  onClose,
}) => {
  if (!transaction) return null;

  return (
    <Dialog open={open} onClose={() => {}} className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50 pointer-events-none" aria-hidden />
      <div className="relative flex min-h-screen items-center justify-center p-4 pointer-events-none">
        <DialogPanel className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800 pointer-events-auto">
          <DialogTitle className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Transaction Detail
          </DialogTitle>

          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="font-medium text-gray-500 dark:text-gray-400">Transaction ID</dt>
              <dd className="text-gray-900 dark:text-white font-mono text-xs">{transaction.id}</dd>
            </div>

            <div className="flex justify-between">
              <dt className="font-medium text-gray-500 dark:text-gray-400">Type</dt>
              <dd className="text-gray-900 dark:text-white">
                {transaction.chargeTypeName || getTransactionTypeLabel(transaction.transactionType)}
              </dd>
            </div>

            <div className="flex justify-between">
              <dt className="font-medium text-gray-500 dark:text-gray-400">Description</dt>
              <dd className="text-gray-900 dark:text-white text-right max-w-[60%]">{transaction.description || '—'}</dd>
            </div>

            <hr className="border-gray-200 dark:border-gray-700" />

            <div className="flex justify-between">
              <dt className="font-medium text-gray-500 dark:text-gray-400">Quantity</dt>
              <dd className="text-gray-900 dark:text-white">{transaction.quantity}</dd>
            </div>

            <div className="flex justify-between">
              <dt className="font-medium text-gray-500 dark:text-gray-400">Unit Price</dt>
              <dd className="text-gray-900 dark:text-white">{formatMoney(transaction.unitPrice)}</dd>
            </div>

            <div className="flex justify-between">
              <dt className="font-medium text-gray-500 dark:text-gray-400">Amount</dt>
              <dd className="text-gray-900 dark:text-white">{formatMoney(transaction.amount)}</dd>
            </div>

            {transaction.taxAmount > 0 && (
              <div className="flex justify-between">
                <dt className="font-medium text-gray-500 dark:text-gray-400">Tax</dt>
                <dd className="text-gray-900 dark:text-white">{formatMoney(transaction.taxAmount)}</dd>
              </div>
            )}

            {transaction.discountAmount > 0 && (
              <div className="flex justify-between">
                <dt className="font-medium text-gray-500 dark:text-gray-400">Discount</dt>
                <dd className="text-gray-900 dark:text-white">-{formatMoney(transaction.discountAmount)}</dd>
              </div>
            )}

            <div className="flex justify-between border-t border-gray-200 pt-2 dark:border-gray-700">
              <dt className="font-semibold text-gray-900 dark:text-white">Net Amount</dt>
              <dd className="font-semibold text-gray-900 dark:text-white">{formatMoney(transaction.netAmount)}</dd>
            </div>

            <hr className="border-gray-200 dark:border-gray-700" />

            <div className="flex justify-between">
              <dt className="font-medium text-gray-500 dark:text-gray-400">Posted At</dt>
              <dd className="text-gray-900 dark:text-white">{new Date(transaction.transactionDate).toLocaleString()}</dd>
            </div>

            {transaction.creatorUserName && (
              <div className="flex justify-between">
                <dt className="font-medium text-gray-500 dark:text-gray-400">Posted By</dt>
                <dd className="text-gray-900 dark:text-white">{transaction.creatorUserName}</dd>
              </div>
            )}

            <div className="flex justify-between">
              <dt className="font-medium text-gray-500 dark:text-gray-400">Void Status</dt>
              <dd>
                {transaction.isVoided ? (
                  <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">Voided</span>
                ) : (
                  <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">Active</span>
                )}
              </dd>
            </div>

            {transaction.isVoided && transaction.voidReason && (
              <div className="flex justify-between">
                <dt className="font-medium text-gray-500 dark:text-gray-400">Void Reason</dt>
                <dd className="text-gray-900 dark:text-white text-right max-w-[60%]">{transaction.voidReason}</dd>
              </div>
            )}

            {transaction.isVoided && transaction.voidedAt && (
              <div className="flex justify-between">
                <dt className="font-medium text-gray-500 dark:text-gray-400">Voided At</dt>
                <dd className="text-gray-900 dark:text-white">{new Date(transaction.voidedAt).toLocaleString()}</dd>
              </div>
            )}
          </dl>

          <div className="mt-5 flex justify-end">
            <button
              type="button"
              className="rounded border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700 dark:text-white"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
};
