import { useState } from 'react';
import { confirmAction } from '@/utils/alerts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MainLayout } from '@components/layout/MainLayout';
import type { StaffListDto } from '@/types/resort.types';
import { HousekeepingTaskStatus, HousekeepingTaskType } from '@/types/resort.types';
import { resortService } from '@services/resort.service';
import { SearchStaffDialog } from '../Shared/SearchStaffDialog';

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
    const [statusFilter, setStatusFilter] = useState<HousekeepingTaskStatus | ''>(HousekeepingTaskStatus.Pending);
    const [taskDate, setTaskDate] = useState<string>(toDateInputValue(new Date()));
    const [assignedStaffFilter, setAssignedStaffFilter] = useState<string>('');
    const [showSearchStaffDialog, setShowSearchStaffDialog] = useState(false);
    const [selectedTaskForAssign, setSelectedTaskForAssign] = useState<{
        taskId: string;
        status: HousekeepingTaskStatus;
    } | null>(null);

    const { data: tasksData, isLoading } = useQuery({
        queryKey: ['housekeeping-tasks', statusFilter, taskDate, assignedStaffFilter],
        queryFn: () =>
            resortService.getHousekeepingTasks({
                status: statusFilter !== '' ? statusFilter : undefined,
                taskDate: taskDate || undefined,
                assignedToStaffId: assignedStaffFilter !== '' && assignedStaffFilter !== 'unassigned' ? assignedStaffFilter : undefined,
                isUnassigned: assignedStaffFilter === 'unassigned' ? true : undefined,
                maxResultCount: 200,
            }),
    });

    const { data: staffData } = useQuery({
        queryKey: ['resort-staff'],
        queryFn: () => resortService.getStaffs(),
    });

    const updateStatusMutation = useMutation({
        mutationFn: resortService.updateHousekeepingTaskStatus,
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['housekeeping-tasks'] });
        },
    });

    const tasks = tasksData?.items ?? [];
    const staff = staffData ?? [];

    const updateTaskStatus = (taskId: string, status: HousekeepingTaskStatus, assignedToStaffId?: string) => {
        updateStatusMutation.mutate({ taskId, status, assignedToStaffId });
    };

    const handleAssignStaff = (staff: StaffListDto) => {
        if (!selectedTaskForAssign) return;

        updateTaskStatus(selectedTaskForAssign.taskId, selectedTaskForAssign.status, staff.id);
        setSelectedTaskForAssign(null);
        setShowSearchStaffDialog(false);
    };

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
                        <div className="min-w-[200px]">
                            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Assigned To</label>
                            <select
                                className="w-full rounded border p-2 text-sm dark:bg-gray-700"
                                value={assignedStaffFilter}
                                onChange={(e) => setAssignedStaffFilter(e.target.value)}
                            >
                                <option value="">All tasks</option>
                                <option value="unassigned">Unassigned</option>
                                {staff.map((member) => (
                                    <option key={member.id} value={member.id}>{member.fullName}</option>
                                ))}
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
                                        <th className="p-2">Assigned Staff</th>
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
                                                <div className="text-xs text-gray-500">{task.assignedToStaffName || 'Unassigned'}</div>
                                            </td>
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
                                                    {task.status === HousekeepingTaskStatus.InProgress ? (
                                                        <button
                                                            type="button"
                                                            className="rounded bg-emerald-600 px-2 py-1 text-xs text-white hover:bg-emerald-700 disabled:opacity-50"
                                                            disabled={updateStatusMutation.isPending}
                                                            onClick={async () => {
                                                                const result = await confirmAction(
                                                                    `Mark cleaning task for room ${task.roomNumber} as completed?`,
                                                                    { confirmButtonText: 'Complete' }
                                                                );
                                                                if (result.isConfirmed) {
                                                                    updateTaskStatus(task.id, HousekeepingTaskStatus.Completed, task.assignedToStaffId || undefined);
                                                                }
                                                            }}
                                                        >
                                                            Complete
                                                        </button>
                                                    ) : null}
                                                    {(task.status === HousekeepingTaskStatus.Pending || task.status === HousekeepingTaskStatus.InProgress) ? (
                                                        <button
                                                            type="button"
                                                            className="rounded border border-indigo-300 px-2 py-1 text-xs text-indigo-700 hover:bg-indigo-50 disabled:opacity-50 dark:border-indigo-500/50 dark:text-indigo-300 dark:hover:bg-indigo-900/20"
                                                            disabled={updateStatusMutation.isPending}
                                                            onClick={() => {
                                                                setSelectedTaskForAssign({ taskId: task.id, status: task.status });
                                                                setShowSearchStaffDialog(true);
                                                            }}
                                                        >
                                                            {task.assignedToStaffId ? 'Re-assign' : 'Assign'}
                                                        </button>
                                                    ) : null}
                                                    {task.status === HousekeepingTaskStatus.Pending ? (
                                                        <button
                                                            type="button"
                                                            className="rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                                                            disabled={updateStatusMutation.isPending || !task.assignedToStaffId}
                                                            title={!task.assignedToStaffId ? 'Assign a staff member before starting' : undefined}
                                                            onClick={async () => {
                                                                const result = await confirmAction(
                                                                    `Start cleaning task for room ${task.roomNumber}?`,
                                                                    { confirmButtonText: 'Start' }
                                                                );
                                                                if (result.isConfirmed) {
                                                                    updateTaskStatus(task.id, HousekeepingTaskStatus.InProgress, task.assignedToStaffId || undefined);
                                                                }
                                                            }}
                                                        >
                                                            Start
                                                        </button>
                                                    ) : null}
                                                    {task.status !== HousekeepingTaskStatus.Cancelled && task.status !== HousekeepingTaskStatus.Completed ? (
                                                        <button
                                                            type="button"
                                                            className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                                                            disabled={updateStatusMutation.isPending}
                                                            onClick={async () => {
                                                                const result = await confirmAction(
                                                                    `Cancel cleaning task for room ${task.roomNumber}? This cannot be undone.`,
                                                                    { confirmButtonText: 'Cancel Task' }
                                                                );
                                                                if (result.isConfirmed) {
                                                                    updateTaskStatus(task.id, HousekeepingTaskStatus.Cancelled, task.assignedToStaffId || undefined);
                                                                }
                                                            }}
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

            <SearchStaffDialog
                open={showSearchStaffDialog}
                onClose={() => {
                    setShowSearchStaffDialog(false);
                    setSelectedTaskForAssign(null);
                }}
                onSelectStaff={handleAssignStaff}
            />
        </MainLayout>
    );
};
