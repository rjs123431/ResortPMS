import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { POSLayout } from '@components/layout/POSLayout';
import { POSSidebar } from '@components/layout/POSSidebar';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { posService } from '@services/pos.service';
import type { MenuItemListDto, MenuCategoryListDto, OptionGroupDto } from '@/types/pos.types';
import {
  MenuItemDialogForm,
  defaultMenuItemForm,
  type MenuItemFormState,
} from './MenuItemDialogForm';
import {
  MenuCategoryDialogForm,
  defaultMenuCategoryForm,
} from './MenuCategoryDialogForm';

const categoriesQueryKey = ['pos-settings-menu-categories'];
const menuItemsQueryKey = (categoryId: string | null) => ['pos-settings-menu-items', categoryId ?? 'all'];

export const PosMenuPage = () => {
  const queryClient = useQueryClient();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');

  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [categoryForm, setCategoryForm] = useState(defaultMenuCategoryForm());

  const [showItemDialog, setShowItemDialog] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [menuItemForm, setMenuItemForm] = useState<MenuItemFormState>(defaultMenuItemForm());
  const [assignedGroupDetails, setAssignedGroupDetails] = useState<OptionGroupDto[]>([]);

  const { data: categories = [] } = useQuery({
    queryKey: categoriesQueryKey,
    queryFn: () => posService.getSettingsMenuCategories(),
  });

  const { data: optionGroups = [] } = useQuery({
    queryKey: ['pos-settings-option-groups'],
    queryFn: () => posService.getOptionGroups(),
  });

  const { data: menuItems = [] } = useQuery({
    queryKey: menuItemsQueryKey(selectedCategoryId || null),
    queryFn: () => posService.getSettingsMenuItems(selectedCategoryId || undefined),
  });

  const createCategoryMutation = useMutation({
    mutationFn: (input: Parameters<typeof posService.createMenuCategory>[0]) =>
      posService.createMenuCategory(input),
    onSuccess: () => {
      setShowCategoryDialog(false);
      setEditingCategoryId(null);
      void queryClient.invalidateQueries({ queryKey: categoriesQueryKey });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Parameters<typeof posService.updateMenuCategory>[1] }) =>
      posService.updateMenuCategory(id, input),
    onSuccess: () => {
      setShowCategoryDialog(false);
      setEditingCategoryId(null);
      void queryClient.invalidateQueries({ queryKey: categoriesQueryKey });
    },
  });

  const createItemMutation = useMutation({
    mutationFn: (input: Parameters<typeof posService.createMenuItem>[0]) => posService.createMenuItem(input),
    onSuccess: () => {
      setShowItemDialog(false);
      setEditingItemId(null);
      void queryClient.invalidateQueries({ queryKey: menuItemsQueryKey(selectedCategoryId || null) });
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Parameters<typeof posService.updateMenuItem>[1] }) =>
      posService.updateMenuItem(id, input),
    onSuccess: () => {
      setShowItemDialog(false);
      setEditingItemId(null);
      void queryClient.invalidateQueries({ queryKey: menuItemsQueryKey(selectedCategoryId || null) });
    },
  });

  const openEditCategory = async (row: MenuCategoryListDto) => {
    const dto = await posService.getSettingsMenuCategory(row.id);
    setCategoryForm({ name: dto.name, displayOrder: dto.displayOrder });
    setEditingCategoryId(row.id);
    setShowCategoryDialog(true);
  };

  const openEditItem = async (row: MenuItemListDto) => {
    const dto = await posService.getSettingsMenuItem(row.id);
    const groups = dto.optionGroups ?? [];
    const optionPriceOverrides: Record<string, number> = {};
    const defaultOptionOverrides: Record<string, string | null> = {};
    for (const g of groups) {
      for (const opt of g.options) {
        optionPriceOverrides[opt.id] = opt.priceAdjustment;
      }
      defaultOptionOverrides[g.id] = g.defaultOptionIdOverride ?? null;
    }
    setMenuItemForm({
      categoryId: dto.categoryId,
      name: dto.name,
      price: dto.price,
      isAvailable: dto.isAvailable,
      assignedOptionGroupIds: groups.map((g) => g.id),
      optionPriceOverrides,
      defaultOptionOverrides,
    });
    setAssignedGroupDetails(groups);
    setEditingItemId(row.id);
    setShowItemDialog(true);
  };

  // When user assigns/unassigns option groups, sync assignedGroupDetails and default overrides for new options.
  useEffect(() => {
    if (!showItemDialog) return;
    const ids = menuItemForm.assignedOptionGroupIds ?? [];
    setAssignedGroupDetails((prev) => {
      const next = prev.filter((g) => ids.includes(g.id));
      const missingIds = ids.filter((id) => !next.some((g) => g.id === id));
      if (missingIds.length === 0) return next;
      // Fetch missing groups and merge in a separate effect/flow so we don't set state during render.
      return next;
    });
    if (ids.length === 0) return;
    const missingIds = ids.filter(
      (id) => !assignedGroupDetails.some((g) => g.id === id),
    );
    if (missingIds.length === 0) return;
    let cancelled = false;
    void (async () => {
      const fetched: OptionGroupDto[] = [];
      for (const id of missingIds) {
        const g = await posService.getOptionGroup(id);
        if (!cancelled) fetched.push(g);
      }
      if (cancelled || fetched.length === 0) return;
      setAssignedGroupDetails((prev) => {
        const kept = prev.filter((g) => ids.includes(g.id));
        const order = ids.map((id) => kept.find((x) => x.id === id) ?? fetched.find((x) => x.id === id)).filter(Boolean) as OptionGroupDto[];
        return order;
      });
      setMenuItemForm((prev) => {
        const overrides = { ...(prev.optionPriceOverrides ?? {}) };
        const defaultOverrides = { ...(prev.defaultOptionOverrides ?? {}) };
        for (const g of fetched) {
          for (const opt of g.options) {
            if (overrides[opt.id] === undefined) {
              overrides[opt.id] = opt.basePriceAdjustment ?? opt.priceAdjustment;
            }
          }
          if (defaultOverrides[g.id] === undefined) defaultOverrides[g.id] = null;
        }
        return { ...prev, optionPriceOverrides: overrides, defaultOptionOverrides: defaultOverrides };
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [showItemDialog, menuItemForm.assignedOptionGroupIds]);

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
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Menu</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Manage categories and menu items.
              </p>
            </div>
          </div>
        </div>

        {/* Categories */}
        <section className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Categories</h2>
            <button
              type="button"
              className="rounded bg-primary-600 px-4 py-2 text-sm text-white hover:bg-primary-700"
              onClick={() => {
                setCategoryForm(defaultMenuCategoryForm());
                setEditingCategoryId(null);
                setShowCategoryDialog(true);
              }}
            >
              New Category
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-600 dark:text-gray-400">
                  <th className="p-2">Order</th>
                  <th className="p-2">Name</th>
                  <th className="p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((c) => (
                  <tr key={c.id} className="border-b dark:border-gray-700">
                    <td className="p-2">{c.displayOrder}</td>
                    <td className="p-2">{c.name}</td>
                    <td className="p-2">
                      <button
                        type="button"
                        className="rounded bg-slate-600 px-2 py-1 text-white hover:bg-slate-700"
                        onClick={() => void openEditCategory(c)}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Menu items */}
        <section className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Menu Items</h2>
            <div className="flex items-center gap-2">
              <select
                className="rounded border p-2 text-sm dark:bg-gray-700 dark:border-gray-600"
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
              >
                <option value="">All categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="rounded bg-primary-600 px-4 py-2 text-sm text-white hover:bg-primary-700"
                onClick={() => {
                  setMenuItemForm({
                    ...defaultMenuItemForm(),
                    categoryId: selectedCategoryId || (categories[0]?.id ?? ''),
                  });
                  setAssignedGroupDetails([]);
                  setEditingItemId(null);
                  setShowItemDialog(true);
                }}
              >
                New Menu Item
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-600 dark:text-gray-400">
                  <th className="p-2">Category</th>
                  <th className="p-2">Name</th>
                  <th className="p-2">Price</th>
                  <th className="p-2">Available</th>
                  <th className="p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {menuItems.map((m) => (
                  <tr key={m.id} className="border-b dark:border-gray-700">
                    <td className="p-2">{m.categoryName}</td>
                    <td className="p-2">{m.name}</td>
                    <td className="p-2">{m.price}</td>
                    <td className="p-2">{m.isAvailable ? 'Yes' : 'No'}</td>
                    <td className="p-2">
                      <button
                        type="button"
                        className="rounded bg-slate-600 px-2 py-1 text-white hover:bg-slate-700"
                        onClick={() => void openEditItem(m)}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <MenuCategoryDialogForm
        isOpen={showCategoryDialog}
        editingId={editingCategoryId}
        form={categoryForm}
        isSaving={createCategoryMutation.isPending || updateCategoryMutation.isPending}
        onClose={() => {
          setShowCategoryDialog(false);
          setEditingCategoryId(null);
        }}
        onFormChange={setCategoryForm}
        onSave={() => {
          if (editingCategoryId) {
            updateCategoryMutation.mutate({ id: editingCategoryId, input: categoryForm });
          } else {
            createCategoryMutation.mutate(categoryForm);
          }
        }}
      />

      <MenuItemDialogForm
        isOpen={showItemDialog}
        editingId={editingItemId}
        form={menuItemForm}
        categories={categories}
        optionGroups={optionGroups}
        assignedGroupDetails={assignedGroupDetails}
        isSaving={createItemMutation.isPending || updateItemMutation.isPending}
        onClose={() => {
          setShowItemDialog(false);
          setEditingItemId(null);
          setAssignedGroupDetails([]);
        }}
        onFormChange={setMenuItemForm}
        onSave={() => {
          const overrides = assignedGroupDetails.flatMap((g) =>
            g.options.map((o) => ({
              optionId: o.id,
              priceAdjustment: menuItemForm.optionPriceOverrides?.[o.id] ?? o.basePriceAdjustment ?? o.priceAdjustment,
            })),
          );
          const defaultOverrides = assignedGroupDetails.map((g) => ({
            optionGroupId: g.id,
            defaultOptionId: menuItemForm.defaultOptionOverrides?.[g.id] ?? null,
          }));
          const base = {
            categoryId: menuItemForm.categoryId,
            name: menuItemForm.name,
            price: menuItemForm.price,
            isAvailable: menuItemForm.isAvailable,
            assignedOptionGroupIds: menuItemForm.assignedOptionGroupIds,
            optionPriceOverrides: overrides,
            defaultOptionOverrides: defaultOverrides,
          };
          if (editingItemId) {
            updateItemMutation.mutate({ id: editingItemId, input: base });
          } else {
            createItemMutation.mutate(base);
          }
        }}
      />
    </POSLayout>
  );
};
