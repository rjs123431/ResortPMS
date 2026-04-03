import { useEffect, useState } from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { conferenceCompanyService } from '@services/conference-company.service';
import { AbpFieldValidationMessage } from '@components/common/AbpFieldValidationMessage';
import { getAbpErrorMessage } from '@utils/abpValidation';

export type SelectedConferenceCompany = {
  id: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
};

type SearchConferenceCompanyDialogProps = {
  open: boolean;
  onClose: () => void;
  onSelectCompany: (company: SelectedConferenceCompany) => void;
};

const createEmptyCompany = () => ({
  name: '',
  contactPerson: '',
  phone: '',
  email: '',
  notes: '',
  isActive: true,
});

export function SearchConferenceCompanyDialog({
  open,
  onClose,
  onSelectCompany,
}: SearchConferenceCompanyDialogProps) {
  const queryClient = useQueryClient();
  const [companyFilter, setCompanyFilter] = useState('');
  const [showCreateCompany, setShowCreateCompany] = useState(false);
  const [createCompanyError, setCreateCompanyError] = useState('');
  const [newCompany, setNewCompany] = useState(createEmptyCompany());

  const { data: companiesData, isLoading: companiesLoading } = useQuery({
    queryKey: ['conference-company-search', companyFilter],
    queryFn: () => conferenceCompanyService.getConferenceCompanies(companyFilter),
    enabled: open,
  });

  const createCompanyMutation = useMutation({
    mutationFn: conferenceCompanyService.createConferenceCompany,
    onMutate: () => {
      setCreateCompanyError('');
    },
    onSuccess: (companyId) => {
      onSelectCompany({
        id: companyId,
        name: newCompany.name.trim(),
        contactPerson: newCompany.contactPerson.trim() || undefined,
        phone: newCompany.phone.trim() || undefined,
        email: newCompany.email.trim() || undefined,
      });
      setShowCreateCompany(false);
      setCreateCompanyError('');
      setCompanyFilter('');
      setNewCompany(createEmptyCompany());
      void queryClient.invalidateQueries({ queryKey: ['conference-company-search'] });
      void queryClient.invalidateQueries({ queryKey: ['conference-companies'] });
      void queryClient.invalidateQueries({ queryKey: ['conference-companies-active'] });
      onClose();
    },
    onError: (error) => {
      setCreateCompanyError(getAbpErrorMessage(error));
    },
  });

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (open) return;

    setCompanyFilter('');
    setShowCreateCompany(false);
    setCreateCompanyError('');
    setNewCompany(createEmptyCompany());
  }, [open]);

  return (
    <Dialog open={open} onClose={() => {}} className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50 pointer-events-none" aria-hidden />
      <div className="relative flex min-h-screen items-start justify-center p-4 pt-6 md:pt-10 pointer-events-none">
        <DialogPanel className="w-full max-w-3xl rounded-lg bg-white p-5 shadow-xl dark:bg-gray-800 pointer-events-auto">
          <div className="mb-4 flex items-center justify-between">
            <DialogTitle as="h3" className="text-lg font-semibold">Search Companies</DialogTitle>
            <button className="rounded bg-gray-200 px-2 py-1 text-sm dark:bg-gray-700" onClick={onClose}>
              x
            </button>
          </div>

          <div className="mb-3">
            <div className="mb-2 flex justify-end">
              <button
                type="button"
                className="rounded bg-primary-600 px-2.5 py-1.5 text-sm text-white hover:bg-primary-700"
                onClick={() => {
                  setCreateCompanyError('');
                  setShowCreateCompany((current) => !current);
                }}
              >
                {showCreateCompany ? 'Cancel New Company' : 'New Company'}
              </button>
            </div>
          </div>

          {showCreateCompany ? (
            <div className="mb-4 rounded border p-3 dark:border-gray-700">
              <p className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">Create Company</p>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Company Name *</label>
                  <input className="w-full rounded border p-2 dark:bg-gray-700" value={newCompany.name} onChange={(event) => setNewCompany((current) => ({ ...current, name: event.target.value }))} />
                  <AbpFieldValidationMessage error={createCompanyMutation.error} member="name" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Contact Person</label>
                  <input className="w-full rounded border p-2 dark:bg-gray-700" value={newCompany.contactPerson} onChange={(event) => setNewCompany((current) => ({ ...current, contactPerson: event.target.value }))} />
                  <AbpFieldValidationMessage error={createCompanyMutation.error} member="contactPerson" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Phone</label>
                  <input className="w-full rounded border p-2 dark:bg-gray-700" value={newCompany.phone} onChange={(event) => setNewCompany((current) => ({ ...current, phone: event.target.value }))} />
                  <AbpFieldValidationMessage error={createCompanyMutation.error} member="phone" />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                  <input className="w-full rounded border p-2 dark:bg-gray-700" value={newCompany.email} onChange={(event) => setNewCompany((current) => ({ ...current, email: event.target.value }))} />
                  <AbpFieldValidationMessage error={createCompanyMutation.error} member="email" />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Remarks</label>
                  <textarea
                    rows={3}
                    className="w-full rounded border p-2 dark:bg-gray-700"
                    value={newCompany.notes}
                    onChange={(event) => setNewCompany((current) => ({ ...current, notes: event.target.value }))}
                  />
                  <AbpFieldValidationMessage error={createCompanyMutation.error} member="notes" />
                </div>
              </div>
              {createCompanyError ? <p className="mt-2 text-sm text-rose-600">{createCompanyError}</p> : null}
              <button
                type="button"
                className="mt-3 rounded bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700 disabled:opacity-50"
                disabled={createCompanyMutation.isPending || !newCompany.name.trim()}
                onClick={() => createCompanyMutation.mutate(newCompany)}
              >
                {createCompanyMutation.isPending ? 'Saving Company...' : 'Save Company'}
              </button>
            </div>
          ) : null}

          {!showCreateCompany ? (
            <>
              <div className="mb-4">
                <input
                  className="w-full rounded border p-2 dark:bg-gray-700"
                  value={companyFilter}
                  onChange={(event) => setCompanyFilter(event.target.value)}
                  placeholder="Search company, contact, phone, email"
                />
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="p-2">Company</th>
                      <th className="p-2">Contact</th>
                      <th className="p-2">Phone</th>
                      <th className="p-2">Email</th>
                      <th className="p-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {companiesLoading ? (
                      <tr>
                        <td className="p-2 text-gray-500" colSpan={5}>Loading companies...</td>
                      </tr>
                    ) : (companiesData?.items ?? []).length === 0 ? (
                      <tr>
                        <td className="p-2 text-gray-500" colSpan={5}>No companies found.</td>
                      </tr>
                    ) : (
                      (companiesData?.items ?? []).map((company) => (
                        <tr key={company.id} className="border-b">
                          <td className="p-2 font-medium">{company.name}</td>
                          <td className="p-2">{company.contactPerson || '-'}</td>
                          <td className="p-2">{company.phone || '-'}</td>
                          <td className="p-2">{company.email || '-'}</td>
                          <td className="p-2">
                            <button
                              type="button"
                              className="rounded bg-primary-600 px-2 py-1 text-white hover:bg-primary-700"
                              onClick={() => {
                                onSelectCompany({
                                  id: company.id,
                                  name: company.name,
                                  contactPerson: company.contactPerson || undefined,
                                  phone: company.phone || undefined,
                                  email: company.email || undefined,
                                });
                                onClose();
                              }}
                            >
                              Select
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          ) : null}
        </DialogPanel>
      </div>
    </Dialog>
  );
}