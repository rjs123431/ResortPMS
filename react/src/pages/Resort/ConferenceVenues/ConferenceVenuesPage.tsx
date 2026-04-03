import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { conferenceVenueBlackoutService } from '@services/conference-venue-blackout.service';
import { conferenceVenueService } from '@services/conference-venue.service';
import { ConferenceVenueDialog } from './ConferenceVenueDialog';
import type {
  CreateConferenceVenueBlackoutDto,
  CreateConferenceVenueDto,
  UpdateConferenceVenueBlackoutDto,
  UpdateConferenceVenueDto,
} from '@/types/conference.types';

const createEmptyForm = (): CreateConferenceVenueDto => ({
  code: '',
  name: '',
  category: '',
  capacity: 50,
  hourlyRate: 0,
  halfDayRate: 0,
  fullDayRate: 0,
  setupBufferMinutes: 60,
  teardownBufferMinutes: 30,
  description: '',
  isActive: true,
});

const createEmptyBlackoutForm = (venueId = ''): CreateConferenceVenueBlackoutDto => {
  const start = new Date();
  start.setMinutes(0, 0, 0);
  start.setHours(start.getHours() + 1);

  const end = new Date(start);
  end.setHours(end.getHours() + 4);

  return {
    venueId,
    title: '',
    startDateTime: toDateTimeLocalValue(start.toISOString()),
    endDateTime: toDateTimeLocalValue(end.toISOString()),
    notes: '',
  };
};

