import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { resortService } from '@services/resort.service';
import {
  type CreateIncidentDto,
  IncidentSeverity,
  IncidentStatus,
  type IncidentListDto,
} from '@/types/incident.types';
import { formatDate } from '@utils/helpers';

// ── Badge configs ──────────────────────────────────────────────────────────────

const STATUS_TABS: { label: string; value: IncidentStatus | undefined }[] = [
  { label: 'All', value: undefined },
  { label: 'Open', value: IncidentStatus.Open },
  { label: 'In Progress', value: IncidentStatus.InProgress },
  { label: 'Resolved', value: IncidentStatus.Resolved },
  { label: 'Closed', value: IncidentStatus.Closed },
];

const STATUS_BADGE: Record<IncidentStatus, { label: string; className: string }> = {
  [IncidentStatus.Open]: { label: 'Open', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  [IncidentStatus.InProgress]: { label: 'In Progress', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  [IncidentStatus.Resolved]: { label: 'Resolved', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  [IncidentStatus.Closed]: { label: 'Closed', className: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400' },
};

const SEVERITY_BADGE: Record<IncidentSeverity, { label: string; className: string }> = {
  [IncidentSeverity.Low]: { label: 'Low', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  [IncidentSeverity.Medium]: { label: 'Medium', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  [IncidentSeverity.High]: { label: 'High', className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  [IncidentSeverity.Critical]: { label: 'Critical', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 font-semibold' },
};

// ── Create Dialog ─────────────────────────────────────────────────────────────

type CreateForm = { stayNo: string; stayId: string; title: string; description: string; severity: IncidentSeverity; category: string; reportedByName: string };

const DEFAULT_FORM: CreateForm = { stayNo: '', stayId: '', title: '', description: '', severity: IncidentSeverity.Medium, category: '', reportedByName: '' };

function CreateIncidentDialog({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState<CreateForm>(DEFAULT_FORM);
  const [stayLookupError, setStayLookupError] = useState('');

  const createMutation = useMutation({
    mutationFn: (input: CreateIncidentDto) => resortService.createIncident(input),
    onSuccess: () => { onCreated(); onClose(); },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.stayId) { setStayLookupError('Please enter a valid Stay No.'); return; }
    createMutation.mutate({
      stayId: form.stayId,
      title: form.title,
      description: form.description,
      severity: form.severity,
      category: form.category || undefined,
      reportedByName: form.reportedByName || undefined,
    });
  };

  // Look up stay ID by stayNo using the stays API
  const stayLookup = useQuery({
    queryKey: ['incident-stay-lookup', form.stayNo],
    queryFn: () => resortService.getInHouseStays(form.stayNo, 0, 5),
    enabled: form.stayNo.length >= 3,
  });

  const matchedStays = stayLookup.data?.items ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Report Incident</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Stay lookup */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Stay No <span className="text-red-500">*</span></label>
            <input
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              placeholder="Search stay number..."
              value={form.stayNo}
              onChange={(e) => { setForm(f => ({ ...f, stayNo: e.target.value, stayId: '' })); setStayLookupError(''); }}
            />
            {matchedStays.length > 0 && !form.stayId && (
              <ul className="mt-1 rounded border border-gray-200 bg-white dark:border-gray-600 dark:bg-gray-700">
                {matchedStays.map(s => (
                  <li key={s.id}>
                    <button
                      type="button"
                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-600"
                      onClick={() => setForm(f => ({ ...f, stayId: s.id, stayNo: s.stayNo }))}
                    >
                      {s.stayNo} — {s.guestName}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {stayLookupError && <p className="mt-1 text-xs text-red-500">{stayLookupError}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Title <span className="text-red-500">*</span></label>
            <input
              required
              maxLength={256}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              value={form.title}
              onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description <span className="text-red-500">*</span></label>
            <textarea
              required
              rows={3}
              maxLength={2048}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              value={form.description}
              onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Severity</label>
              <select
                className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                value={form.severity}
                onChange={(e) => setForm(f => ({ ...f, severity: Number(e.target.value) as IncidentSeverity }))}
              >
                <option value={IncidentSeverity.Low}>Low</option>
                <option value={IncidentSeverity.Medium}>Medium</option>
                <option value={IncidentSeverity.High}>High</option>
                <option value={IncidentSeverity.Critical}>Critical</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
              <input
                maxLength={64}
                className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                placeholder="e.g. Safety, Complaint..."
                value={form.category}
                onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Reported By</label>
            <input
              maxLength={128}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              placeholder="Name of staff reporting..."
              value={form.reportedByName}
              onChange={(e) => setForm(f => ({ ...f, reportedByName: e.target.value }))}
            />
          </div>

          {createMutation.error && (
            <p className="text-xs text-red-500">Error reporting incident. Please try again.</p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700">
              Cancel
            </button>
            <button type="submit" disabled={createMutation.isPending} className="rounded bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-50">
              {createMutation.isPending ? 'Reporting…' : 'Report Incident'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Resolve Dialog ─────────────────────────────────────────────────────────────

function ResolveIncidentDialog({ incident, onClose, onResolved }: { incident: IncidentListDto; onClose: () => void; onResolved: () => void }) {
  const [resolution, setResolution] = useState('');

  const resolveMutation = useMutation({
    mutationFn: () => resortService.resolveIncident({ id: incident.id, resolution }),
    onSuccess: () => { onResolved(); onClose(); },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
        <h2 className="mb-1 text-lg font-semibold text-gray-900 dark:text-white">Resolve Incident</h2>
        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">{incident.title}</p>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Resolution <span className="text-red-500">*</span>
        </label>
        <textarea
          rows={4}
          maxLength={2048}
          className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          placeholder="Describe how the incident was resolved..."
          value={resolution}
          onChange={(e) => setResolution(e.target.value)}
        />
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700">
            Cancel
          </button>
          <button
            type="button"
            disabled={!resolution.trim() || resolveMutation.isPending}
            className="rounded bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700 disabled:opacity-50"
            onClick={() => resolveMutation.mutate()}
          >
            {resolveMutation.isPending ? 'Resolving…' : 'Mark Resolved'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export const IncidentsPage = () => {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('');
  const [statusTab, setStatusTab] = useState<IncidentStatus | undefined>(undefined);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [resolveTarget, setResolveTarget] = useState<IncidentListDto | null>(null);

  const { data, isFetching } = useQuery({
    queryKey: ['resort-incidents', filter, statusTab],
    queryFn: () =>
      resortService.getIncidents({
        filter: filter || undefined,
        status: statusTab,
        maxResultCount: 200,
      }),
  });

  const closeMutation = useMutation({
    mutationFn: (id: string) => resortService.closeIncident(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['resort-incidents'] }),
  });

  const invalidate = () => void queryClient.invalidateQueries({ queryKey: ['resort-incidents'] });
  const incidents = data?.items ?? [];

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Incidents</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Track and resolve guest incidents during their stay.</p>
          </div>
          <button
            type="button"
            className="rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            onClick={() => setShowCreateDialog(true)}
          >
            Report Incident
          </button>
        </div>

        <section className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
          {/* Search */}
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <input
              type="text"
              className="w-full max-w-xs rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              placeholder="Search by title, guest, stay no..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>

          {/* Status tabs */}
          <div className="mb-4 flex flex-wrap gap-2">
            {STATUS_TABS.map((tab) => (
              <button
                key={String(tab.value)}
                type="button"
                onClick={() => setStatusTab(tab.value)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  statusTab === tab.value
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b text-left dark:border-gray-700">
                  <th className="p-3">Stay No</th>
                  <th className="p-3">Guest</th>
                  <th className="p-3">Title</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Severity</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Reported</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isFetching ? (
                  <tr>
                    <td colSpan={8} className="p-4 text-center text-gray-500">Loading incidents…</td>
                  </tr>
                ) : incidents.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-4 text-center text-gray-500">No incidents found.</td>
                  </tr>
                ) : (
                  incidents.map((inc) => {
                    const statusBadge = STATUS_BADGE[inc.status];
                    const severityBadge = SEVERITY_BADGE[inc.severity];
                    const canResolve = inc.status === IncidentStatus.Open || inc.status === IncidentStatus.InProgress;
                    const canClose = inc.status === IncidentStatus.Resolved;

                    return (
                      <tr key={inc.id} className="border-b hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/50">
                        <td className="p-3 font-medium">{inc.stayNo}</td>
                        <td className="p-3">{inc.guestName || '—'}</td>
                        <td className="p-3 max-w-[200px]">
                          <span className="block truncate" title={inc.title}>{inc.title}</span>
                          {inc.reportedByName && (
                            <span className="text-xs text-gray-400">by {inc.reportedByName}</span>
                          )}
                        </td>
                        <td className="p-3 text-gray-500">{inc.category || '—'}</td>
                        <td className="p-3">
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${severityBadge.className}`}>
                            {severityBadge.label}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadge.className}`}>
                            {statusBadge.label}
                          </span>
                        </td>
                        <td className="p-3 text-gray-500">{formatDate(inc.reportedAt)}</td>
                        <td className="p-3">
                          <div className="flex gap-1.5">
                            {canResolve && (
                              <button
                                type="button"
                                className="rounded bg-green-600 px-2.5 py-1 text-xs text-white hover:bg-green-700"
                                onClick={() => setResolveTarget(inc)}
                              >
                                Resolve
                              </button>
                            )}
                            {canClose && (
                              <button
                                type="button"
                                disabled={closeMutation.isPending}
                                className="rounded bg-gray-500 px-2.5 py-1 text-xs text-white hover:bg-gray-600 disabled:opacity-50"
                                onClick={() => closeMutation.mutate(inc.id)}
                              >
                                Close
                              </button>
                            )}
                            {!canResolve && !canClose && (
                              <span className="text-gray-400">—</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {showCreateDialog && (
        <CreateIncidentDialog
          onClose={() => setShowCreateDialog(false)}
          onCreated={invalidate}
        />
      )}

      {resolveTarget && (
        <ResolveIncidentDialog
          incident={resolveTarget}
          onClose={() => setResolveTarget(null)}
          onResolved={invalidate}
        />
      )}
    </>
  );
};
