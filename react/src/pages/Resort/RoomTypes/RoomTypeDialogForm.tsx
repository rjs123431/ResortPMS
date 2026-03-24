import { useEffect } from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { RoomTypeDto } from '@/types/resort.types';
import { roomTypeFormSchema, type RoomTypeFormValues } from '@/lib/resortSchemas';

export type RoomTypeForm = RoomTypeDto & {
  plainDescription: string;
  bedTypeSummary: string;
  featureTagsText: string;
  amenityItemsText: string;
};

type RoomTypeDialogFormProps = {
  isOpen: boolean;
  editingId: string | null;
  form: RoomTypeForm;
  canCreate: boolean;
  canEdit: boolean;
  isSaving: boolean;
  onClose: () => void;
  onSave: (values: RoomTypeFormValues) => void;
};

export const RoomTypeDialogForm = ({
  isOpen,
  editingId,
  form,
  canCreate,
  canEdit,
  isSaving,
  onClose,
  onSave,
}: RoomTypeDialogFormProps) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<RoomTypeFormValues>({
    resolver: zodResolver(roomTypeFormSchema),
    mode: 'onChange',
    defaultValues: {
      ...form,
      maxAdults: form.maxAdults ?? 1,
      maxChildren: form.maxChildren ?? 0,
    },
  });

  useEffect(() => {
    if (!isOpen) return;
    reset({
      ...form,
      maxAdults: form.maxAdults ?? 1,
      maxChildren: form.maxChildren ?? 0,
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
              {editingId ? 'Edit Room Type' : 'New Room Type'}
            </DialogTitle>
            <button className="rounded bg-gray-200 px-2 py-1 text-sm dark:bg-gray-700" onClick={onClose}>
              Close
            </button>
          </div>

          <form onSubmit={handleSubmit(onSave)}>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Room Type Name</label>
              <input className="w-full rounded border p-2 dark:bg-gray-700" {...register('name')} />
              {errors.name ? <p className="mt-1 text-xs text-red-600">{errors.name.message}</p> : null}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Maximum Adults</label>
              <input
                className="w-full rounded border p-2 dark:bg-gray-700"
                type="number"
                min={1}
                {...register('maxAdults', { valueAsNumber: true })}
              />
              {errors.maxAdults ? <p className="mt-1 text-xs text-red-600">{errors.maxAdults.message}</p> : null}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Maximum Children</label>
              <input
                className="w-full rounded border p-2 dark:bg-gray-700"
                type="number"
                min={0}
                {...register('maxChildren', { valueAsNumber: true })}
              />
              {errors.maxChildren ? <p className="mt-1 text-xs text-red-600">{errors.maxChildren.message}</p> : null}
            </div>
          </div>
          <div className="mt-3">
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Bed Configuration</label>
            <input
              className="w-full rounded border p-2 dark:bg-gray-700"
              {...register('bedTypeSummary')}
            />
            {errors.bedTypeSummary ? <p className="mt-1 text-xs text-red-600">{errors.bedTypeSummary.message}</p> : null}
          </div>
          <div className="mt-3">
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Room Feature Tags</label>
            <textarea
              className="w-full rounded border p-2 dark:bg-gray-700"
              {...register('featureTagsText')}
            />
            {errors.featureTagsText ? <p className="mt-1 text-xs text-red-600">{errors.featureTagsText.message}</p> : null}
          </div>
          <div className="mt-3">
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Room Amenities</label>
            <textarea
              className="w-full rounded border p-2 dark:bg-gray-700"
              {...register('amenityItemsText')}
            />
            {errors.amenityItemsText ? <p className="mt-1 text-xs text-red-600">{errors.amenityItemsText.message}</p> : null}
          </div>
          <div className="mt-3">
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Room Type Description</label>
            <textarea
              className="w-full rounded border p-2 dark:bg-gray-700"
              {...register('plainDescription')}
            />
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
