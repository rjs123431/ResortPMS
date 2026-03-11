import { Dialog, DialogPanel } from '@headlessui/react';
import { useQuery } from '@tanstack/react-query';
import { RoomOperationalStatus, HousekeepingStatus } from '@/types/resort.types';
import { resortService } from '@/services/resort.service';

type AssignRoomDialogProps = {
  open: boolean;
  isChangeRoom: boolean;
  roomTypeName?: string;
  roomTypeId?: string;
  selectedRoomId: string;
  excludeRoomIds?: string[];
  onSelectRoom: (roomId: string) => void;
  onClose: () => void;
  onConfirm?: () => void;
};


const getRoomStatusLabel = (operationalStatus?: RoomOperationalStatus, housekeepingStatus?: HousekeepingStatus) => {
  const opLabel = operationalStatus !== undefined ? RoomOperationalStatus[operationalStatus] : 'Unknown';
  const hkLabel = housekeepingStatus !== undefined ? HousekeepingStatus[housekeepingStatus] : '';
  return hkLabel ? `${opLabel} / ${hkLabel}` : opLabel;
};

const getRoomStatusBadgeClass = (operationalStatus?: RoomOperationalStatus, housekeepingStatus?: HousekeepingStatus) => {
  // Vacant Dirty: op = Vacant, hk = Dirty
  if (operationalStatus === RoomOperationalStatus.Vacant && housekeepingStatus === HousekeepingStatus.Dirty) {
    return 'bg-yellow-200 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200';
  }
  switch (operationalStatus) {
    case RoomOperationalStatus.Vacant:
      return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300';
    case RoomOperationalStatus.Occupied:
      return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300';
    case RoomOperationalStatus.Reserved:
      return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300';
    case RoomOperationalStatus.OutOfOrder:
    case RoomOperationalStatus.OutOfService:
      return 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200';
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200';
  }
};

export const AssignRoomDialog = ({
  open,
  isChangeRoom,
  roomTypeName,
  roomTypeId,
  selectedRoomId,
  excludeRoomIds = [],
  onSelectRoom,
  onClose,
}: AssignRoomDialogProps) => {
  const excludeSet = new Set(excludeRoomIds);

  const { data: rooms = [], isLoading } = useQuery({
    queryKey: ['assign-room-dialog-rooms', roomTypeId, open],
    queryFn: async () => {
      if (!open || !roomTypeId) return [];
      const result = await resortService.getRooms('', 0, 1000);
      return result.items.filter((r) => r.roomTypeId === roomTypeId && r.operationalStatus === RoomOperationalStatus.Vacant);
    },
    enabled: open && !!roomTypeId,
    staleTime: 10 * 1000,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });

  const filteredRooms = rooms.filter(
    (room) => room.id === selectedRoomId || !excludeSet.has(room.id)
  );
  return (
    <Dialog open={open} onClose={onClose} className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center bg-black/40 p-4">
        <DialogPanel className="w-full max-w-xl rounded-lg bg-white p-4 shadow-lg dark:bg-gray-800">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              {isChangeRoom ? 'Change Room' : 'Assign Room'}
            </h3>
            <button
              type="button"
              className="rounded border px-2 py-1 text-xs dark:border-gray-600"
              onClick={onClose}
            >
              Close
            </button>
          </div>

          <p className="mb-2 text-sm text-gray-600 dark:text-gray-300">
            {roomTypeName ? `Select available ${roomTypeName} room.` : 'Select available room.'}
          </p>

          {isLoading ? (
            <p className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:border-amber-700/40 dark:bg-amber-900/20 dark:text-amber-200">
              Loading available rooms...
            </p>
          ) : filteredRooms.length === 0 ? (
            <p className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:border-amber-700/40 dark:bg-amber-900/20 dark:text-amber-200">
              No available rooms for this room type.
            </p>
          ) : (
            <div className="max-h-64 overflow-y-auto rounded border dark:border-gray-700">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b text-left dark:border-gray-700">
                    <th className="p-2">Room No.</th>
                    <th className="p-2">Floor</th>
                    <th className="p-2">Status</th>
                    <th className="p-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRooms.map((room) => {
                    const isCurrentlySelected = room.id === selectedRoomId;
                    return (
                      <tr
                        key={room.id}
                        className={`border-b dark:border-gray-700 ${
                          isCurrentlySelected
                            ? 'bg-primary-50 dark:bg-primary-900/20'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                        }`}
                      >
                        <td className="p-2">
                          {room.roomNumber}
                          {isCurrentlySelected && (
                            <span className="ml-2 inline-flex rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
                              Current
                            </span>
                          )}
                        </td>
                        <td className="p-2">{room.floor || '-'}</td>
                        <td className="p-2">
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${getRoomStatusBadgeClass(room.operationalStatus, room.housekeepingStatus)}`}>
                            {getRoomStatusLabel(room.operationalStatus, room.housekeepingStatus)}
                          </span>
                        </td>
                        <td className="p-2">
                          <button
                            type="button"
                            className={`rounded px-3 py-1.5 text-xs text-white ${
                              isCurrentlySelected
                                ? 'bg-gray-400 cursor-default'
                                : 'bg-primary-600 hover:bg-primary-700'
                            }`}
                            disabled={isCurrentlySelected}
                            onClick={() => {
                              onSelectRoom(room.id);
                            }}
                          >
                            {isCurrentlySelected ? 'Selected' : 'Select'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* No footer buttons, selection is per-row */}
        </DialogPanel>
      </div>
    </Dialog>
  );
};