export function ConferenceVenuesPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('');
  const [isVenueDialogOpen, setIsVenueDialogOpen] = useState(false);
  const [editingVenueId, setEditingVenueId] = useState<string | null>(null);
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null);
  const [form, setForm] = useState<CreateConferenceVenueDto>(createEmptyForm());
  const [editingBlackoutId, setEditingBlackoutId] = useState<string | null>(null);
  const [blackoutForm, setBlackoutForm] = useState<CreateConferenceVenueBlackoutDto>(createEmptyBlackoutForm());

  const { data, isLoading } = useQuery({
    queryKey: ['conference-venues', filter],
    queryFn: () => conferenceVenueService.getConferenceVenues(filter),
  });

  const blackoutsQuery = useQuery({
    queryKey: ['conference-venue-blackouts', selectedVenueId],
    queryFn: () => conferenceVenueBlackoutService.getConferenceVenueBlackouts({ venueId: selectedVenueId ?? undefined }),
    enabled: Boolean(selectedVenueId),
  });

  const createMutation = useMutation({
    mutationFn: conferenceVenueService.createConferenceVenue,
    onSuccess: () => {
      setIsVenueDialogOpen(false);
      setForm(createEmptyForm());
      void queryClient.invalidateQueries({ queryKey: ['conference-venues'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: conferenceVenueService.updateConferenceVenue,
    onSuccess: () => {
      setIsVenueDialogOpen(false);
      setEditingVenueId(null);
      setForm(createEmptyForm());
      void queryClient.invalidateQueries({ queryKey: ['conference-venues'] });
    },
  });

  const createBlackoutMutation = useMutation({
    mutationFn: conferenceVenueBlackoutService.createConferenceVenueBlackout,
    onSuccess: () => {
      setEditingBlackoutId(null);
      setBlackoutForm(createEmptyBlackoutForm(selectedVenueId ?? ''));
      void queryClient.invalidateQueries({ queryKey: ['conference-venue-blackouts', selectedVenueId] });
    },
  });

  const updateBlackoutMutation = useMutation({
    mutationFn: conferenceVenueBlackoutService.updateConferenceVenueBlackout,
    onSuccess: () => {
      setEditingBlackoutId(null);
      setBlackoutForm(createEmptyBlackoutForm(selectedVenueId ?? ''));
      void queryClient.invalidateQueries({ queryKey: ['conference-venue-blackouts', selectedVenueId] });
    },
  });

  const deleteBlackoutMutation = useMutation({
    mutationFn: conferenceVenueBlackoutService.deleteConferenceVenueBlackout,
    onSuccess: () => {
      setEditingBlackoutId(null);
      setBlackoutForm(createEmptyBlackoutForm(selectedVenueId ?? ''));
      void queryClient.invalidateQueries({ queryKey: ['conference-venue-blackouts', selectedVenueId] });
    },
  });

  const items = useMemo(() => data?.items ?? [], [data]);

  const startEdit = async (id: string) => {
    const venue = await conferenceVenueService.getConferenceVenue(id);
    setEditingVenueId(id);
    setIsVenueDialogOpen(true);
    setSelectedVenueId(id);
    setForm({
      code: venue.code,
      name: venue.name,
      category: venue.category,
      capacity: venue.capacity,
      hourlyRate: venue.hourlyRate,
      halfDayRate: venue.halfDayRate,
      fullDayRate: venue.fullDayRate,
      setupBufferMinutes: venue.setupBufferMinutes,
      teardownBufferMinutes: venue.teardownBufferMinutes,
      description: venue.description,
      isActive: venue.isActive,
    });
    setEditingBlackoutId(null);
    setBlackoutForm(createEmptyBlackoutForm(id));
  };

  const handleSubmit = () => {
    if (editingVenueId) {
      updateMutation.mutate({ id: editingVenueId, ...form } satisfies UpdateConferenceVenueDto);
      return;
    }

    createMutation.mutate(form);
  };

  const handleBlackoutSubmit = () => {
    if (!blackoutForm.venueId) return;

    const payload = {
      ...blackoutForm,
      startDateTime: new Date(blackoutForm.startDateTime).toISOString(),
      endDateTime: new Date(blackoutForm.endDateTime).toISOString(),
    };

    if (editingBlackoutId) {
      updateBlackoutMutation.mutate({ id: editingBlackoutId, ...payload } satisfies UpdateConferenceVenueBlackoutDto);
      return;
    }

    createBlackoutMutation.mutate(payload);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Conference Venues</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Set up halls and meeting rooms with capacities, buffers, pricing, and blackout periods.</p>
        </div>
      </div>

      <section className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,420px)]">
          <div className="lg:col-span-2">
            <div className="mb-4 flex items-end justify-between gap-3">
              <div className="w-full max-w-sm">
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Search Venues</label>
                <input
                  className="w-full rounded border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  value={filter}
                  onChange={(event) => setFilter(event.target.value)}
                  placeholder="Name, code, or category"
                />
              </div>
              <button
                type="button"
                className="rounded border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                onClick={() => {
                  setIsVenueDialogOpen(true);
                  setEditingVenueId(null);
                  setForm(createEmptyForm());
                }}
              >
                New Venue
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b text-left dark:border-gray-700">
                    <th className="p-2">Code</th>
                    <th className="p-2">Name</th>
                    <th className="p-2">Category</th>
                    <th className="p-2">Capacity</th>
                    <th className="p-2">Hourly</th>
                    <th className="p-2">Active</th>
                    <th className="p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="p-4 text-center text-gray-500">Loading venues...</td>
                    </tr>
                  ) : items.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-4 text-center text-gray-500">No venues found.</td>
                    </tr>
                  ) : (
                    items.map((venue) => (
                      <tr key={venue.id} className="border-b dark:border-gray-700">
                        <td className="p-2 font-medium">{venue.code}</td>
                        <td className="p-2">{venue.name}</td>
                        <td className="p-2">{venue.category || '—'}</td>
                        <td className="p-2">{venue.capacity}</td>
                        <td className="p-2">{venue.hourlyRate.toFixed(2)}</td>
                        <td className="p-2">{venue.isActive ? 'Yes' : 'No'}</td>
                        <td className="p-2">
                          <div className="flex gap-2">
                            <button
                              type="button"
                              className="rounded bg-slate-700 px-2 py-1 text-white hover:bg-slate-800"
                              onClick={() => void startEdit(venue.id)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="rounded border border-gray-300 px-2 py-1 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                              onClick={() => {
                                setSelectedVenueId(venue.id);
                                setEditingBlackoutId(null);
                                setBlackoutForm(createEmptyBlackoutForm(venue.id));
                              }}
                            >
                              Blackouts
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Venue Blackout Periods</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Block event slots for maintenance, internal use, set builds, or exclusive holds.</p>
            </div>
            <select
              className="rounded border border-gray-300 p-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              value={selectedVenueId ?? ''}
              onChange={(event) => {
                const nextVenueId = event.target.value || null;
                setSelectedVenueId(nextVenueId);
                setEditingBlackoutId(null);
                setBlackoutForm(createEmptyBlackoutForm(nextVenueId ?? ''));
              }}
            >
              <option value="">Select venue</option>
              {items.map((venue) => (
                <option key={venue.id} value={venue.id}>{venue.name}</option>
              ))}
            </select>
          </div>

          {!selectedVenueId ? (
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Choose a venue to manage blackout periods.</p>
          ) : (
            <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,420px)]">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b text-left dark:border-gray-700">
                      <th className="p-2">Title</th>
                      <th className="p-2">Start</th>
                      <th className="p-2">End</th>
                      <th className="p-2">Notes</th>
                      <th className="p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {blackoutsQuery.isLoading ? (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-gray-500">Loading blackout periods...</td>
                      </tr>
                    ) : (blackoutsQuery.data?.items?.length ?? 0) === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-gray-500">No blackout periods configured.</td>
                      </tr>
                    ) : (
                      blackoutsQuery.data?.items.map((blackout) => (
                        <tr key={blackout.id} className="border-b dark:border-gray-700">
                          <td className="p-2 font-medium">{blackout.title}</td>
                          <td className="p-2">{new Date(blackout.startDateTime).toLocaleString()}</td>
                          <td className="p-2">{new Date(blackout.endDateTime).toLocaleString()}</td>
                          <td className="p-2">{blackout.notes || '—'}</td>
                          <td className="p-2">
                            <div className="flex gap-2">
                              <button
                                type="button"
                                className="rounded bg-slate-700 px-2 py-1 text-white hover:bg-slate-800"
                                onClick={() => {
                                  setEditingBlackoutId(blackout.id);
                                  setBlackoutForm({
                                    venueId: blackout.venueId,
                                    title: blackout.title,
                                    startDateTime: toDateTimeLocalValue(blackout.startDateTime),
                                    endDateTime: toDateTimeLocalValue(blackout.endDateTime),
                                    notes: blackout.notes,
                                  });
                                }}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className="rounded bg-rose-600 px-2 py-1 text-white hover:bg-rose-700 disabled:opacity-50"
                                disabled={deleteBlackoutMutation.isPending}
                                onClick={() => deleteBlackoutMutation.mutate(blackout.id)}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{editingBlackoutId ? 'Edit Blackout' : 'New Blackout'}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">These periods are enforced by availability checks and booking saves.</p>
                </div>

                <div className="grid gap-3">
                  <label className="block text-sm text-gray-700 dark:text-gray-300">
                    Title
                    <input className="mt-1 w-full rounded border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" value={blackoutForm.title} onChange={(event) => setBlackoutForm((current) => ({ ...current, title: event.target.value }))} />
                  </label>
                  <label className="block text-sm text-gray-700 dark:text-gray-300">
                    Start
                    <input type="datetime-local" className="mt-1 w-full rounded border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" value={blackoutForm.startDateTime} onChange={(event) => setBlackoutForm((current) => ({ ...current, startDateTime: event.target.value }))} />
                  </label>
                  <label className="block text-sm text-gray-700 dark:text-gray-300">
                    End
                    <input type="datetime-local" className="mt-1 w-full rounded border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" value={blackoutForm.endDateTime} onChange={(event) => setBlackoutForm((current) => ({ ...current, endDateTime: event.target.value }))} />
                  </label>
                  <label className="block text-sm text-gray-700 dark:text-gray-300">
                    Notes
                    <textarea className="mt-1 w-full rounded border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" rows={4} value={blackoutForm.notes ?? ''} onChange={(event) => setBlackoutForm((current) => ({ ...current, notes: event.target.value }))} />
                  </label>
                </div>

                <div className="mt-4 flex justify-end gap-2">
                  {editingBlackoutId ? (
                    <button type="button" className="rounded border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700" onClick={() => {
                      setEditingBlackoutId(null);
                      setBlackoutForm(createEmptyBlackoutForm(selectedVenueId ?? ''));
                    }}>
                      Cancel Edit
                    </button>
                  ) : null}
                  <button type="button" className="rounded bg-primary-600 px-4 py-2 text-sm text-white hover:bg-primary-700 disabled:opacity-50" onClick={handleBlackoutSubmit} disabled={createBlackoutMutation.isPending || updateBlackoutMutation.isPending || !blackoutForm.title.trim() || !blackoutForm.startDateTime || !blackoutForm.endDateTime}>
                    {(createBlackoutMutation.isPending || updateBlackoutMutation.isPending) ? 'Saving...' : editingBlackoutId ? 'Update Blackout' : 'Create Blackout'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <ConferenceVenueDialog
        isOpen={isVenueDialogOpen}
        editingVenueId={editingVenueId}
        form={form}
        isSaving={createMutation.isPending || updateMutation.isPending}
        onChange={setForm}
        onSubmit={handleSubmit}
        onClose={() => {
          setIsVenueDialogOpen(false);
          setEditingVenueId(null);
          setForm(createEmptyForm());
        }}
      />
    </div>
  );
}

function toDateTimeLocalValue(value: string) {
  const date = new Date(value);
  const timezoneOffset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16);
}