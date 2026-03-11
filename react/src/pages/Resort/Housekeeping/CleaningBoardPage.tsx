import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { MainLayout } from '@components/layout/MainLayout';
import { HousekeepingStatus, RoomOperationalStatus } from '@/types/resort.types';
import { resortService } from '@services/resort.service';

const CLEANING_TYPE_BADGE: Record<string, string> = {
  CheckoutCleaning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  StayoverCleaning: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  PickupCleaning: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
  Inspection: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
};

const HK_STATUS_BADGE: Record<HousekeepingStatus, string> = {
  [HousekeepingStatus.Clean]: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  [HousekeepingStatus.Dirty]: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
  [HousekeepingStatus.Inspected]: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
  [HousekeepingStatus.Pickup]: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
};

const toDateInputValue = (value: Date) => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const CleaningBoardPage = () => {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const selectedDateKey = toDateInputValue(selectedDate);

  const { data: boardData, isLoading } = useQuery({
    queryKey: ['housekeeping-cleaning-board', selectedDateKey],
    queryFn: () => resortService.getCleaningBoard(selectedDateKey),
  });

  const createTaskMutation = useMutation({
    mutationFn: resortService.createHousekeepingTask,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['housekeeping-cleaning-board'] });
      void queryClient.invalidateQueries({ queryKey: ['housekeeping-tasks'] });
    },
  });

  const rooms = boardData ?? [];

  const toTaskType = (cleaningType: string) => {
    switch (cleaningType) {
      case 'Stayover Cleaning':
        return 2;
      case 'Pickup Cleaning':
        return 3;
      case 'Inspection':
        return 4;
      default:
        return 1;
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Cleaning Board</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Rooms requiring cleaning or inspection today.</p>
        </div>

        <section className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Date</label>
            <DatePicker
              selected={selectedDate}
              onChange={(date: Date | null) => setSelectedDate(date ?? new Date())}
              dateFormat="yyyy-MM-dd"
              className="w-full max-w-xs rounded border p-2 dark:bg-gray-700"
            />
          </div>

          {isLoading ? <p className="text-sm text-gray-500">Loading cleaning board...</p> : null}

          {!isLoading && rooms.length === 0 ? (
            <p className="text-sm text-gray-500">No rooms require cleaning today.</p>
          ) : null}

          {!isLoading && rooms.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="p-2">Room</th>
                    <th className="p-2">Type</th>
                    <th className="p-2">Floor</th>
                    <th className="p-2">Op. Status</th>
                    <th className="p-2">HK Status</th>
                    <th className="p-2">Cleaning Type</th>
                    <th className="p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rooms.map((room) => (
                    <tr className="border-b" key={room.roomId}>
                      <td className="p-2 font-medium">{room.roomNumber}</td>
                      <td className="p-2 text-gray-600 dark:text-gray-300">{room.roomTypeName}</td>
                      <td className="p-2 text-gray-600 dark:text-gray-300">{room.floor ?? '-'}</td>
                      <td className="p-2">
                        <span className="text-xs font-medium">{RoomOperationalStatus[room.operationalStatus]}</span>
                      </td>
                      <td className="p-2">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${HK_STATUS_BADGE[room.housekeepingStatus]}`}>
                          {HousekeepingStatus[room.housekeepingStatus]}
                        </span>
                      </td>
                      <td className="p-2">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${CLEANING_TYPE_BADGE[room.cleaningType] ?? 'bg-gray-100 text-gray-700'}`}>
                          {room.cleaningType}
                        </span>
                      </td>
                      <td className="p-2">
                        <div className="flex gap-2">
                          {room.pendingTaskId ? null : (
                            <button
                              type="button"
                              className="rounded bg-primary-600 px-2 py-1 text-xs text-white hover:bg-primary-700 disabled:opacity-50"
                              disabled={createTaskMutation.isPending}
                              onClick={() =>
                                createTaskMutation.mutate({
                                  roomId: room.roomId,
                                  taskType: toTaskType(room.cleaningType),
                                  remarks: 'Requested from Cleaning Board',
                                  taskDate: selectedDateKey,
                                })
                              }
                            >
                              Create Task
                            </button>
                          )}
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
