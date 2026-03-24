import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { HousekeepingLayout } from '@components/layout/HousekeepingLayout';
import { HousekeepingStatus } from '@/types/resort.types';
import { resortService } from '@services/resort.service';

const HK_STATUS_BADGE: Record<HousekeepingStatus, string> = {
  [HousekeepingStatus.Clean]: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  [HousekeepingStatus.Dirty]: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
  [HousekeepingStatus.Inspected]: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
  [HousekeepingStatus.Pickup]: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
};

export const HousekeepingRoomStatusPage = () => {
  const queryClient = useQueryClient();

  const { data: roomsData, isLoading } = useQuery({
    queryKey: ['housekeeping-room-status-rooms'],
    queryFn: () => resortService.getRooms('', 0, 500),
    staleTime: 30 * 1000,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });

  const { data: logsData, isLoading: isLoadingLogs } = useQuery({
    queryKey: ['housekeeping-logs'],
    queryFn: () => resortService.getHousekeepingLogs({ maxResultCount: 30 }),
    staleTime: 30 * 1000,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });

  const markStatusMutation = useMutation({
    mutationFn: ({ roomId, status }: { roomId: string; status: HousekeepingStatus }) =>
      resortService.updateRoomHousekeepingStatus(roomId, status),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['housekeeping-room-status-rooms'] });
      void queryClient.invalidateQueries({ queryKey: ['housekeeping-logs'] });
    },
  });

  const rooms = roomsData?.items ?? [];
  const logs = logsData?.items ?? [];

  return (
    <HousekeepingLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Room Status</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Housekeeping view — update room cleanliness status across the property.</p>
          </div>
        </div>

        <section className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">

          {isLoading ? <p className="text-sm text-gray-500">Loading rooms...</p> : null}

          {!isLoading ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="p-2">Room</th>
                    <th className="p-2">Type</th>
                    <th className="p-2">Floor</th>
                    <th className="p-2">HK Status</th>
                    <th className="p-2">Mark As</th>
                  </tr>
                </thead>
                <tbody>
                  {rooms.map((room) => (
                    <tr className="border-b" key={room.id}>
                      <td className="p-2 font-medium">{room.roomNumber}</td>
                      <td className="p-2 text-gray-600 dark:text-gray-300">{room.roomTypeName}</td>
                      <td className="p-2 text-gray-600 dark:text-gray-300">{room.floor ?? '-'}</td>
                      <td className="p-2">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${HK_STATUS_BADGE[room.housekeepingStatus]}`}>
                          {HousekeepingStatus[room.housekeepingStatus]}
                        </span>
                      </td>
                      <td className="p-2">
                        <div className="flex flex-wrap gap-1">
                          {([
                            { label: 'Clean', value: HousekeepingStatus.Clean, cls: 'bg-emerald-600 hover:bg-emerald-700' },
                            { label: 'Dirty', value: HousekeepingStatus.Dirty, cls: 'bg-rose-600 hover:bg-rose-700' },
                          ] as const)
                            .filter(({ value }) => room.housekeepingStatus !== value)
                            .map(({ label, value, cls }) => (
                            <button
                              key={value}
                              type="button"
                              className={`rounded px-2 py-1 text-xs text-white disabled:opacity-50 ${cls}`}
                              disabled={markStatusMutation.isPending}
                              onClick={() => markStatusMutation.mutate({ roomId: room.id, status: value })}
                            >
                              {label}
                            </button>
                            ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>

        <section className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
          <div className="mb-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Housekeeping Logs</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Latest room housekeeping status transitions.</p>
          </div>

          {isLoadingLogs ? <p className="text-sm text-gray-500">Loading logs...</p> : null}

          {!isLoadingLogs ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="p-2">Time</th>
                    <th className="p-2">Room</th>
                    <th className="p-2">Status Change</th>
                    <th className="p-2">Staff</th>
                    <th className="p-2">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr className="border-b" key={log.id}>
                      <td className="p-2 tabular-nums">{new Date(log.loggedAt).toLocaleString()}</td>
                      <td className="p-2">{log.roomNumber}</td>
                      <td className="p-2">{`${HousekeepingStatus[log.oldStatus]} -> ${HousekeepingStatus[log.newStatus]}`}</td>
                      <td className="p-2">{log.staffName || 'System'}</td>
                      <td className="p-2">{log.remarks || '-'}</td>
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
