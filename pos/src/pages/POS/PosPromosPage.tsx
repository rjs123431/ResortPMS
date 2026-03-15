import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { POSLayout } from '@components/layout/POSLayout';
import { POSSidebar } from '@components/layout/POSSidebar';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { posService } from '@services/pos.service';
import type { MenuItemPromoListDto } from '@/types/pos.types';
import {
  PromoDialogForm,
  defaultPromoForm,
  type PromoFormState,
} from './PromoDialogForm';

const promosQueryKey = ['pos-promos'];
const menuItemsQueryKey = ['pos-settings-menu-items-all'];

export const PosPromosPage = () => {
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PromoFormState>(defaultPromoForm());

  const { data: menuItems = [] } = useQuery({
    queryKey: menuItemsQueryKey,
    queryFn: () => posService.getSettingsMenuItems(null),
  });

  const { data: promos = [] } = useQuery({
    queryKey: promosQueryKey,
    queryFn: () => posService.getPromos(),
  });

  const createMutation = useMutation({
    mutationFn: (input: Parameters<typeof posService.createPromo>[0]) =>
      posService.createPromo(input),
    onSuccess: () => {
      setShowDialog(false);
      setEditingId(null);
      void queryClient.invalidateQueries({ queryKey: promosQueryKey });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: Parameters<typeof posService.updatePromo>[1];
    }) => posService.updatePromo(id, input),
    onSuccess: () => {
      setShowDialog(false);
      setEditingId(null);
      void queryClient.invalidateQueries({ queryKey: promosQueryKey });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => posService.deletePromo(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: promosQueryKey }),
  });

  const openNew = () => {
    setForm(defaultPromoForm());
    setEditingId(null);
    setShowDialog(true);
  };

  const openEdit = async (row: MenuItemPromoListDto) => {
    const dto = await posService.getPromo(row.id);
    setForm({
      promoName: dto.promoName,
      dateFrom: dto.dateFrom.slice(0, 10),
      dateTo: dto.dateTo.slice(0, 10),
      percentageDiscount: dto.percentageDiscount,
      menuItemIds: dto.menuItemIds ?? [],
    });
    setEditingId(row.id);
    setShowDialog(true);
  };

  const handleSave = () => {
    const payload = {
      promoName: form.promoName.trim(),
      dateFrom: form.dateFrom,
      dateTo: form.dateTo,
      percentageDiscount: form.percentageDiscount,
      menuItemIds: form.menuItemIds,
    };
    if (editingId) {
      updateMutation.mutate({ id: editingId, input: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <POSLayout sidebar={<POSSidebar />}>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/settings"
              className="rounded p-1 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
              title="Back to Settings"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Promos</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Time-limited percentage discounts on selected menu items.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="rounded bg-primary-600 px-4 py-2 text-sm text-white hover:bg-primary-700"
            onClick={openNew}
          >
            New Promo
          </button>
        </div>

        <section className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-600 dark:text-gray-400">
                  <th className="p-2">Promo Name</th>
                  <th className="p-2">Date From</th>
                  <th className="p-2">Date To</th>
                  <th className="p-2">Discount</th>
                  <th className="p-2">Items</th>
                  <th className="p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {promos.map((p) => (
                  <tr key={p.id} className="border-b dark:border-gray-700">
                    <td className="p-2 font-medium">{p.promoName}</td>
                    <td className="p-2">{p.dateFrom.slice(0, 10)}</td>
                    <td className="p-2">{p.dateTo.slice(0, 10)}</td>
                    <td className="p-2">{p.percentageDiscount}%</td>
                    <td className="p-2">{p.menuItemCount}</td>
                    <td className="flex gap-2 p-2">
                      <button
                        type="button"
                        className="rounded bg-slate-600 px-2 py-1 text-white hover:bg-slate-700"
                        onClick={() => void openEdit(p)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="rounded bg-red-100 px-2 py-1 text-sm text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
                        onClick={() => {
                          if (
                            window.confirm(
                              `Delete promo "${p.promoName}"?`
                            )
                          )
                            deleteMutation.mutate(p.id);
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
          {promos.length === 0 && (
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              No promos yet. Create one to offer time-limited discounts on menu items.
            </p>
          )}
        </section>
      </div>

      <PromoDialogForm
        isOpen={showDialog}
        form={form}
        menuItems={menuItems}
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
