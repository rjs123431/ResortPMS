import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MainLayout } from '@components/layout/MainLayout';
import { useAuth } from '@contexts/AuthContext';
import { PermissionNames } from '@config/permissionNames';
import { resortService } from '@services/resort.service';
import { RoomOperationalStatus } from '@/types/resort.types';
import type { RoomDto } from '@/types/resort.types';
import { RoomDialogForm } from './RoomDialogForm';

export const RoomListPage = () => {
  const queryClient = useQueryClient();
  const { isGranted } = useAuth();
  const canCreate = isGranted(PermissionNames.Pages_Rooms_Create);
  const canEdit = isGranted(PermissionNames.Pages_Rooms_Edit);
  const [filter, setFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<RoomDto>({
    id: '',
    roomNumber: '',
    roomTypeId: '',
    floor: '',
    operationalStatus: RoomOperationalStatus.Vacant,
    isActive: true,
  });

  const { data: roomsData, isLoading } = useQuery({
    queryKey: ['resort-rooms', filter],
    queryFn: () => resortService.getRooms(filter),
  });

  const { data: roomTypes } = useQuery({
    queryKey: ['resort-room-types'],
    queryFn: () => resortService.getRoomTypes(),
  });

  const createMutation = useMutation({
    mutationFn: resortService.createRoom,
    onSuccess: () => {
      setShowCreate(false);
      void queryClient.invalidateQueries({ queryKey: ['resort-rooms'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: resortService.updateRoom,
    onSuccess: () => {
      setEditingId(null);
      void queryClient.invalidateQueries({ queryKey: ['resort-rooms'] });
    },
  });

  const loadForEdit = async (id: string) => {
    const room = await resortService.getRoom(id);
    setForm(room);
    setEditingId(id);
  };

  const resetForm = () => {
    setForm({
      id: '',
      roomNumber: '',
      roomTypeId: '',
      floor: '',
      operationalStatus: RoomOperationalStatus.Vacant,
      isActive: true,
    });
  };

  const rooms = useMemo(() => roomsData?.items ?? [], [roomsData]);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Rooms</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage room inventory and assignment readiness.</p>
        </div>

        <section className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Room List</h2>
            {canCreate ? (
              <button
                type="button"
                className="rounded bg-primary-600 px-4 py-2 text-white hover:bg-primary-700"
                onClick={() => {
                  resetForm();
                  setShowCreate(true);
                }}
              >
                New Room
              </button>
            ) : null}
          </div>
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="w-full max-w-sm">
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Search Rooms</label>
              <input className="w-full rounded border p-2 dark:bg-gray-700" value={filter} onChange={(e) => setFilter(e.target.value)} />
            </div>
          </div>

          {isLoading ? <p className="text-sm text-gray-500">Loading...</p> : null}

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="p-2">Room</th>
                  <th className="p-2">Type</th>
                  <th className="p-2">Floor</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rooms.map((room) => (
                  <tr className="border-b" key={room.id}>
                    <td className="p-2">{room.roomNumber}</td>
                    <td className="p-2">{room.roomTypeName}</td>
                    <td className="p-2">{room.floor ?? '-'}</td>
                    <td className="p-2">{RoomOperationalStatus[room.operationalStatus] ?? '-'}</td>
                    <td className="p-2">
                      {canEdit ? (
                        <button type="button" className="rounded bg-slate-700 px-2 py-1 text-white" onClick={() => void loadForEdit(room.id)}>
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

        <RoomDialogForm
          isOpen={Boolean(showCreate || editingId)}
          editingId={editingId}
          form={form}
          roomTypes={roomTypes ?? []}
          canCreate={canCreate}
          canEdit={canEdit}
          isSaving={createMutation.isPending || updateMutation.isPending}
          onClose={() => {
            setShowCreate(false);
            setEditingId(null);
          }}
          onFormChange={(updater) => setForm((prev) => updater(prev))}
          onSave={() => {
            if (editingId) {
              updateMutation.mutate(form);
            } else {
              createMutation.mutate({
                roomNumber: form.roomNumber,
                roomTypeId: form.roomTypeId,
                floor: form.floor,
                operationalStatus: form.operationalStatus,
              });
            }
          }}
        />
      </div>
    </MainLayout>
  );
};
