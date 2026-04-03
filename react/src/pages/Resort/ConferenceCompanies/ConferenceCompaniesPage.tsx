import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { conferenceCompanyService } from '@services/conference-company.service';
import { ConferenceCompanyDialog } from './ConferenceCompanyDialog';
import type { CreateConferenceCompanyDto, UpdateConferenceCompanyDto } from '@/types/conference.types';

const createEmptyForm = (): CreateConferenceCompanyDto => ({
  name: '',
  contactPerson: '',
  phone: '',
  email: '',
  notes: '',
  isActive: true,
});

export function ConferenceCompaniesPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('');
  const [isCompanyDialogOpen, setIsCompanyDialogOpen] = useState(false);
  const [editingCompanyId, setEditingCompanyId] = useState<string | null>(null);
  const [form, setForm] = useState<CreateConferenceCompanyDto>(createEmptyForm());

  const { data, isLoading } = useQuery({
    queryKey: ['conference-companies', filter],
    queryFn: () => conferenceCompanyService.getConferenceCompanies(filter),
  });

  const createMutation = useMutation({
    mutationFn: conferenceCompanyService.createConferenceCompany,
    onSuccess: () => {
      setIsCompanyDialogOpen(false);
      setForm(createEmptyForm());
      void queryClient.invalidateQueries({ queryKey: ['conference-companies'] });
      void queryClient.invalidateQueries({ queryKey: ['conference-companies-active'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: conferenceCompanyService.updateConferenceCompany,
    onSuccess: () => {
      setIsCompanyDialogOpen(false);
      setEditingCompanyId(null);
      setForm(createEmptyForm());
      void queryClient.invalidateQueries({ queryKey: ['conference-companies'] });
      void queryClient.invalidateQueries({ queryKey: ['conference-companies-active'] });
    },
  });

  const items = useMemo(() => data?.items ?? [], [data]);

  const startEdit = async (id: string) => {
    const company = await conferenceCompanyService.getConferenceCompany(id);
    setEditingCompanyId(id);
    setIsCompanyDialogOpen(true);
    setForm({
      name: company.name,
      contactPerson: company.contactPerson,
      phone: company.phone,
      email: company.email,
      notes: company.notes,
      isActive: company.isActive,
    });
  };

  const handleSubmit = () => {
    if (editingCompanyId) {
      updateMutation.mutate({ id: editingCompanyId, ...form } satisfies UpdateConferenceCompanyDto);
      return;
    }

    createMutation.mutate(form);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Conference Companies</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Maintain company profiles and primary contacts used during event booking.</p>
        </div>
      </div>

      <section className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
        <div>
            <div className="mb-4 flex items-end justify-between gap-3">
              <div className="w-full max-w-sm">
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Search Companies</label>
                <input
                  className="w-full rounded border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  value={filter}
                  onChange={(event) => setFilter(event.target.value)}
                  placeholder="Company, contact, phone, email"
                />
              </div>
              <button
                type="button"
                className="rounded border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                onClick={() => {
                  setIsCompanyDialogOpen(true);
                  setEditingCompanyId(null);
                  setForm(createEmptyForm());
                }}
              >
                New Company
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b text-left dark:border-gray-700">
                    <th className="p-2">Company</th>
                    <th className="p-2">Contact</th>
                    <th className="p-2">Phone</th>
                    <th className="p-2">Email</th>
                    <th className="p-2">Active</th>
                    <th className="p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="p-4 text-center text-gray-500">Loading companies...</td>
                    </tr>
                  ) : items.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-4 text-center text-gray-500">No companies found.</td>
                    </tr>
                  ) : (
                    items.map((company) => (
                      <tr key={company.id} className="border-b dark:border-gray-700">
                        <td className="p-2 font-medium">{company.name}</td>
                        <td className="p-2">{company.contactPerson || '—'}</td>
                        <td className="p-2">{company.phone || '—'}</td>
                        <td className="p-2">{company.email || '—'}</td>
                        <td className="p-2">{company.isActive ? 'Yes' : 'No'}</td>
                        <td className="p-2">
                          <button
                            type="button"
                            className="rounded bg-slate-700 px-2 py-1 text-white hover:bg-slate-800"
                            onClick={() => void startEdit(company.id)}
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
        </div>
      </section>

      <ConferenceCompanyDialog
        isOpen={isCompanyDialogOpen}
        editingCompanyId={editingCompanyId}
        form={form}
        isSaving={createMutation.isPending || updateMutation.isPending}
        onChange={setForm}
        onSubmit={handleSubmit}
        onClose={() => {
          setIsCompanyDialogOpen(false);
          setEditingCompanyId(null);
          setForm(createEmptyForm());
        }}
      />
    </div>
  );
}