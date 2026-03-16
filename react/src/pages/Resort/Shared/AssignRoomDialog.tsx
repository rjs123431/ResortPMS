import { useEffect } from 'react';
import { Dialog, DialogPanel } from '@headlessui/react';
import { useQuery } from '@tanstack/react-query';
import { HousekeepingStatus } from '@/types/resort.types';
import { resortService } from '@/services/resort.service';

/** Format date for API (YYYY-MM-DD). */
const toDateOnly = (d: string | undefined | null): string | undefined => {
  if (d == null || !d.trim()) return undefined;
  const s = d.trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const date = new Date(s);
  if (Number.isNaN(date.getTime())) return undefined;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

type AssignRoomDialogProps = {
  open: boolean;
  isChangeRoom: boolean;
  roomTypeName?: string;
  roomTypeId?: string;
  selectedRoomId: string;
  excludeRoomIds?: string[];
  allowDirtySelection?: boolean;
  /** When set, fetches available rooms from room daily inventory for this date range and reservation (reservation assign flow). */
  arrivalDate?: string | null;
  departureDate?: string | null;
  reservationId?: string | null;
  onSelectRoom: (roomId: string) => void;
  onClose: () => void;
  onConfirm?: () => void;
};


const getRoomStatusLabel = (housekeepingStatus?: HousekeepingStatus) => {
  return housekeepingStatus !== undefined ? HousekeepingStatus[housekeepingStatus] : '—';
};

const getRoomStatusBadgeClass = (housekeepingStatus?: HousekeepingStatus) => {
  if (housekeepingStatus === HousekeepingStatus.Dirty) {
    return 'bg-yellow-200 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200';
  }
  if (housekeepingStatus === HousekeepingStatus.Clean) {
    return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300';
  }
  return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200';
};

export const AssignRoomDialog = ({
  open,
  isChangeRoom,
  roomTypeName,
  roomTypeId,
  selectedRoomId,
  excludeRoomIds = [],
  allowDirtySelection = false,
  arrivalDate,
  departureDate,
  reservationId,
  onSelectRoom,
  onClose,
}: AssignRoomDialogProps) => {
  const excludeSet = new Set(excludeRoomIds);
  const arrival = toDateOnly(arrivalDate ?? undefined);
  const departure = toDateOnly(departureDate ?? undefined);
  const useInventoryAvailability = Boolean(open && roomTypeId && arrival && departure);

  const { data: rooms = [], isLoading } = useQuery({
    queryKey: [
      'assign-room-dialog-rooms',
      roomTypeId,
      open,
      useInventoryAvailability ? arrival : null,
      useInventoryAvailability ? departure : null,
      useInventoryAvailability ? reservationId : null,
    ],
    queryFn: async () => {
      if (!open || !roomTypeId) return [];
      if (useInventoryAvailability && arrival && departure) {
        return resortService.getAvailableRooms(
          roomTypeId,
          arrival,
          departure,
          reservationId ?? undefined,
          false,
          false
        );
      }
      const result = await resortService.getRooms('', 0, 1000);
      return result.items.filter((r) => r.roomTypeId === roomTypeId);
    },
    enabled: open && !!roomTypeId,
    staleTime: 10 * 1000,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });

  const filteredRooms = rooms.filter(
    (room) => room.id === selectedRoomId || !excludeSet.has(room.id)
  );

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  return (
    <Dialog open={open} onClose={() => {}} className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50 pointer-events-none" aria-hidden />
      <div className="relative flex min-h-screen items-center justify-center p-4 pointer-events-none">
        <DialogPanel className="w-full max-w-xl rounded-lg bg-white p-4 shadow-lg dark:bg-gray-800 pointer-events-auto">
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
                    const isDirty = room.housekeepingStatus === HousekeepingStatus.Dirty;
                    const isDisabled = isCurrentlySelected || (isDirty && !allowDirtySelection);
                    return (
                      <tr
                        key={room.id}
                        className={`border-b dark:border-gray-700 ${
                          isCurrentlySelected
                            ? 'bg-primary-50 dark:bg-primary-900/20'
                            : isDirty
                              ? 'bg-yellow-50/50 dark:bg-yellow-900/10'
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
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${getRoomStatusBadgeClass(room.housekeepingStatus)}`}>
                            {getRoomStatusLabel(room.housekeepingStatus)}
                          </span>
                        </td>
                        <td className="p-2">
                          <button
                            type="button"
                            className={`rounded px-3 py-1.5 text-xs text-white ${
                              isDisabled
                                ? 'bg-gray-400 cursor-not-allowed'
                                : isDirty && allowDirtySelection
                                  ? 'bg-amber-600 hover:bg-amber-700'
                                  : 'bg-primary-600 hover:bg-primary-700'
                            }`}
                            disabled={isDisabled}
                            onClick={() => {
                              onSelectRoom(room.id);
                            }}
                          >
                            {isCurrentlySelected ? 'Selected' : isDirty && !allowDirtySelection ? 'Dirty' : 'Select'}
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
