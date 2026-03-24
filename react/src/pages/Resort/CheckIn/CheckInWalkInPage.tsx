import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useNavigate, useParams } from 'react-router-dom';
import { resortService } from '@services/resort.service';
import { HousekeepingStatus, type RoomListDto } from '@/types/resort.types';
import { SearchGuestDialog, SelectedGuest } from '../Shared/SearchGuestDialog';
import { AddPaymentDialog } from '../Shared/AddPaymentDialog';
import { AddExtraBedDialog } from '../Shared/AddExtraBedDialog';
import { AssignRoomDialog } from '../Shared/AssignRoomDialog';
import { LoadPreCheckInDialog } from '../Shared/LoadPreCheckInDialog';
import {
  RoomTypeAvailabilitySearch,
  type RoomTypeAvailabilityRow,
  type RoomTypeAvailabilitySearchCriteria,
} from '../Shared/RoomTypeAvailabilitySearch';
import { formatMoney } from '@utils/helpers';

const formatDateLocal = (value: Date) => {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
};

const parseDateOnly = (value: string) => {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const round2 = (value: number) => Math.round(value * 100) / 100;

const getErrorMessage = (error: unknown) => {
  if (error && typeof error === 'object') {
    const apiError = error as {
      message?: string;
      response?: {
        data?: {
          error?: {
            message?: string;
            details?: string;
          };
        };
      };
    };

    return apiError.response?.data?.error?.message || apiError.response?.data?.error?.details || apiError.message || 'Unable to complete check-in.';
  }

  return 'Unable to complete check-in.';
};

const SC_DISCOUNT_PERCENT = 20;
const VAT_RATE = 0.12;

type SearchCriteria = RoomTypeAvailabilitySearchCriteria & {
  adults: number;
  children: number;
  rooms: number;
};

type ExtraBedSelectionRow = {
  id: string;
  extraBedTypeId: string;
  extraBedTypeName: string;
  quantity: number;
  nights: number;
  ratePerNight: number;
};

type InitialDepositRow = {
  id: string;
  amount: number;
  paymentMethodId: string;
  paidDate: string;
  referenceNo: string;
};

const splitFullName = (fullName: string) => {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return { firstName: '', middleName: '', lastName: '' };
  }
  if (parts.length === 1) {
    return { firstName: parts[0], middleName: '', lastName: '' };
  }

  return {
    firstName: parts[0],
    middleName: parts.slice(1, -1).join(' '),
    lastName: parts[parts.length - 1],
  };
};

const isRoomOutOfOrder = (room?: RoomListDto) => room?.roomStatusCode === 'OOO';

