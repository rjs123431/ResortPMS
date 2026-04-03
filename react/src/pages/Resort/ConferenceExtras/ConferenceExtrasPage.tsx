import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { conferenceExtraService } from '@services/conference-extra.service';
import { ConferenceExtraDialog } from './ConferenceExtraDialog';
import type { CreateConferenceExtraDto, UpdateConferenceExtraDto } from '@/types/conference.types';
import { formatMoney } from '@utils/helpers';

const createEmptyForm = (): CreateConferenceExtraDto => ({
  code: '',
  name: '',
  category: '',
  unitLabel: '',
  defaultPrice: 0,
  sortOrder: 0,
  isActive: true,
});

export function ConferenceExtrasPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExtraId, setEditingExtraId] = useState<string | null>(null);
  const [form, setForm] = useState<CreateConferenceExtraDto>(createEmptyForm());

  const { data, isLoading } = useQuery({
    queryKey: ['conference-extras', filter],
    queryFn: () => conferenceExtraService.getConferenceExtras(filter),
  });

  const createMutation = useMutation({
    mutationFn: conferenceExtraService.createConferenceExtra,
    onSuccess: () => {
      setIsDialogOpen(false);
      setForm(createEmptyForm());
      void queryClient.invalidateQueries({ queryKey: ['conference-extras'] });
      void queryClient.invalidateQueries({ queryKey: ['conference-extras-active'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: conferenceExtraService.updateConferenceExtra,
    onSuccess: () => {
      setIsDialogOpen(false);
      setEditingExtraId(null);
      setForm(createEmptyForm());
      void queryClient.invalidateQueries({ queryKey: ['conference-extras'] });
      void queryClient.invalidateQueries({ queryKey: ['conference-extras-active'] });
    },
  });

  const items = useMemo(() => data?.items ?? [], [data]);

  const startEdit = async (id: string) => {
    const extra = await conferenceExtraService.getConferenceExtra(id);
    setEditingExtraId(id);
    setIsDialogOpen(true);
    setForm({
      code: extra.code,
      name: extra.name,
      category: extra.category,
      unitLabel: extra.unitLabel,
      defaultPrice: extra.defaultPrice,
      sortOrder: extra.sortOrder,
      isActive: extra.isActive,
    });
  };

  const handleSubmit = () => {
    if (editingExtraId) {
      updateMutation.mutate({ id: editingExtraId, ...form } satisfies UpdateConferenceExtraDto);
      return;
    }

    createMutation.mutate(form);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Add-On Services</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Maintain reusable conference services and the default prices used on booking quotations.</p>
        </div>
      </div>

      <section className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div className="w-full max-w-sm">
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Search Services</label>
            <input
              className="w-full rounded border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              placeholder="Code, service, category, unit"
            />
          </div>
          <button
            type="button"
            className="rounded border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
            onClick={() => {
              setIsDialogOpen(true);
              setEditingExtraId(null);
              setForm(createEmptyForm());
            }}
          >
            New Add-On Service
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b text-left dark:border-gray-700">
                <th className="p-2">Code</th>
                <th className="p-2">Service</th>
                <th className="p-2">Category</th>
                <th className="p-2">Unit</th>
                <th className="p-2 text-right">Default Price</th>
                <th className="p-2 text-right">Sort</th>
                <th className="p-2">Active</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="p-4 text-center text-gray-500">Loading add-on services...</td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-4 text-center text-gray-500">No add-on services found.</td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="border-b dark:border-gray-700">
                    <td className="p-2 font-medium">{item.code}</td>
                    <td className="p-2">{item.name}</td>
                    <td className="p-2">{item.category || '—'}</td>
                    <td className="p-2">{item.unitLabel || '—'}</td>
                    <td className="p-2 text-right">{formatMoney(item.defaultPrice)}</td>
                    <td className="p-2 text-right">{item.sortOrder}</td>
                    <td className="p-2">{item.isActive ? 'Yes' : 'No'}</td>
                    <td className="p-2">
                      <button
                        type="button"
                        className="rounded bg-slate-700 px-2 py-1 text-white hover:bg-slate-800"
                        onClick={() => void startEdit(item.id)}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <ConferenceExtraDialog
        isOpen={isDialogOpen}
        editingExtraId={editingExtraId}
        form={form}
        isSaving={createMutation.isPending || updateMutation.isPending}
        onChange={setForm}
        onSubmit={handleSubmit}
        onClose={() => {
          setIsDialogOpen(false);
          setEditingExtraId(null);
          setForm(createEmptyForm());
        }}
      />
    </div>
  );
}