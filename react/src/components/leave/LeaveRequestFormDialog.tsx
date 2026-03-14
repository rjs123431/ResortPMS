import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leaveService } from '@/services/leave.service';
import { ApplyLeaveDto, LeaveTypeDto } from '@/types/leave.types';
import { useAuth } from '@/contexts/AuthContext';
import { notifyError } from '@/utils/alerts';

interface LeaveRequestFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  leaveRequestId?: number;
  onSuccess?: () => void;
}

const dayTypeOptions = [
  { id: 1, name: 'Whole Day' },
  { id: 2, name: 'Half Day' },
];

const maxAttachmentSize = 5 * 1024 * 1024;
const allowedAttachmentTypes = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const getAbpErrorMessage = (error: unknown) => {
  const response = (error as { response?: { data?: { error?: { message?: string } } } })?.response;
  return response?.data?.error?.message || 'Something went wrong. Please try again.';
};

export const LeaveRequestFormDialog: React.FC<LeaveRequestFormDialogProps> = ({
  isOpen,
  onClose,
  leaveRequestId,
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
  const attachmentInputRef = useRef<HTMLInputElement | null>(null);
  
  const [formData, setFormData] = useState<ApplyLeaveDto>({
    employeeId: user?.employeeId || 0,
    leaveTypeId: 0,
    dateFrom: '',
    dateTo: '',
    startTime: '8:00 AM',
    endTime: '5:00 PM',
    noOfHours: 8,
    noOfDays: 1,
    remarks: '',
    isPaid: true,
    dayType: 1,
    duration: 1,
    approver1Id: undefined,
    approver2Id: undefined,
    approver3Id: undefined,
    approver1Name: undefined,
    approver2Name: undefined,
    approver3Name: undefined,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [leaveBalance, setLeaveBalance] = useState<number>(0);
  const [formError, setFormError] = useState<string | null>(null);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // DatePicker state
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(() => {
    const date = new Date();
    date.setHours(8, 0, 0, 0);
    return date;
  });
  const [endTime, setEndTime] = useState<Date | null>(() => {
    const date = new Date();
    date.setHours(17, 0, 0, 0);
    return date;
  });

  // Fetch leave types
  const { data: leaveTypes = [], isLoading: isLoadingLeaveTypes } = useQuery<LeaveTypeDto[]>({
    queryKey: ['leave-types'],
    queryFn: ({ signal }) => leaveService.getLeaveTypes(signal),
  });

  const selectedLeaveType = leaveTypes.find((type) => type.id === formData.leaveTypeId) || null;
  const isMultiDay = Boolean(
    formData.dateFrom &&
    formData.dateTo &&
    formData.dateFrom !== formData.dateTo
  );

  // Fetch existing leave request if editing
  const { data: existingLeave } = useQuery({
    queryKey: ['leave-request', leaveRequestId],
    queryFn: ({ signal }) => leaveService.getLeaveRequest(leaveRequestId!, signal),
    enabled: !!leaveRequestId,
  });

  useEffect(() => {
    if (existingLeave) {
      // Convert 24-hour time to 12-hour format with AM/PM for DatePicker
      function to12Hour(time: string) {
        if (!time) return '';
        let [h, m] = time.split(':');
        let hours = parseInt(h, 10);
        const minutes = m;
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        if (hours === 0) hours = 12;
        return `${hours}:${minutes} ${ampm}`;
      }

      const dateFromObj = new Date(existingLeave.dateFrom.split('T')[0]);
      const dateToObj = new Date(existingLeave.dateTo.split('T')[0]);
      const startTimeStr = existingLeave.startTime ? existingLeave.startTime.substring(11, 16) : '08:00';
      const endTimeStr = existingLeave.endTime ? existingLeave.endTime.substring(11, 16) : '17:00';

      // Parse time strings safely
      const [startHour, startMinute] = startTimeStr.split(':').map(s => parseInt(s, 10));
      const [endHour, endMinute] = endTimeStr.split(':').map(s => parseInt(s, 10));

      setFormData({
        ...existingLeave,
        dateFrom: existingLeave.dateFrom.split('T')[0],
        dateTo: existingLeave.dateTo.split('T')[0],
        startTime: to12Hour(startTimeStr),
        endTime: to12Hour(endTimeStr),
      });

      setDateFrom(dateFromObj);
      setDateTo(dateToObj);
      setStartTime(new Date(dateFromObj.getFullYear(), dateFromObj.getMonth(), dateFromObj.getDate(),
        isNaN(startHour) ? 8 : startHour, isNaN(startMinute) ? 0 : startMinute));
      setEndTime(new Date(dateFromObj.getFullYear(), dateFromObj.getMonth(), dateFromObj.getDate(),
        isNaN(endHour) ? 17 : endHour, isNaN(endMinute) ? 0 : endMinute));

      setAttachments([]);
      setAttachmentError(null);
    } else if (isOpen) {
      // Reset form when opening for new request
      const today = new Date();
      setFormData({
        employeeId: user?.employeeId || 0,
        leaveTypeId: 0,
        dateFrom: today.toISOString().split('T')[0],
        dateTo: today.toISOString().split('T')[0],
        startTime: '8:00 AM',
        endTime: '5:00 PM',
        noOfHours: 8,
        noOfDays: 1,
        remarks: '',
        isPaid: true,
        dayType: 1,
        duration: 1,
        approver1Id: undefined,
        approver2Id: undefined,
        approver3Id: undefined,
        approver1Name: undefined,
        approver2Name: undefined,
        approver3Name: undefined,
      });
      setDateFrom(today);
      setDateTo(today);
      setStartTime(new Date(today.getFullYear(), today.getMonth(), today.getDate(), 8, 0));
      setEndTime(new Date(today.getFullYear(), today.getMonth(), today.getDate(), 17, 0));
      setErrors({});
      setLeaveBalance(0);
      setFormError(null);
      setAttachments([]);
      setAttachmentError(null);
    }
  }, [existingLeave, isOpen, user?.employeeId]);

  // Sync DatePicker state with formData
  useEffect(() => {
    if (formData.dateFrom) {
      setDateFrom(new Date(formData.dateFrom));
    }
  }, [formData.dateFrom]);

  useEffect(() => {
    if (formData.dateTo) {
      setDateTo(new Date(formData.dateTo));
    }
  }, [formData.dateTo]);

  // Sync formData with DatePicker state
  useEffect(() => {
    if (dateFrom) {
      const dateStr = dateFrom.toISOString().split('T')[0];
      setFormData(prev => ({ ...prev, dateFrom: dateStr }));
    }
  }, [dateFrom]);

  useEffect(() => {
    if (dateTo) {
      const dateStr = dateTo.toISOString().split('T')[0];
      setFormData(prev => ({ ...prev, dateTo: dateStr }));
    }
  }, [dateTo]);

  // Sync time picker state with formData
  useEffect(() => {
    if (startTime && startTime instanceof Date && !isNaN(startTime.getTime())) {
      const timeStr = startTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      setFormData(prev => ({ ...prev, startTime: timeStr }));
    }
  }, [startTime]);

  useEffect(() => {
    if (endTime && endTime instanceof Date && !isNaN(endTime.getTime())) {
      const timeStr = endTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      setFormData(prev => ({ ...prev, endTime: timeStr }));
    }
  }, [endTime]);

  // Handle day type changes - clear/reset time pickers
  useEffect(() => {
    if (formData.dayType === 1) { // Whole day
      setStartTime(null);
      setEndTime(null);
      setFormData(prev => ({ ...prev, startTime: '', endTime: '' }));
    } else if (formData.dayType === 2) { // Half day
      if (!startTime) {
        const date = new Date();
        date.setHours(8, 0, 0, 0);
        setStartTime(date);
      }
      if (!endTime) {
        const date = new Date();
        date.setHours(17, 0, 0, 0);
        setEndTime(date);
      }
    }
  }, [formData.dayType]);

  useEffect(() => {
    if (!isOpen || !user?.employeeId) {
      return;
    }

    let isActive = true;

    leaveService
      .getApprovers(user.employeeId, 1)
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

  // Fetch leave balance when leave type changes
  // Store both balance and pending
  const [pendingLeave, setPendingLeave] = React.useState<number>(0);

  // Helper to format days
  function formatDays(days: number): string {
    const isWhole = Number.isInteger(days);
    const value = isWhole ? days.toString() : days.toFixed(1);
    const absDays = Math.abs(days);
    const label = absDays === 1 ? 'day' : 'days';
    return `${value} ${label}`;
  }
  useEffect(() => {
    const fetchBalance = async () => {
      if (!formData.leaveTypeId || !selectedLeaveType?.creditRequired) {
        setLeaveBalance(0);
        setPendingLeave(0);
        return;
      }

      try {
        const result = await leaveService.getLeaveBalance(formData.leaveTypeId);
        setLeaveBalance(result.balance);
        setPendingLeave(result.pendingRequests || 0);
      } catch (error) {
        console.error('Error fetching leave balance:', error);
        setLeaveBalance(0);
        setPendingLeave(0);
      }
    };
    fetchBalance();
  }, [formData.leaveTypeId, selectedLeaveType?.creditRequired]);

  // Calculate number of days based on date range and day type
  useEffect(() => {
    if (formData.dateFrom && formData.dateTo) {
      if (formData.dateFrom !== formData.dateTo && formData.dayType !== 1) {
        setFormData((prev) => ({ ...prev, dayType: 1 }));
        return;
      }

      const from = new Date(formData.dateFrom);
      const to = new Date(formData.dateTo);
      const diffTime = Math.abs(to.getTime() - from.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      
      let calculatedDays = diffDays;
      if (formData.dayType === 2) { // Half day
        calculatedDays = 0.5;
      }
      
      setFormData(prev => ({ ...prev, noOfDays: calculatedDays, duration: calculatedDays }));
    }
  }, [formData.dateFrom, formData.dateTo, formData.dayType]);

  // Calculate number of hours based on start/end time
  useEffect(() => {
    if (!formData.startTime || !formData.endTime) {
      return;
    }

    // Helper to parse 12-hour time with AM/PM
    function parseTime12h(timeStr: string): number {
      // Expects format like '2:30 PM' or '11:15 AM'
      const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*([AP]M)$/i);
      if (!match) return NaN;
      let hours = parseInt(match[1], 10);
      const minutes = parseInt(match[2], 10);
      const ampm = match[3].toUpperCase();
      if (ampm === 'PM' && hours !== 12) hours += 12;
      if (ampm === 'AM' && hours === 12) hours = 0;
      return hours * 60 + minutes;
    }

    const startTotalMinutes = parseTime12h(formData.startTime.trim());
    const endTotalMinutes = parseTime12h(formData.endTime.trim());

    if (Number.isNaN(startTotalMinutes) || Number.isNaN(endTotalMinutes)) {
      return;
    }

    const diffMinutes = Math.max(0, endTotalMinutes - startTotalMinutes);
    const calculatedHours = Math.round((diffMinutes / 60) * 100) / 100;

    setFormData(prev => ({ ...prev, noOfHours: calculatedHours }));
  }, [formData.startTime, formData.endTime]);

  const createMutation = useMutation({
    mutationFn: (data: ApplyLeaveDto) => leaveService.createLeaveRequest(data),
  });

  const updateMutation = useMutation({
    mutationFn: (data: ApplyLeaveDto) => leaveService.updateLeaveRequest(data),
  });

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.leaveTypeId) {
      newErrors.leaveTypeId = 'Leave type is required';
    }
    if (!formData.dateFrom) {
      newErrors.dateFrom = 'Date from is required';
    }
    if (!formData.dateTo) {
      newErrors.dateTo = 'Date to is required';
    }
    if (formData.dateFrom && formData.dateTo && formData.dateFrom > formData.dateTo) {
      newErrors.dateTo = 'Date to must be after date from';
    }
    if (!formData.remarks || formData.remarks.trim() === '') {
      newErrors.remarks = 'Remarks is required';
    }

    // Custom validation: For half-day, noOfHours must not exceed 4.5
    if (formData.dayType === 2 && formData.noOfHours > 4.5) {
      notifyError('Invalid time for half-day');
      return false;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    
    if (!validateForm()) {
      return;
    }

    const submitData: ApplyLeaveDto = {
      ...formData,
      dateFrom: `${formData.dateFrom}T00:00:00`,
      dateTo: `${formData.dateTo}T00:00:00`,
      startTime: startTime ? startTime.toISOString() : null,
      endTime: endTime ? endTime.toISOString() : null,
    };

    try {
      let savedId = leaveRequestId;

      if (leaveRequestId) {
        await updateMutation.mutateAsync(submitData);
      } else {
        const result = await createMutation.mutateAsync(submitData);
        savedId = result?.id;
      }

      if (attachments.length > 0 && savedId) {
        setIsUploading(true);
        try {
          await leaveService.uploadLeaveRequestAttachment(savedId, attachments);
        } catch (error) {
          console.error('Error uploading attachment:', error);
          notifyError('Leave request saved but attachment upload failed.');
        } finally {
          setIsUploading(false);
        }
      }

      await queryClient.invalidateQueries({ queryKey: ['my-leaves'] });
      if (leaveRequestId) {
        await queryClient.invalidateQueries({ queryKey: ['leave-request', leaveRequestId] });
      }

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error saving leave request:', error);
      setFormError(getAbpErrorMessage(error));
    }
  };

  const handleAttachmentChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);

    if (files.length === 0) {
      setAttachments([]);
      setAttachmentError(null);
      return;
    }

    const tooLargeFile = files.find((file) => file.size > maxAttachmentSize);
    if (tooLargeFile) {
      setAttachmentError('Each file must be 5 MB or smaller.');
      setAttachments([]);
      if (attachmentInputRef.current) {
        attachmentInputRef.current.value = '';
      }
      return;
    }

    const invalidTypeFile = files.find((file) => !allowedAttachmentTypes.includes(file.type));
    if (invalidTypeFile) {
      setAttachmentError('Unsupported file type.');
      setAttachments([]);
      if (attachmentInputRef.current) {
        attachmentInputRef.current.value = '';
      }
      return;
    }

    setAttachmentError(null);
    setAttachments(files);
  };

  const clearAttachments = () => {
    setAttachments([]);
    setAttachmentError(null);
    if (attachmentInputRef.current) {
      attachmentInputRef.current.value = '';
    }
  };

  const handleChange = (field: keyof ApplyLeaveDto, value: any) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };

      if (field === 'leaveTypeId') {
        const nextType = leaveTypes.find((type) => type.id === Number(value));
        if (nextType) {
          next.isPaid = nextType.isPaid ? true : false;
        }
        setLeaveBalance(0);
        setFormError(null);
        if (errors.leaveTypeId) {
          setErrors((prevErrors) => ({ ...prevErrors, leaveTypeId: '' }));
        }
      }

      if (field === 'dateFrom') {
        const nextDateFrom = String(value || '');
        const nextDateTo = prev.dateTo || '';

        if (nextDateFrom && (!nextDateTo || nextDateFrom > nextDateTo)) {
          next.dateTo = nextDateFrom;
        }
      }

      return next;
    });

    // Clear error when field is modified
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onClose={() => {}} className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50 pointer-events-none" aria-hidden />
      <div className="relative flex min-h-screen items-center justify-center p-4 pointer-events-none">
        <DialogPanel className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto pointer-events-auto">
          <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
            <DialogTitle as="h2" className="text-lg font-semibold text-gray-900 dark:text-white">
              {leaveRequestId ? 'Edit Leave Request' : 'Apply for Leave'}
            </DialogTitle>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
            {/* Leave Type + Available Balance */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="leaveTypeId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Leave Type <span className="text-red-500">*</span>
                </label>
                <select
                  id="leaveTypeId"
                  name="leaveTypeId"
                  value={formData.leaveTypeId}
                  onChange={(e) => handleChange('leaveTypeId', Number(e.target.value))}
                  disabled={isLoadingLeaveTypes}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                    errors.leaveTypeId ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value={0}>{isLoadingLeaveTypes ? 'Loading...' : 'Select Leave Type'}</option>
                  {leaveTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
                {errors.leaveTypeId && (
                  <p className="mt-1 text-sm text-red-500">{errors.leaveTypeId}</p>
                )}
              </div>
              {formData.leaveTypeId > 0 && selectedLeaveType?.creditRequired ? (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-3 flex flex-col gap-1">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    <span className="font-medium">Available Balance:</span>{' '}
                    <span className="text-blue-600 dark:text-blue-400 font-semibold">
                      {formatDays(leaveBalance)}
                    </span>
                  </p>
                  {pendingLeave > 0 && (
                    <p className="text-xs text-yellow-700 dark:text-yellow-400">
                      <span className="font-medium">Pending:</span> {formatDays(pendingLeave)} (awaiting approval)
                    </p>
                  )}
                </div>
              ) : (
                <div className="p-3 flex items-center"></div>
              )}
            </div>

            {/* Date From and Date To */}
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
                {errors.dateFrom ? (
                  <p className="mt-1 text-sm text-red-500">{errors.dateFrom}</p>
                ) : null}
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

            {/* Day Type */}
            <div>
              <label htmlFor="dayType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Days <span className="text-red-500">*</span>
              </label>
              <select
                id="dayType"
                name="dayType"
                value={formData.dayType}
                onChange={(e) => handleChange('dayType', Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                {dayTypeOptions.map((type) => (
                  <option
                    key={type.id}
                    value={type.id}
                    disabled={isMultiDay && type.id === 2}
                  >
                    {type.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Start Time and End Time - Only show for Half Day */}
            {formData.dayType === 2 && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Start Time
                  </label>
                  <DatePicker
                    id="startTime"
                    name="startTime"
                    selected={startTime}
                    onChange={(date: Date | null) => setStartTime(date)}
                    showTimeSelect
                    showTimeSelectOnly
                    timeIntervals={15}
                    timeCaption="Start Time"
                    dateFormat="h:mm aa"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div>
                  <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    End Time
                  </label>
                  <DatePicker
                    id="endTime"
                    name="endTime"
                    selected={endTime}
                    onChange={(date: Date | null) => setEndTime(date)}
                    showTimeSelect
                    showTimeSelectOnly
                    timeIntervals={15}
                    timeCaption="End Time"
                    dateFormat="h:mm aa"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>
            )}

            {/* Remarks */}
            <div>
              <label htmlFor="remarks" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Remarks <span className="text-red-500">*</span>
              </label>
              <textarea
                id="remarks"
                name="remarks"
                value={formData.remarks}
                onChange={(e) => handleChange('remarks', e.target.value)}
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

            {/* Attachments */}
            <div>
              <label htmlFor="leaveAttachments" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Attachments
              </label>
              <input
                ref={attachmentInputRef}
                type="file"
                id="leaveAttachments"
                name="leaveAttachments"
                multiple
                onChange={handleAttachmentChange}
                accept={allowedAttachmentTypes.join(',')}
                className="w-full text-sm text-gray-700 file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100 dark:text-gray-200 dark:file:bg-blue-900/30 dark:file:text-blue-300"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Max size: 5 MB per file. Accepted: JPG, PNG, GIF, PDF, DOC, DOCX.
              </p>
              {attachmentError ? (
                <p className="mt-1 text-sm text-red-500">{attachmentError}</p>
              ) : null}
              {attachments.length > 0 ? (
                <div className="mt-2 space-y-1">
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-300">Selected files:</p>
                  <ul className="text-xs text-gray-600 dark:text-gray-300">
                    {attachments.map((file) => (
                      <li key={`${file.name}-${file.size}`}>{file.name}</li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={clearAttachments}
                    className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    Clear attachments
                  </button>
                </div>
              ) : null}
            </div>

            {/* Paid Leave Checkbox */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isPaid"
                checked={formData.isPaid}
                disabled={!selectedLeaveType?.isPaid}
                onChange={(e) => handleChange('isPaid', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isPaid" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                Paid Leave
              </label>
            </div>

            {/* Form Actions */}
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
                  disabled={createMutation.isPending || updateMutation.isPending || isUploading}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createMutation.isPending || updateMutation.isPending || isUploading ? 'Saving...' : 'Submit'}
                </button>
              </div>
            </div>
          </form>
        </DialogPanel>
      </div>
    </Dialog>
  );
};
