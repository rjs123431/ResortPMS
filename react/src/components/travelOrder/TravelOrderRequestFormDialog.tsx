import React, { useState, useEffect } from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { travelOrderRequestService } from '@/services/travelOrderRequest.service';
import { ApplyTravelOrderDto } from '@/types/travelOrderRequest.types';
import { useAuth } from '@/contexts/AuthContext';
import { notifySuccess } from '@/utils/alerts';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface TravelOrderRequestFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

function getAbpErrorMessage(error: unknown): string {
  const response = (error as { response?: { data?: { error?: { message?: string } } } })?.response;
  return response?.data?.error?.message ?? 'Something went wrong. Please try again.';
}

export const TravelOrderRequestFormDialog: React.FC<TravelOrderRequestFormDialogProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);
  const [remarks, setRemarks] = useState('');
  const [isPaid, setIsPaid] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const today = new Date();
    setDateFrom(today);
    setDateTo(today);
    setRemarks('');
    setIsPaid(true);
    setErrors({});
    setFormError(null);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !user?.employeeId) return;

    let cancelled = false;

    travelOrderRequestService
      .getApprovers(user.employeeId, 14)
      .then((list) => {
        if (cancelled) return;
        if (list.length === 0) {
          setFormError('No approver group configured for travel order requests.');
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error('Error fetching approvers:', err);
          setFormError(getAbpErrorMessage(err));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, user?.employeeId]);

  const computedDays = (() => {
    if (!dateFrom || !dateTo) return 0;
    const from = dateFrom;
    const to = dateTo;
    if (to < from) return 0;
    const diffTime = to.getTime() - from.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  })();

  const createMutation = useMutation({
    mutationFn: (data: ApplyTravelOrderDto) => travelOrderRequestService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-travel-order-requests'] });
      notifySuccess('Travel order request submitted successfully.');
      onSuccess?.();
      onClose();
    },
    onError: (error: unknown) => {
      setFormError(getAbpErrorMessage(error));
    },
  });

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!dateFrom) next.dateFrom = 'Date from is required.';
    if (!dateTo) next.dateTo = 'Date to is required.';
    if (dateFrom && dateTo && dateTo < dateFrom) {
      next.dateTo = 'Date to must be on or after date from.';
    }
    if (!remarks.trim()) next.remarks = 'Remarks is required.';
    if (computedDays <= 0 && dateFrom && dateTo) {
      next.dateTo = 'Date to must be on or after date from.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!validate()) return;
    if (!user?.employeeId) {
      setFormError('No employee linked to your account.');
      return;
    }

    const payload: ApplyTravelOrderDto = {
      employeeId: user.employeeId,
      dateFrom: dateFrom ? `${dateFrom.toISOString().split('T')[0]}T00:00:00` : '',
      dateTo: dateTo ? `${dateTo.toISOString().split('T')[0]}T00:00:00` : '',
      noOfDays: computedDays,
      duration: computedDays,
      remarks: remarks.trim(),
      isPaid,
    };

    createMutation.mutate(payload);
  };

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onClose={onClose} className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50 pointer-events-none" aria-hidden />
      <div className="relative flex min-h-screen items-center justify-center p-4 pointer-events-none">
        <DialogPanel className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto pointer-events-auto">
          <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
            <DialogTitle as="h2" className="text-lg font-semibold text-gray-900 dark:text-white">
              New Travel Order Request
            </DialogTitle>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
            {formError && (
              <div className="rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-3 py-2 text-sm text-red-700 dark:text-red-300">
                {formError}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="dateFrom" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date From <span className="text-red-500">*</span>
                </label>
                <DatePicker
                  id="dateFrom"
                  name="dateFrom"
                  selected={dateFrom}
                  onChange={(date: Date | null) => setDateFrom(date)}
                  dateFormat="MM-dd-yyyy"
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                    errors.dateFrom ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.dateFrom && (
                  <p className="mt-1 text-sm text-red-500">{errors.dateFrom}</p>
                )}
              </div>
              <div>
                <label htmlFor="dateTo" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date To <span className="text-red-500">*</span>
                </label>
                <DatePicker
                  id="dateTo"
                  name="dateTo"
                  selected={dateTo}
                  onChange={(date: Date | null) => setDateTo(date)}
                  minDate={dateFrom || undefined}
                  dateFormat="MM-dd-yyyy"
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                    errors.dateTo ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.dateTo && (
                  <p className="mt-1 text-sm text-red-500">{errors.dateTo}</p>
                )}
              </div>
            </div>
            {(dateFrom && dateTo && computedDays > 0) && (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Duration:</span> {computedDays} day{computedDays !== 1 ? 's' : ''}
                </p>
              </div>
            )}
            <div>
              <label htmlFor="remarks" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Remarks <span className="text-red-500">*</span>
              </label>
              <textarea
                id="remarks"
                name="remarks"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows={2}
                maxLength={200}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  errors.remarks ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.remarks && (
                <p className="mt-1 text-sm text-red-500">{errors.remarks}</p>
              )}
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="travel-order-paid"
                checked={isPaid}
                onChange={(e) => setIsPaid(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="travel-order-paid" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                Paid
              </label>
            </div>
            <div className="flex flex-col gap-3 pt-4 border-t border-gray-200 dark:border-gray-700 sm:flex-row sm:items-center sm:justify-between">
              {formError ? (
                <div
                  className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
                  role="alert"
                >
                  {formError}
                </div>
              ) : (
                <span />
              )}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createMutation.isPending ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </div>
          </form>
        </DialogPanel>
      </div>
    </Dialog>
  );
};
