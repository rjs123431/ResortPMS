import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { POSLayout } from '@components/layout/POSLayout';
import { POSSidebar } from '@components/layout/POSSidebar';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { posService } from '@services/pos.service';
import type {
  MenuItemPriceAdjustmentListDto,
  MenuItemListDto,
} from '@/types/pos.types';
import {
  PriceAdjustmentDialogForm,
  defaultPriceAdjustmentForm,
  type PriceAdjustmentFormState,
} from './PriceAdjustmentDialogForm';

const priceAdjustmentsQueryKey = (menuItemId: string | null) =>
  ['pos-price-adjustments', menuItemId ?? 'all'];
const menuItemsQueryKey = ['pos-settings-menu-items-all'];

export const PosPriceAdjustmentsPage = () => {
  const queryClient = useQueryClient();
  const [menuItemFilter, setMenuItemFilter] = useState<string>('');
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PriceAdjustmentFormState>(defaultPriceAdjustmentForm());

  const { data: menuItems = [] } = useQuery({
    queryKey: menuItemsQueryKey,
    queryFn: () => posService.getSettingsMenuItems(null),
  });

  const { data: adjustments = [] } = useQuery({
    queryKey: priceAdjustmentsQueryKey(menuItemFilter || null),
    queryFn: () => posService.getPriceAdjustments(menuItemFilter || undefined),
  });

  const createMutation = useMutation({
    mutationFn: (input: Parameters<typeof posService.createPriceAdjustment>[0]) =>
      posService.createPriceAdjustment(input),
    onSuccess: () => {
      setShowDialog(false);
      setEditingId(null);
      void queryClient.invalidateQueries({ queryKey: priceAdjustmentsQueryKey(menuItemFilter || null) });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: Parameters<typeof posService.updatePriceAdjustment>[1];
    }) => posService.updatePriceAdjustment(id, input),
    onSuccess: () => {
      setShowDialog(false);
      setEditingId(null);
      void queryClient.invalidateQueries({ queryKey: priceAdjustmentsQueryKey(menuItemFilter || null) });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => posService.deletePriceAdjustment(id),
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: priceAdjustmentsQueryKey(menuItemFilter || null) }),
  });

  const openNew = () => {
    setForm(defaultPriceAdjustmentForm());
    setEditingId(null);
    setShowDialog(true);
  };

  const openEdit = async (row: MenuItemPriceAdjustmentListDto) => {
    const dto = await posService.getPriceAdjustment(row.id);
    setForm({
      menuItemId: dto.menuItemId,
      newPrice: dto.newPrice,
      effectiveDate: dto.effectiveDate.slice(0, 10),
    });
    setEditingId(row.id);
    setShowDialog(true);
  };

  const handleSave = () => {
    if (editingId) {
      updateMutation.mutate({
        id: editingId,
        input: { newPrice: form.newPrice, effectiveDate: form.effectiveDate },
      });
    } else {
      createMutation.mutate({
        menuItemId: form.menuItemId,
        newPrice: form.newPrice,
        effectiveDate: form.effectiveDate,
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
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Price Adjustments
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Set a new price for a menu item effective from a specific date onward.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="rounded bg-primary-600 px-4 py-2 text-sm text-white hover:bg-primary-700"
            onClick={openNew}
          >
            New Price Adjustment
          </button>
        </div>

        <section className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
          <div className="mb-4">
            <label className="mr-2 text-sm text-gray-600 dark:text-gray-400">Filter by item:</label>
            <select
              value={menuItemFilter}
              onChange={(e) => setMenuItemFilter(e.target.value)}
              className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              <option value="">All items</option>
              {(menuItems as MenuItemListDto[]).map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-600 dark:text-gray-400">
                  <th className="p-2">Menu Item</th>
                  <th className="p-2">Category</th>
                  <th className="p-2">New Price</th>
                  <th className="p-2">Effective Date</th>
                  <th className="p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {adjustments.map((a) => (
                  <tr key={a.id} className="border-b dark:border-gray-700">
                    <td className="p-2 font-medium">{a.menuItemName}</td>
                    <td className="p-2">{a.categoryName}</td>
                    <td className="p-2">{a.newPrice.toFixed(2)}</td>
                    <td className="p-2">{a.effectiveDate.slice(0, 10)}</td>
                    <td className="flex gap-2 p-2">
                      <button
                        type="button"
                        className="rounded bg-slate-600 px-2 py-1 text-white hover:bg-slate-700"
                        onClick={() => void openEdit(a)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="rounded bg-red-100 px-2 py-1 text-sm text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
                        onClick={() => {
                          if (
                            window.confirm(
                              `Remove this price adjustment for "${a.menuItemName}"?`
                            )
                          )
                            deleteMutation.mutate(a.id);
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
          {adjustments.length === 0 && (
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              No price adjustments. Add one to change an item&apos;s price from a future date.
            </p>
          )}
        </section>
      </div>

      <PriceAdjustmentDialogForm
        isOpen={showDialog}
        editingId={editingId}
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
