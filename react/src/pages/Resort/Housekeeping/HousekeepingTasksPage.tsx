import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MainLayout } from '@components/layout/MainLayout';
import { HousekeepingTaskStatus, HousekeepingTaskType } from '@/types/resort.types';
import { resortService } from '@services/resort.service';

const TASK_STATUS_BADGE: Record<HousekeepingTaskStatus, string> = {
  [HousekeepingTaskStatus.Pending]: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  [HousekeepingTaskStatus.InProgress]: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  [HousekeepingTaskStatus.Completed]: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  [HousekeepingTaskStatus.Cancelled]: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
};

const TASK_TYPE_LABELS: Record<HousekeepingTaskType, string> = {
  [HousekeepingTaskType.CheckoutCleaning]: 'Checkout Cleaning',
  [HousekeepingTaskType.StayoverCleaning]: 'Stayover Cleaning',
  [HousekeepingTaskType.PickupCleaning]: 'Pickup Cleaning',
  [HousekeepingTaskType.Inspection]: 'Inspection',
};

const toDateInputValue = (value: Date) => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const HousekeepingTasksPage = () => {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<HousekeepingTaskStatus | ''>('');
  const [taskDate, setTaskDate] = useState<string>(toDateInputValue(new Date()));

  const { data: tasksData, isLoading } = useQuery({
    queryKey: ['housekeeping-tasks', statusFilter, taskDate],
    queryFn: () =>
      resortService.getHousekeepingTasks({
        status: statusFilter !== '' ? statusFilter : undefined,
        taskDate: taskDate || undefined,
        maxResultCount: 200,
      }),
  });

  const updateStatusMutation = useMutation({
    mutationFn: resortService.updateHousekeepingTaskStatus,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['housekeeping-tasks'] });
    },
  });

  const tasks = tasksData?.items ?? [];

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Housekeeping Tasks</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage and track housekeeping task assignments and completion.</p>
        </div>

        <section className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
          <div className="mb-4 flex flex-wrap items-end gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Date</label>
              <input
                type="date"
                className="rounded border p-2 text-sm dark:bg-gray-700"
                value={taskDate}
                onChange={(e) => setTaskDate(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
              <select
                className="rounded border p-2 text-sm dark:bg-gray-700"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value === '' ? '' : (Number(e.target.value) as HousekeepingTaskStatus))}
              >
                <option value="">All Statuses</option>
                <option value={HousekeepingTaskStatus.Pending}>Pending</option>
                <option value={HousekeepingTaskStatus.InProgress}>In Progress</option>
                <option value={HousekeepingTaskStatus.Completed}>Completed</option>
                <option value={HousekeepingTaskStatus.Cancelled}>Cancelled</option>
              </select>
            </div>
          </div>

          {isLoading ? <p className="text-sm text-gray-500">Loading tasks...</p> : null}

          {!isLoading && tasks.length === 0 ? (
            <p className="text-sm text-gray-500">No housekeeping tasks found for the selected filters.</p>
          ) : null}

          {!isLoading && tasks.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="p-2">Room</th>
                    <th className="p-2">Type</th>
                    <th className="p-2">Task Type</th>
                    <th className="p-2">Status</th>
                    <th className="p-2">Date</th>
                    <th className="p-2">Remarks</th>
                    <th className="p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((task) => (
                    <tr className="border-b" key={task.id}>
                      <td className="p-2 font-medium">{task.roomNumber}</td>
                      <td className="p-2 text-gray-600 dark:text-gray-300">{task.roomTypeName}</td>
                      <td className="p-2">{TASK_TYPE_LABELS[task.taskType]}</td>
                      <td className="p-2">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${TASK_STATUS_BADGE[task.status]}`}>
                          {HousekeepingTaskStatus[task.status]}
                        </span>
                      </td>
                      <td className="p-2 tabular-nums text-gray-600 dark:text-gray-300">
                        {new Date(task.taskDate).toLocaleDateString()}
                      </td>
                      <td className="p-2 text-gray-600 dark:text-gray-300">{task.remarks ?? '-'}</td>
                      <td className="p-2">
                        <div className="flex flex-wrap gap-1">
                          {task.status === HousekeepingTaskStatus.Pending ? (
                            <button
                              type="button"
                              className="rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700 disabled:opacity-50"
                              disabled={updateStatusMutation.isPending}
                              onClick={() => updateStatusMutation.mutate({ taskId: task.id, status: HousekeepingTaskStatus.InProgress })}
                            >
                              Start
                            </button>
                          ) : null}
                          {task.status === HousekeepingTaskStatus.InProgress ? (
                            <button
                              type="button"
                              className="rounded bg-emerald-600 px-2 py-1 text-xs text-white hover:bg-emerald-700 disabled:opacity-50"
                              disabled={updateStatusMutation.isPending}
                              onClick={() => updateStatusMutation.mutate({ taskId: task.id, status: HousekeepingTaskStatus.Completed })}
                            >
                              Complete
                            </button>
                          ) : null}
                          {task.status !== HousekeepingTaskStatus.Cancelled && task.status !== HousekeepingTaskStatus.Completed ? (
                            <button
                              type="button"
                              className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                              disabled={updateStatusMutation.isPending}
                              onClick={() => updateStatusMutation.mutate({ taskId: task.id, status: HousekeepingTaskStatus.Cancelled })}
                            >
                              Cancel
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>
      </div>
    </MainLayout>
  );
};
