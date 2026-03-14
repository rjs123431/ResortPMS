import React, { useEffect, useState } from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { missedPunchService } from '@/services/missed-punch.service';
import { ApplyMissedPunchDto } from '@/types/missed-punch.types';
import { useAuth } from '@/contexts/AuthContext';

interface MissedPunchRequestFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const logStateOptions = [
  { value: 0, label: 'In' },
  { value: 1, label: 'Out' },
];

const getAbpErrorMessage = (error: unknown) => {
  const response = (error as { response?: { data?: { error?: { message?: string } } } })?.response;
  return response?.data?.error?.message || 'Something went wrong. Please try again.';
};

const formatDateTimeLocal = (value: Date) => {
  const pad = (n: number) => n.toString().padStart(2, '0');
  const hours12 = value.getHours() % 12 || 12;
  const ampm = value.getHours() >= 12 ? 'PM' : 'AM';
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())} ${pad(hours12)}:${pad(value.getMinutes())} ${ampm}`;
};

export const MissedPunchRequestFormDialog: React.FC<MissedPunchRequestFormDialogProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  // Escape key handler
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<ApplyMissedPunchDto>({
    employeeId: user?.employeeId || 0,
    logDateTime: formatDateTimeLocal(new Date()),
    logState: 0,
    remarks: '',
    approver1Id: undefined,
    approver2Id: undefined,
    approver3Id: undefined,
    approver1Name: undefined,
    approver2Name: undefined,
    approver3Name: undefined,
  });

  const [logDateTime, setLogDateTime] = useState<Date>(new Date());

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      logDateTime: formatDateTimeLocal(logDateTime),
    }));
  }, [logDateTime]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setFormData({
      employeeId: user?.employeeId || 0,
      logDateTime: formatDateTimeLocal(new Date()),
      logState: 0,
      remarks: '',
      approver1Id: undefined,
      approver2Id: undefined,
      approver3Id: undefined,
      approver1Name: undefined,
      approver2Name: undefined,
      approver3Name: undefined,
    });
    setLogDateTime(new Date());
    setErrors({});
    setFormError(null);
  }, [isOpen, user?.employeeId]);

  useEffect(() => {
    if (!isOpen || !user?.employeeId) {
      return;
    }

    let isActive = true;

    missedPunchService
      .getApprovers(user.employeeId, 13)
      .then((list) => {
        if (!isActive) return;

        const approverIds = {
          approver1Id: undefined as number | undefined,
          approver2Id: undefined as number | undefined,
          approver3Id: undefined as number | undefined,
          approver1Name: undefined as string | undefined,
          approver2Name: undefined as string | undefined,
          approver3Name: undefined as string | undefined,
        };

        list.forEach((approver) => {
          if (approver.level === 1) {
            approverIds.approver1Id = approver.approverEmployeeId;
            approverIds.approver1Name = approver.approverName;
          }
          if (approver.level === 2) {
            approverIds.approver2Id = approver.approverEmployeeId;
            approverIds.approver2Name = approver.approverName;
          }
          if (approver.level === 3) {
            approverIds.approver3Id = approver.approverEmployeeId;
            approverIds.approver3Name = approver.approverName;
          }
        });

        setFormData((prev) => ({
          ...prev,
          ...approverIds,
        }));
      })
      .catch((error) => {
        if (!isActive) return;
        console.error('Error fetching approvers:', error);
        setFormError(getAbpErrorMessage(error));
      });

    return () => {
      isActive = false;
    };
  }, [isOpen, user?.employeeId]);

  const createMutation = useMutation({
    mutationFn: (data: ApplyMissedPunchDto) => missedPunchService.createMissedPunchRequest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-missed-punches'] });
      onSuccess?.();
      onClose();
    },
    onError: (error: unknown) => {
      console.error('Error creating non-swipe request:', error);
      setFormError(getAbpErrorMessage(error));
    },
  });

  const updateField = (field: keyof ApplyMissedPunchDto, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = () => {
    const nextErrors: Record<string, string> = {};

    if (!formData.logDateTime) {
      nextErrors.logDateTime = 'Log date and time is required';
    }

    if (formData.logState === undefined || formData.logState === null) {
      nextErrors.logState = 'Log state is required';
    }

    if (!formData.approver1Id) {
      nextErrors.approver1Id = 'Approver is required';
    }

    if (!formData.remarks || !formData.remarks.trim()) {
      nextErrors.remarks = 'Remarks is required';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!validateForm()) {
      return;
    }
    createMutation.mutate(formData);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <Dialog open={isOpen} onClose={() => {}} className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50 pointer-events-none" aria-hidden />
      <div className="relative flex min-h-screen items-center justify-center px-4 pointer-events-none">
        <DialogPanel className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-lg shadow-lg pointer-events-auto">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <DialogTitle as="h2" className="text-lg font-semibold text-gray-900 dark:text-white">Non-Swipe Request</DialogTitle>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {formError && (
              <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {formError}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="logDateTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Log Date & Time <span className="text-red-500">*</span>
                </label>
                <DatePicker
                  id="logDateTime"
                  name="logDateTime"
                  selected={logDateTime}
                  onChange={(date: Date | null) => date && setLogDateTime(date)}
                  showTimeSelect
                  timeFormat="hh:mm aa"
                  timeIntervals={5}
                  timeCaption="Time"
                  dateFormat="yyyy-MM-dd hh:mm aa"
                  maxDate={new Date()}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                    errors.logDateTime ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.logDateTime && (
                  <p className="mt-1 text-sm text-red-500">{errors.logDateTime}</p>
                )}
              </div>
              <div>
                <label htmlFor="logState" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Log State <span className="text-red-500">*</span>
                </label>
                <select
                  id="logState"
                  name="logState"
                  value={formData.logState}
                  onChange={(event) => updateField('logState', Number(event.target.value))}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                    errors.logState ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  {logStateOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.logState && (
                  <p className="mt-1 text-sm text-red-500">{errors.logState}</p>
                )}
              </div>
            </div>
            <div>
              <label htmlFor="remarks" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Remarks <span className="text-red-500">*</span>
              </label>
              <textarea
                id="remarks"
                name="remarks"
                rows={3}
                value={formData.remarks}
                onChange={(event) => updateField('remarks', event.target.value)}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  errors.remarks ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.remarks && (
                <p className="mt-1 text-sm text-red-500">{errors.remarks}</p>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50"
              >
                {createMutation.isPending ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </form>
        </DialogPanel>
      </div>
    </Dialog>
  );
};
