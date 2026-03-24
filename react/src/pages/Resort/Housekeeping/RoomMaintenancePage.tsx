import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { HousekeepingLayout } from '@components/layout/HousekeepingLayout';
import { PermissionNames } from '@/config/permissionNames';
import { useAuth } from '@/contexts/AuthContext';
import { resortService } from '@/services/resort.service';
import {
  MaintenanceCategory,
  RoomMaintenancePriority,
  RoomMaintenanceStatus,
  type RoomListDto,
  type CreateRoomMaintenanceRequestDto,
} from '@/types/resort.types';
import { confirmAction } from '@/utils/alerts';

const PRIORITY_LABEL: Record<RoomMaintenancePriority, string> = {
  [RoomMaintenancePriority.Low]: 'Low',
  [RoomMaintenancePriority.Medium]: 'Medium',
  [RoomMaintenancePriority.High]: 'High',
  [RoomMaintenancePriority.Critical]: 'Critical',
};

const STATUS_BADGE: Record<RoomMaintenanceStatus, string> = {
  [RoomMaintenanceStatus.Open]: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  [RoomMaintenanceStatus.Assigned]: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
  [RoomMaintenanceStatus.InProgress]: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  [RoomMaintenanceStatus.Completed]: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  [RoomMaintenanceStatus.Cancelled]: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
};

