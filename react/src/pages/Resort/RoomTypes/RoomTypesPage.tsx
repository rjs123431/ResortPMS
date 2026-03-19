import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@contexts/AuthContext';
import { PermissionNames } from '@config/permissionNames';
import { resortService } from '@services/resort.service';
import { RoomTypeDialogForm, type RoomTypeForm } from './RoomTypeDialogForm';
import { RoomTypeRoomsDialog } from './RoomTypeRoomsDialog';

const ROOM_TYPE_META_PREFIX = '__RTMETA__';

const splitCsv = (value: string) => value.split(',').map((x) => x.trim()).filter((x) => x.length > 0);

const getDefaultProfile = (name: string) => {
  if (name.toLowerCase().includes('superior twin')) {
    return {
      bedTypeSummary: '2 twin beds',
      featureTagsText: '1 room, 40 m2, Balcony, Sea view, Air conditioning, Attached bathroom, Terrace',
      amenityItemsText: 'Free toiletries, Shower, Safe, Toilet, Towels, Desk',
    };
  }

  if (name.toLowerCase().includes('superior king')) {
    return {
      bedTypeSummary: '1 full bed',
      featureTagsText: '1 room, 40 m2, Balcony, Sea view, Air conditioning, Attached bathroom, Terrace',
      amenityItemsText: 'Free toiletries, Shower, Safe, Toilet, Towels, Desk',
    };
  }

  return {
    bedTypeSummary: '1 bed',
    featureTagsText: '1 room',
    amenityItemsText: 'Free toiletries, Shower, Safe, Toilet, Towels, Desk',
  };
};

const parseRoomTypeMeta = (description?: string, name = '') => {
  const defaults = getDefaultProfile(name);
  if (!description || !description.startsWith(ROOM_TYPE_META_PREFIX)) {
    return {
      plainDescription: description ?? '',
      ...defaults,
    };
  }

  try {
    const parsed = JSON.parse(description.slice(ROOM_TYPE_META_PREFIX.length)) as {
      plainDescription?: string;
      bedTypeSummary?: string;
      featureTags?: string[];
      amenityItems?: string[];
    };

    return {
      plainDescription: parsed.plainDescription ?? '',
      bedTypeSummary: parsed.bedTypeSummary ?? defaults.bedTypeSummary,
      featureTagsText: (parsed.featureTags ?? []).join(', ') || defaults.featureTagsText,
      amenityItemsText: (parsed.amenityItems ?? []).join(', ') || defaults.amenityItemsText,
    };
  } catch {
    return {
      plainDescription: description,
      ...defaults,
    };
  }
};

const encodeRoomTypeDescription = (form: RoomTypeForm) =>
  `${ROOM_TYPE_META_PREFIX}${JSON.stringify({
    plainDescription: form.plainDescription,
    bedTypeSummary: form.bedTypeSummary,
    featureTags: splitCsv(form.featureTagsText),
    amenityItems: splitCsv(form.amenityItemsText),
  })}`;

