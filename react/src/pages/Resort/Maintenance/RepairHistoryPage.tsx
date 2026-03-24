import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MaintenanceLayout } from '@components/layout/MaintenanceLayout';
import { resortService } from '@/services/resort.service';
import {
  MaintenanceCategory,
  RoomMaintenancePriority,
  RoomMaintenanceStatus,
} from '@/types/resort.types';

const PRIORITY_LABEL: Record<RoomMaintenancePriority, string> = {
  [RoomMaintenancePriority.Low]: 'Low',
  [RoomMaintenancePriority.Medium]: 'Medium',
  [RoomMaintenancePriority.High]: 'High',
  [RoomMaintenancePriority.Critical]: 'Critical',
};

const PRIORITY_BADGE: Record<RoomMaintenancePriority, string> = {
  [RoomMaintenancePriority.Low]: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
  [RoomMaintenancePriority.Medium]: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  [RoomMaintenancePriority.High]: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  [RoomMaintenancePriority.Critical]: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
};

export const RepairHistoryPage = () => {
  const [filterRoom, setFilterRoom] = useState('');
  const [filterCategory, setFilterCategory] = useState<'' | 'reactive' | 'preventive'>('');

  const { data, isLoading } = useQuery({
    queryKey: ['resort-repair-history'],
    queryFn: () =>
      resortService.getRoomMaintenanceRequests({
        status: RoomMaintenanceStatus.Completed,
        maxResultCount: 500,
      }),
  });

  const allItems = data?.items ?? [];

  const filtered = allItems.filter((r) => {
    if (filterRoom && !r.roomNumber.toLowerCase().includes(filterRoom.toLowerCase())) return false;
    if (filterCategory === 'reactive' && r.category !== MaintenanceCategory.Reactive) return false;
    if (filterCategory === 'preventive' && r.category !== MaintenanceCategory.Preventive) return false;
    return true;
  });

  return (
    <MaintenanceLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Repair History</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Browse the complete log of completed repairs and maintenance work.</p>
          </div>
        </div>

        {/* Filters */}
        <section className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
          <div className="flex flex-wrap gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Room</label>
              <input
                className="rounded border p-2 text-sm dark:bg-gray-700"
                placeholder="Room number"
                value={filterRoom}
                onChange={(e) => setFilterRoom(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Category</label>
              <select
                className="rounded border p-2 text-sm dark:bg-gray-700"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value as '' | 'reactive' | 'preventive')}
              >
                <option value="">All</option>
                <option value="reactive">Reactive</option>
                <option value="preventive">Preventive</option>
              </select>
            </div>
          </div>
        </section>

        <section className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
          {isLoading ? <p className="text-sm text-gray-500">Loading repair history...</p> : null}
          {!isLoading && filtered.length === 0 ? <p className="text-sm text-gray-500">No completed orders match the current filter.</p> : null}

          {!isLoading && filtered.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="p-2">Room</th>
                    <th className="p-2">Title</th>
                    <th className="p-2">Types</th>
                    <th className="p-2">Category</th>
                    <th className="p-2">Priority</th>
                    <th className="p-2">Date Range</th>
                    <th className="p-2">Assigned Staff</th>
                    <th className="p-2">Completed At</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((request) => (
                    <tr className="border-b hover:bg-gray-50 dark:hover:bg-gray-700/30" key={request.id}>
                      <td className="p-2 font-medium">{request.roomNumber}</td>
                      <td className="p-2">{request.title}</td>
                      <td className="p-2">
                        {request.typeNames && request.typeNames.length > 0
                          ? request.typeNames.join(', ')
                          : <span className="text-gray-400">—</span>}
                      </td>
                      <td className="p-2">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${request.category === MaintenanceCategory.Preventive ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300' : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'}`}>
                          {request.category === MaintenanceCategory.Preventive ? 'Preventive' : 'Reactive'}
                        </span>
                      </td>
                      <td className="p-2">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_BADGE[request.priority]}`}>
                          {PRIORITY_LABEL[request.priority]}
                        </span>
                      </td>
                      <td className="p-2 tabular-nums">
                        {new Date(request.startDate).toLocaleDateString()} – {new Date(request.endDate).toLocaleDateString()}
                      </td>
                      <td className="p-2">{request.assignedStaffName || <span className="text-gray-400">—</span>}</td>
                      <td className="p-2 tabular-nums">
                        {request.completedAt
                          ? new Date(request.completedAt).toLocaleString()
                          : <span className="text-gray-400">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {!isLoading && filtered.length > 0 ? (
            <p className="mt-3 text-xs text-gray-400">{filtered.length} record{filtered.length !== 1 ? 's' : ''}</p>
          ) : null}
        </section>
      </div>
    </MaintenanceLayout>
  );
};

