import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@contexts/AuthContext';
import { PermissionNames } from '@config/permissionNames';
import { resortService } from '@services/resort.service';
import type { StaffDto } from '@/types/resort.types';
import { StaffDialogForm } from './StaffDialogForm';

export const StaffListPage = () => {
  const queryClient = useQueryClient();
  const { isGranted } = useAuth();
  const canCreate = isGranted(PermissionNames.Pages_Staff_Create);
  const canEdit = isGranted(PermissionNames.Pages_Staff_Edit);
  const [filter, setFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<StaffDto>({
    id: '',
    staffCode: '',
    fullName: '',
    department: '',
    position: '',
    phoneNumber: '',
    isActive: true,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['resort-staff-paged', filter],
    queryFn: () => resortService.getStaffsPaged(filter),
  });

  const createMutation = useMutation({
    mutationFn: resortService.createStaff,
    onSuccess: () => {
      setShowCreate(false);
      void queryClient.invalidateQueries({ queryKey: ['resort-staff-paged'] });
      void queryClient.invalidateQueries({ queryKey: ['resort-staff'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: resortService.updateStaff,
    onSuccess: () => {
      setEditingId(null);
      void queryClient.invalidateQueries({ queryKey: ['resort-staff-paged'] });
      void queryClient.invalidateQueries({ queryKey: ['resort-staff'] });
    },
  });

  const items = useMemo(() => data?.items ?? [], [data]);

  const loadForEdit = async (id: string) => {
    const item = await resortService.getStaff(id);
    setForm(item);
    setEditingId(id);
  };

  return (
    <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Staff</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Manage housekeeping and operations staff directory.</p>
          </div>

          {canCreate ? (
            <button
              type="button"
              className="rounded bg-primary-600 px-4 py-2 text-white hover:bg-primary-700"
              onClick={() => {
                setForm({ id: '', staffCode: '', fullName: '', department: '', position: '', phoneNumber: '', isActive: true });
                setShowCreate(true);
              }}
            >
              New Staff
            </button>
          ) : null}
        </div>

        <section className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Staff List</h2>
            <div className="flex items-end gap-2">
              <div className="w-full max-w-sm">
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Search Staff</label>
                <input className="w-full rounded border p-2 dark:bg-gray-700" value={filter} onChange={(e) => setFilter(e.target.value)} />
              </div>
            </div>
          </div>

          {isLoading ? <p className="text-sm text-gray-500">Loading...</p> : null}

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="p-2">Code</th>
                  <th className="p-2">Name</th>
                  <th className="p-2">Department</th>
                  <th className="p-2">Position</th>
                  <th className="p-2">Phone</th>
                  <th className="p-2">Active</th>
                  <th className="p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr className="border-b" key={item.id}>
                    <td className="p-2">{item.staffCode}</td>
                    <td className="p-2">{item.fullName}</td>
                    <td className="p-2">{item.department || '-'}</td>
                    <td className="p-2">{item.position || '-'}</td>
                    <td className="p-2">{item.phoneNumber || '-'}</td>
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

        <StaffDialogForm
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
                staffCode: form.staffCode,
                fullName: form.fullName,
                department: form.department,
                position: form.position,
                phoneNumber: form.phoneNumber,
              });
            }
          }}
        />
    </div>
  );
};
