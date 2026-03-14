import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MainLayout } from '@components/layout/MainLayout';
import { useAuth } from '@contexts/AuthContext';
import { PermissionNames } from '@config/permissionNames';
import { resortService } from '@services/resort.service';
import type { ExtraBedTypeDto } from '@/types/resort.types';
import { ExtraBedTypeDialogForm } from './ExtraBedTypeDialogForm';

const formatMoney = (value: number) =>
  Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const ExtraBedTypeListPage = () => {
  const queryClient = useQueryClient();
  const { isGranted } = useAuth();
  const canCreate = isGranted(PermissionNames.Pages_ExtraBedTypes_Create);
  const canEdit = isGranted(PermissionNames.Pages_ExtraBedTypes_Edit);
  const [filter, setFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ExtraBedTypeDto>({ id: '', name: '', basePrice: 0, isActive: true });

  const { data, isLoading } = useQuery({
    queryKey: ['resort-extra-bed-types-paged', filter],
    queryFn: () => resortService.getExtraBedTypesPaged(filter),
  });

  const createMutation = useMutation({
    mutationFn: resortService.createExtraBedType,
    onSuccess: () => {
      setShowCreate(false);
      void queryClient.invalidateQueries({ queryKey: ['resort-extra-bed-types-paged'] });
      void queryClient.invalidateQueries({ queryKey: ['resort-extra-bed-types'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: resortService.updateExtraBedType,
    onSuccess: () => {
      setEditingId(null);
      void queryClient.invalidateQueries({ queryKey: ['resort-extra-bed-types-paged'] });
      void queryClient.invalidateQueries({ queryKey: ['resort-extra-bed-types'] });
    },
  });

  const items = useMemo(() => data?.items ?? [], [data]);

  const loadForEdit = async (id: string) => {
    const item = await resortService.getExtraBedType(id);
    setForm(item);
    setEditingId(id);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Extra Bed Types</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Manage default extra bed pricing options.</p>
          </div>

          {canCreate ? (
            <button
              type="button"
              className="rounded bg-primary-600 px-4 py-2 text-white hover:bg-primary-700"
              onClick={() => {
                setForm({ id: '', name: '', basePrice: 0, isActive: true });
                setShowCreate(true);
              }}
            >
              New Extra Bed Type
            </button>
          ) : null}
        </div>

        <section className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Extra Bed Type List</h2>
            <div className="flex items-end gap-2">
              <div className="w-full max-w-sm">
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Search Extra Bed Types</label>
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
                  <th className="p-2 text-right">Base Price</th>
                  <th className="p-2">Active</th>
                  <th className="p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr className="border-b" key={item.id}>
                    <td className="p-2">{item.name}</td>
                    <td className="p-2 text-right tabular-nums">{formatMoney(item.basePrice)}</td>
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

        <ExtraBedTypeDialogForm
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
              createMutation.mutate({ name: form.name, basePrice: form.basePrice });
            }
          }}
        />
      </div>
    </MainLayout>
  );
};
