import { Dialog, DialogPanel } from '@headlessui/react';
import { RoomStatus } from '@/types/resort.types';

type AssignableRoomOption = {
  id: string;
  roomNumber: string;
  floor?: string;
  baseRate: number;
  status?: RoomStatus;
};

type AssignRoomDialogProps = {
  open: boolean;
  isChangeRoom: boolean;
  roomTypeName?: string;
  rooms: AssignableRoomOption[];
  selectedRoomId: string;
  onSelectRoom: (roomId: string) => void;
  onClose: () => void;
  onConfirm: () => void;
};

const round2 = (value: number) => Math.round(value * 100) / 100;
const formatMoney = (value: number) =>
  round2(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const getRoomStatusLabel = (status?: RoomStatus) => {
  switch (status) {
    case RoomStatus.VacantClean:
      return 'Vacant Clean';
    case RoomStatus.VacantDirty:
      return 'Vacant Dirty';
    case RoomStatus.Occupied:
      return 'Occupied';
    case RoomStatus.OutOfOrder:
      return 'Out of Order';
    case RoomStatus.Maintenance:
      return 'Out of Order';
    default:
      return 'Unknown';
  }
};

const getRoomStatusBadgeClass = (status?: RoomStatus) => {
  switch (status) {
    case RoomStatus.VacantClean:
      return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300';
    case RoomStatus.VacantDirty:
      return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300';
    case RoomStatus.Occupied:
      return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300';
    case RoomStatus.OutOfOrder:
    case RoomStatus.Maintenance:
      return 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200';
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200';
  }
};

export const AssignRoomDialog = ({
  open,
  isChangeRoom,
  roomTypeName,
  rooms,
  selectedRoomId,
  onSelectRoom,
  onClose,
  onConfirm,
}: AssignRoomDialogProps) => {
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

          {rooms.length === 0 ? (
            <p className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:border-amber-700/40 dark:bg-amber-900/20 dark:text-amber-200">
              No available rooms for this room type.
            </p>
          ) : (
            <div className="max-h-64 overflow-y-auto rounded border dark:border-gray-700">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b text-left dark:border-gray-700">
                    <th className="p-2">Select</th>
                    <th className="p-2">Room No.</th>
                    <th className="p-2">Floor</th>
                    <th className="p-2">Status</th>
                    <th className="p-2 text-right">Base Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {rooms.map((room) => (
                    <tr
                      key={room.id}
                      className={`cursor-pointer border-b dark:border-gray-700 ${
                        selectedRoomId === room.id
                          ? 'bg-primary-50 dark:bg-primary-900/20'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      }`}
                      onClick={() => onSelectRoom(room.id)}
                    >
                      <td className="p-2">
                        <input
                          type="radio"
                          name="assign-room"
                          checked={selectedRoomId === room.id}
                          onChange={() => onSelectRoom(room.id)}
                        />
                      </td>
                      <td className="p-2">{room.roomNumber}</td>
                      <td className="p-2">{room.floor || '-'}</td>
                      <td className="p-2">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${getRoomStatusBadgeClass(room.status)}`}>
                          {getRoomStatusLabel(room.status)}
                        </span>
                      </td>
                      <td className="p-2 text-right tabular-nums">{formatMoney(room.baseRate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              className="rounded border px-3 py-1.5 text-sm dark:border-gray-600"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="button"
              className="rounded bg-primary-600 px-3 py-1.5 text-sm text-white disabled:opacity-50"
              disabled={!selectedRoomId}
              onClick={onConfirm}
            >
              {isChangeRoom ? 'Change Room' : 'Assign Room'}
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
};
