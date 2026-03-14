import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { POSLayout } from '@components/layout/POSLayout';
import { POSSidebar } from '@components/layout/POSSidebar';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { posService } from '@services/pos.service';
import { resortService } from '@services/resort.service';
import type { PosOutletListDto, CreatePosOutletDto } from '@/types/pos.types';
import {
  OutletDialogForm,
  defaultOutletForm,
  outletToForm,
} from './OutletDialogForm';
import { OutletTerminalsDialog } from './OutletTerminalsDialog';
import { OutletTablesDialog } from './OutletTablesDialog';

const outletQueryKey = ['pos-settings-outlets'];

export const PosOutletsPage = () => {
  const queryClient = useQueryClient();
  const [showOutletDialog, setShowOutletDialog] = useState(false);
  const [editingOutletId, setEditingOutletId] = useState<string | null>(null);
  const [outletForm, setOutletForm] = useState(defaultOutletForm());

  const [terminalsDialog, setTerminalsDialog] = useState<{ outletId: string; outletName: string } | null>(null);
  const [tablesDialog, setTablesDialog] = useState<{ outletId: string; outletName: string } | null>(null);

  const { data: outlets = [] } = useQuery({
    queryKey: outletQueryKey,
    queryFn: () => posService.getSettingsOutlets(),
  });

  const { data: chargeTypes = [] } = useQuery({
    queryKey: ['resort-charge-types'],
    queryFn: () => resortService.getChargeTypes(),
  });
  const chargeTypeOptions = chargeTypes.map((ct) => ({ id: ct.id, name: ct.name }));

  const createOutletMutation = useMutation({
    mutationFn: (input: CreatePosOutletDto) => posService.createOutlet(input),
    onSuccess: () => {
      setShowOutletDialog(false);
      setEditingOutletId(null);
      void queryClient.invalidateQueries({ queryKey: outletQueryKey });
    },
  });

  const updateOutletMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: CreatePosOutletDto }) =>
      posService.updateOutlet(id, input),
    onSuccess: () => {
      setShowOutletDialog(false);
      setEditingOutletId(null);
      void queryClient.invalidateQueries({ queryKey: outletQueryKey });
    },
  });

  const openEditOutlet = async (row: PosOutletListDto) => {
    const dto = await posService.getSettingsOutlet(row.id);
    setOutletForm(outletToForm(dto));
    setEditingOutletId(row.id);
    setShowOutletDialog(true);
  };

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
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Outlets</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Manage outlets, terminals, and tables.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="rounded bg-primary-600 px-4 py-2 text-sm text-white hover:bg-primary-700"
            onClick={() => {
              setOutletForm(defaultOutletForm());
              setEditingOutletId(null);
              setShowOutletDialog(true);
            }}
          >
            New Outlet
          </button>
        </div>

        <section className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-600 dark:text-gray-400">
                  <th className="p-2">Name</th>
                  <th className="p-2">Location</th>
                  <th className="p-2">Kitchen</th>
                  <th className="p-2">Active</th>
                  <th className="p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {outlets.map((o) => (
                  <tr key={o.id} className="border-b dark:border-gray-700">
                    <td className="p-2">{o.name}</td>
                    <td className="p-2">{o.location}</td>
                    <td className="p-2">{o.hasKitchen ? 'Yes' : 'No'}</td>
                    <td className="p-2">{o.isActive ? 'Yes' : 'No'}</td>
                    <td className="p-2">
                      <div className="flex flex-wrap gap-1">
                        <button
                          type="button"
                          className="rounded bg-slate-600 px-2 py-1 text-white hover:bg-slate-700"
                          onClick={() => void openEditOutlet(o)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="rounded bg-indigo-600 px-2 py-1 text-white hover:bg-indigo-700"
                          onClick={() => setTerminalsDialog({ outletId: o.id, outletName: o.name })}
                        >
                          Terminals
                        </button>
                        <button
                          type="button"
                          className="rounded bg-emerald-600 px-2 py-1 text-white hover:bg-emerald-700"
                          onClick={() => setTablesDialog({ outletId: o.id, outletName: o.name })}
                        >
                          Tables
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <OutletDialogForm
        isOpen={showOutletDialog}
        editingId={editingOutletId}
        form={outletForm}
        chargeTypeOptions={chargeTypeOptions}
        isSaving={createOutletMutation.isPending || updateOutletMutation.isPending}
        onClose={() => {
          setShowOutletDialog(false);
          setEditingOutletId(null);
        }}
        onFormChange={setOutletForm}
        onSave={() => {
          if (editingOutletId) {
            updateOutletMutation.mutate({ id: editingOutletId, input: outletForm });
          } else {
            createOutletMutation.mutate(outletForm);
          }
        }}
      />

      {terminalsDialog ? (
        <OutletTerminalsDialog
          open
          outletId={terminalsDialog.outletId}
          outletName={terminalsDialog.outletName}
          onClose={() => setTerminalsDialog(null)}
        />
      ) : null}

      {tablesDialog ? (
        <OutletTablesDialog
          open
          outletId={tablesDialog.outletId}
          outletName={tablesDialog.outletName}
          onClose={() => setTablesDialog(null)}
        />
      ) : null}
    </POSLayout>
  );
};
