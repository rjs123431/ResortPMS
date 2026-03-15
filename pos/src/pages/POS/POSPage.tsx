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
import { CloseSessionDialog } from './CloseSessionDialog';

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
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [openForm, setOpenForm] = useState({ outletId: '', terminalId: '', openingCash: 0 });

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

  const { data: terminals = [] } = useQuery({
    queryKey: posKeys.settingsTerminals(openForm.outletId),
    queryFn: () => posService.getSettingsTerminals(openForm.outletId),
    enabled: showOpenDialog && !!openForm.outletId,
  });

  // Preselect outlet and terminal when only one option exists
  useEffect(() => {
    if (!showOpenDialog) return;
    if (outlets.length === 1 && !openForm.outletId) {
      setOpenForm((f) => ({ ...f, outletId: outlets[0].id, terminalId: '' }));
    }
  }, [showOpenDialog, outlets, openForm.outletId]);

  useEffect(() => {
    if (!showOpenDialog || !openForm.outletId) return;
    const active = terminals.filter((t: { isActive: boolean }) => t.isActive);
    if (active.length === 1 && !openForm.terminalId) {
      setOpenForm((f) => ({ ...f, terminalId: active[0].code }));
    }
  }, [showOpenDialog, openForm.outletId, openForm.terminalId, terminals]);

  const openSessionMutation = useMutation({
    mutationFn: (input: { outletId: string; terminalId: string; openingCash: number }) =>
      posService.openPosSession(input),
    onSuccess: () => {
      setShowOpenDialog(false);
      setOpenForm({ outletId: '', terminalId: '', openingCash: 0 });
      invalidatePosQueries(queryClient, 'session');
    },
  });

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowOpenDialog(false);
        setShowCloseDialog(false);
      }
    };
    if (showOpenDialog || showCloseDialog) window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [showOpenDialog, showCloseDialog]);

  const filteredSessions = sessions.filter(
    (s) =>
      !filter.trim() ||
      s.outletName?.toLowerCase().includes(filter.toLowerCase()) ||
      s.terminalId?.toLowerCase().includes(filter.toLowerCase()) ||
      s.userName?.toLowerCase().includes(filter.toLowerCase())
  );

  const hasOpenSession = currentOpenSessionId != null && currentOpenSessionId !== '';
  const openSession = sessions.find((s: PosSessionListDto) => s.status === PosSessionStatus.Open);

  const handleOpenSessionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!openForm.outletId.trim() || !openForm.terminalId.trim()) return;
    openSessionMutation.mutate({
      outletId: openForm.outletId,
      terminalId: openForm.terminalId.trim(),
      openingCash: Number(openForm.openingCash) || 0,
    });
  };

  return (
    <POSLayout sidebar={<POSSidebar />}>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">POS Sessions</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              View your POS session history. Open a session to start taking orders.
            </p>
          </div>

          {hasOpenSession ? (
            <div className="flex flex-wrap items-center gap-2">
              <Link
                to="/order/new"
                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded bg-primary-600 px-4 py-2.5 text-white hover:bg-primary-700 active:scale-[0.98]"
              >
                New Order
              </Link>
              {openSession && (
                <button
                  type="button"
                  onClick={() => setShowCloseDialog(true)}
                  className="min-h-[44px] rounded border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 active:scale-[0.98] dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Close session
                </button>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowOpenDialog(true)}
              className="min-h-[44px] min-w-[44px] rounded bg-primary-600 px-4 py-2.5 text-white hover:bg-primary-700 active:scale-[0.98]"
            >
              Open session
            </button>
          )}
        </div>

        <section className="rounded-lg bg-white p-3 shadow dark:bg-gray-800 sm:p-5">
          <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Session List</h2>
            <div className="w-full sm:max-w-sm">
              <input
                className="min-h-[44px] w-full rounded border p-2.5 dark:bg-gray-700"
                placeholder="Search by outlet, terminal, user..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
            </div>
          </div>
          {isLoading ? (
            <p className="text-sm text-gray-500">Loading...</p>
          ) : filteredSessions.length === 0 ? (
            <p className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">No sessions found.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredSessions.map((s: PosSessionListDto) => (
                <div
                  key={s.id}
                  className="flex flex-col rounded-lg border border-gray-200 p-4 dark:border-gray-600"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {s.outletName ?? s.outletId} · {s.terminalName ?? s.terminalId}
                    </span>
                    <span className={SESSION_STATUS_CLASS[s.status] ?? ''}>
                      {SESSION_STATUS_LABELS[s.status] ?? 'Unknown'}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{s.userName ?? s.userId}</p>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                    Opened {formatDateTime(s.openedAt)}
                    {s.closedAt ? ` · Closed ${formatDateTime(s.closedAt)}` : ''}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600 dark:text-gray-400">
                    <span>Open: {formatMoney(s.openingCash)}</span>
                    {s.closingCash != null && <span>Close: {formatMoney(s.closingCash)}</span>}
                    {s.cashDifference != null && (
                      <span className={s.cashDifference !== 0 ? 'text-amber-600 dark:text-amber-400' : ''}>
                        Diff: {formatMoney(s.cashDifference)}
                      </span>
                    )}
                  </div>
                  {s.status === PosSessionStatus.Open && (
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentSession(s);
                        navigate('/order/new');
                      }}
                      className="mt-auto pt-3 min-h-[44px] w-full rounded bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-700 active:scale-[0.98]"
                    >
                      Continue
                    </button>
                  )}
                </div>
              ))}
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
                  onChange={(e) =>
                    setOpenForm((f) => ({ ...f, outletId: e.target.value, terminalId: '' }))
                  }
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
                  Terminal
                </label>
                <select
                  required
                  className="w-full rounded border p-2 dark:bg-gray-700 dark:border-gray-600"
                  value={openForm.terminalId}
                  onChange={(e) => setOpenForm((f) => ({ ...f, terminalId: e.target.value }))}
                  disabled={!openForm.outletId || terminals.length === 0}
                >
                  <option value="">
                    {!openForm.outletId
                      ? 'Select outlet first'
                      : terminals.length === 0
                        ? 'No terminals set up'
                        : 'Select terminal'}
                  </option>
                  {terminals
                    .filter((t: { isActive: boolean }) => t.isActive)
                    .map((t: { id: string; code: string; name: string }) => (
                      <option key={t.id} value={t.code}>
                        {t.name || t.code}
                      </option>
                    ))}
                </select>
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
                  disabled={
                    openSessionMutation.isPending ||
                    !openForm.outletId ||
                    !openForm.terminalId.trim()
                  }
                  className="rounded bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
                >
                  {openSessionMutation.isPending ? 'Opening…' : 'Open session'}
                </button>
              </div>
            </form>
          </DialogPanel>
        </div>
      </Dialog>

      {openSession && (
        <CloseSessionDialog
          open={showCloseDialog}
          onClose={() => setShowCloseDialog(false)}
          session={openSession}
          onSuccess={() => setCurrentSession(null)}
        />
      )}
    </POSLayout>
  );
};
