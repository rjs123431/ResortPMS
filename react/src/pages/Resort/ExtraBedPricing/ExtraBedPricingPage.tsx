import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@contexts/AuthContext';
import { PermissionNames } from '@config/permissionNames';
import { resortService } from '@services/resort.service';
import type { CreateExtraBedPriceDto, ExtraBedPriceDto, UpdateExtraBedPriceDto } from '@/types/resort.types';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

type FormState = {
  extraBedTypeId: string;
  ratePerNight: string;
  effectiveFrom: Date | null;
  effectiveTo: Date | null;
  isActive: boolean;
};

const emptyForm = (): FormState => ({
  extraBedTypeId: '',
  ratePerNight: '',
  effectiveFrom: null,
  effectiveTo: null,
  isActive: true,
});

const toDateStr = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const parseIsoDate = (iso: string): Date => {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d);
};

const formatDate = (iso?: string) => {
  if (!iso) return '—';
  return iso.slice(0, 10);
};

const formatMoney = (value: number) =>
  Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const ExtraBedPricingPage = () => {
  const queryClient = useQueryClient();
  const { isGranted } = useAuth();
  const canCreate = isGranted(PermissionNames.Pages_ExtraBedPricings_Create);
  const canEdit = isGranted(PermissionNames.Pages_ExtraBedPricings_Edit);

  const ALL = '__all__';

  const [selectedTypeId, setSelectedTypeId] = useState(ALL);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [error, setError] = useState('');

  const { data: extraBedTypes } = useQuery({
    queryKey: ['resort-extra-bed-types'],
    queryFn: () => resortService.getExtraBedTypes(),
  });

  const typeOptions = useMemo(() => extraBedTypes ?? [], [extraBedTypes]);

  const { data: history, isLoading } = useQuery({
    queryKey: ['extra-bed-price-history', selectedTypeId],
    queryFn: () => resortService.getByType(selectedTypeId),
    enabled: Boolean(selectedTypeId) && selectedTypeId !== ALL,
  });

  const { data: allHistory, isLoading: isAllLoading } = useQuery({
    queryKey: ['extra-bed-price-history-all', typeOptions.map((t) => t.id).join(',')],
    queryFn: async () => {
      const results = await Promise.all(typeOptions.map((t) => resortService.getByType(t.id)));
      return results.flat();
    },
    enabled: selectedTypeId === ALL && typeOptions.length > 0,
  });

  const rows = selectedTypeId === ALL ? (allHistory ?? []) : (history ?? []);
  const isLoadingRows = selectedTypeId === ALL ? isAllLoading : isLoading;
  const showTypeColumn = selectedTypeId === ALL;

  const createMutation = useMutation({
    mutationFn: (dto: CreateExtraBedPriceDto) => resortService.createExtraBedPrice(dto),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['extra-bed-price-history'] });
      void queryClient.invalidateQueries({ queryKey: ['extra-bed-price-history-all'] });
      void queryClient.invalidateQueries({ queryKey: ['extra-bed-current-prices'] });
      closeDialog();
    },
    onError: (err: Error) => setError(err.message ?? 'Save failed'),
  });

  const updateMutation = useMutation({
    mutationFn: (dto: UpdateExtraBedPriceDto) => resortService.updateExtraBedPrice(dto),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['extra-bed-price-history'] });
      void queryClient.invalidateQueries({ queryKey: ['extra-bed-price-history-all'] });
      void queryClient.invalidateQueries({ queryKey: ['extra-bed-current-prices'] });
      closeDialog();
    },
    onError: (err: Error) => setError(err.message ?? 'Save failed'),
  });

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...emptyForm(), extraBedTypeId: selectedTypeId !== ALL ? selectedTypeId : '' });
    setError('');
    setDialogOpen(true);
  };

  const openEdit = (row: ExtraBedPriceDto) => {
    setEditingId(row.id);
    setForm({
      extraBedTypeId: row.extraBedTypeId,
      ratePerNight: String(row.ratePerNight),
      effectiveFrom: parseIsoDate(row.effectiveFrom),
      effectiveTo: row.effectiveTo ? parseIsoDate(row.effectiveTo) : null,
      isActive: row.isActive,
    });
    setError('');
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingId(null);
    setForm(emptyForm());
    setError('');
  };

  const handleSave = () => {
    setError('');
    const rate = parseFloat(form.ratePerNight);
    if (!form.extraBedTypeId) return setError('Extra bed type is required.');
    if (isNaN(rate) || rate <= 0) return setError('Rate per night must be a positive number.');
    if (!form.effectiveFrom) return setError('Effective from date is required.');

    if (editingId) {
      updateMutation.mutate({
        id: editingId,
        extraBedTypeId: form.extraBedTypeId,
        ratePerNight: rate,
        effectiveFrom: toDateStr(form.effectiveFrom),
        effectiveTo: form.effectiveTo ? toDateStr(form.effectiveTo) : undefined,
        isActive: form.isActive,
      });
    } else {
      createMutation.mutate({
        extraBedTypeId: form.extraBedTypeId,
        ratePerNight: rate,
        effectiveFrom: toDateStr(form.effectiveFrom),
        effectiveTo: form.effectiveTo ? toDateStr(form.effectiveTo) : undefined,
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Extra Bed Pricing</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage date-effective rates per extra bed type.</p>
        </div>
        {canCreate ? (
          <button
            type="button"
            className="rounded bg-primary-600 px-4 py-2 text-white hover:bg-primary-700"
            onClick={openCreate}
          >
            New Price
          </button>
        ) : null}
      </div>

      <section className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
        <div className="mb-4 max-w-sm">
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Select Extra Bed Type
          </label>
          <select
            className="w-full rounded border border-gray-300 p-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            value={selectedTypeId}
            onChange={(e) => setSelectedTypeId(e.target.value)}
          >
            <option value={ALL}>All Types</option>
            {typeOptions.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

        {isLoadingRows ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-gray-500">No pricing records found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  {showTypeColumn ? <th className="p-2">Type</th> : null}
                  <th className="p-2">Rate/Night</th>
                  <th className="p-2">Effective From</th>
                  <th className="p-2">Effective To</th>
                  <th className="p-2">Active</th>
                  <th className="p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b">
                    {showTypeColumn ? <td className="p-2 font-medium">{row.extraBedTypeName}</td> : null}
                    <td className="p-2 tabular-nums">{formatMoney(row.ratePerNight)}</td>
                    <td className="p-2">{formatDate(row.effectiveFrom)}</td>
                    <td className="p-2">{row.effectiveTo ? formatDate(row.effectiveTo) : <span className="text-green-600 text-xs font-medium">Current</span>}</td>
                    <td className="p-2">{row.isActive ? 'Yes' : 'No'}</td>
                    <td className="p-2">
                      {canEdit ? (
                        <button
                          type="button"
                          className="rounded bg-slate-700 px-2 py-1 text-xs text-white hover:bg-slate-600"
                          onClick={() => openEdit(row)}
                        >
                          Edit
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Dialog open={dialogOpen} onClose={() => {}} className="fixed inset-0 z-50 overflow-y-auto">
        <div className="fixed inset-0 bg-black/50 pointer-events-none" aria-hidden />
        <div className="relative flex min-h-screen items-center justify-center p-4 pointer-events-none">
          <DialogPanel className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800 pointer-events-auto">
            <DialogTitle as="h3" className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              {editingId ? 'Edit Price' : 'New Price'}
            </DialogTitle>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Extra Bed Type</label>
                <select
                  className="w-full rounded border border-gray-300 p-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                  value={form.extraBedTypeId}
                  disabled={Boolean(editingId)}
                  onChange={(e) => setForm((f) => ({ ...f, extraBedTypeId: e.target.value }))}
                >
                  <option value="">— select —</option>
                  {typeOptions.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Rate Per Night</label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  className="w-full rounded border border-gray-300 p-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                  value={form.ratePerNight}
                  onChange={(e) => setForm((f) => ({ ...f, ratePerNight: e.target.value }))}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Effective From</label>
                <DatePicker
                  selected={form.effectiveFrom}
                  onChange={(date: Date | null) => setForm((f) => ({ ...f, effectiveFrom: date }))}
                  dateFormat="MMM d, yyyy"
                  placeholderText="Select date"
                  className="w-full rounded border border-gray-300 p-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Effective To <span className="text-gray-400">(leave blank = open-ended / current)</span>
                </label>
                <DatePicker
                  selected={form.effectiveTo}
                  onChange={(date: Date | null) => setForm((f) => ({ ...f, effectiveTo: date }))}
                  dateFormat="MMM d, yyyy"
                  placeholderText="Open-ended"
                  isClearable
                  className="w-full rounded border border-gray-300 p-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>

              {editingId ? (
                <div className="flex items-center gap-2">
                  <input
                    id="is-active"
                    type="checkbox"
                    className="rounded"
                    checked={form.isActive}
                    onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                  />
                  <label htmlFor="is-active" className="text-sm text-gray-700 dark:text-gray-300">Active</label>
                </div>
              ) : null}

              {error ? <p className="text-sm text-rose-600">{error}</p> : null}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                className="rounded border border-gray-300 px-4 py-2 text-sm dark:border-gray-600 dark:text-gray-300"
                onClick={closeDialog}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSaving}
                className="rounded bg-primary-600 px-4 py-2 text-sm text-white hover:bg-primary-700 disabled:opacity-50"
                onClick={handleSave}
              >
                {isSaving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </div>
  );
};