const toDateInputValue = (value: Date) => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const RoomMaintenancePage = () => {
  const queryClient = useQueryClient();
  const { isGranted } = useAuth();
  const canCreate = isGranted(PermissionNames.Pages_Maintenance_Create);
  const canAssign = isGranted(PermissionNames.Pages_Maintenance_Assign);
  const canEdit = isGranted(PermissionNames.Pages_Maintenance_Edit);

  const [roomId, setRoomId] = useState('');
  const [assignedStaffId, setAssignedStaffId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<RoomMaintenancePriority>(RoomMaintenancePriority.Medium);
  const [startDate, setStartDate] = useState(toDateInputValue(new Date()));
  const [endDate, setEndDate] = useState(toDateInputValue(new Date(Date.now() + 24 * 60 * 60 * 1000)));

  const { data: roomsData } = useQuery({
    queryKey: ['resort-room-maintenance-rooms'],
    queryFn: () => resortService.getRooms('', 0, 500),
  });

  const { data: staff } = useQuery({
    queryKey: ['resort-room-maintenance-staff'],
    queryFn: () => resortService.getStaffs(),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['resort-room-maintenance-requests'],
    queryFn: () => resortService.getRoomMaintenanceRequests({ maxResultCount: 200 }),
  });

  const activeStaff = useMemo(() => (staff ?? []).filter((x) => x.isActive), [staff]);

  const invalidate = () => void queryClient.invalidateQueries({ queryKey: ['resort-room-maintenance-requests'] });

  const createMutation = useMutation({
    mutationFn: resortService.createRoomMaintenanceRequest,
    onSuccess: () => {
      setRoomId('');
      setAssignedStaffId('');
      setTitle('');
      setDescription('');
      setPriority(RoomMaintenancePriority.Medium);
      setStartDate(toDateInputValue(new Date()));
      setEndDate(toDateInputValue(new Date(Date.now() + 24 * 60 * 60 * 1000)));
      invalidate();
    },
  });

  const assignMutation = useMutation({
    mutationFn: ({ id, staffId }: { id: string; staffId: string }) => resortService.assignRoomMaintenanceRequest(id, staffId),
    onSuccess: invalidate,
  });

  const startMutation = useMutation({
    mutationFn: (id: string) => resortService.startRoomMaintenanceRequest(id),
    onSuccess: invalidate,
  });

  const completeMutation = useMutation({
    mutationFn: (id: string) => resortService.completeRoomMaintenanceRequest(id),
    onSuccess: invalidate,
  });

  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => resortService.cancelRoomMaintenanceRequest(id, reason),
    onSuccess: invalidate,
  });

  const handleCreate = (event: React.FormEvent) => {
    event.preventDefault();
    const payload: CreateRoomMaintenanceRequestDto = {
      roomId,
      assignedStaffId: assignedStaffId || undefined,
      title: title.trim(),
      description: description.trim(),
      priority,
      category: MaintenanceCategory.Reactive,
      startDate,
      endDate,
      typeIds: [],
    };
    createMutation.mutate(payload);
  };

  const requests = data?.items ?? [];
  const rooms = roomsData?.items ?? [];

  return (
    <HousekeepingLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Room Maintenance</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Create, assign, and complete room maintenance tickets with availability-safe blocking.</p>
          </div>
        </div>

        <section className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
          <h2 className="mb-3 text-base font-semibold text-gray-900 dark:text-white">New Maintenance Ticket</h2>
          <form className="grid grid-cols-1 gap-3 md:grid-cols-2" onSubmit={handleCreate}>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Room</label>
              <select className="w-full rounded border p-2 text-sm dark:bg-gray-700" value={roomId} onChange={(e) => setRoomId(e.target.value)}>
                <option value="">Select room</option>
                {rooms.map((room: RoomListDto) => (
                  <option key={room.id} value={room.id}>{room.roomNumber} - {room.roomTypeName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Assign Staff (optional)</label>
              <select className="w-full rounded border p-2 text-sm dark:bg-gray-700" value={assignedStaffId} onChange={(e) => setAssignedStaffId(e.target.value)}>
                <option value="">Unassigned</option>
                {activeStaff.map((member) => (
                  <option key={member.id} value={member.id}>{member.fullName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
              <input className="w-full rounded border p-2 text-sm dark:bg-gray-700" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Priority</label>
              <select
                className="w-full rounded border p-2 text-sm dark:bg-gray-700"
                value={priority}
                onChange={(e) => setPriority(Number(e.target.value) as RoomMaintenancePriority)}
              >
                <option value={RoomMaintenancePriority.Low}>Low</option>
                <option value={RoomMaintenancePriority.Medium}>Medium</option>
                <option value={RoomMaintenancePriority.High}>High</option>
                <option value={RoomMaintenancePriority.Critical}>Critical</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Start Date</label>
              <DatePicker
                selected={startDate ? new Date(startDate) : null}
                onChange={(date: Date | null) => {
                  if (!date) {
                    setStartDate('');
                    return;
                  }
                  const nextStartDate = date.toISOString().split('T')[0];
                  setStartDate(nextStartDate);
                  if (endDate && endDate < nextStartDate) {
                    setEndDate(nextStartDate);
                  }
                }}
                dateFormat="MM-dd-yyyy"
                className="w-full rounded border p-2 text-sm dark:bg-gray-700"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">End Date</label>
              <DatePicker
                selected={endDate ? new Date(endDate) : null}
                onChange={(date: Date | null) => setEndDate(date ? date.toISOString().split('T')[0] : '')}
                dateFormat="MM-dd-yyyy"
                minDate={startDate ? new Date(startDate) : undefined}
                className="w-full rounded border p-2 text-sm dark:bg-gray-700"
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
              <textarea className="w-full rounded border p-2 text-sm dark:bg-gray-700" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <button
                type="submit"
                className="rounded bg-primary-600 px-4 py-2 text-sm text-white hover:bg-primary-700 disabled:opacity-50"
                disabled={!canCreate || createMutation.isPending || !roomId || !title.trim() || !startDate || !endDate}
              >
                {createMutation.isPending ? 'Creating...' : 'Create Ticket'}
              </button>
            </div>
          </form>
        </section>

        <section className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
          <h2 className="mb-3 text-base font-semibold text-gray-900 dark:text-white">Maintenance Tickets</h2>

          {isLoading ? <p className="text-sm text-gray-500">Loading maintenance requests...</p> : null}
          {!isLoading && requests.length === 0 ? <p className="text-sm text-gray-500">No maintenance requests found.</p> : null}

          {!isLoading && requests.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="p-2">Room</th>
                    <th className="p-2">Title</th>
                    <th className="p-2">Priority</th>
                    <th className="p-2">Status</th>
                    <th className="p-2">Date Range</th>
                    <th className="p-2">Assigned</th>
                    <th className="p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((request) => (
                    <tr className="border-b" key={request.id}>
                      <td className="p-2 font-medium">{request.roomNumber}</td>
                      <td className="p-2">{request.title}</td>
                      <td className="p-2">{PRIORITY_LABEL[request.priority]}</td>
                      <td className="p-2">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[request.status]}`}>
                          {RoomMaintenanceStatus[request.status]}
                        </span>
                      </td>
                      <td className="p-2 tabular-nums">{new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}</td>
                      <td className="p-2">{request.assignedStaffName || 'Unassigned'}</td>
                      <td className="p-2">
                        <div className="flex flex-wrap gap-1">
                          {(request.status === RoomMaintenanceStatus.Open || request.status === RoomMaintenanceStatus.Assigned) && canAssign ? (
                            <button
                              type="button"
                              className="rounded border border-indigo-300 px-2 py-1 text-xs text-indigo-700 hover:bg-indigo-50 disabled:opacity-50 dark:border-indigo-500/50 dark:text-indigo-300 dark:hover:bg-indigo-900/20"
                              disabled={assignMutation.isPending}
                              onClick={async () => {
                                if (activeStaff.length === 0) return;
                                const selected = window.prompt('Enter staff full name to assign', activeStaff[0].fullName);
                                const match = activeStaff.find((s) => s.fullName.toLowerCase() === (selected ?? '').trim().toLowerCase());
                                if (!match) return;
                                assignMutation.mutate({ id: request.id, staffId: match.id });
                              }}
                            >
                              {request.assignedStaffId ? 'Re-assign' : 'Assign'}
                            </button>
                          ) : null}

                          {request.status === RoomMaintenanceStatus.Assigned && canEdit ? (
                            <button
                              type="button"
                              className="rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700 disabled:opacity-50"
                              disabled={startMutation.isPending}
                              onClick={async () => {
                                const result = await confirmAction(`Start maintenance for room ${request.roomNumber}?`, { confirmButtonText: 'Start' });
                                if (result.isConfirmed) startMutation.mutate(request.id);
                              }}
                            >
                              Start
                            </button>
                          ) : null}

                          {(request.status === RoomMaintenanceStatus.Assigned || request.status === RoomMaintenanceStatus.InProgress) && canEdit ? (
                            <button
                              type="button"
                              className="rounded bg-emerald-600 px-2 py-1 text-xs text-white hover:bg-emerald-700 disabled:opacity-50"
                              disabled={completeMutation.isPending}
                              onClick={async () => {
                                const result = await confirmAction(`Complete maintenance for room ${request.roomNumber}?`, { confirmButtonText: 'Complete' });
                                if (result.isConfirmed) completeMutation.mutate(request.id);
                              }}
                            >
                              Complete
                            </button>
                          ) : null}

                          {(request.status !== RoomMaintenanceStatus.Completed && request.status !== RoomMaintenanceStatus.Cancelled) && canEdit ? (
                            <button
                              type="button"
                              className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                              disabled={cancelMutation.isPending}
                              onClick={async () => {
                                const result = await confirmAction(`Cancel maintenance request for room ${request.roomNumber}?`, { confirmButtonText: 'Cancel Request' });
                                if (!result.isConfirmed) return;
                                const reason = window.prompt('Cancellation reason', 'Cancelled by user') ?? '';
                                cancelMutation.mutate({ id: request.id, reason });
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
    </HousekeepingLayout>
  );
};