export const RoomTypeListPage = () => {
  const queryClient = useQueryClient();
  const { isGranted } = useAuth();
  const canCreate = isGranted(PermissionNames.Pages_RoomTypes_Create);
  const canEdit = isGranted(PermissionNames.Pages_RoomTypes_Edit);
  const canCreateRooms = isGranted(PermissionNames.Pages_Rooms_Create);
  const canEditRooms = isGranted(PermissionNames.Pages_Rooms_Edit);
  const [filter, setFilter] = useState('');
  const [roomsDialogTarget, setRoomsDialogTarget] = useState<{ id: string; name: string } | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<RoomTypeForm>({
    id: '',
    name: '',
    description: '',
    plainDescription: '',
    bedTypeSummary: '1 bed',
    featureTagsText: '1 room',
    amenityItemsText: 'Free toiletries, Shower, Safe, Toilet, Towels, Desk',
    maxAdults: 2,
    maxChildren: 0,
    isActive: true,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['resort-room-types-paged', filter],
    queryFn: () => resortService.getRoomTypesPaged(filter),
  });

  const createMutation = useMutation({
    mutationFn: resortService.createRoomType,
    onSuccess: () => {
      setShowCreate(false);
      void queryClient.invalidateQueries({ queryKey: ['resort-room-types-paged'] });
      void queryClient.invalidateQueries({ queryKey: ['resort-room-types'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: resortService.updateRoomType,
    onSuccess: () => {
      setEditingId(null);
      void queryClient.invalidateQueries({ queryKey: ['resort-room-types-paged'] });
      void queryClient.invalidateQueries({ queryKey: ['resort-room-types'] });
    },
  });

  const items = useMemo(() => data?.items ?? [], [data]);

  const resetForm = () => {
    setForm({
      id: '',
      name: '',
      description: '',
      plainDescription: '',
      bedTypeSummary: '1 bed',
      featureTagsText: '1 room',
      amenityItemsText: 'Free toiletries, Shower, Safe, Toilet, Towels, Desk',
      maxAdults: 2,
      maxChildren: 0,
      isActive: true,
    });
  };

  const loadForEdit = async (id: string) => {
    const entity = await resortService.getRoomType(id);
    const meta = parseRoomTypeMeta(entity.description, entity.name);
    setForm({
      ...entity,
      ...meta,
    });
    setEditingId(id);
  };

  return (
    <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Room Types</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Define room categories and base rates.</p>
          </div>

          {canCreate ? (
            <button
              type="button"
              className="rounded bg-primary-600 px-4 py-2 text-white hover:bg-primary-700"
              onClick={() => {
                resetForm();
                setShowCreate(true);
              }}
            >
              New Room Type
            </button>
          ) : null}
        </div>

        <section className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Room Type List</h2>
            <div className="flex items-end gap-2">
              <div className="w-full max-w-sm">
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Search Room Types</label>
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
                  <th className="p-2">No. of Rooms</th>
                  <th className="p-2">Max Adults</th>
                  <th className="p-2">Max Children</th>
                  <th className="p-2">Active</th>
                  <th className="p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr className="border-b" key={item.id}>
                    <td className="p-2">{item.name}</td>
                    <td className="p-2">{item.numberOfRooms}</td>
                    <td className="p-2">{item.maxAdults}</td>
                    <td className="p-2">{item.maxChildren}</td>
                    <td className="p-2">{item.isActive ? 'Yes' : 'No'}</td>
                    <td className="p-2">
                      <div className="flex gap-1">
                        {canEdit ? (
                          <button type="button" className="rounded bg-slate-700 px-2 py-1 text-white" onClick={() => void loadForEdit(item.id)}>
                            Edit
                          </button>
                        ) : null}
                        <button
                          type="button"
                          className="rounded bg-slate-600 px-2 py-1 text-white"
                          onClick={() => setRoomsDialogTarget({ id: item.id, name: item.name })}
                        >
                          Rooms
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <RoomTypeRoomsDialog
          isOpen={!!roomsDialogTarget}
          roomTypeId={roomsDialogTarget?.id ?? ''}
          roomTypeName={roomsDialogTarget?.name ?? ''}
          canCreate={canCreateRooms}
          canEdit={canEditRooms}
          onClose={() => setRoomsDialogTarget(null)}
        />

        <RoomTypeDialogForm
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
                id: form.id,
                name: form.name,
                description: encodeRoomTypeDescription(form),
                maxAdults: form.maxAdults,
                maxChildren: form.maxChildren,
                isActive: form.isActive,
              });
            } else {
              createMutation.mutate({
                name: form.name,
                description: encodeRoomTypeDescription(form),
                maxAdults: form.maxAdults,
                maxChildren: form.maxChildren,
              });
            }
          }}
        />
    </div>
  );
};
