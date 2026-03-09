import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MainLayout } from '@components/layout/MainLayout';
import { useAuth } from '@contexts/AuthContext';
import { PermissionNames } from '@config/permissionNames';
import { resortService } from '@services/resort.service';
import type { GuestDto } from '@/types/resort.types';
import { GuestDialogForm } from './GuestDialogForm';

export const GuestListPage = () => {
  const queryClient = useQueryClient();
  const { isGranted } = useAuth();
  const canCreate = isGranted(PermissionNames.Pages_Guests_Create);
  const canEdit = isGranted(PermissionNames.Pages_Guests_Edit);
  const [filter, setFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<GuestDto>({
    id: '',
    guestCode: '',
    firstName: '',
    lastName: '',
    middleName: '',
    email: '',
    phone: '',
    nationality: '',
    notes: '',
    isActive: true,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['resort-guests', filter],
    queryFn: () => resortService.getGuests(filter),
  });

  const createMutation = useMutation({
    mutationFn: resortService.createGuest,
    onSuccess: () => {
      setShowCreate(false);
      void queryClient.invalidateQueries({ queryKey: ['resort-guests'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: resortService.updateGuest,
    onSuccess: () => {
      setEditingId(null);
      void queryClient.invalidateQueries({ queryKey: ['resort-guests'] });
    },
  });

  const loadForEdit = async (id: string) => {
    const guest = await resortService.getGuest(id);
    setForm(guest);
    setEditingId(id);
  };

  const resetForm = () => {
    setForm({
      id: '',
      guestCode: '',
      firstName: '',
      lastName: '',
      middleName: '',
      email: '',
      phone: '',
      nationality: '',
      notes: '',
      isActive: true,
    });
  };

  const guests = useMemo(() => data?.items ?? [], [data]);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Guests</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Create and manage guest profiles.</p>
        </div>

        <section className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Guest List</h2>
            {canCreate ? (
              <button
                type="button"
                className="rounded bg-primary-600 px-4 py-2 text-white hover:bg-primary-700"
                onClick={() => {
                  resetForm();
                  setShowCreate(true);
                }}
              >
                New Guest
              </button>
            ) : null}
          </div>
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="w-full max-w-sm">
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Search Guests</label>
              <input
                className="w-full rounded border p-2 dark:bg-gray-700"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
            </div>
          </div>

          {isLoading ? <p className="text-sm text-gray-500">Loading...</p> : null}

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="p-2">Code</th>
                  <th className="p-2">Name</th>
                  <th className="p-2">Email</th>
                  <th className="p-2">Phone</th>
                  <th className="p-2">Active</th>
                  <th className="p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {guests.map((g) => (
                  <tr className="border-b" key={g.id}>
                    <td className="p-2">{g.guestCode}</td>
                    <td className="p-2">{g.fullName}</td>
                    <td className="p-2">{g.email ?? '-'}</td>
                    <td className="p-2">{g.phone ?? '-'}</td>
                    <td className="p-2">{g.isActive ? 'Yes' : 'No'}</td>
                    <td className="p-2">
                      {canEdit ? (
                        <button type="button" className="rounded bg-slate-700 px-2 py-1 text-white" onClick={() => void loadForEdit(g.id)}>
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

        <GuestDialogForm
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
              updateMutation.mutate(form);
            } else {
              createMutation.mutate({
                guestCode: form.guestCode,
                firstName: form.firstName,
                lastName: form.lastName,
                middleName: form.middleName,
                email: form.email,
                phone: form.phone,
                nationality: form.nationality,
                notes: form.notes,
              });
            }
          }}
        />
      </div>
    </MainLayout>
  );
};
