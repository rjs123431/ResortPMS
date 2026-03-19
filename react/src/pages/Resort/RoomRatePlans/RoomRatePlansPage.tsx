import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@contexts/AuthContext';
import { PermissionNames } from '@config/permissionNames';
import { resortService } from '@services/resort.service';

type RoomRatePlanGroupListItem = {
  code: string;
  name: string;
  startDate: string;
  endDate?: string;
  priority: number;
  isDefault: boolean;
  isActive: boolean;
  roomTypeNames: string[];
  planIds: string[];
};

export const RoomRatePlansPage = () => {
  const { isGranted } = useAuth();
  const canCreate = isGranted(PermissionNames.Pages_RoomRatePlans_Create);
  const canEdit = isGranted(PermissionNames.Pages_RoomRatePlans_Edit);
  const [filter, setFilter] = useState('');
  const [roomTypeFilter, setRoomTypeFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['resort-room-rate-plans-paged', filter, roomTypeFilter],
    queryFn: () =>
      resortService.getRoomRatePlansPaged({
        filter,
        roomTypeId: roomTypeFilter || undefined,
        maxResultCount: 500,
      }),
  });

  const { data: roomTypes } = useQuery({
    queryKey: ['resort-room-types'],
    queryFn: () => resortService.getRoomTypes(),
  });

  const items = useMemo(() => data?.items ?? [], [data]);

  const groups = useMemo<RoomRatePlanGroupListItem[]>(() => {
    const byCode = new Map<string, RoomRatePlanGroupListItem>();

    for (const item of items) {
      const key = (item.code || '').trim().toUpperCase();
      if (!byCode.has(key)) {
        byCode.set(key, {
          code: item.code,
          name: item.name,
          startDate: item.startDate,
          endDate: item.endDate,
          priority: item.priority,
          isDefault: item.isDefault,
          isActive: item.isActive,
          roomTypeNames: [],
          planIds: [],
        });
      }

      const group = byCode.get(key)!;
      if (!group.roomTypeNames.includes(item.roomTypeName)) {
        group.roomTypeNames.push(item.roomTypeName);
      }
      group.planIds.push(item.id);
    }

    return Array.from(byCode.values()).sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      return a.name.localeCompare(b.name);
    });
  }, [items]);

  return (
    <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Room Rate Plans</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Manage rate groups and room-type pricing from a single group definition.</p>
          </div>

          {canCreate ? (
            <Link
              to="/admin/room-rate-plans/new"
              className="rounded bg-primary-600 px-4 py-2 text-white hover:bg-primary-700"
            >
              New Rate Plan
            </Link>
          ) : null}
        </div>

        <section className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
          <div className="mb-3 flex flex-wrap items-end gap-3">
            <div className="w-full max-w-xs">
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Search</label>
              <input className="w-full rounded border p-2 dark:bg-gray-700" value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Group code or name" />
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
                  <th className="p-2">Code</th>
                  <th className="p-2">Name</th>
                  <th className="p-2">Start</th>
                  <th className="p-2">End</th>
                  <th className="p-2">Priority</th>
                  <th className="p-2">Default</th>
                  <th className="p-2">Active</th>
                  <th className="p-2">Room Types</th>
                  <th className="p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {groups.map((group: RoomRatePlanGroupListItem) => (
                  <tr className="border-b" key={group.code}>
                    <td className="p-2">{group.code}</td>
                    <td className="p-2">{group.name}</td>
                    <td className="p-2">{group.startDate.slice(0, 10)}</td>
                    <td className="p-2">{group.endDate ? group.endDate.slice(0, 10) : '—'}</td>
                    <td className="p-2">{group.priority}</td>
                    <td className="p-2">{group.isDefault ? 'Yes' : 'No'}</td>
                    <td className="p-2">{group.isActive ? 'Yes' : 'No'}</td>
                    <td className="p-2">{group.roomTypeNames.length}</td>
                    <td className="p-2">
                      {canEdit ? (
                        <Link
                          to={`/admin/room-rate-plans/${encodeURIComponent(group.code)}/edit`}
                          className="rounded bg-slate-700 px-2 py-1 text-white"
                        >
                          Edit
                        </Link>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
    </div>
  );
};
