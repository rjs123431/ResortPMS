import { useEffect } from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { GuestDto } from '@/types/resort.types';
import { guestFormSchema, type GuestFormValues } from '@/lib/resortSchemas';

type GuestDialogFormProps = {
  isOpen: boolean;
  editingId: string | null;
  form: GuestDto;
  canCreate: boolean;
  canEdit: boolean;
  isSaving: boolean;
  onClose: () => void;
  onSave: (values: GuestFormValues) => void;
};

export const GuestDialogForm = ({
  isOpen,
  editingId,
  form,
  canCreate,
  canEdit,
  isSaving,
  onClose,
  onSave,
}: GuestDialogFormProps) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<GuestFormValues>({
    resolver: zodResolver(guestFormSchema),
    mode: 'onChange',
    defaultValues: {
      id: form.id,
      guestCode: form.guestCode ?? '',
      firstName: form.firstName ?? '',
      lastName: form.lastName ?? '',
      middleName: form.middleName ?? '',
      email: form.email ?? '',
      phone: form.phone ?? '',
      nationality: form.nationality ?? '',
      notes: form.notes ?? '',
      isActive: form.isActive ?? true,
    },
  });

  useEffect(() => {
    if (!isOpen) return;
    reset({
      id: form.id,
      guestCode: form.guestCode ?? '',
      firstName: form.firstName ?? '',
      lastName: form.lastName ?? '',
      middleName: form.middleName ?? '',
      email: form.email ?? '',
      phone: form.phone ?? '',
      nationality: form.nationality ?? '',
      notes: form.notes ?? '',
      isActive: form.isActive ?? true,
    });
  }, [form, isOpen, reset]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <Dialog open={isOpen} onClose={() => {}} className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50 pointer-events-none" aria-hidden />
      <div className="relative flex min-h-screen items-center justify-center p-4 pointer-events-none">
        <DialogPanel className="w-full max-w-2xl rounded-lg bg-white p-5 shadow-xl dark:bg-gray-800 pointer-events-auto">
          <div className="mb-4 flex items-center justify-between">
            <DialogTitle as="h3" className="text-lg font-semibold">
              {editingId ? 'Edit Guest' : 'New Guest'}
            </DialogTitle>
            <button className="rounded bg-gray-200 px-2 py-1 text-sm dark:bg-gray-700" onClick={onClose}>
              Close
            </button>
          </div>

          <form onSubmit={handleSubmit(onSave)}>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Guest Code</label>
              <input className="w-full rounded border p-2 dark:bg-gray-700" {...register('guestCode')} />
              {errors.guestCode ? <p className="mt-1 text-xs text-red-600">{errors.guestCode.message}</p> : null}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">First Name</label>
              <input className="w-full rounded border p-2 dark:bg-gray-700" {...register('firstName')} />
              {errors.firstName ? <p className="mt-1 text-xs text-red-600">{errors.firstName.message}</p> : null}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Last Name</label>
              <input className="w-full rounded border p-2 dark:bg-gray-700" {...register('lastName')} />
              {errors.lastName ? <p className="mt-1 text-xs text-red-600">{errors.lastName.message}</p> : null}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
              <input className="w-full rounded border p-2 dark:bg-gray-700" {...register('email')} />
              {errors.email ? <p className="mt-1 text-xs text-red-600">{errors.email.message}</p> : null}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Phone</label>
              <input className="w-full rounded border p-2 dark:bg-gray-700" {...register('phone')} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Nationality</label>
              <input className="w-full rounded border p-2 dark:bg-gray-700" {...register('nationality')} />
            </div>
          </div>
          <div className="mt-3">
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Notes</label>
            <textarea className="w-full rounded border p-2 dark:bg-gray-700" {...register('notes')} />
          </div>
          {editingId ? (
            <label className="mt-3 flex items-center gap-2 text-sm">
              <input type="checkbox" {...register('isActive')} />
              Active
            </label>
          ) : null}
          <button
            type="submit"
            className="mt-3 rounded bg-primary-600 px-4 py-2 text-white hover:bg-primary-700 disabled:opacity-50"
            disabled={isSaving || !isValid || (editingId ? !canEdit : !canCreate)}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
          </form>
        </DialogPanel>
      </div>
    </Dialog>
  );
};
