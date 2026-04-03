import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { resortService } from '@services/resort.service';
import { notifyError, notifySuccess } from '@/utils/alerts';
import {
  DayUseOfferType,
  type DayUseOfferDto,
} from '@/types/day-use.types';
import { DayUseOfferDialog } from './DayUseOfferDialog';
import {
  createEmptyDayUseOfferForm,
  dayUseContextLabel,
  dayUseGuestCategoryLabel,
  dayUseOfferTypeLabel,
} from './dayUseUi';

export const DayUseOffersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('');
  const [showOfferDialog, setShowOfferDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<DayUseOfferDto>(createEmptyDayUseOfferForm());

  const { data: offersData, isLoading } = useQuery({
    queryKey: ['day-use-offers', filter],
    queryFn: () => resortService.getDayUseOffersPaged({ filter, maxResultCount: 200 }),
  });

  const { data: chargeTypes = [] } = useQuery({
    queryKey: ['resort-charge-types'],
    queryFn: () => resortService.getChargeTypes(),
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editingId) {
        await resortService.updateDayUseOffer({
          ...form,
          code: form.code.trim(),
          name: form.name.trim(),
          variantName: form.variantName.trim(),
          description: form.description.trim(),
          guestCategory: form.offerType === DayUseOfferType.EntranceFee ? form.guestCategory : undefined,
          durationMinutes: form.offerType === DayUseOfferType.Activity ? form.durationMinutes : undefined,
        });
        return;
      }

      await resortService.createDayUseOffer({
        code: form.code.trim(),
        name: form.name.trim(),
        variantName: form.variantName.trim(),
        description: form.description.trim(),
        offerType: form.offerType,
        guestContext: form.guestContext,
        guestCategory: form.offerType === DayUseOfferType.EntranceFee ? form.guestCategory : undefined,
        durationMinutes: form.offerType === DayUseOfferType.Activity ? form.durationMinutes : undefined,
        chargeTypeId: form.chargeTypeId,
        amount: form.amount,
        sortOrder: form.sortOrder,
      });
    },
    onSuccess: async () => {
      notifySuccess('Day-use offer saved successfully.');
      setEditingId(null);
      setShowOfferDialog(false);
      setForm(createEmptyDayUseOfferForm());
      await queryClient.invalidateQueries({ queryKey: ['day-use-offers'] });
      await queryClient.invalidateQueries({ queryKey: ['day-use-active-offers'] });
    },
    onError: (error) => {
      notifyError(error instanceof Error ? error.message : 'Failed to save day-use offer.');
    },
  });

  const items = useMemo(() => offersData?.items ?? [], [offersData?.items]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Day Use Offers</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage entrance fees and activity rates for walk-in and in-house guests.</p>
        </div>
        <button type="button" className="rounded bg-primary-600 px-4 py-2 text-white hover:bg-primary-700" onClick={() => { setEditingId(null); setForm(createEmptyDayUseOfferForm()); setShowOfferDialog(true); }}>
          New Offer
        </button>
      </div>

      <section className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Search Offers</label>
          <input value={filter} onChange={(e) => setFilter(e.target.value)} className="w-full rounded border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100" placeholder="Search by code, name, or variant" />
        </div>

        {isLoading ? <p className="text-sm text-gray-500">Loading offers...</p> : null}

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="p-2">Code</th>
                <th className="p-2">Offer</th>
                <th className="p-2">Context</th>
                <th className="p-2">Category</th>
                <th className="p-2">Charge Type</th>
                <th className="p-2">Amount</th>
                <th className="p-2">Active</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b">
                  <td className="p-2">{item.code}</td>
                  <td className="p-2">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{item.name}{item.variantName ? ` - ${item.variantName}` : ''}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{dayUseOfferTypeLabel(item.offerType)}{item.durationMinutes ? ` • ${item.durationMinutes} mins` : ''}</p>
                    </div>
                  </td>
                  <td className="p-2">{dayUseContextLabel(item.guestContext)}</td>
                  <td className="p-2">{dayUseGuestCategoryLabel(item.guestCategory)}</td>
                  <td className="p-2">{item.chargeTypeName}</td>
                  <td className="p-2">{item.amount.toFixed(2)}</td>
                  <td className="p-2">{item.isActive ? 'Yes' : 'No'}</td>
                  <td className="p-2">
                    <button
                      type="button"
                      className="rounded bg-slate-700 px-3 py-1 text-white"
                      onClick={() => {
                        setEditingId(item.id);
                        setForm(item);
                        setShowOfferDialog(true);
                      }}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
              {items.length === 0 ? (
                <tr>
                  <td className="p-3 text-gray-500" colSpan={8}>No day-use offers found.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <DayUseOfferDialog
        open={showOfferDialog}
        editingId={editingId}
        form={form}
        chargeTypes={chargeTypes}
        isSaving={saveMutation.isPending}
        onClose={() => {
          setShowOfferDialog(false);
          setEditingId(null);
          setForm(createEmptyDayUseOfferForm());
        }}
        onFormChange={(updater) => setForm((current) => updater(current))}
        onSave={() => void saveMutation.mutate()}
      />
    </div>
  );
};