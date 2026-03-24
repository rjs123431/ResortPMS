import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import Swal from 'sweetalert2';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { resortService } from '@services/resort.service';
import {
  ReservationStatus,
  type ReservationDetailDto,
  type ReservationDepositDto,
  type ReservationRoomDetailDto,
} from '@/types/resort.types';
import { confirmAction, notifySuccess } from '@/utils/alerts';
import { AssignRoomDialog } from '../Shared/AssignRoomDialog';
import { AddExtraBedDialog } from '../Shared/AddExtraBedDialog';
import { SearchGuestDialog, type SelectedGuest } from '../Shared/SearchGuestDialog';
import {
  RoomTypeAvailabilitySearch,
  type RoomTypeAvailabilityRow,
  type RoomTypeAvailabilitySearchCriteria,
} from '../Shared/RoomTypeAvailabilitySearch';

const formatDateLocal = (value: Date) => {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
};

const parseDateOnly = (value: string) => {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const toDateOnly = (value?: string | null) => {
  if (!value) return '';
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : formatDateLocal(date);
};

const formatMoney = (value?: number | null) => {
  const safeValue = Number.isFinite(value) ? (value as number) : 0;
  return safeValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

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

const formatDisplayTime = (value?: string | Date | null) => {
  if (!value) return '-';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
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

const TEMP_ROOM_PREFIX = 'temp-room-';
const TEMP_EXTRA_BED_PREFIX = 'temp-extra-bed-';
const TEMP_DEPOSIT_PREFIX = 'temp-deposit-';

const createTempId = (prefix: string) => `${prefix}${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const ReservationDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const from = new URLSearchParams(location.search).get('from');
  const backPath = from === 'fd-dashboard' ? '/front-desk' : '/front-desk/reservations';
  const [depositAmount, setDepositAmount] = useState('');
  const [depositPaymentMethodId, setDepositPaymentMethodId] = useState('');
  const [depositPaidDate, setDepositPaidDate] = useState(formatDateLocal(new Date()));
  const [depositReferenceNo, setDepositReferenceNo] = useState('');
  const [isDepositDialogOpen, setIsDepositDialogOpen] = useState(false);
  const [isGuestDialogOpen, setIsGuestDialogOpen] = useState(false);
  const [assignDialogReservationRoomId, setAssignDialogReservationRoomId] = useState('');
  const [assignDialogSelectedRoomId, setAssignDialogSelectedRoomId] = useState('');
  const [isAddRoomTypeDialogOpen, setIsAddRoomTypeDialogOpen] = useState(false);
  const [isAddExtraBedDialogOpen, setIsAddExtraBedDialogOpen] = useState(false);
  const [roomTypeFilterIds, setRoomTypeFilterIds] = useState<string[]>([]);
  const [addRoomTypeSearchCriteria, setAddRoomTypeSearchCriteria] = useState<RoomTypeAvailabilitySearchCriteria | null>(null);
  const [selectedRoomTypeAmounts, setSelectedRoomTypeAmounts] = useState<Record<string, number>>({});
  const [addRoomTypeSearchError, setAddRoomTypeSearchError] = useState('');
  const [addRoomTypeAvailabilityRows, setAddRoomTypeAvailabilityRows] = useState<RoomTypeAvailabilityRow[]>([]);

  const [draftReservation, setDraftReservation] = useState<ReservationDetailDto | null>(null);
  const [pendingLinkedGuestId, setPendingLinkedGuestId] = useState<string | null>(null);
  const [pendingAddedRoomTypeCounts, setPendingAddedRoomTypeCounts] = useState<Record<string, number>>({});
  const [pendingRemovedRoomIds, setPendingRemovedRoomIds] = useState<string[]>([]);
  const [pendingRoomAssignments, setPendingRoomAssignments] = useState<Record<string, string>>({});
  const [pendingAddedExtraBeds, setPendingAddedExtraBeds] = useState<Array<{ tempId: string; extraBedTypeId: string; quantity: number }>>([]);
  const [pendingRemovedExtraBedIds, setPendingRemovedExtraBedIds] = useState<string[]>([]);
  const [pendingAddedDeposits, setPendingAddedDeposits] = useState<Array<Omit<ReservationDepositDto, 'id'> & { tempId: string }>>([]);
  const [isEditMode, setIsEditMode] = useState(false);

  const closeGuestDialog = () => {
    setIsGuestDialogOpen(false);
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
        } else {
          setIsDepositDialogOpen(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAddRoomTypeDialogOpen, isDepositDialogOpen, isGuestDialogOpen]);

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

  const confirmMutation = useMutation({
    mutationFn: resortService.confirmReservation,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['resort-reservations'] });
      void queryClient.invalidateQueries({ queryKey: ['resort-reservation-detail', id] });
      notifySuccess('Reservation confirmed.');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (input: { reason: string; remarks?: string }) =>
      resortService.cancelReservation(id as string, input.reason, input.remarks),
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

  const hasUnsavedChanges =
    Boolean(pendingLinkedGuestId) ||
    Object.keys(pendingAddedRoomTypeCounts).length > 0 ||
    pendingRemovedRoomIds.length > 0 ||
    Object.keys(pendingRoomAssignments).length > 0 ||
    pendingAddedExtraBeds.length > 0 ||
    pendingRemovedExtraBedIds.length > 0 ||
    pendingAddedDeposits.length > 0;

  useEffect(() => {
    if (!reservationDetail || hasUnsavedChanges) return;
    setDraftReservation({
      ...reservationDetail,
      rooms: [...reservationDetail.rooms],
      extraBeds: [...reservationDetail.extraBeds],
      deposits: [...reservationDetail.deposits],
      guests: [...reservationDetail.guests],
    });
  }, [reservationDetail, hasUnsavedChanges]);

  useEffect(() => {
    setIsEditMode(false);
  }, [id, reservationDetail?.id]);

  const saveChangesMutation = useMutation({
    mutationFn: async () => {
      if (!id) return;

      const roomTypesToAdd = Object.entries(pendingAddedRoomTypeCounts)
        .filter(([, quantity]) => quantity > 0)
        .map(([roomTypeId, quantity]) => ({ roomTypeId, quantity }));

      const roomAssignments = Object.entries(pendingRoomAssignments)
        .map(([reservationRoomId, roomId]) => ({ reservationRoomId, roomId }))
        .filter((x) => Boolean(x.reservationRoomId) && Boolean(x.roomId));

      const extraBedsToAdd = pendingAddedExtraBeds
        .map(({ extraBedTypeId, quantity }) => ({ extraBedTypeId, quantity }))
        .filter((x) => Boolean(x.extraBedTypeId) && x.quantity > 0);

      await resortService.applyReservationChanges({
        reservationId: id,
        linkedGuestId: pendingLinkedGuestId ?? undefined,
        roomTypesToAdd,
        reservationRoomIdsToRemove: pendingRemovedRoomIds,
        roomAssignments,
        extraBedsToAdd,
        reservationExtraBedIdsToRemove: pendingRemovedExtraBedIds,
        depositsToAdd: pendingAddedDeposits.map((deposit) => ({
          reservationId: id,
          amount: deposit.amount,
          paymentMethodId: deposit.paymentMethodId,
          paidDate: deposit.paidDate,
          referenceNo: deposit.referenceNo || undefined,
        })),
      });
    },
    onSuccess: () => {
      setPendingLinkedGuestId(null);
      setPendingAddedRoomTypeCounts({});
      setPendingRemovedRoomIds([]);
      setPendingRoomAssignments({});
      setPendingAddedExtraBeds([]);
      setPendingRemovedExtraBedIds([]);
      setPendingAddedDeposits([]);
      setIsEditMode(false);

      void queryClient.invalidateQueries({ queryKey: ['resort-reservations'] });
      void queryClient.invalidateQueries({ queryKey: ['resort-reservation-detail', id] });
      void queryClient.invalidateQueries({ queryKey: ['room-rack-info'] });
      void queryClient.invalidateQueries({ queryKey: ['resort-reservation-detail-available-rooms', id] });
      void queryClient.invalidateQueries({ queryKey: ['resort-rooms-lookup'] });
      notifySuccess('Changes saved.');
    },
  });

  const discardChanges = () => {
    if (!reservationDetail) return;
    setDraftReservation({
      ...reservationDetail,
      rooms: [...reservationDetail.rooms],
      extraBeds: [...reservationDetail.extraBeds],
      deposits: [...reservationDetail.deposits],
      guests: [...reservationDetail.guests],
    });
    setPendingLinkedGuestId(null);
    setPendingAddedRoomTypeCounts({});
    setPendingRemovedRoomIds([]);
    setPendingRoomAssignments({});
    setPendingAddedExtraBeds([]);
    setPendingRemovedExtraBedIds([]);
    setPendingAddedDeposits([]);
    setAssignDialogReservationRoomId('');
    setAssignDialogSelectedRoomId('');
    setIsDepositDialogOpen(false);
    setIsAddExtraBedDialogOpen(false);
    closeAddRoomTypeDialog();
    setIsEditMode(false);
  };

  const effectiveReservation = draftReservation ?? reservationDetail;
  const isEditableReservation =
    effectiveReservation?.status === ReservationStatus.Draft ||
    effectiveReservation?.status === ReservationStatus.Pending;

  const rooms = effectiveReservation?.rooms ?? [];
  const extraBeds = effectiveReservation?.extraBeds ?? [];
  const deposits = effectiveReservation?.deposits ?? [];
  const depositAmountValue = Number(depositAmount || 0);
  const totalAmountBalance = useMemo(() => {
    if (!effectiveReservation) return 0;
    return Math.max(0, effectiveReservation.totalAmount - effectiveReservation.depositPaid);
  }, [effectiveReservation]);

  const computedRoomAmount = useMemo(
    () => rooms.reduce((sum, room) => sum + Number(room.netAmount || 0), 0),
    [rooms],
  );

  const computedExtraBedAmount = useMemo(
    () => extraBeds.reduce((sum, bed) => sum + Number(bed.netAmount || 0), 0),
    [extraBeds],
  );

  /** Only allow row-level editing while page is in Edit mode. */
  const canShowBookingActions = useMemo(() => {
    if (!effectiveReservation) return false;
    return effectiveReservation.status === ReservationStatus.Pending && isEditMode;
  }, [effectiveReservation, isEditMode]);

  const roomNumberById = useMemo(() => {
    const map = new Map<string, string>();
    (roomLookup ?? []).forEach((room) => {
      map.set(room.id, room.roomNumber);
    });
    return map;
  }, [roomLookup]);

  const assignDialogRoomLine = useMemo(
    () => effectiveReservation?.rooms?.find((room) => room.id === assignDialogReservationRoomId),
    [effectiveReservation, assignDialogReservationRoomId],
  );

  const isChangeRoomDialog = useMemo(() => {
    if (!assignDialogReservationRoomId) return false;
    const roomLine = (effectiveReservation?.rooms ?? []).find((row) => row.id === assignDialogReservationRoomId);
    return Boolean(roomLine?.roomId);
  }, [assignDialogReservationRoomId, effectiveReservation?.rooms]);

  const canAssignRooms = canShowBookingActions;
  const canAddExtraBeds = isEditableReservation && isEditMode;
  const canAddRoomTypes = isEditableReservation && isEditMode;
  const canRemoveRoomTypes = canAddRoomTypes;
  const canRemoveExtraBeds = canAddExtraBeds;
  const canAddPayments = isEditableReservation && isEditMode;
  const addRoomTypeArrivalDate = toDateOnly(effectiveReservation?.arrivalDate);
  const addRoomTypeDepartureDate = toDateOnly(effectiveReservation?.departureDate);

  const { data: extraBedCurrentPrices } = useQuery({
    queryKey: ['extra-bed-current-prices', addRoomTypeArrivalDate],
    queryFn: () => resortService.getCurrentPrices(addRoomTypeArrivalDate || undefined),
    enabled: Boolean(addRoomTypeArrivalDate),
  });

  const rateByTypeId = useMemo(
    () => Object.fromEntries((extraBedCurrentPrices ?? []).map((p) => [p.extraBedTypeId, p.ratePerNight])),
    [extraBedCurrentPrices],
  );
  const isLinkGuestMode = !effectiveReservation?.guestId;
  const canLinkGuest =
    !effectiveReservation?.guestId &&
    (effectiveReservation?.status === ReservationStatus.Draft || effectiveReservation?.status === ReservationStatus.Pending) &&
    isEditMode;
  const allRoomTypeIds = useMemo(() => (roomTypes ?? []).map((roomType) => roomType.id), [roomTypes]);
  const unsavedRoomTypeCountsForAdd = useMemo(() => {
    return rooms.reduce<Record<string, number>>((acc, room) => {
      if (!room.id.startsWith(TEMP_ROOM_PREFIX)) return acc;
      acc[room.roomTypeId] = (acc[room.roomTypeId] ?? 0) + 1;
      return acc;
    }, {});
  }, [rooms]);
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

  const handleAddRoomTypesDraft = (input: { roomTypeIds: string[]; amounts: Record<string, number> }) => {
    if (!effectiveReservation) return;

    const roomTypeMap = new Map((roomTypes ?? []).map((roomType) => [roomType.id, roomType]));
    const availabilityMap = new Map(addRoomTypeAvailabilityRows.map((row) => [row.roomTypeId, row]));

    const nextRooms: ReservationRoomDetailDto[] = [...(draftReservation?.rooms ?? effectiveReservation.rooms)];
    const nextAddedCounts = { ...pendingAddedRoomTypeCounts };

    input.roomTypeIds.forEach((roomTypeId) => {
      const quantity = Math.max(1, Math.floor(input.amounts[roomTypeId] ?? 1));
      if (quantity <= 0) return;

      const roomType = roomTypeMap.get(roomTypeId);
      const availability = availabilityMap.get(roomTypeId);
      const ratePerNight = availability?.baseRate ?? 0;
      const nights = effectiveReservation.nights > 0 ? effectiveReservation.nights : 1;
      const netAmount = ratePerNight * nights;

      for (let index = 0; index < quantity; index += 1) {
        nextRooms.push({
          id: createTempId(TEMP_ROOM_PREFIX),
          roomTypeId,
          roomTypeName: roomType?.name ?? availability?.roomTypeName ?? 'Room Type',
          roomId: undefined,
          roomNumber: undefined,
          arrivalDate: effectiveReservation.arrivalDate,
          departureDate: effectiveReservation.departureDate,
          ratePerNight,
          numberOfNights: nights,
          amount: netAmount,
          discountPercent: 0,
          discountAmount: 0,
          seniorCitizenCount: 0,
          seniorCitizenPercent: 0,
          seniorCitizenDiscountAmount: 0,
          netAmount,
        });
      }

      nextAddedCounts[roomTypeId] = (nextAddedCounts[roomTypeId] ?? 0) + quantity;
    });

    setDraftReservation((prev) => (prev ? { ...prev, rooms: nextRooms } : prev));
    setPendingAddedRoomTypeCounts(nextAddedCounts);
    closeAddRoomTypeDialog();
  };

  const handleRemoveRoomDraft = (reservationRoomId: string) => {
    setDraftReservation((prev) => {
      if (!prev) return prev;
      const target = prev.rooms.find((room) => room.id === reservationRoomId);
      const updatedRooms = prev.rooms.filter((room) => room.id !== reservationRoomId);

      if (target?.id.startsWith(TEMP_ROOM_PREFIX)) {
        setPendingAddedRoomTypeCounts((counts) => {
          const nextCounts = { ...counts };
          const current = nextCounts[target.roomTypeId] ?? 0;
          if (current <= 1) delete nextCounts[target.roomTypeId];
          else nextCounts[target.roomTypeId] = current - 1;
          return nextCounts;
        });
      } else {
        setPendingRemovedRoomIds((prevRemoved) =>
          prevRemoved.includes(reservationRoomId) ? prevRemoved : [...prevRemoved, reservationRoomId],
        );
        setPendingRoomAssignments((prevAssignments) => {
          const nextAssignments = { ...prevAssignments };
          delete nextAssignments[reservationRoomId];
          return nextAssignments;
        });
      }

      return { ...prev, rooms: updatedRooms };
    });
  };

  const handleAssignRoomDraft = (reservationRoomId: string, roomId: string) => {
    const roomNumber = roomNumberById.get(roomId);

    setDraftReservation((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        rooms: prev.rooms.map((room) =>
          room.id === reservationRoomId
            ? {
                ...room,
                roomId,
                roomNumber: roomNumber ?? room.roomNumber,
              }
            : room,
        ),
      };
    });

    if (!reservationRoomId.startsWith(TEMP_ROOM_PREFIX)) {
      const originalRoomId = reservationDetail?.rooms.find((room) => room.id === reservationRoomId)?.roomId;
      setPendingRoomAssignments((prevAssignments) => {
        const nextAssignments = { ...prevAssignments };
        if (originalRoomId === roomId) {
          delete nextAssignments[reservationRoomId];
        } else {
          nextAssignments[reservationRoomId] = roomId;
        }
        return nextAssignments;
      });
    }

    closeAssignRoomDialog();
  };

  const handleAddExtraBedDraft = (extraBedTypeId: string, quantity: number, ratePerNight: number) => {
    const selectedType = (extraBedTypes ?? []).find((item) => item.id === extraBedTypeId);
    if (!effectiveReservation || !selectedType) return;

    const safeQuantity = Math.max(1, Math.floor(quantity));
    const nights = effectiveReservation.nights > 0 ? effectiveReservation.nights : 1;
    const netAmount = safeQuantity * ratePerNight * nights;
    const tempId = createTempId(TEMP_EXTRA_BED_PREFIX);

    setDraftReservation((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        extraBeds: [
          ...prev.extraBeds,
          {
            id: tempId,
            extraBedTypeId,
            extraBedTypeName: selectedType.name,
            arrivalDate: effectiveReservation.arrivalDate,
            departureDate: effectiveReservation.departureDate,
            quantity: safeQuantity,
            ratePerNight,
            numberOfNights: nights,
            amount: netAmount,
            discountPercent: 0,
            discountAmount: 0,
            seniorCitizenCount: 0,
            seniorCitizenPercent: 0,
            seniorCitizenDiscountAmount: 0,
            netAmount,
          },
        ],
      };
    });

    setPendingAddedExtraBeds((prev) => [...prev, { tempId, extraBedTypeId, quantity: safeQuantity }]);
    setIsAddExtraBedDialogOpen(false);
  };

  const handleRemoveExtraBedDraft = (reservationExtraBedId: string) => {
    setDraftReservation((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        extraBeds: prev.extraBeds.filter((bed) => bed.id !== reservationExtraBedId),
      };
    });

    if (reservationExtraBedId.startsWith(TEMP_EXTRA_BED_PREFIX)) {
      setPendingAddedExtraBeds((prev) => prev.filter((item) => item.tempId !== reservationExtraBedId));
      return;
    }

    setPendingRemovedExtraBedIds((prev) =>
      prev.includes(reservationExtraBedId) ? prev : [...prev, reservationExtraBedId],
    );
  };

  const handleAddDepositDraft = () => {
    if (!effectiveReservation) return;

    const amount = Number(depositAmount);
    if (!amount || amount <= 0 || amount > totalAmountBalance || !depositPaymentMethodId || !depositPaidDate) return;

    const paymentMethodName = (paymentMethods ?? []).find((method) => method.id === depositPaymentMethodId)?.name ?? '';
    const tempId = createTempId(TEMP_DEPOSIT_PREFIX);

    setDraftReservation((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        depositPaid: (prev.depositPaid ?? 0) + amount,
        deposits: [
          ...prev.deposits,
          {
            id: tempId,
            amount,
            paymentMethodId: depositPaymentMethodId,
            paymentMethodName,
            paidDate: depositPaidDate,
            referenceNo: depositReferenceNo || undefined,
          },
        ],
      };
    });

    setPendingAddedDeposits((prev) => [
      ...prev,
      {
        tempId,
        amount,
        paymentMethodId: depositPaymentMethodId,
        paymentMethodName,
        paidDate: depositPaidDate,
        referenceNo: depositReferenceNo || undefined,
      },
    ]);

    setIsDepositDialogOpen(false);
    setDepositAmount('');
    setDepositPaymentMethodId('');
    setDepositPaidDate(formatDateLocal(new Date()));
    setDepositReferenceNo('');
  };

  const handleLinkGuestDraft = (guest: SelectedGuest) => {
    if (!isLinkGuestMode || !canLinkGuest) return;

    setDraftReservation((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        guestId: guest.id,
        guestName: guest.fullName,
        firstName: guest.fullName,
        lastName: '',
        phone: guest.phone ?? prev.phone,
        email: guest.email ?? prev.email,
      };
    });

    setPendingLinkedGuestId(guest.id);
    setIsGuestDialogOpen(false);
  };

  const handleConfirmReservation = async () => {
    if (!id) return;
    const result = await confirmAction('This action will confirm this reservation.', {
      title: 'Confirm Reservation',
      confirmButtonText: 'Confirm',
      cancelButtonText: 'Back',
    });
    if (!result.isConfirmed) return;
    confirmMutation.mutate(id);
  };

  const handleCancelReservation = async () => {
    const result = await confirmAction('', {
      title: 'Cancel Reservation',
      confirmButtonText: 'Submit',
      cancelButtonText: 'Close',
      html: `
        <div style="text-align:left;display:flex;flex-direction:column;gap:10px;">
          <div>
            <label for="cancel-reason" style="display:block;font-size:12px;margin-bottom:4px;">Cancel Reason</label>
            <input id="cancel-reason" class="swal2-input" style="margin:0;width:100%;" placeholder="Enter cancel reason" />
          </div>
          <div>
            <label for="cancel-remarks" style="display:block;font-size:12px;margin-bottom:4px;">Remarks</label>
            <textarea id="cancel-remarks" class="swal2-textarea" style="margin:0;width:100%;" rows="3" placeholder="Enter remarks"></textarea>
          </div>
        </div>
      `,
      focusConfirm: false,
      preConfirm: () => {
        const reasonElement = document.getElementById('cancel-reason') as HTMLInputElement | null;
        const remarksElement = document.getElementById('cancel-remarks') as HTMLTextAreaElement | null;
        const reason = reasonElement?.value?.trim() ?? '';
        const remarks = remarksElement?.value?.trim() ?? '';

        if (!reason) {
          Swal.showValidationMessage('Cancel Reason is required.');
          return null;
        }

        return { reason, remarks };
      },
    });

    if (!result.isConfirmed || !result.value) return;
    const payload = result.value as { reason: string; remarks?: string };
    cancelMutation.mutate({
      reason: payload.reason,
      remarks: payload.remarks,
    });
  };

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
              onClick={() => navigate(backPath)}
            >
              <ChevronLeftIcon className="h-4 w-4" />
              Back
            </button>
          </div>
        </div>

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
                      selectedRoomTypeIds={roomTypeFilterIds}
                      onSelectedRoomTypeIdsChange={setRoomTypeFilterIds}
                      selectedAmounts={selectedRoomTypeAmounts}
                      onSelectedAmountsChange={setSelectedRoomTypeAmounts}
                      searchCriteria={addRoomTypeSearchCriteria}
                      onSearch={setAddRoomTypeSearchCriteria}
                      errorMessage={addRoomTypeSearchError}
                      onErrorMessageChange={setAddRoomTypeSearchError}
                      excludedRoomTypeCounts={unsavedRoomTypeCountsForAdd}
                      onAvailabilityChange={({ availabilityRows }) => setAddRoomTypeAvailabilityRows(availabilityRows)}
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
                      disabled={selectedRoomTypeIdsForAdd.length === 0}
                      onClick={() => {
                        handleAddRoomTypesDraft({
                          roomTypeIds: selectedRoomTypeIdsForAdd,
                          amounts: selectedRoomTypeAmounts,
                        });
                      }}
                    >
                      Add Room Type(s)
                    </button>
                  </div>
                </DialogPanel>
              </div>
            </Dialog>
          ) : null}
          {reservationDetail ? (
            <div className="space-y-6 text-sm">
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                <div className="space-y-4">
                  <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-semibold">Reservation Details</h4>
                        <span className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">{reservationDetail.reservationNo}</span>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${getStatusBadgeClass(reservationDetail.status)}`}>
                          {ReservationStatus[reservationDetail.status]}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                        {reservationDetail.status === ReservationStatus.Draft ? (
                          <>
                            <button
                              type="button"
                              className="w-full rounded bg-amber-600 px-3 py-2 text-sm text-white hover:bg-amber-700 disabled:opacity-50 sm:w-auto"
                              disabled={setPendingMutation.isPending}
                              onClick={() => setPendingMutation.mutate()}
                            >
                              {setPendingMutation.isPending ? 'Updating…' : 'Make Pending'}
                            </button>
                          </>
                        ) : null}
                        {isEditableReservation ? (
                          !isEditMode ? (
                            <>
                              <button
                                type="button"
                                className="w-full rounded bg-primary-600 px-3 py-2 text-sm text-white sm:w-auto"
                                onClick={() => setIsEditMode(true)}
                              >
                                Edit
                              </button>
                              {effectiveReservation?.status === ReservationStatus.Pending ? (
                                <button
                                  type="button"
                                  className="w-full rounded bg-emerald-600 px-3 py-2 text-sm text-white disabled:opacity-50 sm:w-auto"
                                  disabled={confirmMutation.isPending || cancelMutation.isPending}
                                  onClick={handleConfirmReservation}
                                >
                                  {confirmMutation.isPending ? 'Confirming…' : 'Confirm'}
                                </button>
                              ) : null}
                              {effectiveReservation?.status === ReservationStatus.Pending ? (
                                <button
                                  type="button"
                                  className="w-full rounded bg-rose-600 px-3 py-2 text-sm text-white disabled:opacity-50 sm:w-auto"
                                  disabled={cancelMutation.isPending || confirmMutation.isPending}
                                  onClick={handleCancelReservation}
                                >
                                  {cancelMutation.isPending ? 'Cancelling…' : 'Cancel'}
                                </button>
                              ) : null}
                            </>
                          ) : null
                        ) : null}
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-1 gap-4 border-t border-gray-200 pt-4 sm:grid-cols-2 sm:gap-0 sm:divide-x sm:divide-gray-200 dark:border-gray-700 dark:sm:divide-gray-700">
                      <div className="sm:pr-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">CHECK-IN</p>
                        <p className="mt-1 text-lg font-bold tracking-tight text-gray-900 dark:text-white">{formatDisplayDate(reservationDetail.arrivalDate)}</p>
                        <p className="mt-0 text-sm font-medium text-gray-500 dark:text-gray-400">From {formatDisplayTime(reservationDetail.arrivalDate)}</p>
                      </div>
                      <div className="sm:pl-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">CHECK-OUT</p>
                        <p className="mt-1 text-lg font-bold tracking-tight text-gray-900 dark:text-white">{formatDisplayDate(reservationDetail.departureDate)}</p>
                        <p className="mt-0 text-sm font-medium text-gray-500 dark:text-gray-400">Until {formatDisplayTime(reservationDetail.departureDate)}</p>
                      </div>
                    </div>

                    <p className="mt-3 font-semibold">
                      {reservationDetail.nights} Night{reservationDetail.nights > 1 ? 's' : ''}, {reservationDetail.adults} Adult{reservationDetail.adults > 1 ? 's' : ''} {reservationDetail.children} Children
                    </p>
                  </div>

                  <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <h4 className="text-base font-semibold">Guest Info</h4>
                      {canLinkGuest ? (
                        <button
                          type="button"
                          className="w-full rounded bg-primary-600 px-3 py-1.5 text-sm text-white hover:bg-primary-700 sm:w-auto"
                          onClick={() => setIsGuestDialogOpen(true)}
                        >
                          Link Guest
                        </button>
                      ) : null}
                    </div>
                    <div className="mt-3 border-t border-gray-200 pt-4 dark:border-gray-700">
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">GUEST NAME</p>
                      <p className="mt-1 text-lg font-bold tracking-tight text-gray-900 dark:text-white">
                        {(effectiveReservation?.firstName?.trim() || effectiveReservation?.lastName?.trim())
                          ? `${effectiveReservation?.firstName?.trim() ?? ''} ${effectiveReservation?.lastName?.trim() ?? ''}`.trim()
                          : effectiveReservation?.guestName}
                      </p>

                      <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-0 sm:divide-x sm:divide-gray-200 dark:sm:divide-gray-700">
                        <div className="sm:pr-4">
                          <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">CONTACT NUMBER</p>
                          <p className="mt-1 text-base font-medium text-gray-500 dark:text-gray-400">{effectiveReservation?.phone?.trim() ? effectiveReservation.phone : '-'}</p>
                        </div>
                        <div className="sm:pl-4">
                          <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">EMAIL</p>
                          <p className="mt-1 text-base font-medium text-gray-500 dark:text-gray-400 break-all">{effectiveReservation?.email?.trim() ? effectiveReservation.email : '-'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                    <h4 className="text-base font-semibold">Notes</h4>
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
                </div>

                <div className="space-y-4">
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
                                  {canAssignRooms && !room.id.startsWith(TEMP_ROOM_PREFIX) ? (
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
                                      className="rounded bg-rose-600 px-2 py-1 text-xs text-white"
                                      onClick={() => handleRemoveRoomDraft(room.id)}
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
                      className="w-full rounded bg-primary-600 px-3 py-1.5 text-sm text-white hover:bg-primary-700 sm:w-auto"
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
                                  className="rounded bg-rose-600 px-2 py-1 text-xs text-white"
                                  onClick={() => handleRemoveExtraBedDraft(bed.id)}
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

                  <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                    <h4 className="text-base font-semibold">Totals</h4>
                    <div className="mt-3 space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Room Amount</span>
                        <span className="font-semibold tabular-nums">{formatMoney(computedRoomAmount)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Extra Bed Amount</span>
                        <span className="font-semibold tabular-nums">{formatMoney(computedExtraBedAmount)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Total Amount</span>
                        <span className="font-semibold tabular-nums">{formatMoney(effectiveReservation?.totalAmount)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Total Payments</span>
                        <span className="font-semibold tabular-nums">{formatMoney(effectiveReservation?.depositPaid)}</span>
                      </div>
                      <div className="flex items-center justify-between border-t border-gray-200 pt-2 dark:border-gray-700">
                        <span className="text-gray-500 dark:text-gray-400">Balance</span>
                        <span className="font-semibold tabular-nums">{formatMoney(totalAmountBalance)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h4 className="text-base font-semibold">Payments</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Record payments applied before check-in.</p>
                  </div>
                  {canAddPayments && (
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

                </div>
              </div>

              <AddExtraBedDialog
                open={isAddExtraBedDialogOpen}
                extraBedTypes={extraBedTypes ?? []}
                rateByTypeId={rateByTypeId}
                onClose={() => setIsAddExtraBedDialogOpen(false)}
                onAdd={handleAddExtraBedDraft}
              />
            </div>
          ) : null}
        </section>

        {isEditMode ? (
          <div className="flex flex-wrap items-center justify-end gap-2 rounded-lg bg-white p-4 shadow dark:bg-gray-800">
            <button
              type="button"
              className="w-full rounded border border-gray-300 px-4 py-2 text-sm text-gray-700 disabled:opacity-50 sm:w-auto dark:border-gray-600 dark:text-gray-200"
              disabled={!hasUnsavedChanges || saveChangesMutation.isPending}
              onClick={discardChanges}
            >
              Discard Changes
            </button>
            <button
              type="button"
              className="w-full rounded bg-primary-600 px-4 py-2 text-sm text-white disabled:opacity-50 sm:w-auto"
              disabled={!hasUnsavedChanges || saveChangesMutation.isPending}
              onClick={() => saveChangesMutation.mutate()}
            >
              {saveChangesMutation.isPending ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        ) : null}

        {canAddPayments ? (
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
                    <DatePicker
                      selected={depositPaidDate ? parseDateOnly(depositPaidDate) : null}
                      onChange={(date: Date | null) => setDepositPaidDate(date ? formatDateLocal(date) : '')}
                      dateFormat="MMM d, yyyy"
                      className="w-full rounded border p-2 dark:bg-gray-700"
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
                      !effectiveReservation ||
                      depositAmountValue <= 0 ||
                      depositAmountValue > totalAmountBalance ||
                      !depositPaymentMethodId ||
                      !depositPaidDate
                    }
                    onClick={handleAddDepositDraft}
                  >
                    Add Deposit (Draft)
                  </button>
                </div>
              </DialogPanel>
            </div>
          </Dialog>
        ) : null}

        <SearchGuestDialog
          open={isGuestDialogOpen}
          onClose={closeGuestDialog}
          onSelectGuest={handleLinkGuestDraft}
        />

        <AssignRoomDialog
          open={Boolean(assignDialogReservationRoomId)}
          isChangeRoom={isChangeRoomDialog}
          roomTypeName={assignDialogRoomLine?.roomTypeName}
          roomTypeId={assignDialogRoomLine?.roomTypeId}
          selectedRoomId={assignDialogSelectedRoomId}
          arrivalDate={assignDialogRoomLine?.arrivalDate}
          departureDate={assignDialogRoomLine?.departureDate}
          reservationId={id}
          excludeRoomIds={rooms
            .filter((room) => room.id !== assignDialogReservationRoomId && Boolean(room.roomId))
            .map((room) => room.roomId as string)}
          onSelectRoom={(roomId) => {
            setAssignDialogSelectedRoomId(roomId);
            if (assignDialogReservationRoomId) {
              handleAssignRoomDraft(assignDialogReservationRoomId, roomId);
            }
          }}
          onClose={closeAssignRoomDialog}
        />
      </div>
    </>
  );
};
