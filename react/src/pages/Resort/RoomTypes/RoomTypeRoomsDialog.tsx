import { useEffect, useState } from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { resortService } from '@services/resort.service';
import { notifySuccess } from '@/utils/alerts';

type Props = {
  isOpen: boolean;
  roomTypeId: string;
  roomTypeName: string;
  canCreate: boolean;
  canEdit: boolean;
  onClose: () => void;
};

export const RoomTypeRoomsDialog = ({ isOpen, roomTypeId, roomTypeName, canCreate, canEdit, onClose }: Props) => {
  const queryClient = useQueryClient();
  const [newRoomNumber, setNewRoomNumber] = useState('');
  const [newFloor, setNewFloor] = useState('');
  const [newIsActive, setNewIsActive] = useState(true);
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [editRoomNumber, setEditRoomNumber] = useState('');
  const [editFloor, setEditFloor] = useState('');
  const [editIsActive, setEditIsActive] = useState(true);
  const [editHousekeepingStatus, setEditHousekeepingStatus] = useState<number | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const { data, isLoading } = useQuery({
    queryKey: ['room-type-rooms', roomTypeId],
    queryFn: () => resortService.getRooms('', 0, 500, roomTypeId),
    enabled: isOpen && !!roomTypeId,
  });

  const createMutation = useMutation({
    mutationFn: resortService.createRoom,
    onSuccess: () => {
      setNewRoomNumber('');
      setNewFloor('');
      setNewIsActive(true);
      void queryClient.invalidateQueries({ queryKey: ['room-type-rooms', roomTypeId] });
      void queryClient.invalidateQueries({ queryKey: ['resort-room-types-paged'] });
      void queryClient.invalidateQueries({ queryKey: ['resort-room-types'] });
      notifySuccess('Room added successfully.');
    },
  });

  const updateMutation = useMutation({
    mutationFn: resortService.updateRoom,
    onSuccess: () => {
      setEditingRoomId(null);
      void queryClient.invalidateQueries({ queryKey: ['room-type-rooms', roomTypeId] });
      void queryClient.invalidateQueries({ queryKey: ['resort-room-types-paged'] });
      void queryClient.invalidateQueries({ queryKey: ['resort-room-types'] });
      notifySuccess('Room updated successfully.');
    },
  });

  const rooms = data?.items ?? [];

  const handleAdd = () => {
    const trimmed = newRoomNumber.trim();
    if (!trimmed) return;
    createMutation.mutate({ roomNumber: trimmed, roomTypeId, floor: newFloor.trim() || undefined, isActive: newIsActive });
  };

  const startEdit = (room: (typeof rooms)[number]) => {
    setEditingRoomId(room.id);
    setEditRoomNumber(room.roomNumber);
    setEditFloor(room.floor ?? '');
    setEditIsActive(room.isActive);
    setEditHousekeepingStatus(room.housekeepingStatus);
  };

  const handleSaveEdit = () => {
    if (!editingRoomId || editHousekeepingStatus == null) return;
    const trimmed = editRoomNumber.trim();
    if (!trimmed) return;
    updateMutation.mutate({
      id: editingRoomId,
      roomNumber: trimmed,
      roomTypeId,
      floor: editFloor.trim() || undefined,
      housekeepingStatus: editHousekeepingStatus,
      isActive: editIsActive,
    });
  };

  return (
    <Dialog open={isOpen} onClose={() => {}} className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50 pointer-events-none" aria-hidden />
      <div className="relative flex min-h-screen items-center justify-center p-4 pointer-events-none">
        <DialogPanel className="w-full max-w-lg rounded-lg bg-white p-5 shadow-xl dark:bg-gray-800 pointer-events-auto">
          <div className="mb-4 flex items-center justify-between">
            <DialogTitle as="h3" className="text-lg font-semibold text-gray-900 dark:text-white">
              Rooms — {roomTypeName}
            </DialogTitle>
            <button className="rounded bg-gray-200 px-2 py-1 text-sm dark:bg-gray-700" onClick={onClose}>
              Close
            </button>
          </div>

          {isLoading ? (
            <p className="text-sm text-gray-500">Loading...</p>
          ) : rooms.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">No rooms assigned to this room type.</p>
          ) : (
            <div className="mb-4 max-h-64 overflow-y-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="p-2">Room #</th>
                    <th className="p-2">Floor</th>
                    <th className="p-2">Active</th>
                    {canEdit ? <th className="p-2">Actions</th> : null}
                  </tr>
                </thead>
                <tbody>
                  {rooms.map((room) => (
                    <tr key={room.id} className="border-b">
                      {editingRoomId === room.id ? (
                        <>
                          <td className="p-2">
                            <input
                              className="w-full rounded border p-1.5 text-sm dark:bg-gray-700"
                              value={editRoomNumber}
                              onChange={(e) => setEditRoomNumber(e.target.value)}
                            />
                          </td>
                          <td className="p-2">
                            <input
                              className="w-full rounded border p-1.5 text-sm dark:bg-gray-700"
                              value={editFloor}
                              onChange={(e) => setEditFloor(e.target.value)}
                            />
                          </td>
                          <td className="p-2">
                            <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                              <input
                                type="checkbox"
                                checked={editIsActive}
                                onChange={(e) => setEditIsActive(e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300"
                              />
                              Active
                            </label>
                          </td>
                          {canEdit ? (
                            <td className="p-2">
                              <div className="flex gap-1">
                                <button
                                  type="button"
                                  className="rounded bg-primary-600 px-2 py-1 text-xs text-white hover:bg-primary-700 disabled:opacity-50"
                                  disabled={updateMutation.isPending || !editRoomNumber.trim()}
                                  onClick={handleSaveEdit}
                                >
                                  {updateMutation.isPending ? 'Saving...' : 'Save'}
                                </button>
                                <button
                                  type="button"
                                  className="rounded bg-gray-300 px-2 py-1 text-xs text-gray-800 hover:bg-gray-400 dark:bg-gray-600 dark:text-gray-100"
                                  disabled={updateMutation.isPending}
                                  onClick={() => setEditingRoomId(null)}
                                >
                                  Cancel
                                </button>
                              </div>
                            </td>
                          ) : null}
                        </>
                      ) : (
                        <>
                          <td className="p-2">{room.roomNumber}</td>
                          <td className="p-2">{room.floor ?? '—'}</td>
                          <td className="p-2">{room.isActive ? 'Yes' : 'No'}</td>
                          {canEdit ? (
                            <td className="p-2">
                              <button
                                type="button"
                                className="rounded bg-slate-700 px-2 py-1 text-xs text-white"
                                onClick={() => startEdit(room)}
                              >
                                Edit
                              </button>
                            </td>
                          ) : null}
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {canCreate ? (
            <div className="border-t pt-3 dark:border-gray-700">
              <h4 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Add Room</h4>
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <label className="mb-1 block text-xs text-gray-600 dark:text-gray-400">Room Number</label>
                  <input
                    className="w-full rounded border p-2 text-sm dark:bg-gray-700"
                    value={newRoomNumber}
                    onChange={(e) => setNewRoomNumber(e.target.value)}
                    placeholder="e.g. 101"
                  />
                </div>
                <div className="w-24">
                  <label className="mb-1 block text-xs text-gray-600 dark:text-gray-400">Floor</label>
                  <input
                    className="w-full rounded border p-2 text-sm dark:bg-gray-700"
                    value={newFloor}
                    onChange={(e) => setNewFloor(e.target.value)}
                    placeholder="e.g. 1"
                  />
                </div>
                <label className="mb-2 inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={newIsActive}
                    onChange={(e) => setNewIsActive(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  Active
                </label>
                <button
                  type="button"
                  className="rounded bg-primary-600 px-3 py-2 text-sm text-white hover:bg-primary-700 disabled:opacity-50"
                  disabled={!newRoomNumber.trim() || createMutation.isPending}
                  onClick={handleAdd}
                >
                  {createMutation.isPending ? 'Adding...' : 'Add'}
                </button>
              </div>
              {createMutation.isError ? (
                <p className="mt-1 text-xs text-red-600">Failed to add room. It may already exist.</p>
              ) : null}
              {updateMutation.isError ? (
                <p className="mt-1 text-xs text-red-600">Failed to update room.</p>
              ) : null}
            </div>
          ) : null}
        </DialogPanel>
      </div>
    </Dialog>
  );
};
