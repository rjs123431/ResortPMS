import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { MaintenanceLayout } from '@components/layout/MaintenanceLayout';
import { SearchStaffDialog } from '@/pages/Resort/Shared/SearchStaffDialog';
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
import { CancelOrderDialog } from './WorkOrderActionDialogs';

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

const makeDefaultForm = (): CreateRoomMaintenanceRequestDto => ({
  roomId: '',
  assignedStaffId: undefined,
  title: '',
  description: '',
  priority: RoomMaintenancePriority.Medium,
  category: MaintenanceCategory.Preventive,
  startDate: toDateInputValue(new Date()),
  endDate: toDateInputValue(new Date(Date.now() + 24 * 60 * 60 * 1000)),
  typeIds: [],
});

export const PreventiveMaintenancePage = () => {
  const queryClient = useQueryClient();
  const { isGranted } = useAuth();
  const canCreate = isGranted(PermissionNames.Pages_Maintenance_Create);
  const canAssign = isGranted(PermissionNames.Pages_Maintenance_Assign);
  const canEdit = isGranted(PermissionNames.Pages_Maintenance_Edit);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<CreateRoomMaintenanceRequestDto>(makeDefaultForm());
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [actionOrderId, setActionOrderId] = useState<string | null>(null);

  const { data: roomsData } = useQuery({
    queryKey: ['resort-room-maintenance-rooms'],
    queryFn: () => resortService.getRooms('', 0, 500),
  });

  const { data: staff } = useQuery({
    queryKey: ['resort-room-maintenance-staff'],
    queryFn: () => resortService.getStaffs(),
  });

  const { data: maintenanceTypes } = useQuery({
    queryKey: ['resort-maintenance-types'],
    queryFn: () => resortService.getMaintenanceTypes(),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['resort-preventive-requests'],
    queryFn: () => resortService.getRoomMaintenanceRequests({ category: MaintenanceCategory.Preventive, maxResultCount: 200 }),
  });

  const activeStaff = useMemo(() => (staff ?? []).filter((x) => x.isActive), [staff]);
  const activeTypes = useMemo(() => (maintenanceTypes ?? []).filter((x) => x.isActive), [maintenanceTypes]);

  const invalidate = () => void queryClient.invalidateQueries({ queryKey: ['resort-preventive-requests'] });

  const openDialog = () => {
    setForm(makeDefaultForm());
    setDialogOpen(true);
  };

  const closeDialog = () => setDialogOpen(false);

  const toggleTypeId = (id: string) => {
    setForm((prev) => ({
      ...prev,
      typeIds: prev.typeIds.includes(id) ? prev.typeIds.filter((t) => t !== id) : [...prev.typeIds, id],
    }));
  };

  const createMutation = useMutation({
    mutationFn: resortService.createRoomMaintenanceRequest,
    onSuccess: () => {
      closeDialog();
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

  const handleCreate = () => {
    if (!form.roomId || !form.title.trim() || !form.startDate || !form.endDate) return;
    createMutation.mutate({
      ...form,
      assignedStaffId: form.assignedStaffId || undefined,
      title: form.title.trim(),
      description: form.description.trim(),
      category: MaintenanceCategory.Preventive,
    });
  };

  const requests = data?.items ?? [];
  const rooms = roomsData?.items ?? [];

  return (
    <MaintenanceLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Preventive Maintenance</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Schedule and track routine preventive maintenance tasks.</p>
          </div>
          {canCreate ? (
            <button
              type="button"
              className="rounded bg-violet-600 px-4 py-2 text-sm text-white hover:bg-violet-700"
              onClick={openDialog}
            >
              New Preventive Order
            </button>
          ) : null}
        </div>

        <section className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
          {isLoading ? <p className="text-sm text-gray-500">Loading preventive orders...</p> : null}
          {!isLoading && requests.length === 0 ? <p className="text-sm text-gray-500">No preventive maintenance orders found.</p> : null}

          {!isLoading && requests.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="p-2">Room</th>
                    <th className="p-2">Title</th>
                    <th className="p-2">Types</th>
                    <th className="p-2">Priority</th>
                    <th className="p-2">Status</th>
                    <th className="p-2">Scheduled</th>
                    <th className="p-2">Assigned</th>
                    <th className="p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((request) => (
                    <tr className="border-b" key={request.id}>
                      <td className="p-2 font-medium">{request.roomNumber}</td>
                      <td className="p-2">{request.title}</td>
                      <td className="p-2">
                        {request.typeNames && request.typeNames.length > 0
                          ? request.typeNames.join(', ')
                          : <span className="text-gray-400">—</span>}
                      </td>
                      <td className="p-2">{PRIORITY_LABEL[request.priority]}</td>
                      <td className="p-2">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[request.status]}`}>
                          {RoomMaintenanceStatus[request.status]}
                        </span>
                      </td>
                      <td className="p-2 tabular-nums">{new Date(request.startDate).toLocaleDateString()} – {new Date(request.endDate).toLocaleDateString()}</td>
                      <td className="p-2">{request.assignedStaffName || 'Unassigned'}</td>
                      <td className="p-2">
                        <div className="flex flex-wrap gap-1">
                          {(request.status === RoomMaintenanceStatus.Open || request.status === RoomMaintenanceStatus.Assigned) && canAssign ? (
                            <button
                              type="button"
                              className="rounded border border-indigo-300 px-2 py-1 text-xs text-indigo-700 hover:bg-indigo-50 disabled:opacity-50 dark:border-indigo-500/50 dark:text-indigo-300 dark:hover:bg-indigo-900/20"
                              disabled={assignMutation.isPending}
                              onClick={() => {
                                setActionOrderId(request.id);
                                setAssignDialogOpen(true);
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
                                const result = await confirmAction(`Start preventive order for room ${request.roomNumber}?`, { confirmButtonText: 'Start' });
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
                                const result = await confirmAction(`Complete preventive order for room ${request.roomNumber}?`, { confirmButtonText: 'Complete' });
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
                              onClick={() => {
                                setActionOrderId(request.id);
                                setCancelDialogOpen(true);
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

      {/* Assign Staff Dialog - Using shared SearchStaffDialog */}
      <SearchStaffDialog
        open={assignDialogOpen}
        onClose={() => {
          setAssignDialogOpen(false);
          setActionOrderId(null);
        }}
        onSelectStaff={(staff) => {
          if (actionOrderId) {
            assignMutation.mutate({ id: actionOrderId, staffId: staff.id });
            setAssignDialogOpen(false);
            setActionOrderId(null);
          }
        }}
      />

      {/* Cancel Order Dialog */}
      <CancelOrderDialog
        open={cancelDialogOpen}
        onClose={() => {
          setCancelDialogOpen(false);
          setActionOrderId(null);
        }}
        isLoading={cancelMutation.isPending}
        onConfirm={(reason) => {
          if (actionOrderId) {
            cancelMutation.mutate({ id: actionOrderId, reason });
            setCancelDialogOpen(false);
            setActionOrderId(null);
          }
        }}
      />

      {/* New Preventive Order Dialog */}
      <Dialog open={dialogOpen} onClose={() => {}} className="fixed inset-0 z-50 overflow-y-auto">
        <div className="fixed inset-0 bg-black/50 pointer-events-none" aria-hidden />
        <div className="relative flex min-h-screen items-center justify-center p-4 pointer-events-none">
          <DialogPanel className="w-full max-w-2xl rounded-lg bg-white p-5 shadow-xl dark:bg-gray-800 pointer-events-auto">
            <div className="mb-4 flex items-center justify-between">
              <DialogTitle as="h3" className="text-lg font-semibold text-gray-900 dark:text-white">
                New Preventive Order
              </DialogTitle>
              <button type="button" className="rounded bg-gray-200 px-2 py-1 text-sm dark:bg-gray-700" onClick={closeDialog}>
                Close
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Room <span className="text-red-500">*</span></label>
                <select
                  className="w-full rounded border p-2 text-sm dark:bg-gray-700"
                  value={form.roomId}
                  onChange={(e) => setForm((s) => ({ ...s, roomId: e.target.value }))}
                >
                  <option value="">Select room</option>
                  {rooms.map((room: RoomListDto) => (
                    <option key={room.id} value={room.id}>{room.roomNumber} – {room.roomTypeName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Assign Staff (optional)</label>
                <select
                  className="w-full rounded border p-2 text-sm dark:bg-gray-700"
                  value={form.assignedStaffId ?? ''}
                  onChange={(e) => setForm((s) => ({ ...s, assignedStaffId: e.target.value || undefined }))}
                >
                  <option value="">Unassigned</option>
                  {activeStaff.map((member) => (
                    <option key={member.id} value={member.id}>{member.fullName}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Title <span className="text-red-500">*</span></label>
                <input
                  className="w-full rounded border p-2 text-sm dark:bg-gray-700"
                  value={form.title}
                  placeholder="e.g. Monthly AC filter replacement"
                  onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Priority</label>
                <select
                  className="w-full rounded border p-2 text-sm dark:bg-gray-700"
                  value={form.priority}
                  onChange={(e) => setForm((s) => ({ ...s, priority: Number(e.target.value) as RoomMaintenancePriority }))}
                >
                  <option value={RoomMaintenancePriority.Low}>Low</option>
                  <option value={RoomMaintenancePriority.Medium}>Medium</option>
                  <option value={RoomMaintenancePriority.High}>High</option>
                  <option value={RoomMaintenancePriority.Critical}>Critical</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
                <div className="flex h-[38px] items-center rounded border border-violet-300 bg-violet-50 px-3 text-sm text-violet-700 dark:border-violet-700/50 dark:bg-violet-900/20 dark:text-violet-300">
                  Preventive
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Start Date <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  className="w-full rounded border p-2 text-sm dark:bg-gray-700"
                  value={form.startDate}
                  onChange={(e) => setForm((s) => ({ ...s, startDate: e.target.value }))}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">End Date <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  className="w-full rounded border p-2 text-sm dark:bg-gray-700"
                  value={form.endDate}
                  onChange={(e) => setForm((s) => ({ ...s, endDate: e.target.value }))}
                />
              </div>

              {activeTypes.length > 0 ? (
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Maintenance Types</label>
                  <div className="grid grid-cols-2 gap-1 sm:grid-cols-3">
                    {activeTypes.map((type) => (
                      <label key={type.id} className="flex items-center gap-2 rounded border border-gray-200 px-2 py-1.5 text-sm dark:border-gray-600">
                        <input
                          type="checkbox"
                          checked={form.typeIds.includes(type.id)}
                          onChange={() => toggleTypeId(type.id)}
                        />
                        <span>{type.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                <textarea
                  className="w-full rounded border p-2 text-sm dark:bg-gray-700"
                  rows={3}
                  value={form.description}
                  placeholder="Optional notes"
                  onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
                />
              </div>
            </div>

            {createMutation.isError ? (
              <p className="mt-3 text-sm text-red-600 dark:text-red-400">Failed to create order. Please try again.</p>
            ) : null}

            <div className="mt-5 flex justify-end gap-2">
              <button type="button" className="rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-600" onClick={closeDialog}>
                Cancel
              </button>
              <button
                type="button"
                className="rounded bg-violet-600 px-4 py-2 text-sm text-white hover:bg-violet-700 disabled:opacity-50"
                disabled={!canCreate || createMutation.isPending || !form.roomId || !form.title.trim() || !form.startDate || !form.endDate}
                onClick={handleCreate}
              >
                {createMutation.isPending ? 'Creating...' : 'Create Preventive Order'}
              </button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </MaintenanceLayout>
  );
};

