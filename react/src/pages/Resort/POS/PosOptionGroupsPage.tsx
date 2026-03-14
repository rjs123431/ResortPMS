import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { POSLayout } from '@components/layout/POSLayout';
import { POSSidebar } from '@components/layout/POSSidebar';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { posService } from '@services/pos.service';
import type { OptionGroupListDto } from '@/types/pos.types';
import {
  OptionGroupDialogForm,
  defaultOptionGroupForm,
  type OptionGroupFormState,
} from './OptionGroupDialogForm';

const optionGroupsQueryKey = ['pos-settings-option-groups'];

export const PosOptionGroupsPage = () => {
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<OptionGroupFormState>(defaultOptionGroupForm());

  const { data: optionGroups = [] } = useQuery({
    queryKey: optionGroupsQueryKey,
    queryFn: () => posService.getOptionGroups(),
  });

  const createMutation = useMutation({
    mutationFn: (input: Parameters<typeof posService.createOptionGroup>[0]) =>
      posService.createOptionGroup(input),
    onSuccess: () => {
      setShowDialog(false);
      setEditingId(null);
      void queryClient.invalidateQueries({ queryKey: optionGroupsQueryKey });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Parameters<typeof posService.updateOptionGroup>[1] }) =>
      posService.updateOptionGroup(id, input),
    onSuccess: () => {
      setShowDialog(false);
      setEditingId(null);
      void queryClient.invalidateQueries({ queryKey: optionGroupsQueryKey });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => posService.deleteOptionGroup(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: optionGroupsQueryKey }),
  });

  const openNew = () => {
    setForm(defaultOptionGroupForm());
    setEditingId(null);
    setShowDialog(true);
  };

  const openEdit = async (row: OptionGroupListDto) => {
    const dto = await posService.getOptionGroup(row.id);
    setForm({
      name: dto.name,
      displayOrder: dto.displayOrder,
      minSelections: dto.minSelections,
      maxSelections: dto.maxSelections,
      options: dto.options.map((o) => ({
        name: o.name,
        priceAdjustment: o.priceAdjustment,
        displayOrder: o.displayOrder,
        isDefault: o.isDefault ?? false,
      })),
    });
    setEditingId(row.id);
    setShowDialog(true);
  };

  const handleSave = () => {
    if (editingId) {
      updateMutation.mutate({
        id: editingId,
        input: {
          name: form.name,
          displayOrder: form.displayOrder,
          minSelections: form.minSelections,
          maxSelections: form.maxSelections,
          options: form.options.map((o) => ({
            name: o.name,
            priceAdjustment: o.priceAdjustment,
            displayOrder: o.displayOrder,
            isDefault: o.isDefault ?? false,
          })),
        },
      });
    } else {
      createMutation.mutate({
        name: form.name,
        displayOrder: form.displayOrder,
        minSelections: form.minSelections,
        maxSelections: form.maxSelections,
        options: form.options.map((o) => ({
          name: o.name,
          priceAdjustment: o.priceAdjustment,
          displayOrder: o.displayOrder,
          isDefault: o.isDefault ?? false,
        })),
      });
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <POSLayout sidebar={<POSSidebar />}>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/pos/settings"
              className="rounded p-1 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
              title="Back to Settings"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Option Groups</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Define reusable option groups (e.g. Sugar, Pearls) and their choices. Assign them to menu items in Menu.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="rounded bg-primary-600 px-4 py-2 text-sm text-white hover:bg-primary-700"
            onClick={openNew}
          >
            New Option Group
          </button>
        </div>

        <section className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-600 dark:text-gray-400">
                  <th className="p-2">Order</th>
                  <th className="p-2">Name</th>
                  <th className="p-2">Min / Max</th>
                  <th className="p-2">Options</th>
                  <th className="p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {optionGroups.map((g) => (
                  <tr key={g.id} className="border-b dark:border-gray-700">
                    <td className="p-2">{g.displayOrder}</td>
                    <td className="p-2 font-medium">{g.name}</td>
                    <td className="p-2">{g.minSelections} / {g.maxSelections}</td>
                    <td className="p-2">{g.optionCount}</td>
                    <td className="p-2 flex gap-2">
                      <button
                        type="button"
                        className="rounded bg-slate-600 px-2 py-1 text-white hover:bg-slate-700"
                        onClick={() => void openEdit(g)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="rounded bg-red-100 px-2 py-1 text-sm text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
                        onClick={() => {
                          if (window.confirm(`Delete option group "${g.name}"? This will fail if it is assigned to any menu item.`))
                            deleteMutation.mutate(g.id);
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {optionGroups.length === 0 && (
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">No option groups yet. Create one to use on menu items.</p>
          )}
        </section>
      </div>

      <OptionGroupDialogForm
        isOpen={showDialog}
        editingId={editingId}
        form={form}
        isSaving={isSaving}
        onClose={() => {
          setShowDialog(false);
          setEditingId(null);
        }}
        onFormChange={setForm}
        onSave={handleSave}
      />
    </POSLayout>
  );
};
