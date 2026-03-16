import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useNavigate } from 'react-router-dom';
import { resortService } from '@services/resort.service';
import { SearchGuestDialog, SelectedGuest } from '../Shared/SearchGuestDialog';
import { AddPaymentDialog } from '../Shared/AddPaymentDialog';
import { AddExtraBedDialog } from '../Shared/AddExtraBedDialog';
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

const round2 = (value: number) => Math.round(value * 100) / 100;
const formatMoney = (value: number) =>
  round2(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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

export const ReservationPage = () => {
  const navigate = useNavigate();
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
  const [showReservationDetails, setShowReservationDetails] = useState(false);
  const [showGuestInfoStep, setShowGuestInfoStep] = useState(false);
  const [seniorCountsByRoom, setSeniorCountsByRoom] = useState<Record<string, number>>({});
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
  const [selectedChannelId, setSelectedChannelId] = useState('');
  const [selectedAgencyId, setSelectedAgencyId] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [initialDeposits, setInitialDeposits] = useState<InitialDepositRow[]>([]);
  const [showDepositDialog, setShowDepositDialog] = useState(false);

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
    enabled: showReservationDetails && showGuestInfoStep,
  });

  const { data: agencies } = useQuery({
    queryKey: ['resort-agencies'],
    queryFn: () => resortService.getAgencies(),
    enabled: showReservationDetails && showGuestInfoStep,
  });

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
    setSelectedChannelId('');
    setSelectedAgencyId('');
    setInitialDeposits([]);
    setShowDepositDialog(false);
    setAvailabilityRows([]);
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

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!searchCriteria) {
        throw new Error('Missing reservation search criteria.');
      }
      if (!selectedGuest?.id) {
        throw new Error('Please search and select a guest before confirming.');
      }
      if (!selectedChannelId) {
        throw new Error('Please select a reservation channel.');
      }
      if (reservationDetailLines.length === 0) {
        throw new Error('No room selections found for this reservation.');
      }

      const roomEntries = reservationDetailLines.map((line) => ({
        roomTypeId: line.roomTypeId,
        ratePerNight: round2(line.ratePerNight),
        numberOfNights: line.nights,
        amount: round2(line.grossAmount),
        discountPercent: 0,
        discountAmount: 0,
        seniorCitizenCount: line.seniorCount,
        seniorCitizenPercent: SC_DISCOUNT_PERCENT,
        seniorCitizenDiscountAmount: round2(line.seniorDiscountAmount),
        netAmount: round2(line.netAmount),
      }));

      const extraBedEntries = extraBedRows.map((row) => ({
        extraBedTypeId: row.extraBedTypeId,
        arrivalDate: searchCriteria.arrivalDate,
        departureDate: searchCriteria.departureDate,
        quantity: row.quantity,
        ratePerNight: round2(row.ratePerNight),
        numberOfNights: row.nights,
        amount: round2(row.quantity * row.ratePerNight * row.nights),
        discountPercent: 0,
        discountAmount: 0,
        seniorCitizenCount: 0,
        seniorCitizenPercent: SC_DISCOUNT_PERCENT,
        seniorCitizenDiscountAmount: 0,
        netAmount: round2(row.quantity * row.ratePerNight * row.nights),
      }));

      const depositPercentage =
        selectionGrandTotal > 0 ? round2((initialDepositTotal / selectionGrandTotal) * 100) : 0;

      const reservationId = await resortService.createReservation({
        guestId: selectedGuest.id,
        channelId: selectedChannelId,
        agencyId: selectedAgencyId || undefined,
        arrivalDate: searchCriteria.arrivalDate,
        departureDate: searchCriteria.departureDate,
        adults,
        children,
        totalAmount: round2(selectionGrandTotal),
        depositPercentage,
        depositRequired: round2(initialDepositTotal),
        notes: transactionNotes.trim() || undefined,
        reservationConditions: reservationConditions.trim() || undefined,
        specialRequests: specialRequests.trim() || undefined,
        firstName: guestInfoForm.firstName.trim() || undefined,
        lastName: guestInfoForm.lastName.trim() || undefined,
        phone: guestInfoForm.phone.trim() || undefined,
        email: guestInfoForm.email.trim() || undefined,
        rooms: roomEntries,
        extraBeds: extraBedEntries,
        additionalGuestIds: [],
      });

      const validDeposits = initialDeposits.filter((row) => row.amount > 0 && row.paymentMethodId && row.paidDate);
      for (const row of validDeposits) {
        await resortService.recordReservationDeposit({
          reservationId,
          amount: round2(row.amount),
          paymentMethodId: row.paymentMethodId,
          paidDate: row.paidDate,
          referenceNo: row.referenceNo || undefined,
        });
      }

      return reservationId;
    },
    onSuccess: (reservationId) => {
      setConfirmError('');
      void queryClient.invalidateQueries({ queryKey: ['resort-reservations'] });
      navigate(`/front-desk/reservations/${reservationId}`);
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Unable to save reservation.';
      setConfirmError(message);
    },
  });

  const currentStep = !showReservationDetails ? 1 : showGuestInfoStep ? 3 : 2;

  return (
    <>
      <div className="space-y-6">
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
              <input
                type="number"
                min={1}
                max={10}
                value={adults}
                onChange={(e) => setAdults(Number(e.target.value || 1))}
                className="w-full rounded border border-gray-300 p-2 text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Children</label>
              <input
                type="number"
                min={0}
                max={10}
                value={children}
                onChange={(e) => setChildren(Number(e.target.value || 0))}
                className="w-full rounded border border-gray-300 p-2 text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Number of Rooms</label>
              <input
                type="number"
                min={1}
                max={5}
                value={roomCount}
                onChange={(e) => setRoomCount(Number(e.target.value || 1))}
                className="w-full rounded border border-gray-300 p-2 text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              />
            </div>
          </div>

          <div className="mt-4">
            <RoomTypeAvailabilitySearch
              roomTypes={roomTypes}
              arrivalDate={startDate ? formatDateLocal(startDate) : undefined}
              departureDate={endDate ? formatDateLocal(endDate) : undefined}
              selectedRoomTypeIds={selectedRoomTypeIds}
              onSelectedRoomTypeIdsChange={setSelectedRoomTypeIds}
              selectedAmounts={selectedAmounts}
              onSelectedAmountsChange={setSelectedAmounts}
              searchCriteria={searchCriteria}
              onSearch={handleSearch}
              errorMessage={searchError}
              onErrorMessageChange={setSearchError}
              onAvailabilityChange={({ availabilityRows: nextAvailabilityRows }) => {
                setAvailabilityRows(nextAvailabilityRows);
              }}
            />
          </div>
        </section>
        ) : null}

        {searchCriteria && !showReservationDetails ? (
          <section className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
            <div className="mt-4 flex items-center justify-between rounded border bg-slate-100 p-3 dark:border-gray-700 dark:bg-gray-700/40">
              <div>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Selection Package:</p>
                {selectedPackage.lines.length > 0 ? (
                  <div className="mt-1 space-y-1">
                    {selectedPackage.lines.map((line) => (
                      <p key={line.roomTypeName} className="text-sm text-gray-600 dark:text-gray-300">
                        {line.quantity} {line.roomTypeName} room{line.quantity > 1 ? 's' : ''} x {selectedPackage.nights} night{selectedPackage.nights > 1 ? 's' : ''} = {line.lineTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    ))}
                    <p className="font-semibold text-gray-900 dark:text-white">
                      Total: {selectedPackage.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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

              <p className="mt-3 text-right text-base font-semibold text-gray-900 dark:text-white">
                Room Total: {formatMoney(reservationDetailTotal)}
              </p>
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
                className="inline-flex items-center gap-1 rounded bg-primary-600 px-4 py-2 text-white hover:bg-primary-700"
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
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Reservation Channel</label>
                    <select
                      className="w-full rounded border border-gray-300 p-2 text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                      value={selectedChannelId}
                      onChange={(e) => setSelectedChannelId(e.target.value)}
                    >
                      <option value="">Select channel</option>
                      {(channels ?? []).map((channel) => (
                        <option key={channel.id} value={channel.id}>{channel.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Agency</label>
                    <select
                      className="w-full rounded border border-gray-300 p-2 text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                      value={selectedAgencyId}
                      onChange={(e) => setSelectedAgencyId(e.target.value)}
                    >
                      <option value="">Select agency (optional)</option>
                      {(agencies ?? []).map((agency) => (
                        <option key={agency.id} value={agency.id}>{agency.name}</option>
                      ))}
                    </select>
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
                </div>
              </div>
            </div>

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
                  createMutation.mutate();
                }}
                disabled={
                  createMutation.isPending ||
                  !searchCriteria ||
                  !selectedChannelId ||
                  !selectedGuest?.id ||
                  reservationDetailLines.length === 0
                }
                className="ml-auto inline-flex items-center gap-1 rounded bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                <span>{createMutation.isPending ? 'Saving...' : 'Create Reservation'}</span>
                <span aria-hidden="true">&rarr;</span>
              </button>
            </div>
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
      </div>
    </>
  );
};
