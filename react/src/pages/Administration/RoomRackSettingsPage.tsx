import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { resortService } from '@services/resort.service';
import type { RoomRackSettingsDto } from '@/types/resort.types';

const defaultSettings: RoomRackSettingsDto = {
  dateRangeDays: 14,
  colorInHouse: '#DBEAFE',
  colorInHouseDark: '#1E3A8A',
  colorPendingReservation: '#FEF3C7',
  colorPendingReservationDark: '#713F12',
  colorConfirmedReservation: '#D1FAE5',
  colorConfirmedReservationDark: '#14532D',
  colorCheckoutToday: '#BFDBFE',
  colorCheckoutTodayDark: '#1E40AF',
  colorOnHoldRoom: '#E2E8F0',
  colorOnHoldRoomDark: '#475569',
};

function ColorRow({
  label,
  value,
  valueDark,
  onChange,
  onChangeDark,
}: {
  label: string;
  value: string;
  valueDark: string;
  onChange: (v: string) => void;
  onChangeDark: (v: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:items-center">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500 dark:text-gray-400">Light</span>
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-14 cursor-pointer rounded border border-gray-300 dark:border-gray-600"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-24 rounded border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        />
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500 dark:text-gray-400">Dark</span>
        <input
          type="color"
          value={valueDark}
          onChange={(e) => onChangeDark(e.target.value)}
          className="h-9 w-14 cursor-pointer rounded border border-gray-300 dark:border-gray-600"
        />
        <input
          type="text"
          value={valueDark}
          onChange={(e) => onChangeDark(e.target.value)}
          className="w-24 rounded border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        />
      </div>
    </div>
  );
}

export const RoomRackSettingsPage = () => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<RoomRackSettingsDto>(defaultSettings);

  const { data, isLoading } = useQuery({
    queryKey: ['room-rack-settings'],
    queryFn: () => resortService.getRoomRackSettings(),
    staleTime: 60 * 1000,
  });

  React.useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const updateMutation = useMutation({
    mutationFn: (input: RoomRackSettingsDto) => resortService.updateRoomRackSettings(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['room-rack-settings'] });
      void queryClient.invalidateQueries({ queryKey: ['room-rack-info'] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(form);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Room Rack Settings</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Date range and color codes for the Front Desk room rack grid.
          </p>
        </div>
      </div>

      <section className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Date range</h2>
            <div className="flex items-center gap-2">
              <label htmlFor="dateRangeDays" className="text-sm text-gray-700 dark:text-gray-300">
                Default number of days in date range filter
              </label>
              <input
                id="dateRangeDays"
                type="number"
                min={1}
                max={90}
                value={form.dateRangeDays}
                onChange={(e) => setForm((f) => ({ ...f, dateRangeDays: Math.max(1, Math.min(90, Number(e.target.value) || 14)) }))}
                className="w-20 rounded border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Color codes</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              Light = background in light theme; Dark = background in dark theme. Use hex (e.g. #DBEAFE).
            </p>
            <div className="space-y-4">
              <ColorRow
                label="In-house (stay)"
                value={form.colorInHouse}
                valueDark={form.colorInHouseDark}
                onChange={(v) => setForm((f) => ({ ...f, colorInHouse: v }))}
                onChangeDark={(v) => setForm((f) => ({ ...f, colorInHouseDark: v }))}
              />
              <ColorRow
                label="Pending reservation"
                value={form.colorPendingReservation}
                valueDark={form.colorPendingReservationDark}
                onChange={(v) => setForm((f) => ({ ...f, colorPendingReservation: v }))}
                onChangeDark={(v) => setForm((f) => ({ ...f, colorPendingReservationDark: v }))}
              />
              <ColorRow
                label="Confirmed reservation"
                value={form.colorConfirmedReservation}
                valueDark={form.colorConfirmedReservationDark}
                onChange={(v) => setForm((f) => ({ ...f, colorConfirmedReservation: v }))}
                onChangeDark={(v) => setForm((f) => ({ ...f, colorConfirmedReservationDark: v }))}
              />
              <ColorRow
                label="Checkout today"
                value={form.colorCheckoutToday}
                valueDark={form.colorCheckoutTodayDark}
                onChange={(v) => setForm((f) => ({ ...f, colorCheckoutToday: v }))}
                onChangeDark={(v) => setForm((f) => ({ ...f, colorCheckoutTodayDark: v }))}
              />
              <ColorRow
                label="On-hold room (blocked)"
                value={form.colorOnHoldRoom}
                valueDark={form.colorOnHoldRoomDark}
                onChange={(v) => setForm((f) => ({ ...f, colorOnHoldRoom: v }))}
                onChangeDark={(v) => setForm((f) => ({ ...f, colorOnHoldRoomDark: v }))}
              />
            </div>
          </div>

          {updateMutation.isError && (
            <p className="text-sm text-red-600 dark:text-red-400">
              {updateMutation.error instanceof Error ? updateMutation.error.message : 'Failed to save settings.'}
            </p>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="rounded bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {updateMutation.isPending ? 'Saving…' : 'Save settings'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};
