import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import DatePicker from 'react-datepicker';
import { resortService } from '@services/resort.service';
import { useAuth } from '@contexts/AuthContext';
import { PermissionNames } from '@config/permissionNames';
import { notifyError, notifySuccess } from '@/utils/alerts';
import 'react-datepicker/dist/react-datepicker.css';
import type {
  CreateRoomRatePlanDto,
  RatePlanDateOverrideDto,
  RoomRatePlanDayDto,
  RoomRatePlanDto,
  RoomRatePlanListDto,
  RoomTypeListDto,
  UpdateRoomRatePlanDto,
} from '@/types/resort.types';

const EMPTY_GUID = '00000000-0000-0000-0000-000000000000';
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const parseDateOnly = (value: string) => {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const formatDateLocal = (d: Date) => {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

type RoomTypeRateRow = {
  roomTypeId: string;
  roomTypeName: string;
  enabled: boolean;
  planId?: string;
  dayRates: number[];
  dateOverrides: RatePlanDateOverrideDto[];
};

type GroupForm = {
  code: string;
  name: string;
  startDate: string;
  endDate?: string;
  priority: number;
  isDefault: boolean;
  isActive: boolean;
};

const getDayRate = (dayRates: RoomRatePlanDayDto[] | undefined, dayOfWeek: number) =>
  dayRates?.find((x) => x.dayOfWeek === dayOfWeek)?.basePrice ?? 0;

const toDayRates = (planId: string, dayRates: number[]): RoomRatePlanDayDto[] =>
  DAY_LABELS.map((_, dayOfWeek) => ({
    roomRatePlanId: planId,
    dayOfWeek,
    basePrice: dayRates[dayOfWeek] ?? 0,
  }));

const getInitialGroupForm = (): GroupForm => ({
  code: '',
  name: '',
  startDate: new Date().toISOString().slice(0, 10),
  endDate: undefined,
  priority: 1,
  isDefault: false,
  isActive: true,
});

export const RoomRatePlanGroupEditorPage = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { groupCode } = useParams();
  const decodedGroupCode = groupCode ? decodeURIComponent(groupCode) : '';
  const isEditing = !!decodedGroupCode;
  const { isGranted } = useAuth();
  const canCreate = isGranted(PermissionNames.Pages_RoomRatePlans_Create);
  const canEdit = isGranted(PermissionNames.Pages_RoomRatePlans_Edit);
  const canSave = isEditing ? canEdit : canCreate;

  const [groupForm, setGroupForm] = useState<GroupForm>(getInitialGroupForm());
  const [roomTypeRates, setRoomTypeRates] = useState<RoomTypeRateRow[]>([]);

  const { data: roomTypes, isLoading: isRoomTypesLoading } = useQuery({
    queryKey: ['resort-room-types'],
    queryFn: () => resortService.getRoomTypes(),
  });

  const { data: allPlans, isLoading: isPlansLoading } = useQuery({
    queryKey: ['resort-room-rate-plans-paged', 'group-editor', decodedGroupCode],
    queryFn: () => resortService.getRoomRatePlansPaged({ maxResultCount: 1000 }),
  });

  const groupPlans = useMemo(() => {
    const items = allPlans?.items ?? [];
    if (!isEditing) return [] as RoomRatePlanListDto[];
    return items.filter((x) => x.code.trim().toUpperCase() === decodedGroupCode.trim().toUpperCase());
  }, [allPlans?.items, decodedGroupCode, isEditing]);

  const { data: groupPlanDetails, isLoading: isDetailsLoading } = useQuery({
    queryKey: ['resort-room-rate-plan-details-by-group', decodedGroupCode, groupPlans.map((x) => x.id).join(',')],
    enabled: isEditing,
    queryFn: async () => {
      const details = await Promise.all(groupPlans.map((x) => resortService.getRoomRatePlan(x.id)));
      return details;
    },
  });

  useEffect(() => {
    if (!roomTypes || roomTypes.length === 0) return;
    if (isEditing && !groupPlanDetails) return;

    const detailsByRoomType = new Map<string, RoomRatePlanDto>();
    (groupPlanDetails ?? []).forEach((detail) => {
      detailsByRoomType.set(detail.roomTypeId, detail);
    });

    if (isEditing && groupPlanDetails && groupPlanDetails.length > 0) {
      const base = groupPlanDetails[0];
      setGroupForm({
        code: base.code,
        name: base.name,
        startDate: base.startDate.slice(0, 10),
        endDate: base.endDate?.slice(0, 10),
        priority: base.priority,
        isDefault: base.isDefault,
        isActive: base.isActive,
      });
    }

    const nextRows = roomTypes.map((roomType: RoomTypeListDto) => {
      const existing = detailsByRoomType.get(roomType.id);
      const dayRates = DAY_LABELS.map((_, dayOfWeek) => (existing ? getDayRate(existing.dayRates, dayOfWeek) : 0));

      return {
        roomTypeId: roomType.id,
        roomTypeName: roomType.name,
        enabled: !!existing,
        planId: existing?.id,
        dayRates,
        dateOverrides: existing?.dateOverrides ?? [],
      } as RoomTypeRateRow;
    });

    setRoomTypeRates(nextRows);
  }, [roomTypes, groupPlanDetails, isEditing]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const code = groupForm.code.trim();
      const name = groupForm.name.trim();

      if (!code || !name) {
        throw new Error('Code and name are required.');
      }

      const enabledRows = roomTypeRates.filter((x) => x.enabled);
      if (enabledRows.length === 0) {
        throw new Error('Enable at least one room type rate.');
      }

      for (const row of enabledRows) {
        if (row.dayRates.some((rate) => rate < 0)) {
          throw new Error(`Rates cannot be negative for ${row.roomTypeName}.`);
        }
      }

      const operations: Array<Promise<unknown>> = [];

      for (const row of roomTypeRates) {
        if (row.enabled) {
          const planId = row.planId || EMPTY_GUID;
          const dayRates = toDayRates(planId, row.dayRates);

          if (row.planId) {
            const payload: UpdateRoomRatePlanDto = {
              id: row.planId,
              roomTypeId: row.roomTypeId,
              code,
              name,
              startDate: groupForm.startDate,
              endDate: groupForm.endDate,
              priority: groupForm.priority,
              isDefault: groupForm.isDefault,
              isActive: groupForm.isActive,
              dayRates,
              dateOverrides: row.dateOverrides.map((x) => ({ ...x, roomRatePlanId: row.planId! })),
            };
            operations.push(resortService.updateRoomRatePlan(payload));
          } else {
            const payload: CreateRoomRatePlanDto = {
              roomTypeId: row.roomTypeId,
              code,
              name,
              startDate: groupForm.startDate,
              endDate: groupForm.endDate,
              priority: groupForm.priority,
              isDefault: groupForm.isDefault,
              isActive: groupForm.isActive,
              dayRates,
              dateOverrides: [],
            };
            operations.push(resortService.createRoomRatePlan(payload));
          }
        } else if (row.planId) {
          operations.push(resortService.deleteRoomRatePlan(row.planId));
        }
      }

      for (const operation of operations) {
        await operation;
      }
    },
    onSuccess: async () => {
      notifySuccess('Rate plan saved successfully.');
      await queryClient.invalidateQueries({ queryKey: ['resort-room-rate-plans-paged'] });
      navigate('/admin/room-rate-plans');
    },
    onError: (error) => {
      notifyError(error instanceof Error ? error.message : 'Failed to save rate plan.');
    },
  });

  const isLoading = isRoomTypesLoading || isPlansLoading || (isEditing && isDetailsLoading);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isEditing ? 'Edit Room Rate Plan' : 'New Room Rate Plan'}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Set one group definition and assign weekday/weekend rates per room type.</p>
        </div>

        <Link to="/admin/room-rate-plans" className="rounded border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700">
          Back to list
        </Link>
      </div>

      <section className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
        {isLoading ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Code *</label>
                <input
                  className="w-full rounded border p-2 dark:bg-gray-700"
                  value={groupForm.code}
                  onChange={(e) => setGroupForm((p) => ({ ...p, code: e.target.value }))}
                  placeholder="e.g. REGULAR_RATE"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Name *</label>
                <input
                  className="w-full rounded border p-2 dark:bg-gray-700"
                  value={groupForm.name}
                  onChange={(e) => setGroupForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. REGULAR RATE"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Start Date *</label>
                <DatePicker
                  selected={groupForm.startDate ? parseDateOnly(groupForm.startDate) : null}
                  onChange={(date: Date | null) => setGroupForm((p) => ({ ...p, startDate: date ? formatDateLocal(date) : '' }))}
                  dateFormat="MMM d, yyyy"
                  className="w-full rounded border p-2 dark:bg-gray-700"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">End Date</label>
                <DatePicker
                  selected={groupForm.endDate ? parseDateOnly(groupForm.endDate) : null}
                  onChange={(date: Date | null) => setGroupForm((p) => ({ ...p, endDate: date ? formatDateLocal(date) : undefined }))}
                  dateFormat="MMM d, yyyy"
                  minDate={groupForm.startDate ? parseDateOnly(groupForm.startDate) : undefined}
                  isClearable
                  placeholderText="No end date"
                  className="w-full rounded border p-2 dark:bg-gray-700"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Priority</label>
                <input
                  type="number"
                  className="w-full rounded border p-2 dark:bg-gray-700"
                  value={groupForm.priority}
                  onChange={(e) => setGroupForm((p) => ({ ...p, priority: Number(e.target.value) || 0 }))}
                />
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={groupForm.isDefault}
                    onChange={(e) => setGroupForm((p) => ({ ...p, isDefault: e.target.checked }))}
                  />
                  Default Group
                </label>
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={groupForm.isActive}
                    onChange={(e) => setGroupForm((p) => ({ ...p, isActive: e.target.checked }))}
                  />
                  Active
                </label>
              </div>
            </div>

            <div className="mt-6">
              <h2 className="mb-2 text-sm font-medium text-gray-800 dark:text-gray-200">Rates per Room Type</h2>
              <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
                Enter one rate field for each day.
              </p>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="p-2">Use</th>
                      <th className="p-2">Room Type</th>
                      <th className="p-2">Sun</th>
                      <th className="p-2">Mon</th>
                      <th className="p-2">Tue</th>
                      <th className="p-2">Wed</th>
                      <th className="p-2">Thu</th>
                      <th className="p-2">Fri</th>
                      <th className="p-2">Sat</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roomTypeRates.map((row) => (
                      <tr key={row.roomTypeId} className="border-b">
                        <td className="p-2">
                          <input
                            type="checkbox"
                            checked={row.enabled}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setRoomTypeRates((prev) => prev.map((x) => (x.roomTypeId === row.roomTypeId ? { ...x, enabled: checked } : x)));
                            }}
                          />
                        </td>
                        <td className="p-2">{row.roomTypeName}</td>
                        {DAY_LABELS.map((dayLabel, dayIndex) => (
                          <td key={`${row.roomTypeId}-${dayLabel}`} className="p-2">
                            <input
                              type="number"
                              min={0}
                              step={0.01}
                              className="w-24 rounded border p-2 dark:bg-gray-700"
                              value={row.dayRates[dayIndex] ?? 0}
                              disabled={!row.enabled}
                              onChange={(e) => {
                                const value = Number(e.target.value) || 0;
                                setRoomTypeRates((prev) =>
                                  prev.map((x) => {
                                    if (x.roomTypeId !== row.roomTypeId) return x;
                                    const nextDayRates = [...x.dayRates];
                                    nextDayRates[dayIndex] = value;
                                    return { ...x, dayRates: nextDayRates };
                                  }),
                                );
                              }}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <Link to="/admin/room-rate-plans" className="rounded border border-gray-300 px-4 py-2 dark:border-gray-600">
                Cancel
              </Link>
              {canSave ? (
                <button
                  type="button"
                  className="rounded bg-primary-600 px-4 py-2 text-white hover:bg-primary-700 disabled:opacity-50"
                  onClick={() => saveMutation.mutate()}
                  disabled={saveMutation.isPending}
                >
                  {saveMutation.isPending ? 'Saving...' : isEditing ? 'Update Group' : 'Create Group'}
                </button>
              ) : null}
            </div>
          </>
        )}
      </section>
    </div>
  );
};
