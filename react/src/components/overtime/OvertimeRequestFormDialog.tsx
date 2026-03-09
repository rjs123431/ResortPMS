import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { overtimeService } from '@/services/overtime.service';
import { ApplyOvertimeDto } from '@/types/overtime.types';
import { useAuth } from '@/contexts/AuthContext';

interface OvertimeRequestFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const getAbpErrorMessage = (error: unknown) => {
  const response = (error as { response?: { data?: { error?: { message?: string } } } })?.response;
  return response?.data?.error?.message || 'Something went wrong. Please try again.';
};

const formatDateLocal = (value: Date) => {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
};

const formatDateTimeLocal = (value: Date) => {
  const pad = (n: number) => n.toString().padStart(2, '0');
  const hours12 = value.getHours() % 12 || 12;
  const ampm = value.getHours() >= 12 ? 'PM' : 'AM';
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())} ${pad(hours12)}:${pad(value.getMinutes())} ${ampm}`;
};

/** Same-day only: end must be after start; if end <= start returns 0. */
const computeHoursBetweenDates = (start: Date | null, end: Date | null): number => {
  if (!start || !end || end <= start) return 0;
  return Math.round(((end.getTime() - start.getTime()) / (1000 * 60 * 60)) * 100) / 100;
};

export const OvertimeRequestFormDialog: React.FC<OvertimeRequestFormDialogProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  // Escape key handler
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);
  const datePickerRef = useRef<any>(null);

  const [formData, setFormData] = useState<ApplyOvertimeDto>({
    employeeId: user?.employeeId || 0,
    date: '',
    startTime: null,
    endTime: null,
    noOfHours: 0,
    remarks: '',
    isPreShift: false,
    approver1Id: undefined,
    approver2Id: undefined,
    approver3Id: undefined,
    approver1Name: undefined,
    approver2Name: undefined,
    approver3Name: undefined,
  });

  const [dateStr, setDateStr] = useState('');
  const [startDateTime, setStartDateTime] = useState<Date | null>(null);
  const [endDateTime, setEndDateTime] = useState<Date | null>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [approvers, setApprovers] = useState<{
    approver1Id?: number;
    approver2Id?: number;
    approver3Id?: number;
    approver1Name?: string;
    approver2Name?: string;
    approver3Name?: string;
  }>({});

  useEffect(() => {
    if (!isOpen) return;

    setFormData({
      employeeId: user?.employeeId || 0,
      date: '',
      startTime: null,
      endTime: null,
      noOfHours: 0,
      remarks: '',
      isPreShift: false,
      approver1Id: undefined,
      approver2Id: undefined,
      approver3Id: undefined,
      approver1Name: undefined,
      approver2Name: undefined,
      approver3Name: undefined,
    });
    setDateStr('');
    setStartDateTime(null);
    setEndDateTime(null);
    setErrors({});
    setFormError(null);
    setApprovers({});
  }, [isOpen, user?.employeeId]);

  useEffect(() => {
    if (!isOpen || !user?.employeeId) return;

    let isActive = true;

    overtimeService
      .getApprovers(user.employeeId, 2)
      .then((list) => {
        if (!isActive) return;

        const approverData: typeof approvers = {};
        list.forEach((approver) => {
          if (approver.level === 1) {
            approverData.approver1Id = approver.approverEmployeeId;
            approverData.approver1Name = approver.approverName;
          }
          if (approver.level === 2) {
            approverData.approver2Id = approver.approverEmployeeId;
            approverData.approver2Name = approver.approverName;
          }
          if (approver.level === 3) {
            approverData.approver3Id = approver.approverEmployeeId;
            approverData.approver3Name = approver.approverName;
          }
        });

        setApprovers(approverData);

        // Also update formData with approver information
        setFormData((prev) => ({
          ...prev,
          approver1Id: approverData.approver1Id,
          approver2Id: approverData.approver2Id,
          approver3Id: approverData.approver3Id,
          approver1Name: approverData.approver1Name,
          approver2Name: approverData.approver2Name,
          approver3Name: approverData.approver3Name,
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

  // Auto-calculate hours when inputs change (same-day only; end <= start => 0 hours)
  useEffect(() => {
    const hours = computeHoursBetweenDates(startDateTime, endDateTime);

    setFormData((prev) => ({
      ...prev,
      date: dateStr,
      startTime: startDateTime ? formatDateTimeLocal(startDateTime) : null,
      endTime: endDateTime ? formatDateTimeLocal(endDateTime) : null,
      noOfHours: hours,
    }));
  }, [dateStr, startDateTime, endDateTime]);

  const startTimeMinDate = useMemo(() => {
    if (!dateStr) return undefined;
    return new Date(`${dateStr}T00:00`);
  }, [dateStr]);

  const endTimeMinDate = useMemo(() => {
    if (!startDateTime) return undefined;
    return new Date(startDateTime);
  }, [startDateTime]);

  const endTimeMinTime = useMemo(() => {
    if (!startDateTime) return undefined;
    const dt = new Date(startDateTime);
    dt.setMinutes(dt.getMinutes() + 30);
    return dt;
  }, [startDateTime]);

  const endTimeMaxTime = useMemo(() => {
    return new Date(0, 0, 0, 23, 59); // 11:59 PM
  }, []);

  const createMutation = useMutation({
    mutationFn: (data: ApplyOvertimeDto) => overtimeService.createOvertimeRequest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-overtimes'] });
      onSuccess?.();
      onClose();
    },
    onError: (error: unknown) => {
      console.error('Error creating overtime request:', error);
      setFormError(getAbpErrorMessage(error));
    },
  });

  const updateField = (field: keyof ApplyOvertimeDto, value: string | number | boolean | null) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleStartDateTimeChange = (date: Date | null) => {
    const effectiveEnd = date && endDateTime && endDateTime <= date ? date : endDateTime;
    setStartDateTime(date);
    if (date && endDateTime && endDateTime <= date) {
      setEndDateTime(date);
    }
    if (date && effectiveEnd) {
      const hours = computeHoursBetweenDates(date, effectiveEnd);
      setFormData((prev) => ({
        ...prev,
        startTime: formatDateTimeLocal(date),
        endTime: formatDateTimeLocal(effectiveEnd),
        noOfHours: hours,
      }));
    }
  };

  const validateForm = () => {
    const nextErrors: Record<string, string> = {};

    if (!formData.date) nextErrors.date = 'Date is required';
    if (!formData.startTime) nextErrors.startTime = 'Start time is required';
    if (!formData.endTime) nextErrors.endTime = 'End time is required';

    if (startDateTime && endDateTime) {
      // Check if end time is less than or equal to start time
      if (endDateTime <= startDateTime) {
        nextErrors.endTime = 'End time must be after start time';
      }
    }

    if (!formData.noOfHours || formData.noOfHours <= 0) {
      nextErrors.noOfHours = 'Number of hours must be greater than 0';
    }

    if (!formData.remarks || !formData.remarks.trim()) {
      nextErrors.remarks = 'Remarks is required';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!validateForm()) return;
    createMutation.mutate(formData);
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onClose={() => {}} className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center px-4 bg-black/50">
        <DialogPanel className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-lg shadow-lg">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <DialogTitle as="h2" className="text-lg font-semibold text-gray-900 dark:text-white">Overtime Request</DialogTitle>
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
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Shift Date <span className="text-red-500">*</span>
                </label>
                <DatePicker
                  ref={datePickerRef}
                  id="date"
                  name="date"
                  selected={dateStr ? new Date(dateStr) : null}
                  onChange={(date: Date | null) => {
                    if (!date) return;
                    const ds = formatDateLocal(date);
                    setDateStr(ds);
                    // Update the date part of start and end times to match the new shift date
                    if (startDateTime) {
                      const newStart = new Date(startDateTime);
                      newStart.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
                      setStartDateTime(newStart);
                    } else {
                      // Set default start time if none exists
                      setStartDateTime(new Date(date.getFullYear(), date.getMonth(), date.getDate(), 17, 0));
                    }
                    if (endDateTime) {
                      const newEnd = new Date(endDateTime);
                      newEnd.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
                      setEndDateTime(newEnd);
                    } else {
                      // Set default end time if none exists (1 hour after start)
                      const startDT = startDateTime || new Date(date.getFullYear(), date.getMonth(), date.getDate(), 17, 0);
                      const endDT = new Date(startDT);
                      endDT.setHours(endDT.getHours() + 1);
                      setEndDateTime(endDT);
                    }
                  }}
                  dateFormat="MM-dd-yyyy"
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${errors.date ? 'border-red-500' : 'border-gray-300'}`}
                  wrapperClassName='w-full'
                />
                {errors.date && <p className="mt-1 text-sm text-red-500">{errors.date}</p>}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Start Date & Time <span className="text-red-500">*</span>
                </label>
                <DatePicker
                  id="startTime"
                  name="startTime"
                  selected={startDateTime}
                  onChange={handleStartDateTimeChange}
                  showTimeSelect
                  timeFormat="h:mm aa"
                  timeIntervals={5}
                  timeCaption="Time"
                  dateFormat="MM-dd-yyyy h:mm aa"
                  minDate={startTimeMinDate}
                  wrapperClassName='w-full'
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${errors.startTime ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.startTime && <p className="mt-1 text-sm text-red-500">{errors.startTime}</p>}
              </div>
              <div>
                <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  End Date & Time <span className="text-red-500">*</span>
                </label>
                <DatePicker
                  id="endTime"
                  name="endTime"
                  selected={endDateTime}
                  onChange={(date: Date | null) => setEndDateTime(date)}
                  showTimeSelect
                  timeFormat="h:mm aa"
                  timeIntervals={5}
                  timeCaption="Time"
                  dateFormat="MM-dd-yyyy h:mm aa"
                  minDate={endTimeMinDate}
                  minTime={endTimeMinTime}
                  maxTime={endTimeMaxTime}
                  wrapperClassName='w-full'
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${errors.endTime ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.endTime && <p className="mt-1 text-sm text-red-500">{errors.endTime}</p>}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="noOfHours" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  No. of Hours <span className="text-red-500">*</span>
                </label>
                <input
                  id="noOfHours"
                  type="number"
                  step="0.01"
                  min="0"
                  readOnly
                  value={formData.noOfHours}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm bg-gray-100 dark:bg-gray-600 dark:border-gray-600 dark:text-white cursor-not-allowed ${errors.noOfHours ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.noOfHours && <p className="mt-1 text-sm text-red-500">{errors.noOfHours}</p>}
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
                onChange={(e) => updateField('remarks', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${errors.remarks ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.remarks && <p className="mt-1 text-sm text-red-500">{errors.remarks}</p>}
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
