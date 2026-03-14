import { useEffect, useState } from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { posService } from '@services/pos.service';
import type { PosTerminalListDto, CreatePosTerminalDto, UpdatePosTerminalDto } from '@/types/pos.types';

type OutletTerminalsDialogProps = {
  open: boolean;
  outletId: string;
  outletName: string;
  onClose: () => void;
};

export const OutletTerminalsDialog = ({ open, outletId, outletName, onClose }: OutletTerminalsDialogProps) => {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CreatePosTerminalDto & { id?: string }>({
    outletId: '',
    code: '',
    name: '',
    isActive: true,
  });

  const { data: terminals = [] } = useQuery({
    queryKey: ['pos-settings-terminals', outletId],
    queryFn: () => posService.getSettingsTerminals(outletId),
    enabled: open && !!outletId,
  });

  const createMutation = useMutation({
    mutationFn: (input: CreatePosTerminalDto) => posService.createTerminal(input),
    onSuccess: () => {
      setShowForm(false);
      setForm({ outletId, code: '', name: '', isActive: true });
      void queryClient.invalidateQueries({ queryKey: ['pos-settings-terminals', outletId] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdatePosTerminalDto }) =>
      posService.updateTerminal(id, input),
    onSuccess: () => {
      setShowForm(false);
      setEditingId(null);
      setForm({ outletId, code: '', name: '', isActive: true });
      void queryClient.invalidateQueries({ queryKey: ['pos-settings-terminals', outletId] });
    },
  });

  const startAdd = () => {
    setForm({ outletId, code: '', name: '', isActive: true });
    setEditingId(null);
    setShowForm(true);
  };

  const startEdit = (row: PosTerminalListDto) => {
    setForm({
      outletId,
      code: row.code,
      name: row.name,
      isActive: row.isActive,
    });
    setEditingId(row.id);
    setShowForm(true);
  };

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  return (
    <Dialog open={open} onClose={() => {}} className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50 pointer-events-none" aria-hidden />
      <div className="relative flex min-h-screen items-start justify-center p-4 pt-6 md:pt-10 pointer-events-none">
        <DialogPanel className="w-full max-w-2xl rounded-lg bg-white p-5 shadow-xl dark:bg-gray-800 pointer-events-auto">
          <div className="mb-4 flex items-center justify-between">
            <DialogTitle as="h3" className="text-lg font-semibold text-gray-900 dark:text-white">
              Terminals – {outletName}
            </DialogTitle>
            <button type="button" className="rounded bg-gray-200 px-2 py-1 text-sm dark:bg-gray-700" onClick={onClose}>
              Close
            </button>
          </div>

          <div className="mb-3 flex justify-end">
            <button
              type="button"
              className="rounded bg-primary-600 px-2.5 py-1.5 text-sm text-white hover:bg-primary-700"
              onClick={() => (showForm ? setShowForm(false) : startAdd())}
            >
              {showForm ? 'Cancel' : 'New Terminal'}
            </button>
          </div>

          {showForm ? (
            <div className="mb-4 rounded border p-3 dark:border-gray-700">
              <p className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                {editingId ? 'Edit Terminal' : 'New Terminal'}
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Code</label>
                  <input
                    className="w-full rounded border p-2 dark:bg-gray-700 dark:border-gray-600"
                    value={form.code}
                    onChange={(e) => setForm((s) => ({ ...s, code: e.target.value }))}
                    placeholder="e.g. POS-01"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                  <input
                    className="w-full rounded border p-2 dark:bg-gray-700 dark:border-gray-600"
                    value={form.name}
                    onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                  />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(e) => setForm((s) => ({ ...s, isActive: e.target.checked }))}
                    />
                    Active
                  </label>
                </div>
              </div>
              <button
                type="button"
                className="mt-3 rounded bg-primary-600 px-4 py-2 text-sm text-white hover:bg-primary-700 disabled:opacity-50"
                disabled={
                  (createMutation.isPending || updateMutation.isPending) || !form.code.trim() || !form.name.trim()
                }
                onClick={() => {
                  if (editingId) {
                    updateMutation.mutate({
                      id: editingId,
                      input: { code: form.code, name: form.name, isActive: form.isActive },
                    });
                  } else {
                    createMutation.mutate({ outletId, code: form.code, name: form.name, isActive: form.isActive });
                  }
                }}
              >
                {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save'}
              </button>
            </div>
          ) : null}

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-600 dark:text-gray-400">
                  <th className="p-2">Code</th>
                  <th className="p-2">Name</th>
                  <th className="p-2">Active</th>
                  <th className="p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {terminals.length === 0 ? (
                  <tr>
                    <td className="p-2 text-gray-500" colSpan={4}>
                      No terminals. Add one with New Terminal.
                    </td>
                  </tr>
                ) : (
                  terminals.map((t) => (
                    <tr key={t.id} className="border-b dark:border-gray-700">
                      <td className="p-2">{t.code}</td>
                      <td className="p-2">{t.name}</td>
                      <td className="p-2">{t.isActive ? 'Yes' : 'No'}</td>
                      <td className="p-2">
                        <button
                          type="button"
                          className="rounded bg-slate-600 px-2 py-1 text-white hover:bg-slate-700"
                          onClick={() => startEdit(t)}
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
};