export const CheckInWalkInPage = () => {
  const navigate = useNavigate();
  const { preCheckInId: urlPreCheckInId } = useParams<{ preCheckInId?: string }>();
  const queryClient = useQueryClient();
  const [stayRange, setStayRange] = useState<[Date | null, Date | null]>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return [today, tomorrow];
  });
  const [selectedRoomTypeIds, setSelectedRoomTypeIds] = useState<string[]>([]);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [roomCount, setRoomCount] = useState(1);
  const [searchError, setSearchError] = useState('');
  const [searchCriteria, setSearchCriteria] = useState<SearchCriteria | null>(null);
  const [selectedAmounts, setSelectedAmounts] = useState<Record<string, number>>({});
  const [availabilityRows, setAvailabilityRows] = useState<RoomTypeAvailabilityRow[]>([]);
  const [availableRooms, setAvailableRooms] = useState<RoomListDto[]>([]);
  const [showReservationDetails, setShowReservationDetails] = useState(false);
  const [showGuestInfoStep, setShowGuestInfoStep] = useState(false);
  const [seniorCountsByRoom, setSeniorCountsByRoom] = useState<Record<string, number>>({});
  const [assignedRoomByLine, setAssignedRoomByLine] = useState<Record<string, string>>({});
  const [assignDialogLineId, setAssignDialogLineId] = useState('');
  const [assignDialogSelectedRoomId, setAssignDialogSelectedRoomId] = useState('');
  const [extraBedRows, setExtraBedRows] = useState<ExtraBedSelectionRow[]>([]);
  const [showAddExtraBedDialog, setShowAddExtraBedDialog] = useState(false);
  const [showGuestDialog, setShowGuestDialog] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState<SelectedGuest | null>(null);
  const [guestInfoForm, setGuestInfoForm] = useState({
    guestCode: '',
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    phone: '',
    nationality: '',
  });
  const [transactionNotes, setTransactionNotes] = useState('');
  const [reservationConditions, setReservationConditions] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [initialDeposits, setInitialDeposits] = useState<InitialDepositRow[]>([]);
  const [showDepositDialog, setShowDepositDialog] = useState(false);
  const [refundableDepositAmount, setRefundableDepositAmount] = useState('');
  const [refundableDepositPaymentMethodId, setRefundableDepositPaymentMethodId] = useState('');
  const [refundableDepositReference, setRefundableDepositReference] = useState('');
  const [showPreCheckInListDialog, setShowPreCheckInListDialog] = useState(false);
  const [loadedPreCheckInId, setLoadedPreCheckInId] = useState<string | null>(null);
  const [preCheckInSaveMessage, setPreCheckInSaveMessage] = useState('');

  const [startDate, endDate] = stayRange;

  const { data: roomTypes } = useQuery({
    queryKey: ['resort-room-types'],
    queryFn: () => resortService.getRoomTypes(),
  });

  const { data: extraBedTypes } = useQuery({
    queryKey: ['resort-extra-bed-types'],
    queryFn: () => resortService.getExtraBedTypes(),
  });

  const { data: paymentMethods } = useQuery({
    queryKey: ['resort-payment-methods'],
    queryFn: () => resortService.getPaymentMethods(),
    enabled: showReservationDetails && showGuestInfoStep,
  });

  const { data: channels } = useQuery({
    queryKey: ['resort-channels'],
    queryFn: () => resortService.getChannels(),
  });

  const [selectedChannelId, setSelectedChannelId] = useState('');

  useEffect(() => {
    if (selectedChannelId) return;
    const firstChannelId = channels?.[0]?.id;
    if (firstChannelId) {
      setSelectedChannelId(firstChannelId);
    }
  }, [channels, selectedChannelId]);

  useEffect(() => {
    if (!selectedGuest) return;
    const nameParts = splitFullName(selectedGuest.fullName);
    setGuestInfoForm({
      guestCode: selectedGuest.guestCode || '',
      firstName: nameParts.firstName,
      middleName: nameParts.middleName,
      lastName: nameParts.lastName,
      email: selectedGuest.email || '',
      phone: selectedGuest.phone || '',
      nationality: selectedGuest.nationality || '',
    });
  }, [selectedGuest]);
  const assignedRoomIds = useMemo(() => Object.values(assignedRoomByLine).filter(Boolean), [assignedRoomByLine]);

  const { data: freshRoomStatuses } = useQuery({
    queryKey: ['walkin-assigned-room-statuses', assignedRoomIds],
    queryFn: async () => {
      if (assignedRoomIds.length === 0) return [];
      const result = await resortService.getRooms('', 0, 500);
      return result.items.filter((r) => assignedRoomIds.includes(r.id));
    },
    enabled: assignedRoomIds.length > 0,
    staleTime: 10 * 1000,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchInterval: 30 * 1000,
  });

  const selectedSummary = useMemo(() => {
    const rows = availabilityRows
      .map((row) => ({ ...row, selected: selectedAmounts[row.roomTypeId] ?? 0 }))
      .filter((row) => row.selected > 0);

    const perNightTotal = rows.reduce((sum, row) => sum + row.baseRate * row.selected, 0);
    return { rows, perNightTotal };
  }, [availabilityRows, selectedAmounts]);

  const totalSelectedQuantity = useMemo(
    () => Object.values(selectedAmounts).reduce((sum, value) => sum + value, 0),
    [selectedAmounts]
  );

  const selectedPackage = useMemo(() => {
    if (!searchCriteria || selectedSummary.rows.length === 0) {
      return { nights: 0, lines: [], total: 0 };
    }

    const arrival = parseDateOnly(searchCriteria.arrivalDate);
    const departure = parseDateOnly(searchCriteria.departureDate);
    const diffInMs = departure.getTime() - arrival.getTime();
    const nights = Math.max(1, Math.round(diffInMs / (1000 * 60 * 60 * 24)));

    const lines = selectedSummary.rows.map((row) => {
      const lineTotal = row.selected * nights * row.baseRate;
      return {
        roomTypeName: row.roomTypeName,
        quantity: row.selected,
        lineTotal,
      };
    });

    const total = lines.reduce((sum, line) => sum + line.lineTotal, 0);
    return { nights, lines, total };
  }, [searchCriteria, selectedSummary.rows]);

  type ReservationRoomLine = {
    lineId: string;
    roomTypeId: string;
    roomTypeName: string;
    nights: number;
    ratePerNight: number;
    grossAmount: number;
    seniorCount: number;
    seniorDiscountAmount: number;
    netAmount: number;
    maxSeniorCount: number;
  };

  const reservationDetailLines = useMemo(() => {
    if (!searchCriteria || selectedSummary.rows.length === 0) {
      return [] as ReservationRoomLine[];
    }

    const arrival = parseDateOnly(searchCriteria.arrivalDate);
    const departure = parseDateOnly(searchCriteria.departureDate);
    const diffInMs = departure.getTime() - arrival.getTime();
    const nights = Math.max(1, Math.round(diffInMs / (1000 * 60 * 60 * 24)));

    return selectedSummary.rows.flatMap((row) =>
      Array.from({ length: Math.max(0, row.selected) }, (_, idx) => {
        const lineId = `${row.roomTypeId}-${idx + 1}`;
        const grossAmount = round2(nights * row.baseRate);
        const maxSeniorCount = Math.max(0, Math.max(1, row.maxAdults));
        const requestedSeniorCount = seniorCountsByRoom[lineId] ?? 0;
        const seniorCount = Math.max(0, Math.min(Math.floor(requestedSeniorCount), maxSeniorCount));

        const sharePerOccupant = maxSeniorCount > 0 ? grossAmount / maxSeniorCount : 0;
        const seniorShare = sharePerOccupant * seniorCount;
        const seniorVatExclusive = seniorShare / (1 + VAT_RATE);
        const seniorDiscountAmountRaw = seniorVatExclusive * (SC_DISCOUNT_PERCENT / 100);
        const seniorDiscountAmount = round2(seniorDiscountAmountRaw);
        const seniorPays = seniorVatExclusive - seniorDiscountAmountRaw;
        const nonSeniorPays = sharePerOccupant * (maxSeniorCount - seniorCount);
        const netAmount = round2(Math.max(0, seniorPays + nonSeniorPays));

        return {
          lineId,
          roomTypeId: row.roomTypeId,
          roomTypeName: row.roomTypeName,
          nights,
          ratePerNight: row.baseRate,
          grossAmount,
          seniorCount,
          seniorDiscountAmount,
          netAmount,
          maxSeniorCount,
        };
      })
    );
  }, [searchCriteria, selectedSummary.rows, seniorCountsByRoom]);

  const reservationDetailTotal = useMemo(
    () => round2(reservationDetailLines.reduce((sum, line) => sum + line.netAmount, 0)),
    [reservationDetailLines]
  );

  const assignedRoomLookup = useMemo(() => {
    const map = new Map<string, RoomListDto>();
    for (const room of availableRooms) {
      map.set(room.id, room);
    }
    for (const room of freshRoomStatuses ?? []) {
      map.set(room.id, room);
    }
    return map;
  }, [availableRooms, freshRoomStatuses]);

  const hasUnassignedRooms = useMemo(
    () =>
      reservationDetailLines.some((line) => {
        const assignedRoomId = (assignedRoomByLine[line.lineId] ?? '').trim();
        if (!assignedRoomId) return true;
        return !assignedRoomLookup.has(assignedRoomId);
      }),
    [reservationDetailLines, assignedRoomByLine, assignedRoomLookup]
  );

  const hasDirtyRoomsAssigned = useMemo(() => {
    if (assignedRoomIds.length === 0) return false;
    return assignedRoomIds.some((roomId) => {
      const assignedRoom = assignedRoomLookup.get(roomId);
      return assignedRoom?.housekeepingStatus === HousekeepingStatus.Dirty;
    });
  }, [assignedRoomIds, assignedRoomLookup]);

  const hasOutOfOrderRoomsAssigned = useMemo(() => {
    if (assignedRoomIds.length === 0) return false;
    return assignedRoomIds.some((roomId) => isRoomOutOfOrder(assignedRoomLookup.get(roomId)));
  }, [assignedRoomIds, assignedRoomLookup]);

  const stayNights = useMemo(() => {
    if (!searchCriteria) return 0;
    const arrival = parseDateOnly(searchCriteria.arrivalDate);
    const departure = parseDateOnly(searchCriteria.departureDate);
    const diffInMs = departure.getTime() - arrival.getTime();
    return Math.max(1, Math.round(diffInMs / (1000 * 60 * 60 * 24)));
  }, [searchCriteria]);

  const extraBedTotal = useMemo(
    () =>
      round2(
        extraBedRows.reduce(
          (sum, row) =>
            sum + Math.max(0, row.quantity) * Math.max(0, row.ratePerNight) * Math.max(0, row.nights),
          0
        )
      ),
    [extraBedRows]
  );

  const selectionGrandTotal = useMemo(
    () => round2(reservationDetailTotal + extraBedTotal),
    [reservationDetailTotal, extraBedTotal]
  );

  const handleAvailabilityChange = useCallback(
    ({ availableRooms: nextAvailableRooms, availabilityRows: nextAvailabilityRows }: { availableRooms: RoomListDto[]; availabilityRows: RoomTypeAvailabilityRow[] }) => {
      setAvailableRooms(nextAvailableRooms);
      setAvailabilityRows(nextAvailabilityRows);
    },
    []
  );

  const handleSearch = (criteria: RoomTypeAvailabilitySearchCriteria) => {
    const nextCriteria: SearchCriteria = {
      ...criteria,
      adults,
      children,
      rooms: roomCount,
    };

    setSearchError('');
    setSelectedAmounts({});
    setShowReservationDetails(false);
    setShowGuestInfoStep(false);
    setSeniorCountsByRoom({});
    setAssignedRoomByLine({});
    setExtraBedRows([]);
    setShowAddExtraBedDialog(false);
    setShowGuestDialog(false);
    setSelectedGuest(null);
    setGuestInfoForm({
      guestCode: '',
      firstName: '',
      middleName: '',
      lastName: '',
      email: '',
      phone: '',
      nationality: '',
    });
    setTransactionNotes('');
    setReservationConditions('');
    setSpecialRequests('');
    setSuccessMessage('');
    setConfirmError('');
    setInitialDeposits([]);
    setShowDepositDialog(false);
    setRefundableDepositAmount('');
    setRefundableDepositPaymentMethodId('');
    setRefundableDepositReference('');
    closeAssignRoomDialog();
    setAvailabilityRows([]);
    setAvailableRooms([]);
    setSearchCriteria(nextCriteria);
  };

  const handleReserve = () => {
    if (!searchCriteria) return;

    if (selectedSummary.rows.length === 0) {
      setSearchError('Select at least one room from the table before proceeding.');
      return;
    }

    setSearchError('');
    setShowReservationDetails(true);
    setShowGuestInfoStep(false);
  };

  const handleSeniorCountChange = (lineId: string, value: string, maxValue: number) => {
    const parsed = Number(value);
    const next = Number.isNaN(parsed) ? 0 : Math.max(0, Math.min(Math.floor(parsed), maxValue));
    setSeniorCountsByRoom((prev) => ({
      ...prev,
      [lineId]: next,
    }));
  };

  const removeSelectedRoomLine = (lineId: string, roomTypeId: string) => {
    setSelectedAmounts((prev) => {
      const current = prev[roomTypeId] ?? 0;
      const nextValue = Math.max(0, current - 1);
      return {
        ...prev,
        [roomTypeId]: nextValue,
      };
    });

    setSeniorCountsByRoom((prev) => {
      const next = { ...prev };
      delete next[lineId];
      return next;
    });

    setAssignedRoomByLine((prev) => {
      const next = { ...prev };
      delete next[lineId];
      return next;
    });

    if (assignDialogLineId === lineId) {
      closeAssignRoomDialog();
    }
  };

  const handleAssignRoom = (lineId: string, roomId: string) => {
    setAssignedRoomByLine((prev) => ({
      ...prev,
      [lineId]: roomId,
    }));
  };

  const assignDialogLine = useMemo(
    () => reservationDetailLines.find((line) => line.lineId === assignDialogLineId),
    [reservationDetailLines, assignDialogLineId]
  );

  const isChangeRoomDialog = useMemo(
    () => Boolean(assignDialogLineId && assignedRoomByLine[assignDialogLineId]),
    [assignDialogLineId, assignedRoomByLine]
  );

  const openAssignRoomDialog = (lineId: string) => {
    setAssignDialogLineId(lineId);
    setAssignDialogSelectedRoomId(assignedRoomByLine[lineId] ?? '');
  };

  const closeAssignRoomDialog = () => {
    setAssignDialogLineId('');
    setAssignDialogSelectedRoomId('');
  };

  const confirmAssignRoom = (roomId: string) => {
    if (!assignDialogLineId || !roomId) return;
    handleAssignRoom(assignDialogLineId, roomId);
    closeAssignRoomDialog();
  };

  const openAddExtraBedDialog = () => {
    setShowAddExtraBedDialog(true);
  };

  const addExtraBedRow = (extraBedTypeId: string, quantity: number) => {
    const safeQuantity = Math.max(1, Math.floor(quantity));
    const selectedType = (extraBedTypes ?? []).find((item) => item.id === extraBedTypeId);
    if (!selectedType) return;

    const id = `extra-bed-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    setExtraBedRows((prev) => [
      ...prev,
      {
        id,
        extraBedTypeId: selectedType.id,
        extraBedTypeName: selectedType.name,
        quantity: safeQuantity,
        nights: stayNights,
        ratePerNight: selectedType.basePrice,
      },
    ]);
  };

  const updateExtraBedRow = (id: string, patch: Partial<ExtraBedSelectionRow>) => {
    setExtraBedRows((prev) => prev.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  };

  const removeExtraBedRow = (id: string) => {
    setExtraBedRows((prev) => prev.filter((row) => row.id !== id));
  };

  const paymentMethodNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const method of paymentMethods ?? []) {
      map.set(method.id, method.name);
    }
    return map;
  }, [paymentMethods]);

  const initialDepositTotal = useMemo(
    () => round2(initialDeposits.reduce((sum, row) => sum + row.amount, 0)),
    [initialDeposits]
  );

  const balanceDue = useMemo(
    () => round2(Math.max(0, selectionGrandTotal - initialDepositTotal)),
    [selectionGrandTotal, initialDepositTotal]
  );

  const openAddDepositDialog = () => {
    setShowDepositDialog(true);
  };

  const saveDepositDialog = (values: Omit<InitialDepositRow, 'id'>) => {
    const payload: InitialDepositRow = {
      id: `dep-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      amount: Math.max(0, Number(values.amount || 0)),
      paymentMethodId: values.paymentMethodId,
      paidDate: values.paidDate,
      referenceNo: values.referenceNo,
    };

    setInitialDeposits((prev) => [...prev, payload]);
    setShowDepositDialog(false);
  };

  const removeInitialDepositRow = (id: string) => {
    setInitialDeposits((prev) => prev.filter((row) => row.id !== id));
  };

  const refundableDeposit = Number(refundableDepositAmount || 0);

  const savePreCheckInMutation = useMutation({
    mutationFn: async () => {
      if (!searchCriteria) {
        throw new Error('Please search for rooms first.');
      }
      if (reservationDetailLines.length === 0) {
        throw new Error('No room selections found.');
      }

      const preCheckInRooms = reservationDetailLines.map((line) => ({
        roomTypeId: line.roomTypeId,
        roomId: assignedRoomByLine[line.lineId] || undefined,
        roomTypeName: line.roomTypeName,
        roomNumber: availableRooms.find((r) => r.id === assignedRoomByLine[line.lineId])?.roomNumber || '',
        ratePerNight: round2(line.ratePerNight),
        numberOfNights: line.nights,
        amount: round2(line.grossAmount),
        seniorCitizenCount: line.seniorCount,
        seniorCitizenDiscountAmount: round2(line.seniorDiscountAmount),
        netAmount: round2(line.netAmount),
      }));

      const preCheckInExtraBeds = extraBedRows.map((row) => ({
        extraBedTypeId: row.extraBedTypeId || undefined,
        extraBedTypeName: row.extraBedTypeName,
        quantity: row.quantity,
        ratePerNight: round2(row.ratePerNight),
        numberOfNights: row.nights,
        amount: round2(row.quantity * row.ratePerNight * row.nights),
      }));

      const input = {
        guestId: selectedGuest?.id || undefined,
        arrivalDate: searchCriteria.arrivalDate,
        departureDate: searchCriteria.departureDate,
        adults: searchCriteria.adults,
        children: searchCriteria.children,
        totalAmount: round2(selectionGrandTotal),
        notes: transactionNotes || undefined,
        specialRequests: specialRequests || undefined,
        guestName: selectedGuest ? `${guestInfoForm.firstName} ${guestInfoForm.lastName}`.trim() : undefined,
        firstName: guestInfoForm.firstName || undefined,
        lastName: guestInfoForm.lastName || undefined,
        phone: guestInfoForm.phone || undefined,
        email: guestInfoForm.email || undefined,
        rooms: preCheckInRooms,
        extraBeds: preCheckInExtraBeds.length > 0 ? preCheckInExtraBeds : undefined,
      };

      if (loadedPreCheckInId) {
        return resortService.updatePreCheckIn({ ...input, id: loadedPreCheckInId });
      }
      return resortService.createPreCheckIn(input);
    },
    onSuccess: (preCheckInId) => {
      if (!loadedPreCheckInId) {
        navigate(`/front-desk/walk-in/${preCheckInId}`, { replace: true });
      }
      setLoadedPreCheckInId(preCheckInId);
      setPreCheckInSaveMessage('Pre-check-in saved successfully!');
      void queryClient.invalidateQueries({ queryKey: ['resort-precheckins-pending'] });
      setTimeout(() => setPreCheckInSaveMessage(''), 3000);
    },
    onError: (error) => {
      setPreCheckInSaveMessage(getErrorMessage(error));
      setTimeout(() => setPreCheckInSaveMessage(''), 5000);
    },
  });

  const loadPreCheckIn = async (preCheckInId: string) => {
    try {
      const preCheckIn = await resortService.getPreCheckIn(preCheckInId);

      const arrival = parseDateOnly(preCheckIn.arrivalDate.split('T')[0]);
      const departure = parseDateOnly(preCheckIn.departureDate.split('T')[0]);
      setStayRange([arrival, departure]);

      const roomTypeIdsFromPreCheckIn = [...new Set(preCheckIn.rooms.map((r) => r.roomTypeId))];
      setSelectedRoomTypeIds(roomTypeIdsFromPreCheckIn);
      setAdults(preCheckIn.adults);
      setChildren(preCheckIn.children);

      const effectiveChannelId = selectedChannelId || channels?.[0]?.id || '';

      const criteria: SearchCriteria = {
        roomTypeIds: roomTypeIdsFromPreCheckIn,
        arrivalDate: preCheckIn.arrivalDate.split('T')[0],
        departureDate: preCheckIn.departureDate.split('T')[0],
        channelId: effectiveChannelId,
        adults: preCheckIn.adults,
        children: preCheckIn.children,
        rooms: preCheckIn.rooms.length,
      };
      setSelectedChannelId(effectiveChannelId);
      setSearchCriteria(criteria);

      const searchResults = await Promise.all(
        roomTypeIdsFromPreCheckIn.map((roomTypeId) =>
          resortService.getAvailableRooms(
            roomTypeId,
            criteria.arrivalDate,
            criteria.departureDate,
            undefined,
            false,
            true,
            criteria.channelId,
          )
        )
      );
      const allRooms = searchResults.flat();
      setAvailableRooms(allRooms);

      const amounts: Record<string, number> = {};
      preCheckIn.rooms.forEach((room) => {
        amounts[room.roomTypeId] = (amounts[room.roomTypeId] || 0) + 1;
      });
      setSelectedAmounts(amounts);

      const seniors: Record<string, number> = {};
      const assigned: Record<string, string> = {};
      preCheckIn.rooms.forEach((room, idx) => {
        const lineId = `${room.roomTypeId}-${idx + 1}`;
        seniors[lineId] = room.seniorCitizenCount;
        if (room.roomId) {
          const foundRoom = allRooms.find((r) => r.id === room.roomId);
          if (foundRoom) {
            assigned[lineId] = room.roomId;
          }
        }
      });
      setSeniorCountsByRoom(seniors);
      setAssignedRoomByLine(assigned);

      const beds: ExtraBedSelectionRow[] = preCheckIn.extraBeds.map((bed, idx) => ({
        id: `extra-bed-loaded-${idx}`,
        extraBedTypeId: bed.extraBedTypeId || '',
        extraBedTypeName: bed.extraBedTypeName || '',
        quantity: bed.quantity,
        nights: bed.numberOfNights,
        ratePerNight: bed.ratePerNight,
      }));
      setExtraBedRows(beds);

      if (preCheckIn.guestId) {
        setSelectedGuest({
          id: preCheckIn.guestId,
          guestCode: '',
          fullName: preCheckIn.guestName || '',
          email: preCheckIn.email,
          phone: preCheckIn.phone,
          nationality: '',
        });
        setGuestInfoForm({
          guestCode: '',
          firstName: preCheckIn.firstName || '',
          middleName: '',
          lastName: preCheckIn.lastName || '',
          email: preCheckIn.email || '',
          phone: preCheckIn.phone || '',
          nationality: '',
        });
      }

      setTransactionNotes(preCheckIn.notes || '');
      setSpecialRequests(preCheckIn.specialRequests || '');
      setLoadedPreCheckInId(preCheckIn.id);
      setShowReservationDetails(true);
      setShowPreCheckInListDialog(false);

      navigate(`/front-desk/walk-in/${preCheckIn.id}`, { replace: true });
    } catch (error) {
      setConfirmError(getErrorMessage(error));
    }
  };

  useEffect(() => {
    if (urlPreCheckInId && !loadedPreCheckInId) {
      void loadPreCheckIn(urlPreCheckInId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlPreCheckInId]);

  const completeCheckInMutation = useMutation({
    mutationFn: async () => {
      if (!searchCriteria) {
        throw new Error('Missing reservation search criteria.');
      }
      const hasGuest = !!selectedGuest?.id;
      const hasSnapshot = !!(guestInfoForm.firstName?.trim() && guestInfoForm.lastName?.trim() && guestInfoForm.phone?.trim());
      if (!hasGuest && !hasSnapshot) {
        throw new Error('Please search and select a guest, or enter first name, last name, and phone.');
      }
      if (reservationDetailLines.length === 0) {
        throw new Error('No room selections found for this reservation.');
      }
      if (reservationDetailLines.some((line) => !assignedRoomByLine[line.lineId])) {
        throw new Error('Please assign a room for each selected room line before confirming.');
      }
      if (hasUnassignedRooms) {
        throw new Error('One or more assigned rooms are no longer available. Please reassign rooms before confirming.');
      }
      if (hasOutOfOrderRoomsAssigned) {
        throw new Error('One or more assigned rooms are out of order. Please assign different rooms before confirming.');
      }
      if (refundableDeposit > 0 && !refundableDepositPaymentMethodId) {
        throw new Error('Please select a payment method for refundable cash deposit.');
      }

      const reservationRooms = reservationDetailLines
        .map((line) => {
          const assignedRoomId = assignedRoomByLine[line.lineId];
          if (!assignedRoomId) return null;

          return {
            roomTypeId: line.roomTypeId,
            roomId: assignedRoomId,
            ratePerNight: round2(line.ratePerNight),
            numberOfNights: line.nights,
            amount: round2(line.grossAmount),
            discountAmount: round2(line.grossAmount - line.netAmount),
            netAmount: round2(line.netAmount),
          };
        })
        .filter(
          (
            row,
          ): row is {
            roomTypeId: string;
            roomId: string;
            ratePerNight: number;
            numberOfNights: number;
            amount: number;
            discountAmount: number;
            netAmount: number;
          } => Boolean(row)
        );

      if (reservationRooms.length === 0) {
        throw new Error('No assigned room lines found for walk-in check-in.');
      }

      const validPayments = initialDeposits.filter(
        (row) => row.amount > 0 && row.paymentMethodId && row.paidDate
      );

      const checkInResult = await resortService.checkInWalkIn({
        guestId: selectedGuest?.id,
        firstName: guestInfoForm.firstName?.trim() || undefined,
        lastName: guestInfoForm.lastName?.trim() || undefined,
        phone: guestInfoForm.phone?.trim() || undefined,
        email: guestInfoForm.email?.trim() || undefined,
        roomId: reservationRooms[0].roomId,
        expectedCheckOutDate: searchCriteria.departureDate,
        reservationRooms,
        extraBeds: extraBedRows.map((row) => ({
          extraBedTypeId: row.extraBedTypeId || undefined,
          arrivalDate: searchCriteria.arrivalDate,
          departureDate: searchCriteria.departureDate,
          quantity: row.quantity,
          ratePerNight: round2(row.ratePerNight),
          numberOfNights: row.nights,
          amount: round2(row.quantity * row.ratePerNight * row.nights),
        })),
        payments: validPayments.map((row) => ({
          paymentMethodId: row.paymentMethodId,
          amount: round2(row.amount),
          paidDate: row.paidDate,
          referenceNo: row.referenceNo || undefined,
        })),
        refundableCashDepositAmount: refundableDeposit > 0 ? round2(refundableDeposit) : undefined,
        refundableCashDepositPaymentMethodId: refundableDepositPaymentMethodId || undefined,
        refundableCashDepositReference: refundableDepositReference || undefined,
      });

      return checkInResult;
    },
    onSuccess: async (result) => {
      setConfirmError('');

      if (loadedPreCheckInId) {
        try {
          await resortService.markPreCheckInCheckedIn(loadedPreCheckInId);
        } catch {
          // Pre-check-in status update is non-critical, continue with navigation
        }
      }

      void queryClient.invalidateQueries({ queryKey: ['resort-reservations'] });
      void queryClient.invalidateQueries({ queryKey: ['resort-reservations-checkin'] });
      void queryClient.invalidateQueries({ queryKey: ['resort-reservations-checkin-today'] });
      void queryClient.invalidateQueries({ queryKey: ['resort-stays'] });
      void queryClient.invalidateQueries({ queryKey: ['resort-available-rooms'] });
      void queryClient.invalidateQueries({ queryKey: ['resort-precheckins-pending'] });
      navigate('/front-desk/check-in/confirmation', {
        replace: true,
        state: {
          stayId: result.stayId,
          stayNo: result.stayNo,
          folioId: result.folioId,
          folioNo: result.folioNo,
        },
      });
    },
    onError: (error) => {
      setSuccessMessage('');
      setConfirmError(getErrorMessage(error));
    },
  });

  const currentStep = !showReservationDetails ? 1 : showGuestInfoStep ? 3 : 2;

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Walk-In</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Create a new stay without a reservation.</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              onClick={() => setShowPreCheckInListDialog(true)}
            >
              Load Pre-Check-In
            </button>
            {showReservationDetails && reservationDetailLines.length > 0 && (
              <button
                type="button"
                className="rounded bg-amber-600 px-3 py-2 text-sm text-white hover:bg-amber-700 disabled:opacity-50"
                disabled={savePreCheckInMutation.isPending}
                onClick={() => savePreCheckInMutation.mutate()}
              >
                {savePreCheckInMutation.isPending ? 'Saving...' : loadedPreCheckInId ? 'Update Pre-Check-In' : 'Save as Pre-Check-In'}
              </button>
            )}
          </div>
        </div>

        {preCheckInSaveMessage && (
          <div className={`rounded px-3 py-2 text-sm ${preCheckInSaveMessage.includes('success') ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300'}`}>
            {preCheckInSaveMessage}
          </div>
        )}

        {loadedPreCheckInId && (
          <div className="rounded bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:bg-amber-900/20 dark:text-amber-200">
            Loaded from pre-check-in. Changes will update the existing record when saved.
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="w-full rounded-lg border border-gray-200 bg-white/90 p-3 shadow-sm dark:border-gray-700 dark:bg-gray-800/80">
            <div className="grid grid-cols-3 gap-2 md:gap-3">
              <div className="flex items-center gap-2">
                <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${currentStep >= 1 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>1</span>
                <p className={`text-sm font-semibold ${currentStep === 1 ? 'text-primary-600 dark:text-primary-400' : 'text-gray-600 dark:text-gray-300'}`}>Your Selection</p>
              </div>
              <div className="flex items-center gap-2 border-l border-gray-200 pl-2 dark:border-gray-700 md:pl-3">
                <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${currentStep >= 2 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>2</span>
                <p className={`text-sm font-semibold ${currentStep === 2 ? 'text-primary-600 dark:text-primary-400' : 'text-gray-600 dark:text-gray-300'}`}>Customize</p>
              </div>
              <div className="flex items-center gap-2 border-l border-gray-200 pl-2 dark:border-gray-700 md:pl-3">
                <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${currentStep >= 3 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>3</span>
                <p className={`text-sm font-semibold ${currentStep === 3 ? 'text-primary-600 dark:text-primary-400' : 'text-gray-600 dark:text-gray-300'}`}>Details & Payment</p>
              </div>
            </div>
          </div>
        </div>

        {!showReservationDetails ? (
          <section className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Dates</label>
                <DatePicker
                  selectsRange
                  startDate={startDate}
                  endDate={endDate}
                  onChange={(update) => setStayRange(update as [Date | null, Date | null])}
                  dateFormat="MMM d, yyyy"
                  placeholderText="Select stay date range"
                  wrapperClassName="w-full"
                  className="w-full rounded border border-gray-300 p-2 text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Adults</label>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    className="rounded border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                    disabled={adults <= 1}
                    onClick={() => setAdults((prev) => Math.max(1, prev - 1))}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={adults}
                    onChange={(e) => {
                      const parsed = Number(e.target.value);
                      const next = Number.isNaN(parsed) ? 1 : Math.max(1, Math.min(10, Math.floor(parsed)));
                      setAdults(next);
                    }}
                    className="w-full rounded border border-gray-300 p-2 text-center text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                  />
                  <button
                    type="button"
                    className="rounded border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                    disabled={adults >= 10}
                    onClick={() => setAdults((prev) => Math.min(10, prev + 1))}
                  >
                    +
                  </button>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Children</label>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    className="rounded border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                    disabled={children <= 0}
                    onClick={() => setChildren((prev) => Math.max(0, prev - 1))}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min={0}
                    max={10}
                    value={children}
                    onChange={(e) => {
                      const parsed = Number(e.target.value);
                      const next = Number.isNaN(parsed) ? 0 : Math.max(0, Math.min(10, Math.floor(parsed)));
                      setChildren(next);
                    }}
                    className="w-full rounded border border-gray-300 p-2 text-center text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                  />
                  <button
                    type="button"
                    className="rounded border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                    disabled={children >= 10}
                    onClick={() => setChildren((prev) => Math.min(10, prev + 1))}
                  >
                    +
                  </button>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Number of Rooms</label>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    className="rounded border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                    disabled={roomCount <= 1}
                    onClick={() => setRoomCount((prev) => Math.max(1, prev - 1))}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={roomCount}
                    onChange={(e) => {
                      const parsed = Number(e.target.value);
                      const next = Number.isNaN(parsed) ? 1 : Math.max(1, Math.min(5, Math.floor(parsed)));
                      setRoomCount(next);
                    }}
                    className="w-full rounded border border-gray-300 p-2 text-center text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                  />
                  <button
                    type="button"
                    className="rounded border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                    disabled={roomCount >= 5}
                    onClick={() => setRoomCount((prev) => Math.min(5, prev + 1))}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <RoomTypeAvailabilitySearch
                roomTypes={roomTypes}
                arrivalDate={startDate ? formatDateLocal(startDate) : undefined}
                departureDate={endDate ? formatDateLocal(endDate) : undefined}
                channelId={selectedChannelId}
                channelOptions={(channels ?? []).map((channel) => ({ id: channel.id, name: channel.name }))}
                onChannelIdChange={setSelectedChannelId}
                selectedRoomTypeIds={selectedRoomTypeIds}
                onSelectedRoomTypeIdsChange={setSelectedRoomTypeIds}
                selectedAmounts={selectedAmounts}
                onSelectedAmountsChange={setSelectedAmounts}
                searchCriteria={searchCriteria}
                onSearch={handleSearch}
                errorMessage={searchError}
                onErrorMessageChange={setSearchError}
                excludeReservedWithoutAssignedRoom={false}
                checkInReadyOnly
                onAvailabilityChange={handleAvailabilityChange}
              />
            </div>
          </section>
        ) : null}

        {searchCriteria && !showReservationDetails ? (
          <section className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
            <div className="mt-4 flex items-center justify-between rounded border bg-slate-100 p-3 dark:border-gray-700 dark:bg-gray-700/40">
              <div>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Selection Package:</p>
                {selectedChannelId && (
                  <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                    Channel: <span className="font-medium text-gray-800 dark:text-gray-300">{channels?.find((c) => c.id === selectedChannelId)?.name || selectedChannelId}</span>
                  </p>
                )}
                {selectedPackage.lines.length > 0 ? (
                  <div className="mt-1 space-y-1">
                    {selectedPackage.lines.map((line) => (
                      <p key={line.roomTypeName} className="text-sm text-gray-600 dark:text-gray-300">
                        {line.quantity} {line.roomTypeName} room{line.quantity > 1 ? 's' : ''} x {selectedPackage.nights} night{selectedPackage.nights > 1 ? 's' : ''} = {formatMoney(line.lineTotal)}
                      </p>
                    ))}
                    <p className="font-semibold text-gray-900 dark:text-white">
                      Total: {formatMoney(selectedPackage.total)}
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Quantity: {totalSelectedQuantity}</p>
                    <p className="font-semibold text-gray-900 dark:text-white">P {selectedSummary.perNightTotal.toLocaleString()} per night</p>
                  </>
                )}
              </div>
              <button
                type="button"
                onClick={handleReserve}
                disabled={selectedSummary.rows.length === 0}
                className="inline-flex items-center gap-1 rounded bg-primary-600 px-4 py-2 text-white hover:bg-primary-700"
              >
                <span>Next</span>
                <span aria-hidden="true">&rarr;</span>
              </button>
            </div>
          </section>
        ) : null}

        {searchCriteria && showReservationDetails && !showGuestInfoStep ? (
          <section className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Reservation Details</h2>
            </div>

            <div className="rounded border border-gray-200 p-3 dark:border-gray-700">
              <p className="mb-2 text-sm font-semibold text-gray-800 dark:text-gray-200">Selection Package:</p>
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-200 text-sm dark:border-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700/40">
                    <tr>
                      <th className="border border-gray-200 p-2 text-left dark:border-gray-700">Room Type</th>
                      <th className="border border-gray-200 p-2 text-left dark:border-gray-700">Room No.</th>
                      <th className="border border-gray-200 p-2 text-center dark:border-gray-700">Action</th>
                      <th className="border border-gray-200 p-2 text-right dark:border-gray-700">Nights</th>
                      <th className="border border-gray-200 p-2 text-right dark:border-gray-700">Rate/Night</th>
                      <th className="border border-gray-200 p-2 text-right dark:border-gray-700">Gross</th>
                      <th className="border border-gray-200 p-2 text-right dark:border-gray-700">Senior Count</th>
                      <th className="border border-gray-200 p-2 text-right dark:border-gray-700">SC Discount</th>
                      <th className="border border-gray-200 p-2 text-right dark:border-gray-700">Net</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reservationDetailLines.map((line) => (
                      <tr key={line.lineId}>
                        <td className="border border-gray-200 p-2 dark:border-gray-700">
                          <div className="flex items-center justify-between gap-2">
                            <span>{line.roomTypeName}</span>
                            <button
                              type="button"
                              onClick={() => removeSelectedRoomLine(line.lineId, line.roomTypeId)}
                              className="rounded bg-rose-600 px-2 py-1 text-xs text-white hover:bg-rose-700"
                              title="Remove"
                            >
                              x
                            </button>
                          </div>
                        </td>
                        <td className="border border-gray-200 p-2 dark:border-gray-700">
                          {(() => {
                            const roomId = assignedRoomByLine[line.lineId];
                            const assignedRoom = roomId ? assignedRoomLookup.get(roomId) : undefined;
                            if (!assignedRoom) return 'Unassigned';
                            const isDirty = assignedRoom.housekeepingStatus === HousekeepingStatus.Dirty;
                            const isOOO = isRoomOutOfOrder(assignedRoom);
                            return (
                              <span className="inline-flex items-center gap-1">
                                {assignedRoom.roomNumber}
                                {isDirty && (
                                  <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                    Dirty
                                  </span>
                                )}
                                {isOOO && (
                                  <span className="rounded bg-rose-100 px-1.5 py-0.5 text-xs font-medium text-rose-700 dark:bg-rose-900/30 dark:text-rose-400">
                                    Out of Order
                                  </span>
                                )}
                              </span>
                            );
                          })()}
                        </td>
                        <td className="border border-gray-200 p-2 text-center dark:border-gray-700">
                          <button
                            type="button"
                            className="rounded bg-primary-600 px-2 py-1 text-xs text-white hover:bg-primary-700 disabled:opacity-50"
                            onClick={() => openAssignRoomDialog(line.lineId)}
                          >
                            {assignedRoomByLine[line.lineId] ? 'Change Room' : 'Assign Room'}
                          </button>
                        </td>
                        <td className="border border-gray-200 p-2 text-right dark:border-gray-700">{line.nights}</td>
                        <td className="border border-gray-200 p-2 text-right dark:border-gray-700">{formatMoney(line.ratePerNight)}</td>
                        <td className="border border-gray-200 p-2 text-right dark:border-gray-700">{formatMoney(line.grossAmount)}</td>
                        <td className="border border-gray-200 p-2 text-right dark:border-gray-700">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              className="rounded border border-gray-300 px-2 py-1 text-sm font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                              disabled={line.seniorCount <= 0}
                              onClick={() =>
                                handleSeniorCountChange(line.lineId, String(line.seniorCount - 1), line.maxSeniorCount)
                              }
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min={0}
                              max={line.maxSeniorCount}
                              value={line.seniorCount}
                              onChange={(e) => handleSeniorCountChange(line.lineId, e.target.value, line.maxSeniorCount)}
                              className="w-20 rounded border border-gray-300 p-1 text-right text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                            />
                            <button
                              type="button"
                              className="rounded border border-gray-300 px-2 py-1 text-sm font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                              disabled={line.seniorCount >= line.maxSeniorCount}
                              onClick={() =>
                                handleSeniorCountChange(line.lineId, String(line.seniorCount + 1), line.maxSeniorCount)
                              }
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td className="border border-gray-200 p-2 text-right dark:border-gray-700">{formatMoney(line.seniorDiscountAmount)}</td>
                        <td className="border border-gray-200 p-2 text-right font-semibold dark:border-gray-700">{formatMoney(line.netAmount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-between mt-3 text-right">
                {hasUnassignedRooms ? (
                  <p className="mt-2 text-sm text-rose-600">Assign a room for each selected line to continue.</p>
                ) : null}
                <p className="mt-3 text-right text-base font-semibold text-gray-900 dark:text-white">
                  Room Total: {formatMoney(reservationDetailTotal)}
                </p></div>
            </div>

            <div className="mt-4 rounded border border-gray-200 p-3 dark:border-gray-700">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Extra Bed Option</p>
                <button
                  type="button"
                  onClick={openAddExtraBedDialog}
                  className="rounded bg-slate-700 px-3 py-1 text-xs text-white hover:bg-slate-800"
                >
                  Add extra bed
                </button>
              </div>

              {extraBedRows.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">No extra bed rows added.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full border border-gray-200 text-sm dark:border-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700/40">
                      <tr>
                        <th className="border border-gray-200 p-2 text-left dark:border-gray-700">Type</th>
                        <th className="border border-gray-200 p-2 text-right dark:border-gray-700">Qty</th>
                        <th className="border border-gray-200 p-2 text-right dark:border-gray-700">Nights</th>
                        <th className="border border-gray-200 p-2 text-right dark:border-gray-700">Rate/Night</th>
                        <th className="border border-gray-200 p-2 text-right dark:border-gray-700">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {extraBedRows.map((row) => {
                        const rowAmount = round2(row.quantity * row.ratePerNight * row.nights);
                        return (
                          <tr key={row.id}>
                            <td className="border border-gray-200 p-2 dark:border-gray-700">
                              <div className="flex items-center justify-between gap-2">
                                <span>{row.extraBedTypeName}</span>
                                <button
                                  type="button"
                                  onClick={() => removeExtraBedRow(row.id)}
                                  className="rounded bg-rose-600 px-2 py-1 text-xs text-white hover:bg-rose-700"
                                  title='Remove'
                                >
                                  x
                                </button>
                              </div>
                            </td>
                            <td className="border border-gray-200 p-2 text-right dark:border-gray-700">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  type="button"
                                  className="rounded border border-gray-300 px-2 py-1 text-sm font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                                  disabled={row.quantity <= 1}
                                  onClick={() =>
                                    updateExtraBedRow(row.id, {
                                      quantity: Math.max(1, row.quantity - 1),
                                    })
                                  }
                                >
                                  -
                                </button>
                                <input
                                  type="number"
                                  min={1}
                                  value={row.quantity}
                                  onChange={(e) =>
                                    updateExtraBedRow(row.id, {
                                      quantity: Math.max(1, Math.floor(Number(e.target.value || 1))),
                                    })
                                  }
                                  className="w-20 rounded border border-gray-300 p-1 text-right text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                                />
                                <button
                                  type="button"
                                  className="rounded border border-gray-300 px-2 py-1 text-sm font-semibold text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                                  onClick={() =>
                                    updateExtraBedRow(row.id, {
                                      quantity: row.quantity + 1,
                                    })
                                  }
                                >
                                  +
                                </button>
                              </div>
                            </td>
                            <td className="border border-gray-200 p-2 text-right dark:border-gray-700">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  type="button"
                                  className="rounded border border-gray-300 px-2 py-1 text-sm font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                                  disabled={row.nights <= 1}
                                  onClick={() =>
                                    updateExtraBedRow(row.id, {
                                      nights: Math.max(1, row.nights - 1),
                                    })
                                  }
                                >
                                  -
                                </button>
                                <input
                                  type="number"
                                  min={1}
                                  max={stayNights}
                                  value={row.nights}
                                  onChange={(e) =>
                                    updateExtraBedRow(row.id, {
                                      nights: Math.max(1, Math.min(stayNights, Math.floor(Number(e.target.value || 1)))),
                                    })
                                  }
                                  className="w-20 rounded border border-gray-300 p-1 text-right text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                                />
                                <button
                                  type="button"
                                  className="rounded border border-gray-300 px-2 py-1 text-sm font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                                  disabled={row.nights >= stayNights}
                                  onClick={() =>
                                    updateExtraBedRow(row.id, {
                                      nights: Math.min(stayNights, row.nights + 1),
                                    })
                                  }
                                >
                                  +
                                </button>
                              </div>
                            </td>
                            <td className="border border-gray-200 p-2 text-right dark:border-gray-700">{formatMoney(row.ratePerNight)}</td>
                            <td className="border border-gray-200 p-2 text-right dark:border-gray-700">{formatMoney(rowAmount)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              <p className="mt-3 text-right text-base font-semibold text-gray-900 dark:text-white">
                Extra Bed Total: {formatMoney(extraBedTotal)}
              </p>
            </div>

            <p className="mt-4 text-right text-lg font-bold text-gray-900 dark:text-white">
              Total: {formatMoney(selectionGrandTotal)}
            </p>

            <div className="mt-4 rounded border border-gray-200 bg-slate-50 p-3 dark:border-gray-700 dark:bg-gray-700/30">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Selection Package:</p>
              <div className="mt-2 space-y-1">
                {reservationDetailLines.map((line) => (
                  <p key={`bottom-summary-${line.lineId}`} className="text-sm text-gray-600 dark:text-gray-300">
                    1 {line.roomTypeName} room x {line.nights} night{line.nights > 1 ? 's' : ''}{line.seniorCount > 0 ? ` (${line.seniorCount} senior${line.seniorCount === 1 ? '' : 's'})` : ''} = {formatMoney(line.netAmount)}
                  </p>
                ))}

                {extraBedRows.length > 0 ? (
                  <>
                    {extraBedRows.map((row) => {
                      const rowAmount = round2(row.quantity * row.ratePerNight * row.nights);
                      return (
                        <p key={`bottom-extra-bed-${row.id}`} className="text-sm text-gray-600 dark:text-gray-300">
                          {row.quantity} {row.extraBedTypeName} x {row.nights} night{row.nights > 1 ? 's' : ''} = {formatMoney(rowAmount)}
                        </p>
                      );
                    })}
                  </>
                ) : null}

                <p className="font-semibold text-gray-900 dark:text-white">Total Net Amount: {formatMoney(selectionGrandTotal)}</p>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowReservationDetails(false)}
                className="inline-flex items-center gap-1 rounded border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                <span aria-hidden="true">&larr;</span>
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={() => setShowGuestInfoStep(true)}
                disabled={hasUnassignedRooms || hasOutOfOrderRoomsAssigned}
                className="inline-flex items-center gap-1 rounded bg-primary-600 px-4 py-2 text-white hover:bg-primary-700 disabled:opacity-50"
              >
                <span>Next</span>
                <span aria-hidden="true">&rarr;</span>
              </button>
            </div>

            <AddExtraBedDialog
              open={showAddExtraBedDialog}
              extraBedTypes={extraBedTypes ?? []}
              onClose={() => setShowAddExtraBedDialog(false)}
              onAdd={addExtraBedRow}
            />
          </section>
        ) : null}

        {searchCriteria && showReservationDetails && showGuestInfoStep ? (
          <section className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Guest Info & Deposit</h2>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="rounded border border-gray-200 p-3 dark:border-gray-700 lg:col-span-2">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Guest Info</p>
                  <button
                    type="button"
                    className="rounded bg-primary-600 px-3 py-2 text-sm text-white hover:bg-primary-700"
                    onClick={() => setShowGuestDialog(true)}
                  >
                    Search Guest
                  </button>
                </div>

                <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">First Name</label>
                    <input
                      className="w-full rounded border border-gray-300 p-2 text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                      value={guestInfoForm.firstName}
                      onChange={(e) => setGuestInfoForm((s) => ({ ...s, firstName: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Middle Name</label>
                    <input
                      className="w-full rounded border border-gray-300 p-2 text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                      value={guestInfoForm.middleName}
                      onChange={(e) => setGuestInfoForm((s) => ({ ...s, middleName: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Last Name</label>
                    <input
                      className="w-full rounded border border-gray-300 p-2 text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                      value={guestInfoForm.lastName}
                      onChange={(e) => setGuestInfoForm((s) => ({ ...s, lastName: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Phone</label>
                    <input
                      className="w-full rounded border border-gray-300 p-2 text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                      value={guestInfoForm.phone}
                      onChange={(e) => setGuestInfoForm((s) => ({ ...s, phone: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                    <input
                      className="w-full rounded border border-gray-300 p-2 text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                      value={guestInfoForm.email}
                      onChange={(e) => setGuestInfoForm((s) => ({ ...s, email: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Nationality</label>
                    <input
                      className="w-full rounded border border-gray-300 p-2 text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                      value={guestInfoForm.nationality}
                      onChange={(e) => setGuestInfoForm((s) => ({ ...s, nationality: e.target.value }))}
                    />
                  </div>
                  <div className="md:col-span-3 grid grid-cols-1 gap-2 md:grid-cols-1">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Notes</label>
                      <textarea
                        rows={3}
                        className="w-full rounded border border-gray-300 p-2 text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                        value={transactionNotes}
                        onChange={(e) => setTransactionNotes(e.target.value)}
                        placeholder="Transaction note"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Reservation Conditions</label>
                      <textarea
                        rows={3}
                        className="w-full rounded border border-gray-300 p-2 text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                        value={reservationConditions}
                        onChange={(e) => setReservationConditions(e.target.value)}
                        placeholder="Optional reservation conditions"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Special Requests</label>
                      <textarea
                        rows={3}
                        className="w-full rounded border border-gray-300 p-2 text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                        value={specialRequests}
                        onChange={(e) => setSpecialRequests(e.target.value)}
                        placeholder="Optional special requests"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded border border-gray-200 bg-slate-50 p-3 dark:border-gray-700 dark:bg-gray-700/30 lg:col-span-1">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Selection Summary</p>
                <div className="mt-2 space-y-1">
                  {reservationDetailLines.map((line) => (
                    <div key={`guest-step-summary-${line.lineId}`} className="flex items-start justify-between gap-3 text-sm text-gray-600 dark:text-gray-300">
                      <p>
                        1 {line.roomTypeName} room x {line.nights} night{line.nights > 1 ? 's' : ''}{line.seniorCount > 0 ? ` (${line.seniorCount} senior${line.seniorCount === 1 ? '' : 's'})` : ''}
                      </p>
                      <p className="shrink-0 text-right tabular-nums">{formatMoney(line.netAmount)}</p>
                    </div>
                  ))}

                  {extraBedRows.length > 0 ? (
                    <>
                      <p className="mt-2 text-sm font-semibold text-gray-700 dark:text-gray-200">Extra bed:</p>
                      {extraBedRows.map((row) => {
                        const rowAmount = round2(row.quantity * row.ratePerNight * row.nights);
                        return (
                          <div key={`guest-step-extra-${row.id}`} className="flex items-start justify-between gap-3 text-sm text-gray-600 dark:text-gray-300">
                            <p>{row.quantity} {row.extraBedTypeName} x {row.nights} night{row.nights > 1 ? 's' : ''}</p>
                            <p className="shrink-0 text-right tabular-nums">{formatMoney(rowAmount)}</p>
                          </div>
                        );
                      })}
                    </>
                  ) : null}

                  <div className="mt-2 flex items-center justify-between gap-3 border-t border-gray-300 pt-2 font-semibold text-gray-900 dark:border-gray-600 dark:text-white">
                    <p>Total Net Amount</p>
                    <p className="text-right tabular-nums">{formatMoney(selectionGrandTotal)}</p>
                  </div>

                  <div className="mt-4 rounded border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800/50">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Payment Details</p>
                      <button
                        type="button"
                        onClick={openAddDepositDialog}
                        className="rounded bg-slate-700 px-2 py-1 text-xs text-white hover:bg-slate-800"
                      >
                        Add Payment
                      </button>
                    </div>
                    {initialDeposits.length === 0 ? (
                      <p className="text-sm text-gray-500 dark:text-gray-400">No payments added.</p>
                    ) : (
                      <div className="space-y-2">
                        {initialDeposits.map((row) => (
                          <div key={row.id} className="flex items-center justify-between rounded border border-gray-200 p-2 dark:border-gray-700">
                            <div className="text-sm text-gray-700 dark:text-gray-300">
                              <p>{formatMoney(row.amount)} - {paymentMethodNameById.get(row.paymentMethodId) ?? '-'}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{row.paidDate}{row.referenceNo ? ` | Ref: ${row.referenceNo}` : ''}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeInitialDepositRow(row.id)}
                              className="rounded bg-rose-600 px-2 py-1 text-xs text-white hover:bg-rose-700"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-3  pt-2 font-semibold text-gray-900 dark:text-white">
                    <p>Total Payments</p>
                    <p className="text-right tabular-nums">{formatMoney(initialDepositTotal)}</p>
                  </div>
                  <div className="flex items-center justify-between gap-3 border-t border-gray-300 pt-2 font-semibold text-gray-900 dark:border-gray-600 dark:text-white">
                    <p>BALANCE</p>
                    <p className="text-right tabular-nums">{formatMoney(balanceDue)}</p>
                  </div>

                  <div className="mt-4 rounded border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800/50">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Refundable Cash Deposit</p>
                    <div className="mt-2 grid grid-cols-1 gap-2">
                      <input
                        className="rounded border border-gray-300 p-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                        type="number"
                        min={0}
                        value={refundableDepositAmount}
                        onChange={(e) => setRefundableDepositAmount(e.target.value)}
                        placeholder="Amount"
                      />
                      <select
                        className="rounded border border-gray-300 p-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                        value={refundableDepositPaymentMethodId}
                        onChange={(e) => setRefundableDepositPaymentMethodId(e.target.value)}
                      >
                        <option value="">Payment method</option>
                        {(paymentMethods ?? []).map((method) => (
                          <option key={method.id} value={method.id}>
                            {method.name}
                          </option>
                        ))}
                      </select>
                      <input
                        className="rounded border border-gray-300 p-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                        value={refundableDepositReference}
                        onChange={(e) => setRefundableDepositReference(e.target.value)}
                        placeholder="Reference"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {successMessage ? (
              <div className="mt-4 rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-700/40 dark:bg-emerald-900/20 dark:text-emerald-200">
                <p>{successMessage}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="rounded bg-emerald-700 px-3 py-1.5 text-xs font-medium text-white"
                    onClick={() => navigate('/front-desk/stays')}
                  >
                    Open In-House Stays
                  </button>
                </div>
              </div>
            ) : null}

            <div className="mt-4 flex items-center justify-start">
              <button
                type="button"
                onClick={() => setShowGuestInfoStep(false)}
                className="inline-flex items-center gap-1 rounded border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                <span aria-hidden="true">&larr;</span>
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmError('');
                  setSuccessMessage('');
                  completeCheckInMutation.mutate();
                }}
                disabled={
                  completeCheckInMutation.isPending ||
                  !searchCriteria ||
                  (!selectedGuest?.id && !(guestInfoForm.firstName?.trim() && guestInfoForm.lastName?.trim() && guestInfoForm.phone?.trim())) ||
                  reservationDetailLines.length === 0 ||
                  hasUnassignedRooms ||
                  hasDirtyRoomsAssigned ||
                  hasOutOfOrderRoomsAssigned ||
                  (refundableDeposit > 0 && !refundableDepositPaymentMethodId)
                }
                className="ml-auto inline-flex items-center gap-1 rounded bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                <span>{completeCheckInMutation.isPending ? 'Checking In...' : 'Complete Check-In'}</span>
                <span aria-hidden="true">&rarr;</span>
              </button>
            </div>
            {hasDirtyRoomsAssigned && (
              <p className="mt-2 text-sm text-amber-600">
                Cannot complete check-in: one or more assigned rooms are dirty. Please clean the rooms first or assign different rooms.
              </p>
            )}
            {hasOutOfOrderRoomsAssigned && (
              <p className="mt-2 text-sm text-rose-600">
                Cannot complete check-in: one or more assigned rooms are out of order. Please assign different rooms.
              </p>
            )}
            {confirmError ? <p className="mt-2 text-sm text-rose-600">{confirmError}</p> : null}
          </section>
        ) : null}

        <SearchGuestDialog
          open={showGuestDialog}
          onClose={() => setShowGuestDialog(false)}
          onSelectGuest={(guest) => setSelectedGuest(guest)}
        />

        <AddPaymentDialog
          open={showDepositDialog}
          paymentMethods={paymentMethods ?? []}
          onClose={() => setShowDepositDialog(false)}
          onSave={saveDepositDialog}
        />

        <AssignRoomDialog
          open={Boolean(assignDialogLineId)}
          isChangeRoom={isChangeRoomDialog}
          roomTypeName={assignDialogLine?.roomTypeName}
          roomTypeId={assignDialogLine?.roomTypeId}
          arrivalDate={searchCriteria?.arrivalDate ?? null}
          departureDate={searchCriteria?.departureDate ?? null}
          selectedRoomId={assignDialogSelectedRoomId}
          excludeRoomIds={Object.entries(assignedRoomByLine)
            .filter(([lineId, roomId]) => lineId !== assignDialogLineId && Boolean(roomId))
            .map(([, roomId]) => roomId)}
          allowDirtySelection={Boolean(loadedPreCheckInId)}
          onSelectRoom={(roomId) => {
            setAssignDialogSelectedRoomId(roomId);
            confirmAssignRoom(roomId);
          }}
          onClose={closeAssignRoomDialog}
        />

        <LoadPreCheckInDialog
          open={showPreCheckInListDialog}
          walkInOnly
          onSelect={(id) => void loadPreCheckIn(id)}
          onClose={() => setShowPreCheckInListDialog(false)}
        />
      </div>
    </>
  );
};
