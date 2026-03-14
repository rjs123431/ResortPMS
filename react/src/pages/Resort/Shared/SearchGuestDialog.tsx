import { useEffect, useState } from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { resortService } from '@services/resort.service';

export type SelectedGuest = {
    id: string;
    guestCode: string;
    fullName: string;
    email?: string;
    phone?: string;
    nationality?: string;
};

type SearchGuestDialogProps = {
    open: boolean;
    onClose: () => void;
    onSelectGuest: (guest: SelectedGuest) => void;
};

export const SearchGuestDialog = ({ open, onClose, onSelectGuest }: SearchGuestDialogProps) => {
    const queryClient = useQueryClient();
    const [guestFilter, setGuestFilter] = useState('');
    const [showCreateGuest, setShowCreateGuest] = useState(false);
    const [newGuest, setNewGuest] = useState({
        firstName: '',
        lastName: '',
        middleName: '',
        email: '',
        phone: '',
        nationality: '',
        notes: '',
    });

    const { data: guestsData, isLoading: guestsLoading } = useQuery({
        queryKey: ['reservation-guest-search', guestFilter],
        queryFn: () => resortService.getGuests(guestFilter, 0, 20),
        enabled: open,
    });

    const createGuestMutation = useMutation({
        mutationFn: resortService.createGuest,
        onSuccess: (newGuestId, payload) => {
            onSelectGuest({
                id: newGuestId,
                guestCode: payload.guestCode,
                fullName: `${newGuest.firstName} ${newGuest.lastName}`.trim(),
                email: newGuest.email || undefined,
                phone: newGuest.phone || undefined,
                nationality: newGuest.nationality || undefined,
            });
            setShowCreateGuest(false);
            setGuestFilter('');
            setNewGuest({
                firstName: '',
                lastName: '',
                middleName: '',
                email: '',
                phone: '',
                nationality: '',
                notes: '',
            });
            void queryClient.invalidateQueries({ queryKey: ['reservation-guest-search'] });
            void queryClient.invalidateQueries({ queryKey: ['resort-guests'] });
            onClose();
        },
    });

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
            <div className="fixed inset-0 bg-black/50" aria-hidden />
            <div className="flex min-h-screen items-start justify-center p-4 pt-6 md:pt-10">
                <DialogPanel className="w-full max-w-3xl rounded-lg bg-white p-5 shadow-xl dark:bg-gray-800">
                    <div className="mb-4 flex items-center justify-between">
                        <DialogTitle as="h3" className="text-lg font-semibold">Search Guests</DialogTitle>
                        <button
                            className="rounded bg-gray-200 px-2 py-1 text-sm dark:bg-gray-700"
                            onClick={onClose}
                        >
                            x
                        </button>
                    </div>

                    <div className="mb-3">
                        <div className="mb-2 flex justify-end">
                            <button
                                type="button"
                                className="rounded bg-primary-600 px-2.5 py-1.5 text-sm text-white hover:bg-primary-700"
                                onClick={() => setShowCreateGuest((prev) => !prev)}
                            >
                                {showCreateGuest ? 'Cancel New Guest' : 'New Guest'}
                            </button>
                        </div>
                    </div>

                    {showCreateGuest ? (
                        <div className="mb-4 rounded border p-3 dark:border-gray-700">
                            <p className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">Create Guest</p>
                            <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Last Name *</label>
                                    <input className="w-full rounded border p-2 dark:bg-gray-700" value={newGuest.lastName} onChange={(e) => setNewGuest((s) => ({ ...s, lastName: e.target.value }))} />
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">First Name *</label>
                                    <input className="w-full rounded border p-2 dark:bg-gray-700" value={newGuest.firstName} onChange={(e) => setNewGuest((s) => ({ ...s, firstName: e.target.value }))} />
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Middle Name</label>
                                    <input className="w-full rounded border p-2 dark:bg-gray-700" value={newGuest.middleName} onChange={(e) => setNewGuest((s) => ({ ...s, middleName: e.target.value }))} />
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Contact Number *</label>
                                    <input className="w-full rounded border p-2 dark:bg-gray-700" value={newGuest.phone} onChange={(e) => setNewGuest((s) => ({ ...s, phone: e.target.value }))} />
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                                    <input className="w-full rounded border p-2 dark:bg-gray-700" value={newGuest.email} onChange={(e) => setNewGuest((s) => ({ ...s, email: e.target.value }))} />
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Nationality</label>
                                    <input className="w-full rounded border p-2 dark:bg-gray-700" value={newGuest.nationality} onChange={(e) => setNewGuest((s) => ({ ...s, nationality: e.target.value }))} />
                                </div>
                                <div className="md:col-span-3">
                                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Remarks</label>
                                    <textarea
                                        rows={3}
                                        className="w-full rounded border p-2 dark:bg-gray-700"
                                        value={newGuest.notes}
                                        onChange={(e) => setNewGuest((s) => ({ ...s, notes: e.target.value }))}
                                    />
                                </div>
                            </div>
                            <button
                                type="button"
                                className="mt-3 rounded bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700 disabled:opacity-50"
                                disabled={
                                    createGuestMutation.isPending ||
                                    !newGuest.firstName.trim() ||
                                    !newGuest.lastName.trim() ||
                                    !newGuest.phone.trim()
                                }
                                onClick={() =>
                                    createGuestMutation.mutate({
                                        ...newGuest,
                                        guestCode: `GST${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 10)}`,
                                    })
                                }
                            >
                                {createGuestMutation.isPending ? 'Saving Guest...' : 'Save Guest'}
                            </button>
                        </div>
                    ) : null}
                    {!showCreateGuest ? (
                        <>
                            <div className="mb-4">
                                <input
                                    className="w-full rounded border p-2 dark:bg-gray-700"
                                    value={guestFilter}
                                    onChange={(e) => setGuestFilter(e.target.value)}
                                    placeholder='Search...'
                                />
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-sm">
                                    <thead>
                                        <tr className="border-b text-left">
                                            <th className="p-2">Name</th>
                                            <th className="p-2">Phone</th>
                                            <th className="p-2">Email</th>
                                            <th className="p-2">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {guestsLoading ? (
                                            <tr>
                                                <td className="p-2 text-gray-500" colSpan={4}>Loading guests...</td>
                                            </tr>
                                        ) : (guestsData?.items ?? []).length === 0 ? (
                                            <tr>
                                                <td className="p-2 text-gray-500" colSpan={4}>No guests found.</td>
                                            </tr>
                                        ) : (
                                            (guestsData?.items ?? []).map((guest) => (
                                                <tr key={guest.id} className="border-b">
                                                    <td className="p-2">{guest.fullName}</td>
                                                    <td className="p-2">{guest.phone || '-'}</td>
                                                    <td className="p-2">{guest.email || '-'}</td>
                                                    <td className="p-2">
                                                        <button
                                                            type="button"
                                                            className="rounded bg-primary-600 px-2 py-1 text-white hover:bg-primary-700"
                                                            onClick={() => {
                                                                onSelectGuest({
                                                                    id: guest.id,
                                                                    guestCode: guest.guestCode,
                                                                    fullName: guest.fullName,
                                                                    phone: guest.phone || undefined,
                                                                    email: guest.email || undefined,
                                                                    nationality: guest.nationality || undefined,
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
};
