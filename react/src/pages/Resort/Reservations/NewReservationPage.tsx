import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { MainLayout } from '@components/layout/MainLayout';
import { resortService } from '@services/resort.service';
import { EditReservationRoomDialog, ReservationRoomPricingValues } from './EditReservationRoomDialog';
import { EditExtraBedDialog, ExtraBedPricingValues } from './EditExtraBedDialog';
import { SelectExtraBedTypeDialog } from './SelectExtraBedTypeDialog';

const formatDateLocal = (value: Date) => {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
};

type SearchCriteria = {
  roomTypeIds: string[];
  arrivalDate: string;
  departureDate: string;
};

type AvailabilityPrefillState = {
  fromAvailability?: boolean;
  arrivalDate?: string;
  departureDate?: string;
  roomTypeIds?: string[];
};

type ExtraBedRow = {
  id: string;
  extraBedTypeId?: string;
  extraBedTypeName?: string;
  arrivalDate: string;
  departureDate: string;
  quantity: number;
  ratePerNight: number;
  numberOfNights: number;
  amount: number;
  discountPercent: number;
  discountAmount: number;
  seniorCitizenCount: number;
  seniorCitizenPercent: number;
  seniorCitizenDiscountAmount: number;
  netAmount: number;
};

type InitialDepositRow = {
  id: string;
  amount: number;
  paymentMethodId: string;
  paidDate: string;
  referenceNo: string;
};

const parseLocalDate = (value: string) => {
  const parts = value.split('-').map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return null;
  const [year, month, day] = parts;
  return new Date(year, month - 1, day);
};

const splitGuestName = (fullName: string) => {
  const trimmed = fullName.trim();
  if (!trimmed) return { firstName: '', lastName: '' };
  const parts = trimmed.split(/\s+/);
  const firstName = parts[0] ?? '';
  const lastName = parts.length > 1 ? parts.slice(1).join(' ') : '';
  return { firstName, lastName };
};

