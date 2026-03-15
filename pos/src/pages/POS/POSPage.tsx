import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Dialog, DialogPanel } from '@headlessui/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { invalidatePosQueries, posKeys } from '@/lib/posQueries';
import { POSLayout } from '@components/layout/POSLayout';
import { POSSidebar } from '@components/layout/POSSidebar';
import { usePOSSession } from '@contexts/POSSessionContext';
import { posService } from '@services/pos.service';
import { PosSessionStatus, type PosSessionListDto } from '@/types/pos.types';

const formatMoney = (value: number) =>
  value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatDateTime = (value: string) => (value ? new Date(value).toLocaleString() : '—');

const SESSION_STATUS_LABELS: Record<number, string> = {
  [PosSessionStatus.Open]: 'Open',
  [PosSessionStatus.Closed]: 'Closed',
  [PosSessionStatus.Suspended]: 'Suspended',
};

const SESSION_STATUS_CLASS: Record<number, string> = {
  [PosSessionStatus.Open]:
    'rounded bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  [PosSessionStatus.Closed]:
    'rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  [PosSessionStatus.Suspended]:
    'rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
};

export const POSPage = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { setCurrentSession } = usePOSSession();
  const [filter, setFilter] = useState('');
  const [showOpenDialog, setShowOpenDialog] = useState(false);
  const [openForm, setOpenForm] = useState({ outletId: '', terminalId: 'POS-01', openingCash: 0 });

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: posKeys.mySessions(),
    queryFn: () => posService.getMyPosSessions(),
  });

  const { data: currentOpenSessionId = null } = useQuery({
    queryKey: posKeys.currentSession(),
    queryFn: () => posService.getMyCurrentOpenSessionId(),
  });

  const { data: outlets = [] } = useQuery({
    queryKey: posKeys.outlets(),
    queryFn: () => posService.getPosOutlets(),
    enabled: showOpenDialog,
  });

  const openSessionMutation = useMutation({
    mutationFn: (input: { outletId: string; terminalId: string; openingCash: number }) =>
      posService.openPosSession(input),
    onSuccess: () => {
      setShowOpenDialog(false);
      setOpenForm({ outletId: '', terminalId: 'POS-01', openingCash: 0 });
      invalidatePosQueries(queryClient, 'session');
    },
  });

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowOpenDialog(false);
    };
    if (showOpenDialog) window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [showOpenDialog]);

  const filteredSessions = sessions.filter(
    (s) =>
      !filter.trim() ||
      s.outletName?.toLowerCase().includes(filter.toLowerCase()) ||
      s.terminalId?.toLowerCase().includes(filter.toLowerCase()) ||
      s.userName?.toLowerCase().includes(filter.toLowerCase())
  );

  const hasOpenSession = currentOpenSessionId != null && currentOpenSessionId !== '';

  const handleOpenSessionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!openForm.outletId.trim()) return;
    openSessionMutation.mutate({
      outletId: openForm.outletId,
      terminalId: openForm.terminalId.trim() || 'POS-01',
      openingCash: Number(openForm.openingCash) || 0,
    });
  };

  return (
    <POSLayout sidebar={<POSSidebar />}>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">POS Sessions</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              View your POS session history. Open a session to start taking orders.
            </p>
          </div>

          {hasOpenSession ? (
            <Link to="/order/new" className="rounded bg-primary-600 px-4 py-2 text-white hover:bg-primary-700">
              New Order
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => setShowOpenDialog(true)}
              className="rounded bg-primary-600 px-4 py-2 text-white hover:bg-primary-700"
            >
              Open session
            </button>
          )}
        </div>

        <section className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Session List</h2>
            <div className="w-full max-w-sm">
              <input
                className="w-full rounded border p-2 dark:bg-gray-700"
                placeholder="Search by outlet, terminal, user..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
            </div>
          </div>
          {isLoading ? (
            <p className="text-sm text-gray-500">Loading...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="p-2">Outlet</th>
                    <th className="p-2">Terminal</th>
                    <th className="p-2">User</th>
                    <th className="p-2">Opened At</th>
                    <th className="p-2">Closed At</th>
                    <th className="p-2 text-right">Opening Cash</th>
                    <th className="p-2 text-right">Closing Cash</th>
                    <th className="p-2 text-right">Expected</th>
                    <th className="p-2 text-right">Difference</th>
                    <th className="p-2">Status</th>
                    <th className="p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSessions.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="p-4 text-center text-gray-500 dark:text-gray-400">
                        No sessions found.
                      </td>
                    </tr>
                  ) : (
                    filteredSessions.map((s: PosSessionListDto) => (
                      <tr className="border-b" key={s.id}>
                        <td className="p-2">{s.outletName ?? s.outletId}</td>
                        <td className="p-2">{s.terminalName ?? s.terminalId}</td>
                        <td className="p-2">{s.userName ?? s.userId}</td>
                        <td className="p-2">{formatDateTime(s.openedAt)}</td>
                        <td className="p-2">{formatDateTime(s.closedAt ?? '')}</td>
                        <td className="p-2 text-right">{formatMoney(s.openingCash)}</td>
                        <td className="p-2 text-right">
                          {s.closingCash != null ? formatMoney(s.closingCash) : '—'}
                        </td>
                        <td className="p-2 text-right">
                          {s.expectedCash != null ? formatMoney(s.expectedCash) : '—'}
                        </td>
                        <td className="p-2 text-right">
                          {s.cashDifference != null ? (
                            <span
                              className={
                                s.cashDifference !== 0
                                  ? 'text-amber-600 dark:text-amber-400'
                                  : 'text-gray-600 dark:text-gray-400'
                              }
                            >
                              {formatMoney(s.cashDifference)}
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="p-2">
                          <span className={SESSION_STATUS_CLASS[s.status] ?? ''}>
                            {SESSION_STATUS_LABELS[s.status] ?? 'Unknown'}
                          </span>
                        </td>
                        <td className="p-2">
                          {s.status === PosSessionStatus.Open ? (
                            <button
                              type="button"
                              onClick={() => {
                                setCurrentSession(s);
                                navigate('/order/new');
                              }}
                              className="rounded bg-primary-600 px-2 py-1 text-white hover:bg-primary-700"
                            >
                              Continue
                            </button>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <Dialog open={showOpenDialog} onClose={() => {}} className="fixed inset-0 z-50 overflow-y-auto">
        <div className="fixed inset-0 bg-black/50 pointer-events-none" aria-hidden />
        <div className="relative flex min-h-screen items-center justify-center p-4 pointer-events-none">
          <DialogPanel className="w-full max-w-md rounded-lg bg-white p-5 shadow dark:bg-gray-800 pointer-events-auto">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Open POS Session</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Cash drawer opening — enter opening cash amount.
            </p>
            <form onSubmit={handleOpenSessionSubmit} className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Outlet
                </label>
                <select
                  required
                  className="w-full rounded border p-2 dark:bg-gray-700 dark:border-gray-600"
                  value={openForm.outletId}
                  onChange={(e) => setOpenForm((f) => ({ ...f, outletId: e.target.value }))}
                >
                  <option value="">Select outlet</option>
                  {outlets.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Terminal ID
                </label>
                <input
                  type="text"
                  className="w-full rounded border p-2 dark:bg-gray-700 dark:border-gray-600"
                  placeholder="e.g. POS-01"
                  value={openForm.terminalId}
                  onChange={(e) => setOpenForm((f) => ({ ...f, terminalId: e.target.value }))}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Opening cash
                </label>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  className="w-full rounded border p-2 dark:bg-gray-700 dark:border-gray-600"
                  value={openForm.openingCash || ''}
                  onChange={(e) =>
                    setOpenForm((f) => ({ ...f, openingCash: parseFloat(e.target.value) || 0 }))
                  }
                />
              </div>
              {openSessionMutation.isError && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {(openSessionMutation.error as Error).message}
                </p>
              )}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowOpenDialog(false)}
                  className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 dark:border-gray-600 dark:text-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={openSessionMutation.isPending || !openForm.outletId}
                  className="rounded bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
                >
                  {openSessionMutation.isPending ? 'Opening…' : 'Open session'}
                </button>
              </div>
            </form>
          </DialogPanel>
        </div>
      </Dialog>
    </POSLayout>
  );
};
