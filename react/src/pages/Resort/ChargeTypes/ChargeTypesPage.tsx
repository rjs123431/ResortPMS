  import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@contexts/AuthContext';
import { PermissionNames } from '@config/permissionNames';
import { resortService } from '@services/resort.service';
import { RoomChargeType, type ChargeTypeDto } from '@/types/charge-type.types';
import { ChargeTypeDialogForm } from './ChargeTypeDialogForm';

const getRoomChargeTypeLabel = (value: RoomChargeType) => {
  switch (value) {
    case RoomChargeType.Room:
      return 'Room';
    case RoomChargeType.ExtraBed:
      return 'Extra Bed';
    default:
      return 'None';
  }
};

export const ChargeTypeListPage = () => {
  const queryClient = useQueryClient();
  const { isGranted } = useAuth();
  const canCreate = isGranted(PermissionNames.Pages_ChargeTypes_Create);
  const canEdit = isGranted(PermissionNames.Pages_ChargeTypes_Edit);
  const [filter, setFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ChargeTypeDto>({
    id: '',
    name: '',
    category: '',
    sort: 0,
    roomChargeType: RoomChargeType.None,
    isActive: true,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['resort-charge-types-paged', filter],
    queryFn: () => resortService.getChargeTypesPaged(filter),
  });

  const createMutation = useMutation({
    mutationFn: resortService.createChargeType,
    onSuccess: () => {
      setShowCreate(false);
      void queryClient.invalidateQueries({ queryKey: ['resort-charge-types-paged'] });
      void queryClient.invalidateQueries({ queryKey: ['resort-charge-types'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: resortService.updateChargeType,
    onSuccess: () => {
      setEditingId(null);
      void queryClient.invalidateQueries({ queryKey: ['resort-charge-types-paged'] });
      void queryClient.invalidateQueries({ queryKey: ['resort-charge-types'] });
    },
  });

  const items = useMemo(() => data?.items ?? [], [data]);

  const loadForEdit = async (id: string) => {
    const item = await resortService.getChargeType(id);
    setForm(item);
    setEditingId(id);
  };

  return (
    <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Charge Types</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Define charge categories for folio postings.</p>
          </div>

          {canCreate ? (
            <button
              type="button"
              className="rounded bg-primary-600 px-4 py-2 text-white hover:bg-primary-700"
              onClick={() => {
                setForm({
                  id: '',
                  name: '',
                  category: '',
                  sort: 0,
                  roomChargeType: RoomChargeType.None,
                  isActive: true,
                });
                setShowCreate(true);
              }}
            >
              New Charge Type
            </button>
          ) : null}
        </div>

        <section className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Charge Type List</h2>
            <div className="flex items-end gap-2">
              <div className="w-full max-w-sm">
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Search Charge Types</label>
                <input className="w-full rounded border p-2 dark:bg-gray-700" value={filter} onChange={(e) => setFilter(e.target.value)} />
              </div>
            </div>
          </div>

          {isLoading ? <p className="text-sm text-gray-500">Loading...</p> : null}

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="p-2">Name</th>
                  <th className="p-2">Category</th>
                  <th className="p-2">Room Charge Type</th>
                  <th className="p-2">Active</th>
                  <th className="p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr className="border-b" key={item.id}>
                    <td className="p-2">{item.name}</td>
                    <td className="p-2">{item.category}</td>
                    <td className="p-2">{getRoomChargeTypeLabel(item.roomChargeType)}</td>
                    <td className="p-2">{item.isActive ? 'Yes' : 'No'}</td>
                    <td className="p-2">
                      {canEdit ? (
                        <button type="button" className="rounded bg-slate-700 px-2 py-1 text-white" onClick={() => void loadForEdit(item.id)}>
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

        <ChargeTypeDialogForm
          isOpen={Boolean(showCreate || editingId)}
          editingId={editingId}
          form={form}
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
              updateMutation.mutate({
                ...form,
                name: (form.name ?? '').trim(),
                category: (form.category ?? '').trim(),
              });
            } else {
              createMutation.mutate({
                name: (form.name ?? '').trim(),
                category: (form.category ?? '').trim(),
                sort: form.sort,
                roomChargeType: form.roomChargeType,
              });
            }
          }}
        />
    </div>
  );
};
