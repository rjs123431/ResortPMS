import { useEffect, useState } from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { posService } from '@services/pos.service';
import type { PosTableListDto, CreatePosTableDto, UpdatePosTableDto } from '@/types/pos.types';

type OutletTablesDialogProps = {
  open: boolean;
  outletId: string;
  outletName: string;
  onClose: () => void;
};

export const OutletTablesDialog = ({ open, outletId, outletName, onClose }: OutletTablesDialogProps) => {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CreatePosTableDto>({
    outletId: '',
    tableNumber: '',
    capacity: 2,
  });

  const { data: tables = [] } = useQuery({
    queryKey: ['pos-settings-tables', outletId],
    queryFn: () => posService.getSettingsTables(outletId),
    enabled: open && !!outletId,
  });

  const createMutation = useMutation({
    mutationFn: (input: CreatePosTableDto) => posService.createTable(input),
    onSuccess: () => {
      setShowForm(false);
      setForm({ outletId, tableNumber: '', capacity: 2 });
      void queryClient.invalidateQueries({ queryKey: ['pos-settings-tables', outletId] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdatePosTableDto }) =>
      posService.updateTable(id, input),
    onSuccess: () => {
      setShowForm(false);
      setEditingId(null);
      setForm({ outletId, tableNumber: '', capacity: 2 });
      void queryClient.invalidateQueries({ queryKey: ['pos-settings-tables', outletId] });
    },
  });

  const startAdd = () => {
    setForm({ outletId, tableNumber: '', capacity: 2 });
    setEditingId(null);
    setShowForm(true);
  };

  const startEdit = (row: PosTableListDto) => {
    setForm({
      outletId,
      tableNumber: row.tableNumber,
      capacity: row.capacity,
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
              Tables – {outletName}
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
              {showForm ? 'Cancel' : 'New Table'}
            </button>
          </div>

          {showForm ? (
            <div className="mb-4 rounded border p-3 dark:border-gray-700">
              <p className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                {editingId ? 'Edit Table' : 'New Table'}
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Table number</label>
                  <input
                    className="w-full rounded border p-2 dark:bg-gray-700 dark:border-gray-600"
                    value={form.tableNumber}
                    onChange={(e) => setForm((s) => ({ ...s, tableNumber: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Capacity</label>
                  <input
                    type="number"
                    min={1}
                    max={99}
                    className="w-full rounded border p-2 dark:bg-gray-700 dark:border-gray-600"
                    value={form.capacity}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, capacity: Math.max(1, parseInt(e.target.value, 10) || 1) }))
                    }
                  />
                </div>
              </div>
              <button
                type="button"
                className="mt-3 rounded bg-primary-600 px-4 py-2 text-sm text-white hover:bg-primary-700 disabled:opacity-50"
                disabled={(createMutation.isPending || updateMutation.isPending) || !form.tableNumber.trim()}
                onClick={() => {
                  if (editingId) {
                    updateMutation.mutate({
                      id: editingId,
                      input: { tableNumber: form.tableNumber, capacity: form.capacity },
                    });
                  } else {
                    createMutation.mutate({ outletId, tableNumber: form.tableNumber, capacity: form.capacity });
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
                  <th className="p-2">Table #</th>
                  <th className="p-2">Capacity</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tables.length === 0 ? (
                  <tr>
                    <td className="p-2 text-gray-500" colSpan={4}>
                      No tables. Add one with New Table.
                    </td>
                  </tr>
                ) : (
                  tables.map((t) => (
                    <tr key={t.id} className="border-b dark:border-gray-700">
                      <td className="p-2">{t.tableNumber}</td>
                      <td className="p-2">{t.capacity}</td>
                      <td className="p-2">
                        {t.status === 0 ? 'Available' : t.status === 1 ? 'Occupied' : String(t.status)}
                      </td>
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
