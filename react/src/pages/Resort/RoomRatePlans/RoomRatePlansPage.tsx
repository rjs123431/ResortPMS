import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MainLayout } from '@components/layout/MainLayout';
import { useAuth } from '@contexts/AuthContext';
import { PermissionNames } from '@config/permissionNames';
import { resortService } from '@services/resort.service';
import type { RoomRatePlanListDto, RoomRatePlanDto, CreateRoomRatePlanDto } from '@/types/resort.types';
import { RoomRatePlanDialogForm } from './RoomRatePlanDialogForm';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const EMPTY_GUID = '00000000-0000-0000-0000-000000000000';

const defaultForm: CreateRoomRatePlanDto & { id?: string } = {
  roomTypeId: '',
  code: '',
  name: '',
  startDate: new Date().toISOString().slice(0, 10),
  endDate: undefined,
  priority: 0,
  isDefault: false,
  isActive: true,
  dayRates: DAY_NAMES.map((_, i) => ({ roomRatePlanId: EMPTY_GUID, dayOfWeek: i, basePrice: 0 })),
  dateOverrides: [],
};

export const RoomRatePlansPage = () => {
  const queryClient = useQueryClient();
  const { isGranted } = useAuth();
  const canCreate = isGranted(PermissionNames.Pages_RoomRatePlans_Create);
  const canEdit = isGranted(PermissionNames.Pages_RoomRatePlans_Edit);
  const [filter, setFilter] = useState('');
  const [roomTypeFilter, setRoomTypeFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CreateRoomRatePlanDto & { id?: string }>({ ...defaultForm });

  const { data, isLoading } = useQuery({
    queryKey: ['resort-room-rate-plans-paged', filter, roomTypeFilter],
    queryFn: () =>
      resortService.getRoomRatePlansPaged({
        filter,
        roomTypeId: roomTypeFilter || undefined,
        maxResultCount: 200,
      }),
  });

  const { data: roomTypes } = useQuery({
    queryKey: ['resort-room-types'],
    queryFn: () => resortService.getRoomTypes(),
  });

  const createMutation = useMutation({
    mutationFn: resortService.createRoomRatePlan,
    onSuccess: () => {
      setShowCreate(false);
      setForm({ ...defaultForm });
      void queryClient.invalidateQueries({ queryKey: ['resort-room-rate-plans-paged'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: resortService.updateRoomRatePlan,
    onSuccess: () => {
      setEditingId(null);
      void queryClient.invalidateQueries({ queryKey: ['resort-room-rate-plans-paged'] });
    },
  });

  const items = useMemo(() => data?.items ?? [], [data]);

  const loadForEdit = async (id: string) => {
    const item: RoomRatePlanDto = await resortService.getRoomRatePlan(id);
    setForm({
      id: item.id,
      roomTypeId: item.roomTypeId,
      code: item.code,
      name: item.name,
      startDate: item.startDate.slice(0, 10),
      endDate: item.endDate?.slice(0, 10),
      priority: item.priority,
      isDefault: item.isDefault,
      isActive: item.isActive,
      dayRates:
        item.dayRates?.length === 7
          ? item.dayRates
          : DAY_NAMES.map((_, i) => ({
              id: (item.dayRates ?? []).find((d) => d.dayOfWeek === i)?.id,
              roomRatePlanId: item.id,
              dayOfWeek: i,
              basePrice: (item.dayRates ?? []).find((d) => d.dayOfWeek === i)?.basePrice ?? 0,
            })),
      dateOverrides: item.dateOverrides ?? [],
    });
    setEditingId(id);
  };

  const sanitizeForApi = (payload: CreateRoomRatePlanDto & { id?: string }) => {
    const dayRates = payload.dayRates.map((d) => ({
      ...d,
      roomRatePlanId: d.roomRatePlanId || payload.id || EMPTY_GUID,
    }));
    const dateOverrides = payload.dateOverrides.map((o) => ({
      ...o,
      roomRatePlanId: o.roomRatePlanId || payload.id || EMPTY_GUID,
    }));
    return { ...payload, dayRates, dateOverrides };
  };

  const handleSave = () => {
    if (editingId && form.id) {
      const payload = sanitizeForApi(form);
      updateMutation.mutate({
        id: payload.id!,
        roomTypeId: payload.roomTypeId,
        code: payload.code,
        name: payload.name,
        startDate: payload.startDate,
        endDate: payload.endDate || undefined,
        priority: payload.priority,
        isDefault: payload.isDefault,
        isActive: payload.isActive,
        dayRates: payload.dayRates,
        dateOverrides: payload.dateOverrides,
      });
    } else {
      const payload = sanitizeForApi(form);
      createMutation.mutate({
        roomTypeId: payload.roomTypeId,
        code: payload.code,
        name: payload.name,
        startDate: payload.startDate,
        endDate: payload.endDate || undefined,
        priority: payload.priority,
        isDefault: payload.isDefault,
        isActive: payload.isActive,
        dayRates: payload.dayRates,
        dateOverrides: payload.dateOverrides,
      });
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Room Rate Plans</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Define seasonal and day-based pricing for room types.</p>
          </div>

          {canCreate ? (
            <button
              type="button"
              className="rounded bg-primary-600 px-4 py-2 text-white hover:bg-primary-700"
              onClick={() => {
                setForm({ ...defaultForm, roomTypeId: form.roomTypeId || '' });
                setShowCreate(true);
              }}
            >
              New Rate Plan
            </button>
          ) : null}
        </div>

        <section className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
          <div className="mb-3 flex flex-wrap items-end gap-3">
            <div className="w-full max-w-xs">
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Search</label>
              <input className="w-full rounded border p-2 dark:bg-gray-700" value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Code or name" />
            </div>
            <div className="w-full max-w-xs">
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Room Type</label>
              <select className="w-full rounded border p-2 dark:bg-gray-700" value={roomTypeFilter} onChange={(e) => setRoomTypeFilter(e.target.value)}>
                <option value="">All</option>
                {(roomTypes ?? []).map((rt) => (
                  <option key={rt.id} value={rt.id}>
                    {rt.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {isLoading ? <p className="text-sm text-gray-500">Loading...</p> : null}

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="p-2">Room Type</th>
                  <th className="p-2">Code</th>
                  <th className="p-2">Name</th>
                  <th className="p-2">Start</th>
                  <th className="p-2">End</th>
                  <th className="p-2">Priority</th>
                  <th className="p-2">Default</th>
                  <th className="p-2">Active</th>
                  <th className="p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item: RoomRatePlanListDto) => (
                  <tr className="border-b" key={item.id}>
                    <td className="p-2">{item.roomTypeName}</td>
                    <td className="p-2">{item.code}</td>
                    <td className="p-2">{item.name}</td>
                    <td className="p-2">{item.startDate.slice(0, 10)}</td>
                    <td className="p-2">{item.endDate ? item.endDate.slice(0, 10) : '—'}</td>
                    <td className="p-2">{item.priority}</td>
                    <td className="p-2">{item.isDefault ? 'Yes' : 'No'}</td>
                    <td className="p-2">{item.isActive ? 'Yes' : 'No'}</td>
                    <td className="p-2">
                      {canEdit ? (
                        <button type="button" className="rounded bg-slate-700 px-2 py-1 text-white" onClick={() => void loadForEdit(item.id)}>
                          Edit
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <RoomRatePlanDialogForm
          isOpen={Boolean(showCreate || editingId)}
          isEditing={Boolean(editingId)}
          form={form}
          roomTypes={roomTypes ?? []}
          canSave={canCreate || canEdit}
          isSaving={createMutation.isPending || updateMutation.isPending}
          onClose={() => {
            setShowCreate(false);
            setEditingId(null);
          }}
          onFormChange={(updater) => setForm((prev) => updater(prev))}
          onSave={handleSave}
        />
      </div>
    </MainLayout>
  );
};