const round2 = (value: number) => Math.round(value * 100) / 100;
const formatMoney = (value: number) =>
  round2(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const computeSeniorPricing = (
  amount: number,
  discountAmount: number,
  scPercent: number,
  scCount: number,
  occupantCount: number,
  vatRate: number
) => {
  const safeOccupantCount = Math.max(1, Math.floor(occupantCount));
  const effectiveScCount = Math.max(0, Math.min(scCount, safeOccupantCount));

  const amountAfterDiscount = Math.max(0, amount - discountAmount);
  const sharePerOccupant = amountAfterDiscount / safeOccupantCount;

  if (effectiveScCount === 0 || scPercent <= 0) {
    return {
      scDiscountAmount: 0,
      netAmount: round2(amountAfterDiscount),
    };
  }

  const seniorShare = sharePerOccupant * effectiveScCount;
  const seniorVatExclusive = seniorShare / (1 + vatRate);
  const scDiscountAmount = seniorVatExclusive * (scPercent / 100);
  const seniorPays = seniorVatExclusive - scDiscountAmount;
  const nonSeniorPays = sharePerOccupant * (safeOccupantCount - effectiveScCount);
  const netAmount = seniorPays + nonSeniorPays;

  return {
    scDiscountAmount: round2(Math.max(0, scDiscountAmount)),
    netAmount: round2(Math.max(0, netAmount)),
  };
};

export const NewReservationPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [guestId, setGuestId] = useState('');
  const [depositPercentage, setDepositPercentage] = useState(50);
  const [occupancyAdults, setOccupancyAdults] = useState(2);
  const [occupancyChildren, setOccupancyChildren] = useState(0);
  const [selectedRoomTypeIds, setSelectedRoomTypeIds] = useState<string[]>([]);
  const [stayRange, setStayRange] = useState<[Date | null, Date | null]>([null, null]);
  const [searchCriteria, setSearchCriteria] = useState<SearchCriteria | null>(null);
  const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>([]);
  const [extraBedRows, setExtraBedRows] = useState<ExtraBedRow[]>([]);
  const [editingExtraBedId, setEditingExtraBedId] = useState<string | null>(null);
  const [showExtraBedTypeDialog, setShowExtraBedTypeDialog] = useState(false);
  const [editedRoomValues, setEditedRoomValues] = useState<Record<string, ReservationRoomPricingValues>>({});
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [showReservationDetails, setShowReservationDetails] = useState(false);
  const [initialDeposits, setInitialDeposits] = useState<InitialDepositRow[]>([]);
  const [showDepositDialog, setShowDepositDialog] = useState(false);
  const [editingDepositId, setEditingDepositId] = useState<string | null>(null);
  const [depositForm, setDepositForm] = useState({
    amount: 0,
    paymentMethodId: '',
    paidDate: formatDateLocal(new Date()),
    referenceNo: '',
  });
  const [showGuestDialog, setShowGuestDialog] = useState(false);
  const [guestFilter, setGuestFilter] = useState('');
  const [selectedGuestName, setSelectedGuestName] = useState('');
  const [selectedGuestFirstName, setSelectedGuestFirstName] = useState('');
  const [selectedGuestLastName, setSelectedGuestLastName] = useState('');
  const [selectedGuestContactNumber, setSelectedGuestContactNumber] = useState('');
  const [selectedGuestEmail, setSelectedGuestEmail] = useState('');
  const [showCreateGuest, setShowCreateGuest] = useState(false);
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

  const [startDate, endDate] = stayRange;

  const SC_DISCOUNT_PERCENT = 20;
  const VAT_RATE = 0.12;

  const [form, setForm] = useState({
    searchError: '',
  });

  const { data: roomTypes } = useQuery({
    queryKey: ['resort-room-types'],
    queryFn: () => resortService.getRoomTypes(),
  });

  const { data: guestsData, isLoading: guestsLoading } = useQuery({
    queryKey: ['reservation-guest-search', guestFilter],
    queryFn: () => resortService.getGuests(guestFilter, 0, 20),
    enabled: showGuestDialog,
  });

  const { data: extraBedTypes, isLoading: extraBedTypesLoading } = useQuery({
    queryKey: ['resort-extra-bed-types'],
    queryFn: () => resortService.getExtraBedTypes(),
  });

  const { data: paymentMethods } = useQuery({
    queryKey: ['resort-payment-methods'],
    queryFn: () => resortService.getPaymentMethods(),
  });

  const searchMutation = useMutation({
    mutationFn: async (input: SearchCriteria) => {
      const responseList = await Promise.all(
        input.roomTypeIds.map((roomTypeId) =>
          resortService.getAvailableRooms(roomTypeId, input.arrivalDate, input.departureDate)
        )
      );

      const merged = responseList.flat();
      const uniqueById = new Map(merged.map((room) => [room.id, room]));
      return Array.from(uniqueById.values()).sort((a, b) => a.roomNumber.localeCompare(b.roomNumber));
    },
  });

  useEffect(() => {
    const prefill = (location.state as AvailabilityPrefillState | null) ?? null;
    if (!prefill?.fromAvailability) return;
    if (!prefill.arrivalDate || !prefill.departureDate || !(prefill.roomTypeIds?.length)) return;

    const arrival = parseLocalDate(prefill.arrivalDate);
    const departure = parseLocalDate(prefill.departureDate);
    if (!arrival || !departure || arrival >= departure) return;

    const nextCriteria: SearchCriteria = {
      roomTypeIds: prefill.roomTypeIds,
      arrivalDate: prefill.arrivalDate,
      departureDate: prefill.departureDate,
    };

    setSelectedRoomTypeIds(prefill.roomTypeIds);
    setStayRange([arrival, departure]);
    setForm({ searchError: '' });
    setSelectedRoomIds([]);
    setSearchCriteria(nextCriteria);
    searchMutation.mutate(nextCriteria);
  }, [location.state]);

  const createMutation = useMutation({
    mutationFn: async (input: Parameters<typeof resortService.createReservation>[0]) => {
      const newReservationId = await resortService.createReservation(input);
      const validDeposits = initialDeposits.filter((row) => row.amount > 0 && row.paymentMethodId && row.paidDate);

      for (const row of validDeposits) {
        await resortService.recordReservationDeposit({
          reservationId: newReservationId,
          amount: round2(row.amount),
          paymentMethodId: row.paymentMethodId,
          paidDate: row.paidDate,
          referenceNo: row.referenceNo || undefined,
        });
      }

      return newReservationId;
    },
    onSuccess: (newReservationId) => {
      setGuestId('');
      setSelectedGuestName('');
      setSelectedGuestFirstName('');
      setSelectedGuestLastName('');
      setSelectedGuestContactNumber('');
      setSelectedGuestEmail('');
      setDepositPercentage(50);
      setOccupancyAdults(2);
      setOccupancyChildren(0);
      setSelectedRoomTypeIds([]);
      setStayRange([null, null]);
      setSearchCriteria(null);
      setSelectedRoomIds([]);
      setExtraBedRows([]);
      setInitialDeposits([]);
      setShowDepositDialog(false);
      setEditingDepositId(null);
      setDepositForm({
        amount: 0,
        paymentMethodId: '',
        paidDate: formatDateLocal(new Date()),
        referenceNo: '',
      });
      setEditedRoomValues({});
      setForm({ searchError: '' });
      void queryClient.invalidateQueries({ queryKey: ['resort-reservations'] });
      navigate(`/reservations/${newReservationId}`);
    },
  });

  const createGuestMutation = useMutation({
    mutationFn: resortService.createGuest,
    onSuccess: (newGuestId) => {
      setGuestId(newGuestId);
      setSelectedGuestName(`${newGuest.firstName} ${newGuest.lastName}`.trim());
      setSelectedGuestFirstName(newGuest.firstName);
      setSelectedGuestLastName(newGuest.lastName);
      setSelectedGuestContactNumber(newGuest.phone);
      setSelectedGuestEmail(newGuest.email);
      setShowCreateGuest(false);
      setShowGuestDialog(false);
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
      void queryClient.invalidateQueries({ queryKey: ['resort-guests'] });
    },
  });

  const selectedRooms = (searchMutation.data ?? []).filter((room) => selectedRoomIds.includes(room.id));

  const groupedAvailableRooms = useMemo(() => {
    const groups = new Map<string, { roomTypeId: string; roomTypeName: string; rooms: typeof selectedRooms }>();

    for (const room of searchMutation.data ?? []) {
      const key = room.roomTypeId;
      const existing = groups.get(key);
      if (existing) {
        existing.rooms.push(room);
        continue;
      }

      groups.set(key, {
        roomTypeId: room.roomTypeId,
        roomTypeName: room.roomTypeName,
        rooms: [room],
      });
    }

    return Array.from(groups.values()).sort((a, b) => a.roomTypeName.localeCompare(b.roomTypeName));
  }, [searchMutation.data]);

  const stayNights = useMemo(() => {
    if (!searchCriteria) return 0;
    const checkIn = parseLocalDate(searchCriteria.arrivalDate);
    const checkOut = parseLocalDate(searchCriteria.departureDate);
    if (!checkIn || !checkOut) return 0;
    const millisecondsPerDay = 24 * 60 * 60 * 1000;
    return Math.max(0, Math.round((checkOut.getTime() - checkIn.getTime()) / millisecondsPerDay));
  }, [searchCriteria]);

  const selectedRoomSummaryByType = useMemo(() => {
    const summary = new Map<
      string,
      { roomTypeId: string; roomTypeName: string; quantity: number; totalAmount: number }
    >();

    for (const room of selectedRooms) {
      const existing = summary.get(room.roomTypeId);
      const roomAmount = (room.baseRate ?? 0) * stayNights;

      if (existing) {
        existing.quantity += 1;
        existing.totalAmount += roomAmount;
        continue;
      }

      summary.set(room.roomTypeId, {
        roomTypeId: room.roomTypeId,
        roomTypeName: room.roomTypeName,
        quantity: 1,
        totalAmount: roomAmount,
      });
    }

    return Array.from(summary.values())
      .map((item) => ({ ...item, totalAmount: round2(item.totalAmount) }))
      .sort((a, b) => a.roomTypeName.localeCompare(b.roomTypeName));
  }, [selectedRooms, stayNights]);

  const selectedRoomSummaryTotal = useMemo(
    () => round2(selectedRoomSummaryByType.reduce((sum, item) => sum + item.totalAmount, 0)),
    [selectedRoomSummaryByType]
  );

  const autoCalculatedRows = useMemo(() => {
    return selectedRooms.map((room) => {
      const occupantCount = Math.max(1, room.maxAdults || 0);
      const ratePerNight = room.baseRate ?? 0;
      const amount = ratePerNight * stayNights;
      const discountPercent = 0;
      const discountAmount = round2(amount * (discountPercent / 100));
      const scPercent = SC_DISCOUNT_PERCENT;
      const scCount = 0;
      const pricing = computeSeniorPricing(
        amount,
        discountAmount,
        scPercent,
        scCount,
        occupantCount,
        VAT_RATE
      );

      return {
        roomId: room.id,
        roomLabel: `${room.roomNumber} - ${room.roomTypeName}`,
        ratePerNight: round2(ratePerNight),
        nights: stayNights,
        occupantCount,
        amount: round2(amount),
        discountPercent,
        discountAmount,
        scCount,
        scPercent,
        scDiscountAmount: pricing.scDiscountAmount,
        netAmount: pricing.netAmount,
      };
    });
  }, [selectedRooms, stayNights]);

  const reservationDetailRows = useMemo(() => {
    return autoCalculatedRows.map((row) => {
      const override = editedRoomValues[row.roomId];
      if (!override) return row;
      return {
        ...row,
        ...override,
      };
    });
  }, [autoCalculatedRows, editedRoomValues]);

  const roomNetTotal = useMemo(
    () => round2(reservationDetailRows.reduce((sum, row) => sum + row.netAmount, 0)),
    [reservationDetailRows]
  );

  const extraBedNetTotal = useMemo(
    () => round2(extraBedRows.reduce((sum, row) => sum + row.netAmount, 0)),
    [extraBedRows]
  );

  const reservationNetTotal = useMemo(
    () => round2(roomNetTotal + extraBedNetTotal),
    [roomNetTotal, extraBedNetTotal]
  );

  const computedDepositRequired = useMemo(
    () => round2(reservationNetTotal * (depositPercentage / 100)),
    [reservationNetTotal, depositPercentage]
  );

  const initialDepositTotal = useMemo(
    () => round2(initialDeposits.reduce((sum, row) => sum + row.amount, 0)),
    [initialDeposits]
  );

  const hasInvalidInitialDeposits = useMemo(
    () => initialDeposits.some((row) => row.amount <= 0 || !row.paymentMethodId || !row.paidDate),
    [initialDeposits]
  );

  const exceedsTotalAmount = useMemo(
    () => initialDepositTotal > reservationNetTotal,
    [initialDepositTotal, reservationNetTotal]
  );

  const occupancySeniors = useMemo(
    () => reservationDetailRows.reduce((sum, row) => sum + row.scCount, 0),
    [reservationDetailRows]
  );

  const reservationDetailByRoomId = useMemo(
    () => new Map(reservationDetailRows.map((row) => [row.roomId, row])),
    [reservationDetailRows]
  );

  const editingRoomLabel = useMemo(() => {
    if (!editingRoomId) return '';
    return reservationDetailByRoomId.get(editingRoomId)?.roomLabel ?? '';
  }, [editingRoomId, reservationDetailByRoomId]);

  const editingRoomValues = useMemo<ReservationRoomPricingValues | null>(() => {
    if (!editingRoomId) return null;
    const row = reservationDetailByRoomId.get(editingRoomId);
    if (!row) return null;
    return {
      ratePerNight: row.ratePerNight,
      nights: row.nights,
      occupantCount: row.occupantCount,
      amount: row.amount,
      discountPercent: row.discountPercent,
      discountAmount: row.discountAmount,
      scCount: row.scCount,
      scPercent: row.scPercent,
      scDiscountAmount: row.scDiscountAmount,
      netAmount: row.netAmount,
    };
  }, [editingRoomId, reservationDetailByRoomId]);

  const toggleRoomType = (roomTypeId: string) => {
    setSelectedRoomTypeIds((prev) =>
      prev.includes(roomTypeId)
        ? prev.filter((id) => id !== roomTypeId)
        : [...prev, roomTypeId]
    );
  };

  const handleSearch = () => {
    if (selectedRoomTypeIds.length === 0 || !startDate || !endDate) {
      setForm({ searchError: 'Please select stay date range and at least one room type before searching.' });
      return;
    }

    const nextCriteria: SearchCriteria = {
      roomTypeIds: selectedRoomTypeIds,
      arrivalDate: formatDateLocal(startDate),
      departureDate: formatDateLocal(endDate),
    };

    setForm({ searchError: '' });
    setShowReservationDetails(false);
    setSelectedRoomIds([]);
    setExtraBedRows([]);
    setEditedRoomValues({});
    setSearchCriteria(nextCriteria);
    searchMutation.mutate(nextCriteria);
  };

  const toggleRoomSelection = (roomId: string) => {
    setSelectedRoomIds((prev) =>
      prev.includes(roomId) ? prev.filter((id) => id !== roomId) : [...prev, roomId]
    );
  };

  const recomputeExtraBedRow = (row: ExtraBedRow): ExtraBedRow => {
    const amount = round2(row.ratePerNight * row.numberOfNights * row.quantity);
    const discountAmount = round2(amount * (row.discountPercent / 100));
    const pricing = computeSeniorPricing(
      amount,
      discountAmount,
      row.seniorCitizenPercent,
      row.seniorCitizenCount,
      row.quantity,
      VAT_RATE
    );

    return {
      ...row,
      amount,
      discountAmount,
      seniorCitizenDiscountAmount: pricing.scDiscountAmount,
      netAmount: pricing.netAmount,
    };
  };

  const addExtraBedRow = (extraBedTypeId: string, extraBedTypeName: string, basePrice: number) => {
    const existing = extraBedRows.find((row) => row.extraBedTypeId === extraBedTypeId);
    if (existing) {
      updateExtraBedRow(existing.id, { quantity: existing.quantity + 1 });
      return;
    }

    const id = `eb-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const initial = recomputeExtraBedRow({
      id,
      extraBedTypeId,
      extraBedTypeName,
      arrivalDate: searchCriteria?.arrivalDate ?? formatDateLocal(startDate ?? new Date()),
      departureDate: searchCriteria?.departureDate ?? formatDateLocal(endDate ?? new Date()),
      quantity: 1,
      ratePerNight: round2(basePrice),
      numberOfNights: stayNights || 1,
      amount: 0,
      discountPercent: 0,
      discountAmount: 0,
      seniorCitizenCount: 0,
      seniorCitizenPercent: SC_DISCOUNT_PERCENT,
      seniorCitizenDiscountAmount: 0,
      netAmount: 0,
    });
    setExtraBedRows((prev) => [...prev, initial]);
  };

  const updateExtraBedRow = (id: string, patch: Partial<ExtraBedRow>) => {
    setExtraBedRows((prev) =>
      prev.map((row) => (row.id === id ? recomputeExtraBedRow({ ...row, ...patch }) : row))
    );
  };

  const removeExtraBedRow = (id: string) => {
    setExtraBedRows((prev) => prev.filter((row) => row.id !== id));
  };

  const openAddDepositDialog = () => {
    setEditingDepositId(null);
    setDepositForm({
      amount: 0,
      paymentMethodId: '',
      paidDate: formatDateLocal(new Date()),
      referenceNo: '',
    });
    setShowDepositDialog(true);
  };

  const openEditDepositDialog = (row: InitialDepositRow) => {
    setEditingDepositId(row.id);
    setDepositForm({
      amount: row.amount,
      paymentMethodId: row.paymentMethodId,
      paidDate: row.paidDate,
      referenceNo: row.referenceNo,
    });
    setShowDepositDialog(true);
  };

  const saveDepositDialog = () => {
    if (editingDepositId) {
      setInitialDeposits((prev) =>
        prev.map((row) =>
          row.id === editingDepositId
            ? {
                ...row,
                amount: Math.max(0, depositForm.amount),
                paymentMethodId: depositForm.paymentMethodId,
                paidDate: depositForm.paidDate,
                referenceNo: depositForm.referenceNo,
              }
            : row
        )
      );
    } else {
      const id = `dep-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      setInitialDeposits((prev) => [
        ...prev,
        {
          id,
          amount: Math.max(0, depositForm.amount),
          paymentMethodId: depositForm.paymentMethodId,
          paidDate: depositForm.paidDate,
          referenceNo: depositForm.referenceNo,
        },
      ]);
    }

    setShowDepositDialog(false);
    setEditingDepositId(null);
  };

  const removeInitialDepositRow = (id: string) => {
    setInitialDeposits((prev) => prev.filter((row) => row.id !== id));
  };

  const paymentMethodNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const method of paymentMethods ?? []) {
      map.set(method.id, method.name);
    }
    return map;
  }, [paymentMethods]);

  const editingExtraBedValues = useMemo<ExtraBedPricingValues | null>(() => {
    if (!editingExtraBedId) return null;
    const row = extraBedRows.find((x) => x.id === editingExtraBedId);
    if (!row) return null;
    return {
      quantity: row.quantity,
      ratePerNight: row.ratePerNight,
      numberOfNights: row.numberOfNights,
      amount: row.amount,
      discountPercent: row.discountPercent,
      discountAmount: row.discountAmount,
      seniorCitizenCount: row.seniorCitizenCount,
      seniorCitizenPercent: row.seniorCitizenPercent,
      seniorCitizenDiscountAmount: row.seniorCitizenDiscountAmount,
      netAmount: row.netAmount,
    };
  }, [editingExtraBedId, extraBedRows]);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">New Reservation</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Create a reservation and optionally assign an available room.</p>
          </div>
          <Link to="/reservations" className="rounded border px-3 py-2 text-sm dark:border-gray-600">
            Back to List
          </Link>
        </div>

        {!showReservationDetails ? (
          <section className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Find Available Rooms</h2>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="md:col-span-2">
                <DatePicker
                  selectsRange
                  startDate={startDate}
                  endDate={endDate}
                  onChange={(update) => setStayRange(update as [Date | null, Date | null])}
                  dateFormat="MM/dd/yyyy"
                  placeholderText="Select stay date range"
                  className="w-full rounded border p-2 dark:bg-gray-700"
                  wrapperClassName='w-full'
                />
              </div>
              <div className="rounded border p-2 dark:border-gray-700 dark:bg-gray-700/40 md:col-span-3">
                <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Room Type</p>
                <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                  {(roomTypes ?? []).map((rt) => (
                    <label key={rt.id} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <input
                        type="checkbox"
                        checked={selectedRoomTypeIds.includes(rt.id)}
                        onChange={() => toggleRoomType(rt.id)}
                      />
                      <span>{rt.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              <button
                type="button"
                className="rounded bg-primary-600 px-4 py-2 text-white hover:bg-primary-700 disabled:opacity-50"
                disabled={searchMutation.isPending}
                onClick={handleSearch}
              >
                {searchMutation.isPending ? 'Searching...' : 'Search'}
              </button>
            </div>

            {form.searchError ? <p className="mt-2 text-sm text-rose-600">{form.searchError}</p> : null}
            {searchCriteria ? (
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                {searchMutation.data ? `${searchMutation.data.length} room(s) available from Check-In ${searchCriteria.arrivalDate} to Check-Out ${searchCriteria.departureDate}.` : 'Searching availability...'}
              </p>
            ) : null}
          </section>
        ) : null}

        {searchMutation.data && !showReservationDetails ? (
          <section className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Available Rooms</h2>
            {searchMutation.data.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">No rooms available for the selected criteria.</p>
            ) : (
              <div className="space-y-4">
                {groupedAvailableRooms.map((group) => (
                  <div key={group.roomTypeId}>
                    <p className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
                      {group.roomTypeName} ({group.rooms.length} rooms - {group.rooms.filter((room) => selectedRoomIds.includes(room.id)).length} selected)
                    </p>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                      {group.rooms.map((room) => (
                        <label
                          key={room.id}
                          className={`relative block rounded border p-3 text-left transition cursor-pointer ${selectedRoomIds.includes(room.id) ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-gray-700'}`}
                        >
                          <div className="absolute right-3 top-3">
                            <input
                              type="checkbox"
                              checked={selectedRoomIds.includes(room.id)}
                              onChange={() => toggleRoomSelection(room.id)}
                              className="peer sr-only"
                            />
                            <span className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-gray-300 bg-white transition peer-checked:border-green-600 peer-checked:bg-green-600 peer-focus:ring-2 peer-focus:ring-green-500 dark:border-gray-500 dark:bg-gray-800">
                              <span className="h-2 w-2 rounded-full bg-white opacity-0 transition peer-checked:opacity-100" />
                            </span>
                          </div>
                          <p className="font-semibold text-gray-900 dark:text-white">Room {room.roomNumber}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{room.roomTypeName}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Floor: {room.floor || '-'}</p>
                          <p className="text-sm font-medium text-primary-700 dark:text-primary-300">
                            Rate: {formatMoney(room.baseRate ?? 0)} / night
                          </p>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {selectedRoomSummaryByType.length > 0 ? (
              <div className="mt-4 rounded border border-emerald-200 bg-emerald-50/70 p-3 dark:border-emerald-800 dark:bg-emerald-900/20">
                <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">Selection Summary:</p>
                <ul className="mt-2 space-y-1 text-sm text-emerald-900 dark:text-emerald-200">
                  {selectedRoomSummaryByType.map((item) => (
                    <li key={item.roomTypeId}>
                      {item.quantity} {item.roomTypeName} room{item.quantity > 1 ? 's' : ''} x {stayNights} night{stayNights === 1 ? '' : 's'} = {formatMoney(item.totalAmount)}
                    </li>
                  ))}
                </ul>
                <p className="mt-2 border-t border-emerald-300 pt-2 text-sm font-semibold text-emerald-900 dark:border-emerald-700 dark:text-emerald-200">
                  Total: {formatMoney(selectedRoomSummaryTotal)}
                </p>
              </div>
            ) : null}

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                className="rounded bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700 disabled:opacity-50"
                disabled={selectedRoomIds.length === 0 || !searchCriteria}
                onClick={() => setShowReservationDetails(true)}
              >
                Next
              </button>
            </div>
          </section>
        ) : null}

        {showReservationDetails ? (
        <section className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Reservation Details</h2>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="space-y-4">
              <div className="rounded border p-3 dark:border-gray-700">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Guest Info</h3>
                  <button
                    type="button"
                    className="rounded bg-slate-700 px-3 py-1 text-xs text-white hover:bg-slate-800"
                    onClick={() => setShowGuestDialog(true)}
                  >
                    Search Guest
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
                    <input className="w-full rounded border p-2 dark:bg-gray-700" value={selectedGuestName} readOnly />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">First Name</label>
                    <input className="w-full rounded border p-2 dark:bg-gray-700" value={selectedGuestFirstName} readOnly />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Last Name</label>
                    <input className="w-full rounded border p-2 dark:bg-gray-700" value={selectedGuestLastName} readOnly />
                  </div>
                  <div className="md:col-span-2">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Contact Number</label>
                        <input className="w-full rounded border p-2 dark:bg-gray-700" value={selectedGuestContactNumber} readOnly />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
                        <input className="w-full rounded border p-2 dark:bg-gray-700" value={selectedGuestEmail} readOnly />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded border p-3 dark:border-gray-700 dark:bg-gray-700/30">
                <h3 className="mb-3 text-sm font-semibold text-gray-800 dark:text-gray-200">Occupancy</h3>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Adults</label>
                    <input
                      type="number"
                      min={1}
                      className="w-full rounded border p-2 dark:bg-gray-700"
                      value={occupancyAdults}
                      onChange={(e) => {
                        const nextAdults = Math.max(1, Number(e.target.value || 1));
                        setOccupancyAdults(nextAdults);
                      }}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Children</label>
                    <input
                      type="number"
                      min={0}
                      className="w-full rounded border p-2 dark:bg-gray-700"
                      value={occupancyChildren}
                      onChange={(e) => setOccupancyChildren(Math.max(0, Number(e.target.value || 0)))}
                    />
                  </div>
                </div>
                <div className="mt-3 rounded border p-3 dark:border-gray-700 dark:bg-gray-700/30">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Total Occupancy</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{occupancyAdults} adults ({occupancySeniors} seniors)</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{occupancyChildren} children</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded border p-3 dark:border-gray-700">
                <p className="mb-3 text-sm font-semibold text-gray-800 dark:text-gray-200">Selected Room Summary</p>
                {reservationDetailRows.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No selected rooms.</p>
                ) : (
                  <div className="space-y-3">
                    {reservationDetailRows.map((row) => (
                      <div key={row.roomId} className="rounded border border-gray-200 bg-gray-50/70 p-3 dark:border-gray-700 dark:bg-gray-700/30">
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1 text-sm text-gray-700 dark:text-gray-200">
                            <p className="font-semibold text-gray-900 dark:text-white">{row.roomLabel}</p>
                            <p>{row.nights} night{row.nights === 1 ? '' : 's'} @ {formatMoney(row.ratePerNight)}</p>
                            {row.discountAmount > 0 ? <p>Disc. ({formatMoney(row.discountAmount)})</p> : null}
                            <p className="font-semibold">Net: {formatMoney(row.netAmount)}</p>
                          </div>
                          <button
                            type="button"
                            className="rounded bg-slate-700 px-2 py-1 text-xs text-white hover:bg-slate-800"
                            onClick={() => setEditingRoomId(row.roomId)}
                          >
                            Edit
                          </button>
                        </div>
                      </div>
                    ))}
                    <div className="rounded border border-gray-200 bg-slate-50 p-2 text-right text-sm font-semibold dark:border-gray-700 dark:bg-gray-700/40">
                      TOTAL ROOM AMOUNT: <span className="tabular-nums">{formatMoney(roomNetTotal)}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="rounded border p-3 dark:border-gray-700">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Extra Bed</h3>
                  <button
                    type="button"
                    className="rounded bg-slate-700 px-3 py-1 text-xs text-white hover:bg-slate-800"
                    onClick={() => setShowExtraBedTypeDialog(true)}
                  >
                    Add Extra Bed
                  </button>
                </div>

                {extraBedRows.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No extra bed rows.</p>
                ) : (
                  <div className="space-y-3">
                    {extraBedRows.map((row) => (
                      <div key={row.id} className="rounded border border-gray-200 bg-gray-50/70 p-3 dark:border-gray-700 dark:bg-gray-700/30">
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1 text-sm text-gray-700 dark:text-gray-200">
                            <p className="font-semibold text-gray-900 dark:text-white">Extra Bed - {row.extraBedTypeName ?? '-'}</p>
                            <p>{row.numberOfNights} night{row.numberOfNights === 1 ? '' : 's'} @ {formatMoney(row.ratePerNight)} x Qty {row.quantity}</p>
                            {row.discountAmount > 0 ? <p>Disc. ({formatMoney(row.discountAmount)})</p> : null}
                            <p className="font-semibold">Net: {formatMoney(row.netAmount)}</p>
                          </div>
                          <div className="flex gap-1">
                            <button
                              type="button"
                              className="rounded bg-slate-700 px-2 py-1 text-xs text-white hover:bg-slate-800"
                              onClick={() => setEditingExtraBedId(row.id)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="rounded bg-rose-600 px-2 py-1 text-xs text-white hover:bg-rose-700"
                              onClick={() => removeExtraBedRow(row.id)}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="rounded border border-gray-200 bg-slate-50 p-2 text-right text-sm font-semibold dark:border-gray-700 dark:bg-gray-700/40">
                      TOTAL EXTRA BED: <span className="tabular-nums">{formatMoney(extraBedNetTotal)}</span>
                    </div>
                  </div>
                )}
                {exceedsTotalAmount ? (
                  <p className="mt-2 text-sm text-rose-600">
                    Initial deposits cannot exceed total amount.
                  </p>
                ) : null}
              </div>

              <div className="rounded border border-slate-300 bg-slate-50 p-3 dark:border-gray-700 dark:bg-gray-700/30">
                <p className="text-right text-sm font-semibold text-gray-700 dark:text-gray-300">
                  TOTAL AMOUNT: <span className="font-bold tabular-nums">{formatMoney(reservationNetTotal)}</span>
                </p>
              </div>

              <div className="rounded border p-3 dark:border-gray-700 dark:bg-gray-700/30">
                <h3 className="mb-3 text-sm font-semibold text-gray-800 dark:text-gray-200">Deposit Setup</h3>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Deposit Percentage</label>
                    <div className="relative">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step={0.01}
                        className="w-full rounded border p-2 pr-8 dark:bg-gray-700"
                        value={depositPercentage}
                        onChange={(e) => {
                          const raw = Number(e.target.value);
                          if (Number.isNaN(raw)) {
                            setDepositPercentage(0);
                            return;
                          }
                          setDepositPercentage(Math.max(0, Math.min(100, raw)));
                        }}
                      />
                      <span className="pointer-events-none absolute right-3 top-2 text-sm text-gray-500">%</span>
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Deposit Required</label>
                    <input
                      className="w-full rounded border bg-gray-100 p-2 dark:bg-gray-700"
                      value={formatMoney(computedDepositRequired)}
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Initial Deposit Total</label>
                    <input
                      className="w-full rounded border bg-gray-100 p-2 dark:bg-gray-700"
                      value={formatMoney(initialDepositTotal)}
                      readOnly
                    />
                  </div>
                </div>
              </div>

              <div className="rounded border p-3 dark:border-gray-700">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Initial Reservation Deposits</h3>
                  <button
                    type="button"
                    className="rounded bg-slate-700 px-3 py-1 text-xs text-white hover:bg-slate-800"
                    onClick={openAddDepositDialog}
                  >
                    Add Deposit
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full border border-gray-200 text-sm dark:border-gray-700">
                    <thead className="bg-slate-100 dark:bg-gray-700/50">
                      <tr>
                        <th className="border border-gray-200 p-2 text-right dark:border-gray-700">Amount</th>
                        <th className="border border-gray-200 p-2 text-left dark:border-gray-700">Payment Method</th>
                        <th className="border border-gray-200 p-2 text-left dark:border-gray-700">Paid Date</th>
                        <th className="border border-gray-200 p-2 text-left dark:border-gray-700">Reference No</th>
                        <th className="border border-gray-200 p-2 text-left dark:border-gray-700">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {initialDeposits.map((row) => (
                        <tr key={row.id}>
                          <td className="border border-gray-200 p-2 text-right tabular-nums dark:border-gray-700">{formatMoney(row.amount)}</td>
                          <td className="border border-gray-200 p-2 dark:border-gray-700">{paymentMethodNameById.get(row.paymentMethodId) || '-'}</td>
                          <td className="border border-gray-200 p-2 dark:border-gray-700">{row.paidDate || '-'}</td>
                          <td className="border border-gray-200 p-2 dark:border-gray-700">{row.referenceNo || '-'}</td>
                          <td className="border border-gray-200 p-2 dark:border-gray-700">
                            <div className="flex gap-1">
                              <button
                                type="button"
                                className="rounded bg-slate-700 px-2 py-1 text-xs text-white hover:bg-slate-800"
                                onClick={() => openEditDepositDialog(row)}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className="rounded bg-rose-600 px-2 py-1 text-xs text-white hover:bg-rose-700"
                                onClick={() => removeInitialDepositRow(row.id)}
                              >
                                Remove
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {initialDeposits.length === 0 ? (
                        <tr>
                          <td className="border border-gray-200 p-2 text-gray-500 dark:border-gray-700" colSpan={5}>No initial deposits added.</td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              </div>

              <p className="text-sm text-gray-500 dark:text-gray-400">
                Selected Room(s): {selectedRooms.length > 0 ? selectedRooms.map((r) => `${r.roomNumber} - ${r.roomTypeName}`).join(', ') : 'None'}
              </p>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              className="rounded border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
              onClick={() => setShowReservationDetails(false)}
            >
              Back
            </button>
            <button
              type="button"
              className="rounded bg-primary-600 px-4 py-2 text-white hover:bg-primary-700 disabled:opacity-50"
              disabled={
                createMutation.isPending ||
                !guestId ||
                !searchCriteria ||
                selectedRoomIds.length === 0 ||
                hasInvalidInitialDeposits ||
                exceedsTotalAmount
              }
              onClick={() =>
                createMutation.mutate({
                  guestId,
                  arrivalDate: searchCriteria!.arrivalDate,
                  departureDate: searchCriteria!.departureDate,
                  adults: occupancyAdults,
                  children: occupancyChildren,
                  totalAmount: round2(reservationNetTotal),
                  depositPercentage: round2(depositPercentage),
                  depositRequired: computedDepositRequired,
                  rooms: selectedRooms.map((room) => {
                    const detail = reservationDetailByRoomId.get(room.id);
                    return {
                      roomTypeId: room.roomTypeId,
                      roomId: room.id,
                      ratePerNight: round2(room.baseRate ?? 0),
                      numberOfNights: detail?.nights ?? stayNights,
                      amount: round2(detail?.amount ?? 0),
                      discountPercent: detail?.discountPercent ?? 0,
                      discountAmount: round2(detail?.discountAmount ?? 0),
                      seniorCitizenCount: detail?.scCount ?? 0,
                      seniorCitizenPercent: detail?.scPercent ?? SC_DISCOUNT_PERCENT,
                      seniorCitizenDiscountAmount: round2(detail?.scDiscountAmount ?? 0),
                      netAmount: round2(detail?.netAmount ?? 0),
                    };
                  }),
                  extraBeds: extraBedRows.map((row) => ({
                    extraBedTypeId: row.extraBedTypeId,
                    arrivalDate: row.arrivalDate,
                    departureDate: row.departureDate,
                    quantity: row.quantity,
                    ratePerNight: round2(row.ratePerNight),
                    numberOfNights: row.numberOfNights,
                    amount: round2(row.amount),
                    discountPercent: row.discountPercent,
                    discountAmount: round2(row.discountAmount),
                    seniorCitizenCount: row.seniorCitizenCount,
                    seniorCitizenPercent: row.seniorCitizenPercent,
                    seniorCitizenDiscountAmount: round2(row.seniorCitizenDiscountAmount),
                    netAmount: round2(row.netAmount),
                  })),
                  additionalGuestIds: [],
                })
              }
            >
              {createMutation.isPending ? 'Saving...' : 'Create Reservation'}
            </button>
          </div>
        </section>
        ) : null}

        <EditReservationRoomDialog
          open={!!editingRoomId}
          roomLabel={editingRoomLabel}
          initialValues={editingRoomValues}
          onClose={() => setEditingRoomId(null)}
          onSave={(values) => {
            if (!editingRoomId) return;
            setEditedRoomValues((prev) => ({
              ...prev,
              [editingRoomId]: values,
            }));
            setEditingRoomId(null);
          }}
        />

        <EditExtraBedDialog
          open={!!editingExtraBedId}
          initialValues={editingExtraBedValues}
          onClose={() => setEditingExtraBedId(null)}
          onSave={(values) => {
            if (!editingExtraBedId) return;
            updateExtraBedRow(editingExtraBedId, values);
            setEditingExtraBedId(null);
          }}
        />

        <SelectExtraBedTypeDialog
          open={showExtraBedTypeDialog}
          types={extraBedTypes ?? []}
          isLoading={extraBedTypesLoading}
          onClose={() => setShowExtraBedTypeDialog(false)}
          onSelect={(type) => {
            addExtraBedRow(type.id, type.name, type.basePrice);
            setShowExtraBedTypeDialog(false);
          }}
        />

        <Dialog open={showDepositDialog} onClose={() => setShowDepositDialog(false)} className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center bg-black/50 p-4">
            <DialogPanel className="w-full max-w-xl rounded-lg bg-white p-5 shadow-xl dark:bg-gray-800">
              <div className="mb-4 flex items-center justify-between">
                <DialogTitle as="h3" className="text-lg font-semibold text-gray-900 dark:text-white">
                  {editingDepositId ? 'Edit Deposit' : 'Add Deposit'}
                </DialogTitle>
                <button
                  type="button"
                  className="rounded bg-gray-200 px-2 py-1 text-sm dark:bg-gray-700"
                  onClick={() => setShowDepositDialog(false)}
                >
                  Close
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Amount</label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    className="w-full rounded border p-2 text-right tabular-nums dark:bg-gray-700"
                    value={depositForm.amount}
                    onChange={(e) => setDepositForm((prev) => ({ ...prev, amount: Math.max(0, Number(e.target.value || 0)) }))}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Payment Method</label>
                  <select
                    className="w-full rounded border p-2 dark:bg-gray-700"
                    value={depositForm.paymentMethodId}
                    onChange={(e) => setDepositForm((prev) => ({ ...prev, paymentMethodId: e.target.value }))}
                  >
                    <option value="">Select payment method</option>
                    {(paymentMethods ?? []).map((method) => (
                      <option key={method.id} value={method.id}>{method.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Paid Date</label>
                  <input
                    type="date"
                    className="w-full rounded border p-2 dark:bg-gray-700"
                    value={depositForm.paidDate}
                    onChange={(e) => setDepositForm((prev) => ({ ...prev, paidDate: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Reference No</label>
                  <input
                    className="w-full rounded border p-2 dark:bg-gray-700"
                    value={depositForm.referenceNo}
                    onChange={(e) => setDepositForm((prev) => ({ ...prev, referenceNo: e.target.value }))}
                  />
                </div>
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  className="rounded border border-gray-300 px-4 py-2 text-sm"
                  onClick={() => setShowDepositDialog(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="rounded bg-primary-600 px-4 py-2 text-sm text-white disabled:opacity-50"
                  disabled={!depositForm.paymentMethodId || !depositForm.paidDate}
                  onClick={saveDepositDialog}
                >
                  Save
                </button>
              </div>
            </DialogPanel>
          </div>
        </Dialog>

        <Dialog open={showGuestDialog} onClose={() => setShowGuestDialog(false)} className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center bg-black/50 p-4">
            <DialogPanel className="w-full max-w-3xl rounded-lg bg-white p-5 shadow-xl dark:bg-gray-800">
              <div className="mb-4 flex items-center justify-between">
                <DialogTitle as="h3" className="text-lg font-semibold">Search Guests</DialogTitle>
                <button className="rounded bg-gray-200 px-2 py-1 text-sm dark:bg-gray-700" onClick={() => setShowGuestDialog(false)}>
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
                    onClick={() => createGuestMutation.mutate(newGuest)}
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
                      <th className="p-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {guestsLoading ? (
                      <tr>
                        <td className="p-2 text-gray-500" colSpan={5}>Loading guests...</td>
                      </tr>
                    ) : (guestsData?.items ?? []).length === 0 ? (
                      <tr>
                        <td className="p-2 text-gray-500" colSpan={5}>No guests found.</td>
                      </tr>
                    ) : (
                      (guestsData?.items ?? []).map((guest) => (
                        <tr key={guest.id} className="border-b">
                          <td className="p-2">{guest.guestCode}</td>
                          <td className="p-2">{guest.fullName}</td>
                          <td className="p-2">{guest.phone || '-'}</td>
                          <td className="p-2">{guest.email || '-'}</td>
                          <td className="p-2">
                            <button
                              type="button"
                              className="rounded bg-primary-600 px-2 py-1 text-white hover:bg-primary-700"
                              onClick={() => {
                                const nameParts = splitGuestName(guest.fullName);
                                setGuestId(guest.id);
                                setSelectedGuestName(guest.fullName);
                                setSelectedGuestFirstName(nameParts.firstName);
                                setSelectedGuestLastName(nameParts.lastName);
                                setSelectedGuestContactNumber(guest.phone || '');
                                setSelectedGuestEmail(guest.email || '');
                                setShowGuestDialog(false);
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
            </DialogPanel>
          </div>
        </Dialog>
      </div>
    </MainLayout>
  );
};
