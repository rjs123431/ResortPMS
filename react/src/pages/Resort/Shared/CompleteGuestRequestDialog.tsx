import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { HousekeepingTaskStatus, HousekeepingTaskType, type GuestRequestCompletionContextDto } from '@/types/resort.types';

type CompleteGuestRequestDialogProps = {
  open: boolean;
  context?: GuestRequestCompletionContextDto;
  isLoading?: boolean;
  isSaving?: boolean;
  onClose: () => void;
  onComplete: (remarks?: string) => void;
};

const toDateTime = (value?: string) => {
  if (!value) return '-';
  return new Date(value).toLocaleString();
};

export const CompleteGuestRequestDialog = ({
  open,
  context,
  isLoading = false,
  isSaving = false,
  onClose,
  onComplete,
}: CompleteGuestRequestDialogProps) => {
  const [remarks, setRemarks] = useState('');

  useEffect(() => {
    if (open) {
      setRemarks('');
    }
  }, [open]);

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

  const hasOpenTasks = useMemo(
    () => (context?.relatedTasks ?? []).some((task) => task.status !== HousekeepingTaskStatus.Completed),
    [context?.relatedTasks],
  );

  return (
    <Dialog open={open} onClose={() => {}} className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/40" aria-hidden />
      <div className="flex min-h-screen items-center justify-center p-4">
        <DialogPanel className="w-full max-w-3xl rounded-lg bg-white p-4 shadow-xl dark:bg-gray-800">
          <DialogTitle as="h3" className="text-lg font-semibold text-gray-900 dark:text-white">Complete Guest Request</DialogTitle>

          {isLoading ? (
            <p className="mt-3 text-sm text-gray-500">Loading guest request details...</p>
          ) : !context ? (
            <p className="mt-3 text-sm text-gray-500">Unable to load guest request details.</p>
          ) : (
            <div className="mt-3 space-y-4 text-sm">
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                <p><span className="font-medium">Status:</span> {context.status}</p>
                <p><span className="font-medium">Requested At:</span> {toDateTime(context.requestedAt)}</p>
                <p className="md:col-span-2"><span className="font-medium">Description:</span> {context.description || '-'}</p>
              </div>

              <div>
                <h4 className="mb-2 font-medium text-gray-900 dark:text-white">Related Housekeeping Tasks</h4>
                {(context.relatedTasks ?? []).length === 0 ? (
                  <p className="text-gray-500">No housekeeping tasks are linked to this request.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b text-left dark:border-gray-700">
                          <th className="p-2">Room</th>
                          <th className="p-2">Task Type</th>
                          <th className="p-2">Status</th>
                          <th className="p-2">Task Date</th>
                          <th className="p-2">Completed</th>
                        </tr>
                      </thead>
                      <tbody>
                        {context.relatedTasks.map((task) => (
                          <tr className="border-b dark:border-gray-700" key={task.taskId}>
                            <td className="p-2">{task.roomNumber || '-'}</td>
                            <td className="p-2">{HousekeepingTaskType[task.taskType]}</td>
                            <td className="p-2">{HousekeepingTaskStatus[task.status]}</td>
                            <td className="p-2">{toDateTime(task.taskDate)}</td>
                            <td className="p-2">{toDateTime(task.completedAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {hasOpenTasks ? (
                <p className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-700/40 dark:bg-amber-900/20 dark:text-amber-200">
                  Some related housekeeping tasks are not yet completed. Complete those tasks first before completing this guest request.
                </p>
              ) : null}

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Completion Remarks (Optional)</label>
                <textarea
                  rows={3}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full rounded border border-gray-300 p-2 text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                  placeholder="Add notes for completion"
                />
              </div>
            </div>
          )}

          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onComplete(remarks || undefined)}
              disabled={isLoading || !context || isSaving || context.status.toLowerCase() === 'completed' || hasOpenTasks}
              className="rounded bg-emerald-600 px-3 py-2 text-sm text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {isSaving ? 'Completing...' : 'Complete Request'}
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
};
