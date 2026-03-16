import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';
import { resortService } from '@services/resort.service';
import { ReservationStatus } from '@/types/resort.types';
import { notifySuccess } from '@/utils/alerts';
import { AssignRoomDialog } from '../Shared/AssignRoomDialog';
import { AddExtraBedDialog } from '../Shared/AddExtraBedDialog';
import {
  RoomTypeAvailabilitySearch,
  type RoomTypeAvailabilitySearchCriteria,
} from '../Shared/RoomTypeAvailabilitySearch';

const formatDateLocal = (value: Date) => {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
};

const toDateOnly = (value?: string | null) => {
  if (!value) return '';
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : formatDateLocal(date);
};

const formatMoney = (value: number) =>
  value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatDisplayDate = (value?: string | Date | null) => {
  if (!value) return '-';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const getStatusBadgeClass = (status: ReservationStatus) => {
  switch (status) {
    case ReservationStatus.Draft:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    case ReservationStatus.Pending:
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200';
    case ReservationStatus.Confirmed:
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200';
    case ReservationStatus.CheckedIn:
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200';
    case ReservationStatus.NoShow:
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200';
    case ReservationStatus.Cancelled:
      return 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200';
    case ReservationStatus.Completed:
      return 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
  }
};

export const ReservationDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [depositAmount, setDepositAmount] = useState('');
  const [depositPaymentMethodId, setDepositPaymentMethodId] = useState('');
  const [depositPaidDate, setDepositPaidDate] = useState(formatDateLocal(new Date()));
  const [depositReferenceNo, setDepositReferenceNo] = useState('');
  const [isDepositDialogOpen, setIsDepositDialogOpen] = useState(false);
  const [isGuestDialogOpen, setIsGuestDialogOpen] = useState(false);
  const [guestFilter, setGuestFilter] = useState('');
  const [selectedGuestsForAdd, setSelectedGuestsForAdd] = useState<Record<string, string>>({});
  const [guestAgeDrafts, setGuestAgeDrafts] = useState<Record<string, string>>({});
  const guestAgeSaveTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const [showCreateGuest, setShowCreateGuest] = useState(false);
  const [assignDialogReservationRoomId, setAssignDialogReservationRoomId] = useState('');
  const [assignDialogSelectedRoomId, setAssignDialogSelectedRoomId] = useState('');
  const [isAddRoomTypeDialogOpen, setIsAddRoomTypeDialogOpen] = useState(false);
  const [isAddExtraBedDialogOpen, setIsAddExtraBedDialogOpen] = useState(false);
  const [roomTypeFilterIds, setRoomTypeFilterIds] = useState<string[]>([]);
  const [addRoomTypeSearchCriteria, setAddRoomTypeSearchCriteria] = useState<RoomTypeAvailabilitySearchCriteria | null>(null);
  const [selectedRoomTypeAmounts, setSelectedRoomTypeAmounts] = useState<Record<string, number>>({});
  const [addRoomTypeSearchError, setAddRoomTypeSearchError] = useState('');

  const closeGuestDialog = () => {
    setIsGuestDialogOpen(false);
    setGuestFilter('');
    setSelectedGuestsForAdd({});
    setShowCreateGuest(false);
  };

  const closeAddRoomTypeDialog = () => {
    setIsAddRoomTypeDialogOpen(false);
    setRoomTypeFilterIds([]);
    setAddRoomTypeSearchCriteria(null);
    setSelectedRoomTypeAmounts({});
    setAddRoomTypeSearchError('');
  };

  const openAddRoomTypeDialog = () => {
    setIsAddRoomTypeDialogOpen(true);
    setRoomTypeFilterIds(allRoomTypeIds);
    setAddRoomTypeSearchCriteria(null);
    setSelectedRoomTypeAmounts({});
    setAddRoomTypeSearchError('');
  };

  useEffect(() => {
    if (!isDepositDialogOpen && !isGuestDialogOpen && !isAddRoomTypeDialogOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (isAddRoomTypeDialogOpen) {
          closeAddRoomTypeDialog();
        } else if (isGuestDialogOpen) {
          setIsGuestDialogOpen(false);
          setGuestFilter('');
          setSelectedGuestsForAdd({});
          setShowCreateGuest(false);
        } else {
          setIsDepositDialogOpen(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAddRoomTypeDialogOpen, isDepositDialogOpen, isGuestDialogOpen]);

  const [newGuest, setNewGuest] = useState({
    guestCode: `GST${Date.now().toString().slice(-6)}`,
    firstName: '',
    lastName: '',
    middleName: '',
    email: '',
    phone: '',
    nationality: '',
    notes: '',
  });

  const { data: reservationDetail, isLoading } = useQuery({
    queryKey: ['resort-reservation-detail', id],
    queryFn: () => resortService.getReservation(id as string),
    enabled: Boolean(id),
  });

  const { data: paymentMethods } = useQuery({
    queryKey: ['resort-payment-methods'],
    queryFn: () => resortService.getPaymentMethods(),
  });
  const { data: roomTypes } = useQuery({
    queryKey: ['resort-room-types'],
    queryFn: () => resortService.getRoomTypes(),
  });

  const { data: extraBedTypes } = useQuery({
    queryKey: ['resort-extra-bed-types'],
    queryFn: () => resortService.getExtraBedTypes(),
  });

  const { data: roomLookup } = useQuery({
    queryKey: ['resort-rooms-lookup'],
    queryFn: async () => {
      const result = await resortService.getRooms('', 0, 500);
      return result.items;
    },
  });

  const { data: guestLookup, isLoading: isGuestLookupLoading } = useQuery({
    queryKey: ['reservation-guest-search', guestFilter],
    queryFn: () => resortService.getGuests(guestFilter, 0, 50),
    enabled: isGuestDialogOpen,
  });

  const confirmMutation = useMutation({
    mutationFn: resortService.confirmReservation,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['resort-reservations'] });
      void queryClient.invalidateQueries({ queryKey: ['resort-reservation-detail', id] });
      notifySuccess('Reservation confirmed.');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => resortService.cancelReservation(id as string, 'Cancelled from reservation detail'),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['resort-reservations'] });
      void queryClient.invalidateQueries({ queryKey: ['resort-reservation-detail', id] });
      notifySuccess('Reservation cancelled.');
    },
  });

  const setPendingMutation = useMutation({
    mutationFn: () => resortService.setReservationPending(id as string),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['resort-reservations'] });
      void queryClient.invalidateQueries({ queryKey: ['resort-reservation-detail', id] });
      void queryClient.invalidateQueries({ queryKey: ['room-rack-info'] });
      notifySuccess('Reservation set to pending.');
    },
  });

  const noShowMutation = useMutation({
    mutationFn: () => resortService.markReservationNoShow(id as string),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['resort-reservations'] });
      void queryClient.invalidateQueries({ queryKey: ['resort-reservation-detail', id] });
      notifySuccess('Reservation marked as no-show.');
    },
  });

  const recordDepositMutation = useMutation({
    mutationFn: resortService.recordReservationDeposit,
    onSuccess: () => {
      setIsDepositDialogOpen(false);
      setDepositAmount('');
      setDepositPaymentMethodId('');
      setDepositPaidDate(formatDateLocal(new Date()));
      setDepositReferenceNo('');
      void queryClient.invalidateQueries({ queryKey: ['resort-reservations'] });
      void queryClient.invalidateQueries({ queryKey: ['resort-reservation-detail', id] });
      notifySuccess('Deposit added.');
    },
  });

  const addGuestsMutation = useMutation({
    mutationFn: (guestRows: { guestId: string; age: number }[]) => resortService.addReservationGuests(id as string, guestRows),
    onSuccess: () => {
      setIsGuestDialogOpen(false);
      setGuestFilter('');
      setSelectedGuestsForAdd({});
      void queryClient.invalidateQueries({ queryKey: ['resort-reservations'] });
      void queryClient.invalidateQueries({ queryKey: ['resort-reservation-detail', id] });
      notifySuccess('Guest(s) added to reservation.');
    },
  });

  const createGuestMutation = useMutation({
    mutationFn: () => resortService.createGuest(newGuest),
    onSuccess: () => {
      setShowCreateGuest(false);
      setGuestFilter('');
      setNewGuest({
        guestCode: `GST${Date.now().toString().slice(-6)}`,
        firstName: '',
        lastName: '',
        middleName: '',
        email: '',
        phone: '',
        nationality: '',
        notes: '',
      });
      void queryClient.invalidateQueries({ queryKey: ['reservation-guest-search'] });
      notifySuccess('Guest created.');
    },
  });

  const updateGuestAgeMutation = useMutation({
    mutationFn: (input: { reservationGuestId: string; age: number }) =>
      resortService.updateReservationGuestAge(id as string, input.reservationGuestId, input.age),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['resort-reservation-detail', id] });
      notifySuccess('Guest age updated.');
    },
  });

  const removeGuestMutation = useMutation({
    mutationFn: (reservationGuestId: string) => resortService.removeReservationGuest(id as string, reservationGuestId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['resort-reservations'] });
      void queryClient.invalidateQueries({ queryKey: ['resort-reservation-detail', id] });
      notifySuccess('Guest removed from reservation.');
    },
  });

  const removeRoomMutation = useMutation({
    mutationFn: (reservationRoomId: string) => resortService.removeReservationRoom(id as string, reservationRoomId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['resort-reservations'] });
      void queryClient.invalidateQueries({ queryKey: ['resort-reservation-detail', id] });
      void queryClient.invalidateQueries({ queryKey: ['room-rack-info'] });
      void queryClient.invalidateQueries({ queryKey: ['resort-reservation-detail-available-rooms', id] });
      notifySuccess('Room type removed from reservation.');
    },
  });

  const removeExtraBedMutation = useMutation({
    mutationFn: (reservationExtraBedId: string) => resortService.removeReservationExtraBed(id as string, reservationExtraBedId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['resort-reservations'] });
      void queryClient.invalidateQueries({ queryKey: ['resort-reservation-detail', id] });
      notifySuccess('Extra bed removed from reservation.');
    },
  });

  const assignRoomMutation = useMutation({
    mutationFn: resortService.assignReservationRoom,
    onSuccess: () => {
      setAssignDialogReservationRoomId('');
      setAssignDialogSelectedRoomId('');
      void queryClient.invalidateQueries({ queryKey: ['resort-reservation-detail', id] });
      void queryClient.invalidateQueries({ queryKey: ['resort-reservation-detail-available-rooms', id] });
      void queryClient.invalidateQueries({ queryKey: ['resort-rooms-lookup'] });
      notifySuccess('Room assignment updated.');
    },
  });
  const addRoomTypesMutation = useMutation({
    mutationFn: async (input: { roomTypeIds: string[]; amounts: Record<string, number> }) => {
      const roomTypes = input.roomTypeIds.map((roomTypeId) => ({
        roomTypeId,
        quantity: Math.max(1, Math.floor(input.amounts[roomTypeId] ?? 1)),
      }));
      return resortService.addReservationRoomTypes(id as string, roomTypes);
    },
    onSuccess: () => {
      closeAddRoomTypeDialog();
      void queryClient.invalidateQueries({ queryKey: ['resort-reservations'] });
      void queryClient.invalidateQueries({ queryKey: ['resort-reservation-detail', id] });
      notifySuccess('Room type(s) added to reservation.');
    },
  });

  const addExtraBedsMutation = useMutation({
    mutationFn: async (input: { extraBedTypeId: string; quantity: number }) =>
      resortService.addReservationExtraBeds(id as string, [input]),
    onSuccess: () => {
      setIsAddExtraBedDialogOpen(false);
      void queryClient.invalidateQueries({ queryKey: ['resort-reservations'] });
      void queryClient.invalidateQueries({ queryKey: ['resort-reservation-detail', id] });
      notifySuccess('Extra bed added to reservation.');
    },
  });

  const rooms = reservationDetail?.rooms ?? [];
  const extraBeds = reservationDetail?.extraBeds ?? [];
  const guests = reservationDetail?.guests ?? [];
  const deposits = reservationDetail?.deposits ?? [];
  const depositAmountValue = Number(depositAmount || 0);
  const depositBalance = useMemo(() => {
    if (!reservationDetail) return 0;
    return Math.max(0, reservationDetail.depositRequired - reservationDetail.depositPaid);
  }, [reservationDetail]);

  const totalAmountBalance = useMemo(() => {
    if (!reservationDetail) return 0;
    return Math.max(0, reservationDetail.totalAmount - reservationDetail.depositPaid);
  }, [reservationDetail]);

  /** Draft: no assign room, add guest, add deposit. Pending/Confirmed: allow all. */
  const canShowBookingActions = useMemo(() => {
    if (!reservationDetail) return false;
    return ![
      ReservationStatus.Draft,
      ReservationStatus.Cancelled,
      ReservationStatus.NoShow,
      ReservationStatus.CheckedIn,
      ReservationStatus.Completed,
    ].includes(reservationDetail.status);
  }, [reservationDetail]);

  const canAddGuests = canShowBookingActions;

  const existingGuestIds = useMemo(() => new Set(guests.map((g) => g.guestId)), [guests]);

  const selectableGuests = useMemo(
    () => (guestLookup?.items ?? []).filter((g) => !existingGuestIds.has(g.id)),
    [guestLookup?.items, existingGuestIds],
  );

  const roomNumberById = useMemo(() => {
    const map = new Map<string, string>();
    (roomLookup ?? []).forEach((room) => {
      map.set(room.id, room.roomNumber);
    });
    return map;
  }, [roomLookup]);

  const assignDialogRoomLine = useMemo(
    () => reservationDetail?.rooms?.find((room) => room.id === assignDialogReservationRoomId),
    [reservationDetail, assignDialogReservationRoomId],
  );

  const isChangeRoomDialog = useMemo(() => {
    if (!assignDialogReservationRoomId) return false;
    const roomLine = (reservationDetail?.rooms ?? []).find((row) => row.id === assignDialogReservationRoomId);
    return Boolean(roomLine?.roomId);
  }, [assignDialogReservationRoomId, reservationDetail?.rooms]);

  const canAssignRooms = canShowBookingActions;
  const canAddExtraBeds = canShowBookingActions;
  const canAddRoomTypes =
    reservationDetail?.status === ReservationStatus.Draft ||
    reservationDetail?.status === ReservationStatus.Pending;
  const canRemoveRoomTypes = canAddRoomTypes;
  const canRemoveExtraBeds = canAddExtraBeds;
  const addRoomTypeArrivalDate = toDateOnly(reservationDetail?.arrivalDate);
  const addRoomTypeDepartureDate = toDateOnly(reservationDetail?.departureDate);
  const todayDateOnly = formatDateLocal(new Date());
  const isArrivalToday = toDateOnly(reservationDetail?.arrivalDate) === todayDateOnly;
  const canShowCheckInActions =
    reservationDetail?.status === ReservationStatus.Confirmed && isArrivalToday;
  const allRoomTypeIds = useMemo(() => (roomTypes ?? []).map((roomType) => roomType.id), [roomTypes]);
  const selectedRoomTypeIdsForAdd = useMemo(
    () => Object.entries(selectedRoomTypeAmounts).filter(([, amount]) => amount > 0).map(([roomTypeId]) => roomTypeId),
    [selectedRoomTypeAmounts],
  );

  const openAssignRoomDialog = (reservationRoomId: string, currentRoomId?: string) => {
    setAssignDialogReservationRoomId(reservationRoomId);
    setAssignDialogSelectedRoomId(currentRoomId ?? '');
  };

  const closeAssignRoomDialog = () => {
    setAssignDialogReservationRoomId('');
    setAssignDialogSelectedRoomId('');
  };

  useEffect(() => {
    const nextDrafts: Record<string, string> = {};
    guests.forEach((g) => {
      nextDrafts[g.id] = String(g.age ?? 0);
    });
    setGuestAgeDrafts(nextDrafts);
  }, [guests]);

  useEffect(() => {
    return () => {
      Object.values(guestAgeSaveTimersRef.current).forEach((timerId) => clearTimeout(timerId));
    };
  }, []);

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reservation Detail</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Review and manage reservation details.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <button
              type="button"
              className="inline-flex w-full items-center justify-center gap-1 rounded border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 sm:w-auto dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
              onClick={() => navigate('/front-desk/reservations')}
            >
              <ChevronLeftIcon className="h-4 w-4" />
              Back
            </button>
            {reservationDetail?.status === ReservationStatus.Pending ? (
              <>
                <button
                  type="button"
                  className="w-full rounded bg-emerald-600 px-3 py-2 text-sm text-white disabled:opacity-50 sm:w-auto"
                  disabled={confirmMutation.isPending}
                  onClick={() => confirmMutation.mutate(id as string)}
                >
                  Confirm
                </button>
                <button
                  type="button"
                  className="w-full rounded bg-rose-600 px-3 py-2 text-sm text-white disabled:opacity-50 sm:w-auto"
                  disabled={cancelMutation.isPending}
                  onClick={() => cancelMutation.mutate()}
                >
                  Cancel
                </button>
              </>
            ) : null}
            {canShowCheckInActions ? (
              <>
                <button
                  type="button"
                  className="w-full rounded bg-primary-600 px-3 py-2 text-sm text-white sm:w-auto"
                  onClick={() => navigate(`/front-desk/check-in/reservations/${id}`)}
                >
                  Check-In
                </button>
                <button
                  type="button"
                  className="w-full rounded bg-amber-600 px-3 py-2 text-sm text-white disabled:opacity-50 sm:w-auto"
                  disabled={noShowMutation.isPending}
                  onClick={() => noShowMutation.mutate()}
                >
                  No Show
                </button>
              </>
            ) : null}
          </div>
        </div>

        {reservationDetail?.status === ReservationStatus.Draft ? (
          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              className="w-full rounded bg-amber-600 px-3 py-2 text-sm text-white hover:bg-amber-700 disabled:opacity-50 sm:w-auto"
              disabled={setPendingMutation.isPending}
              onClick={() => setPendingMutation.mutate()}
            >
              {setPendingMutation.isPending ? 'Updating…' : 'Make Pending'}
            </button>
            <button
              type="button"
              className="w-full rounded bg-rose-600 px-3 py-2 text-sm text-white hover:bg-rose-700 disabled:opacity-50 sm:w-auto"
              disabled={cancelMutation.isPending}
              onClick={() => cancelMutation.mutate()}
            >
              Cancel
            </button>
          </div>
        ) : null}

        <section className="rounded-lg bg-white p-4 shadow sm:p-5 dark:bg-gray-800">
          {isLoading ? <p className="text-sm text-gray-500">Loading...</p> : null}
          {!isLoading && !reservationDetail ? <p className="text-sm text-rose-600">Reservation not found.</p> : null}

          {/* Add Room Type Dialog */}
          {canAddRoomTypes ? (
            <Dialog open={isAddRoomTypeDialogOpen} onClose={() => {}} className="fixed inset-0 z-50 overflow-y-auto">
              <div className="fixed inset-0 bg-black/50 pointer-events-none" aria-hidden />
              <div className="relative flex min-h-screen items-start justify-center p-4 pt-10 pointer-events-none sm:pt-16">
                <DialogPanel className="pointer-events-auto w-full max-w-5xl rounded-lg bg-white p-5 shadow-xl dark:bg-gray-800">
                  <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-white">Add Room Type</DialogTitle>
                  <div className="mt-4 space-y-4">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div className="rounded border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900/30">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Check-In</p>
                        <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">{addRoomTypeArrivalDate || '-'}</p>
                      </div>
                      <div className="rounded border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900/30">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Check-Out</p>
                        <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">{addRoomTypeDepartureDate || '-'}</p>
                      </div>
                    </div>

                    <RoomTypeAvailabilitySearch
                      roomTypes={roomTypes}
                      arrivalDate={addRoomTypeArrivalDate || undefined}
                      departureDate={addRoomTypeDepartureDate || undefined}
                      reservationId={id}
                      selectedRoomTypeIds={roomTypeFilterIds}
                      onSelectedRoomTypeIdsChange={setRoomTypeFilterIds}
                      selectedAmounts={selectedRoomTypeAmounts}
                      onSelectedAmountsChange={setSelectedRoomTypeAmounts}
                      searchCriteria={addRoomTypeSearchCriteria}
                      onSearch={setAddRoomTypeSearchCriteria}
                      errorMessage={addRoomTypeSearchError}
                      onErrorMessageChange={setAddRoomTypeSearchError}
                    />
                  </div>
                  <div className="mt-4 flex justify-end gap-2">
                    <button
                      type="button"
                      className="rounded border px-3 py-2 text-sm dark:border-gray-600"
                      onClick={closeAddRoomTypeDialog}
                    >
                      Close
                    </button>
                    <button
                      type="button"
                      className="rounded bg-primary-600 px-3 py-2 text-sm text-white hover:bg-primary-700 disabled:opacity-50"
                      disabled={addRoomTypesMutation.isPending || selectedRoomTypeIdsForAdd.length === 0}
                      onClick={() => {
                        addRoomTypesMutation.mutate({
                          roomTypeIds: selectedRoomTypeIdsForAdd,
                          amounts: selectedRoomTypeAmounts,
                        });
                      }}
                    >
                      {addRoomTypesMutation.isPending ? 'Adding...' : 'Add Room Type(s)'}
                    </button>
                  </div>
                </DialogPanel>
              </div>
            </Dialog>
          ) : null}
          {reservationDetail ? (
            <div className="space-y-6 text-sm">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                  <h4 className="text-base font-semibold">Guest Info</h4>
                  <div className="mt-3 space-y-3">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">First Name Lastname</p>
                      <p className="font-semibold">
                        {(reservationDetail.firstName?.trim() || reservationDetail.lastName?.trim())
                          ? `${reservationDetail.firstName?.trim() ?? ''} ${reservationDetail.lastName?.trim() ?? ''}`.trim()
                          : reservationDetail.guestName}
                      </p>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Contact #</p>
                        <p className="font-semibold">{reservationDetail.phone?.trim() ? reservationDetail.phone : '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Email</p>
                        <p className="font-semibold break-all">{reservationDetail.email?.trim() ? reservationDetail.email : '-'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-semibold">Reservation Details</h4>
                    <span className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">{reservationDetail.reservationNo}</span>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${getStatusBadgeClass(reservationDetail.status)}`}>
                      {ReservationStatus[reservationDetail.status]}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Check-In Date & Time</p>
                      <p className="font-semibold">{formatDisplayDate(reservationDetail.arrivalDate)} {new Date(reservationDetail.arrivalDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Check-Out Date & Time</p>
                      <p className="font-semibold">{formatDisplayDate(reservationDetail.departureDate)} {new Date(reservationDetail.departureDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>

                  <p className="mt-3 font-semibold">
                    {reservationDetail.nights} Night{reservationDetail.nights > 1 ? 's' : ''}, {reservationDetail.adults} Adult{reservationDetail.adults > 1 ? 's' : ''} {reservationDetail.children} Children
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h4 className="text-base font-semibold">Rooms</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Manage reserved room types and room assignments.</p>
                  </div>
                  {canAddRoomTypes ? (
                    <button
                      type="button"
                      className="w-full rounded bg-primary-600 px-3 py-1.5 text-sm text-white hover:bg-primary-700 sm:w-auto"
                      onClick={openAddRoomTypeDialog}
                    >
                      Add Room Type
                    </button>
                  ) : null}
                </div>
                {rooms.length === 0 ? (
                  <p className="text-gray-500">No rooms.</p>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                    <table className="min-w-[760px] text-sm sm:min-w-full">
                      <thead>
                        <tr className="border-b text-left">
                          <th className="p-2">Room Type</th>
                          <th className="p-2">Room No.</th>
                          <th className="p-2 text-right">Rate/Night</th>
                          <th className="p-2 text-right">Nights</th>
                          <th className="p-2 text-right">Net Amount</th>
                          <th className="p-2 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rooms.map((room) => (
                          <tr key={room.id} className="border-b">
                            <td className="p-2">{room.roomTypeName}</td>
                            <td className="p-2">{room.roomNumber || (room.roomId ? roomNumberById.get(room.roomId) : undefined) || 'Unassigned'}</td>
                            <td className="p-2 text-right tabular-nums">{formatMoney(room.ratePerNight)}</td>
                            <td className="p-2 text-right tabular-nums">{room.numberOfNights}</td>
                            <td className="p-2 text-right tabular-nums">{formatMoney(room.netAmount)}</td>
                            <td className="p-2 text-right">
                              {canAssignRooms || canRemoveRoomTypes ? (
                                <div className="flex justify-end gap-2">
                                  {canAssignRooms ? (
                                    <button
                                      type="button"
                                      className="rounded bg-primary-600 px-2 py-1 text-xs text-white"
                                      onClick={() => openAssignRoomDialog(room.id, room.roomId)}
                                    >
                                      {room.roomId ? 'Change Room' : 'Assign Room'}
                                    </button>
                                  ) : null}
                                  {canRemoveRoomTypes ? (
                                    <button
                                      type="button"
                                      className="rounded bg-rose-600 px-2 py-1 text-xs text-white disabled:opacity-50"
                                      disabled={removeRoomMutation.isPending}
                                      onClick={() => removeRoomMutation.mutate(room.id)}
                                    >
                                      Remove
                                    </button>
                                  ) : null}
                                </div>
                              ) : (
                                <span className="text-gray-400">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h4 className="text-base font-semibold">Extra Beds</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Add optional extra bed charges for this reservation.</p>
                  </div>
                  {canAddExtraBeds ? (
                    <button
                      type="button"
                      className="w-full rounded bg-primary-600 px-3 py-1.5 text-sm text-white hover:bg-primary-700 disabled:opacity-50 sm:w-auto"
                      disabled={addExtraBedsMutation.isPending}
                      onClick={() => setIsAddExtraBedDialogOpen(true)}
                    >
                      Add Extra Bed
                    </button>
                  ) : null}
                </div>
                {extraBeds.length === 0 ? (
                  <p className="text-gray-500">No extra beds.</p>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                    <table className="min-w-[760px] text-sm sm:min-w-full">
                      <thead>
                        <tr className="border-b text-left">
                          <th className="p-2">Extra Bed Type</th>
                          <th className="p-2 text-right">Quantity</th>
                          <th className="p-2 text-right">Rate/Night</th>
                          <th className="p-2 text-right">Nights</th>
                          <th className="p-2 text-right">Net Amount</th>
                          <th className="p-2 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {extraBeds.map((bed) => (
                          <tr key={bed.id} className="border-b">
                            <td className="p-2">{bed.extraBedTypeName || '-'}</td>
                            <td className="p-2 text-right tabular-nums">{bed.quantity}</td>
                            <td className="p-2 text-right tabular-nums">{formatMoney(bed.ratePerNight)}</td>
                            <td className="p-2 text-right tabular-nums">{bed.numberOfNights}</td>
                            <td className="p-2 text-right tabular-nums">{formatMoney(bed.netAmount)}</td>
                            <td className="p-2 text-right">
                              {canRemoveExtraBeds ? (
                                <button
                                  type="button"
                                  className="rounded bg-rose-600 px-2 py-1 text-xs text-white disabled:opacity-50"
                                  disabled={removeExtraBedMutation.isPending}
                                  onClick={() => removeExtraBedMutation.mutate(bed.id)}
                                >
                                  Remove
                                </button>
                              ) : (
                                <span className="text-gray-400">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              </div>

              <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h4 className="text-base font-semibold">Deposits</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Record payments applied before check-in.</p>
                  </div>
                  {canAddGuests && (
                    <button
                      type="button"
                      className="w-full rounded bg-primary-600 px-3 py-1.5 text-sm text-white sm:w-auto"
                      onClick={() => setIsDepositDialogOpen(true)}
                    >
                      Add Deposit
                    </button>
                  )}
                </div>
                {deposits.length === 0 ? (
                  <p className="text-gray-500">No deposits yet.</p>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                    <table className="min-w-[700px] text-sm sm:min-w-full">
                      <thead>
                        <tr className="border-b text-left">
                          <th className="p-2">Payment Method</th>
                          <th className="p-2 text-right">Amount</th>
                          <th className="p-2">Paid Date</th>
                          <th className="p-2">Reference No</th>
                        </tr>
                      </thead>
                      <tbody>
                        {deposits.map((d) => (
                          <tr key={d.id} className="border-b">
                            <td className="p-2">{d.paymentMethodName}</td>
                            <td className="p-2 text-right tabular-nums">{formatMoney(d.amount)}</td>
                            <td className="p-2">{formatDisplayDate(d.paidDate)}</td>
                            <td className="p-2">{d.referenceNo || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                <h4 className="text-base font-semibold">Notes & Requests</h4>
                <div className="mt-3 space-y-3">
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Notes</p>
                    <p className="font-semibold whitespace-pre-line">{reservationDetail.notes?.trim() ? reservationDetail.notes : '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Reservation Conditions</p>
                    <p className="font-semibold whitespace-pre-line">{reservationDetail.reservationConditions?.trim() ? reservationDetail.reservationConditions : '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Special Requests</p>
                    <p className="font-semibold whitespace-pre-line">{reservationDetail.specialRequests?.trim() ? reservationDetail.specialRequests : '-'}</p>
                  </div>
                </div>
              </div>

              <AddExtraBedDialog
                open={isAddExtraBedDialogOpen}
                extraBedTypes={extraBedTypes ?? []}
                onClose={() => setIsAddExtraBedDialogOpen(false)}
                onAdd={(extraBedTypeId, quantity) => {
                  addExtraBedsMutation.mutate({ extraBedTypeId, quantity });
                }}
              />
            </div>
          ) : null}
        </section>

        {reservationDetail?.status === ReservationStatus.Pending ? (
          <Dialog open={isDepositDialogOpen} onClose={() => {}} className="relative z-50">
            <div className="fixed inset-0 bg-black/50 pointer-events-none" aria-hidden="true" />
            <div className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none">
              <DialogPanel className="w-full max-w-2xl rounded-lg bg-white p-5 shadow-xl dark:bg-gray-800 pointer-events-auto">
                <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-white">Add Deposit</DialogTitle>
                <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Amount</label>
                    <input
                      type="number"
                      min={0.01}
                      step={0.01}
                      className="w-full rounded border p-2 dark:bg-gray-700"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Payment Method</label>
                    <select
                      className="w-full rounded border p-2 dark:bg-gray-700"
                      value={depositPaymentMethodId}
                      onChange={(e) => setDepositPaymentMethodId(e.target.value)}
                    >
                      <option value="">Select payment method</option>
                      {(paymentMethods ?? []).map((method) => (
                        <option key={method.id} value={method.id}>{method.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Paid Date</label>
                    <input
                      type="date"
                      className="w-full rounded border p-2 dark:bg-gray-700"
                      value={depositPaidDate}
                      onChange={(e) => setDepositPaidDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Reference No</label>
                    <input
                      className="w-full rounded border p-2 dark:bg-gray-700"
                      value={depositReferenceNo}
                      onChange={(e) => setDepositReferenceNo(e.target.value)}
                    />
                  </div>
                </div>
                {depositAmountValue > totalAmountBalance ? (
                  <p className="mt-2 text-sm text-rose-600">Deposit amount cannot exceed remaining total amount.</p>
                ) : null}
                <div className="mt-4 flex justify-end gap-2">
                  <button
                    type="button"
                    className="rounded border px-3 py-2 text-sm dark:border-gray-600"
                    onClick={() => setIsDepositDialogOpen(false)}
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    className="rounded bg-primary-600 px-3 py-2 text-sm text-white hover:bg-primary-700 disabled:opacity-50"
                    disabled={
                      recordDepositMutation.isPending ||
                      !reservationDetail ||
                      depositAmountValue <= 0 ||
                      depositAmountValue > totalAmountBalance ||
                      !depositPaymentMethodId ||
                      !depositPaidDate
                    }
                    onClick={() => {
                      if (!reservationDetail) return;
                      recordDepositMutation.mutate({
                        reservationId: reservationDetail.id,
                        amount: Number(depositAmount),
                        paymentMethodId: depositPaymentMethodId,
                        paidDate: depositPaidDate,
                        referenceNo: depositReferenceNo || undefined,
                      });
                    }}
                  >
                    {recordDepositMutation.isPending ? 'Saving...' : 'Record Deposit'}
                  </button>
                </div>
              </DialogPanel>
            </div>
          </Dialog>
        ) : null}

        <Dialog open={isGuestDialogOpen} onClose={() => {}} className="relative z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black/50 pointer-events-none" aria-hidden />
          <div className="relative flex min-h-screen items-center justify-center p-4 pointer-events-none">
              <DialogPanel className="w-full max-w-3xl rounded-lg bg-white p-5 shadow-xl dark:bg-gray-800 pointer-events-auto">
                <div className="mb-4 flex items-center justify-between">
                  <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-white">Search Guests</DialogTitle>
                  <button className="rounded bg-gray-200 px-2 py-1 text-sm dark:bg-gray-700" onClick={closeGuestDialog}>
                    Close
                  </button>
                </div>

                <div className="mb-3 flex items-end gap-2">
                  <div className="w-full">
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Search Guests</label>
                    <input
                      className="w-full rounded border p-2 dark:bg-gray-700"
                      value={guestFilter}
                      onChange={(e) => setGuestFilter(e.target.value)}
                    />
                  </div>
                  <button
                    type="button"
                    className="rounded bg-primary-600 px-3 py-2 text-white hover:bg-primary-700"
                    onClick={() => setShowCreateGuest((prev) => !prev)}
                  >
                    {showCreateGuest ? 'Cancel New Guest' : 'New Guest'}
                  </button>
                </div>

                {showCreateGuest ? (
                  <div className="mb-4 rounded border p-3 dark:border-gray-700">
                    <p className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">Create Guest</p>
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Guest Code</label>
                        <input className="w-full rounded border p-2 dark:bg-gray-700" value={newGuest.guestCode} onChange={(e) => setNewGuest((s) => ({ ...s, guestCode: e.target.value }))} />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">First Name</label>
                        <input className="w-full rounded border p-2 dark:bg-gray-700" value={newGuest.firstName} onChange={(e) => setNewGuest((s) => ({ ...s, firstName: e.target.value }))} />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Last Name</label>
                        <input className="w-full rounded border p-2 dark:bg-gray-700" value={newGuest.lastName} onChange={(e) => setNewGuest((s) => ({ ...s, lastName: e.target.value }))} />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Middle Name</label>
                        <input className="w-full rounded border p-2 dark:bg-gray-700" value={newGuest.middleName} onChange={(e) => setNewGuest((s) => ({ ...s, middleName: e.target.value }))} />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                        <input className="w-full rounded border p-2 dark:bg-gray-700" value={newGuest.email} onChange={(e) => setNewGuest((s) => ({ ...s, email: e.target.value }))} />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Phone</label>
                        <input className="w-full rounded border p-2 dark:bg-gray-700" value={newGuest.phone} onChange={(e) => setNewGuest((s) => ({ ...s, phone: e.target.value }))} />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Nationality</label>
                        <input className="w-full rounded border p-2 dark:bg-gray-700" value={newGuest.nationality} onChange={(e) => setNewGuest((s) => ({ ...s, nationality: e.target.value }))} />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Notes</label>
                        <input className="w-full rounded border p-2 dark:bg-gray-700" value={newGuest.notes} onChange={(e) => setNewGuest((s) => ({ ...s, notes: e.target.value }))} />
                      </div>
                    </div>
                    <button
                      type="button"
                      className="mt-3 rounded bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700 disabled:opacity-50"
                      disabled={createGuestMutation.isPending || !newGuest.guestCode || !newGuest.firstName || !newGuest.lastName}
                      onClick={() => createGuestMutation.mutate()}
                    >
                      {createGuestMutation.isPending ? 'Saving Guest...' : 'Save Guest'}
                    </button>
                  </div>
                ) : null}

                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="p-2">Code</th>
                        <th className="p-2">Name</th>
                        <th className="p-2">Phone</th>
                        <th className="p-2">Email</th>
                        <th className="p-2 text-right">Age</th>
                        <th className="p-2 text-right">Add</th>
                      </tr>
                    </thead>
                    <tbody>
                      {isGuestLookupLoading ? (
                        <tr>
                          <td className="p-2 text-gray-500" colSpan={6}>Loading guests...</td>
                        </tr>
                      ) : selectableGuests.length === 0 ? (
                        <tr>
                          <td className="p-2 text-gray-500" colSpan={6}>No available guests to add.</td>
                        </tr>
                      ) : (
                        selectableGuests.map((guest) => (
                          <tr key={guest.id} className="border-b">
                            <td className="p-2">{guest.guestCode}</td>
                            <td className="p-2">{guest.fullName}</td>
                            <td className="p-2">{guest.phone || '-'}</td>
                            <td className="p-2">{guest.email || '-'}</td>
                            <td className="p-2 text-right">
                              <input
                                type="number"
                                min={0}
                                max={150}
                                className="w-20 rounded border p-1 text-right dark:bg-gray-700"
                                disabled={!Object.prototype.hasOwnProperty.call(selectedGuestsForAdd, guest.id)}
                                value={selectedGuestsForAdd[guest.id] ?? '0'}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  setSelectedGuestsForAdd((prev) => ({ ...prev, [guest.id]: value }));
                                }}
                              />
                            </td>
                            <td className="p-2 text-right">
                              <input
                                type="checkbox"
                                checked={Object.prototype.hasOwnProperty.call(selectedGuestsForAdd, guest.id)}
                                onChange={(e) => {
                                  setSelectedGuestsForAdd((prev) => {
                                    if (e.target.checked) {
                                      return { ...prev, [guest.id]: prev[guest.id] ?? '0' };
                                    }
                                    const next = { ...prev };
                                    delete next[guest.id];
                                    return next;
                                  });
                                }}
                              />
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 flex justify-end gap-2">
                  <button
                    type="button"
                    className="rounded bg-primary-600 px-3 py-2 text-sm text-white hover:bg-primary-700 disabled:opacity-50"
                    disabled={
                      addGuestsMutation.isPending ||
                      Object.keys(selectedGuestsForAdd).length === 0 ||
                      Object.values(selectedGuestsForAdd).some((age) => Number(age || 0) < 0 || Number(age || 0) > 150)
                    }
                    onClick={() => {
                      const rows = Object.entries(selectedGuestsForAdd).map(([guestId, age]) => ({
                        guestId,
                        age: Math.max(0, Number(age || 0)),
                      }));
                      addGuestsMutation.mutate(rows);
                    }}
                  >
                    {addGuestsMutation.isPending ? 'Saving...' : `Add ${Object.keys(selectedGuestsForAdd).length} Guest(s)`}
                  </button>
                </div>
              </DialogPanel>
            </div>
        </Dialog>

        <AssignRoomDialog
          open={Boolean(assignDialogReservationRoomId)}
          isChangeRoom={isChangeRoomDialog}
          roomTypeName={assignDialogRoomLine?.roomTypeName}
          roomTypeId={assignDialogRoomLine?.roomTypeId}
          selectedRoomId={assignDialogSelectedRoomId}
          arrivalDate={assignDialogRoomLine?.arrivalDate}
          departureDate={assignDialogRoomLine?.departureDate}
          reservationId={id}
          excludeRoomIds={(reservationDetail?.rooms ?? [])
            .filter((room) => room.id !== assignDialogReservationRoomId && Boolean(room.roomId))
            .map((room) => room.roomId as string)}
          onSelectRoom={(roomId) => {
            setAssignDialogSelectedRoomId(roomId);
            if (id && assignDialogReservationRoomId) {
              assignRoomMutation.mutate({
                reservationId: id,
                reservationRoomId: assignDialogReservationRoomId,
                roomId,
              });
            }
          }}
          onClose={closeAssignRoomDialog}
        />
      </div>
    </>
  );
};
