import { useMemo, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { MainLayout } from '@components/layout/MainLayout';
import { ReservationStatus, RoomOperationalStatus, HousekeepingStatus } from '@/types/resort.types';
import { resortService } from '@services/resort.service';

type StatusKey = 'occupied' | 'reservedArrivalToday' | 'vacantDirty' | 'vacantClean' | 'outOfOrder';

interface RoomRackRow {
  roomId: string;
  roomNumber: string;
  roomTypeName: string;
  statusKey: StatusKey;
  label: string;
  statusSortOrder: number;
}

const STATUS_FILTERS: { key: StatusKey; label: string }[] = [
  { key: 'occupied', label: 'Occupied' },
  { key: 'reservedArrivalToday', label: 'Reserved (Arrival Today)' },
  { key: 'vacantDirty', label: 'Vacant Dirty' },
  { key: 'vacantClean', label: 'Vacant Clean' },
  { key: 'outOfOrder', label: 'Out of Order / Out of Service' },
];

const STATUS_STYLES: Record<StatusKey, { badgeClass: string; cardClass: string }> = {
  occupied: {
    badgeClass: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
    cardClass: 'border-l-4 border-l-rose-500',
  },
  reservedArrivalToday: {
    badgeClass: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
    cardClass: 'border-l-4 border-l-indigo-500',
  },
  vacantDirty: {
    badgeClass: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    cardClass: 'border-l-4 border-l-amber-500',
  },
  vacantClean: {
    badgeClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    cardClass: 'border-l-4 border-l-emerald-500',
  },
  outOfOrder: {
    badgeClass: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
    cardClass: 'border-l-4 border-l-slate-500',
  },
};

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

const toDateInputValue = (value: Date) => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const toDateKey = (value: Date | string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const RoomRackPage = () => {
  const [activeStatuses, setActiveStatuses] = useState<StatusKey[]>(STATUS_FILTERS.map((s) => s.key));
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [activeRoomTypes, setActiveRoomTypes] = useState<string[]>([]); // will set default after room types load

  const selectedDateKey = useMemo(() => toDateInputValue(selectedDate), [selectedDate]);

  const { data: roomsData, isLoading: isLoadingRooms } = useQuery({
    queryKey: ['room-rack-rooms'],
    queryFn: () => resortService.getRooms('', 0, 500),
  });

  const { data: inHouseData, isLoading: isLoadingInHouse } = useQuery({
    queryKey: ['room-rack-in-house'],
    queryFn: () => resortService.getInHouseStays('', 0, 500),
  });

  const { data: reservationsData, isLoading: isLoadingReservations } = useQuery({
    queryKey: ['room-rack-reservations', selectedDateKey],
    queryFn: () => resortService.getReservations('', 0, 200),
  });

  const arrivalTodayReservationIds = useMemo(() => {
    const targetDate = toDateKey(selectedDate);
    return (reservationsData?.items ?? [])
      .filter((r) => {
        const isArrivalToday = toDateKey(r.arrivalDate) === targetDate;
        const isReservedState = r.status === ReservationStatus.Confirmed || r.status === ReservationStatus.Pending;
        return isArrivalToday && isReservedState;
      })
      .map((r) => r.id);
  }, [reservationsData, selectedDate]);

  const { data: reservationDetails, isLoading: isLoadingReservationDetails } = useQuery({
    queryKey: ['room-rack-reservation-details', selectedDateKey, arrivalTodayReservationIds],
    enabled: arrivalTodayReservationIds.length > 0,
    queryFn: async () => Promise.all(arrivalTodayReservationIds.map((id) => resortService.getReservation(id))),
  });

  // Compute all room types from roomsData
  const allRoomTypes = useMemo(() => {
    const rooms = roomsData?.items ?? [];
    const types = Array.from(new Set(rooms.map((r) => r.roomTypeName || 'Unknown')));
    return types.sort((a, b) => collator.compare(a, b));
  }, [roomsData]);

  // Set default activeRoomTypes after room types load
  useEffect(() => {
    if (allRoomTypes.length > 0 && activeRoomTypes.length === 0) {
      setActiveRoomTypes(allRoomTypes);
    }
  }, [allRoomTypes]);

  const rowsByRoomType = useMemo(() => {
    const rooms = roomsData?.items ?? [];
    const inHouseByRoom = new Map((inHouseData?.items ?? []).map((stay) => [stay.roomNumber, stay.guestName]));
    const reservedRoomNumbers = new Set<string>();
    (reservationDetails ?? []).forEach((res) => {
      res.rooms.forEach((rm) => {
        if (rm.roomNumber) reservedRoomNumbers.add(rm.roomNumber);
      });
    });

    const rows: RoomRackRow[] = rooms
      .map((room): RoomRackRow => {
        const occupiedGuest = inHouseByRoom.get(room.roomNumber);

        if (occupiedGuest) {
          return { roomId: room.id, roomNumber: room.roomNumber, roomTypeName: room.roomTypeName || 'Unknown', statusKey: 'occupied', label: `Occupied (${occupiedGuest})`, statusSortOrder: 0 };
        }

        if (room.operationalStatus === RoomOperationalStatus.OutOfOrder || room.operationalStatus === RoomOperationalStatus.OutOfService) {
          return { roomId: room.id, roomNumber: room.roomNumber, roomTypeName: room.roomTypeName || 'Unknown', statusKey: 'outOfOrder', label: RoomOperationalStatus[room.operationalStatus], statusSortOrder: 4 };
        }

        if (reservedRoomNumbers.has(room.roomNumber)) {
          return { roomId: room.id, roomNumber: room.roomNumber, roomTypeName: room.roomTypeName || 'Unknown', statusKey: 'reservedArrivalToday', label: 'Reserved (Arrival Today)', statusSortOrder: 1 };
        }

        if (room.housekeepingStatus === HousekeepingStatus.Dirty) {
          return { roomId: room.id, roomNumber: room.roomNumber, roomTypeName: room.roomTypeName || 'Unknown', statusKey: 'vacantDirty', label: 'Vacant Dirty', statusSortOrder: 2 };
        }

        return { roomId: room.id, roomNumber: room.roomNumber, roomTypeName: room.roomTypeName || 'Unknown', statusKey: 'vacantClean', label: 'Vacant Clean', statusSortOrder: 3 };
      })
      .filter((row) => activeStatuses.includes(row.statusKey))
      .filter((row) => activeRoomTypes.includes(row.roomTypeName))
      .sort((a, b) => {
        if (a.statusSortOrder !== b.statusSortOrder) return a.statusSortOrder - b.statusSortOrder;
        return collator.compare(a.roomNumber, b.roomNumber);
      });

    const grouped = new Map<string, RoomRackRow[]>();
    rows.forEach((row) => {
      const current = grouped.get(row.roomTypeName) ?? [];
      current.push(row);
      grouped.set(row.roomTypeName, current);
    });
    return grouped;
  }, [activeStatuses, activeRoomTypes, inHouseData, reservationDetails, roomsData]);

  const roomTypeGroups = useMemo(
    () => Array.from(rowsByRoomType.entries()).sort((a, b) => collator.compare(a[0], b[0])),
    [rowsByRoomType],
  );

  const isLoading = isLoadingRooms || isLoadingInHouse || isLoadingReservations || isLoadingReservationDetails;

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Room Rack</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Live front desk room board grouped by room type.</p>
        </div>

        <section className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Date</label>
            <DatePicker
              selected={selectedDate}
              onChange={(date: Date | null) => setSelectedDate(date ?? new Date())}
              dateFormat="yyyy-MM-dd"
              className="w-full max-w-xs rounded border p-2 dark:bg-gray-700"
            />
          </div>

          <div className="mb-4">
            <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Filter By Status</p>
            <div className="flex flex-wrap gap-3">
              {STATUS_FILTERS.map((status) => (
                <label key={status.key} className="inline-flex items-center gap-2 rounded border border-gray-200 px-3 py-1.5 text-sm dark:border-gray-700">
                  <input
                    type="checkbox"
                    checked={activeStatuses.includes(status.key)}
                    onChange={(e) => {
                      setActiveStatuses((prev) =>
                        e.target.checked ? Array.from(new Set([...prev, status.key])) : prev.filter((item) => item !== status.key),
                      );
                    }}
                  />
                  <span className="text-gray-700 dark:text-gray-300">{status.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Filter By Room Type</p>
            <div className="flex flex-wrap gap-3">
              {allRoomTypes.map((roomType) => (
                <label key={roomType} className="inline-flex items-center gap-2 rounded border border-gray-200 px-3 py-1.5 text-sm dark:border-gray-700">
                  <input
                    type="checkbox"
                    checked={activeRoomTypes.includes(roomType)}
                    onChange={(e) => {
                      setActiveRoomTypes((prev) =>
                        e.target.checked ? Array.from(new Set([...prev, roomType])) : prev.filter((item) => item !== roomType)
                      );
                    }}
                  />
                  <span className="text-gray-700 dark:text-gray-300">{roomType}</span>
                </label>
              ))}
            </div>
          </div>

          {isLoading ? <p className="text-sm text-gray-500">Loading room rack...</p> : null}

          {!isLoading ? (
            <div className="space-y-5">
              {roomTypeGroups.length === 0 ? <p className="text-sm text-gray-500">No rooms found for selected status filters.</p> : null}
              {roomTypeGroups.map(([roomTypeName, rows]) => (
                <div key={roomTypeName} className="rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between border-b border-gray-200 px-4 py-2 dark:border-gray-700">
                    <h2 className="text-sm font-semibold text-gray-900 dark:text-white">{roomTypeName}</h2>
                    <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-300">{rows.length}</span>
                  </div>
                  {rows.length === 0 ? (
                    <p className="px-4 py-3 text-sm text-gray-500">No rooms in this room type.</p>
                  ) : (
                    <ul className="grid grid-cols-1 gap-3 p-3 sm:grid-cols-2 lg:grid-cols-3">
                      {rows.map((row) => (
                        <li key={row.roomId} className={`rounded-md border border-gray-200 p-3 dark:border-gray-700 ${STATUS_STYLES[row.statusKey].cardClass}`}>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">Room {row.roomNumber}</p>
                          <p className="mt-2">
                            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[row.statusKey].badgeClass}`}>
                              {row.label}
                            </span>
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          ) : null}
        </section>
      </div>
    </MainLayout>
  );
};
