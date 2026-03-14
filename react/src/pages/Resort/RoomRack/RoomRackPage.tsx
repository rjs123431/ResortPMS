import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { MainLayout } from '@components/layout/MainLayout';
import { resortService } from '@services/resort.service';
import type { RoomListDto, StayListDto, ReservationDetailDto, ReservationRoomDetailDto } from '@/types/resort.types';
import { ReservationStatus } from '@/types/resort.types';
import { QuickReservationDialog, type QuickReservationPayload } from './QuickReservationDialog';

/** Normalize to YYYY-MM-DD for grid comparison. Prefer date part from ISO strings to avoid timezone shift. */
const toDateKey = (d: Date | string | undefined | null): string => {
  if (d == null) return '';
  if (typeof d === 'string') {
    const trimmed = d.trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return trimmed.slice(0, 10);
    const date = new Date(trimmed);
    if (Number.isNaN(date.getTime())) return '';
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

/** Property policy: check-in at 2:00 PM, checkout at 12:00 PM. Used for grid bar positioning. */
const CHECK_IN_HOUR_FRAC = 14 / 24; // 2pm = start of bar on check-in day
const CHECK_OUT_HOUR_FRAC = 12 / 24; // 12 noon = end of bar on checkout day

/** AM half (left) of a column = end of previous night → previous date; PM half (right) = check-in 2pm → current date. */
function getDateIndexFromPosition(pct: number, n: number): number | null {
  const colRaw = pct * n;
  const colIndex = Math.floor(colRaw);
  const posInCol = colRaw - colIndex;
  const dateIndex = posInCol < 0.5 ? colIndex - 1 : colIndex;
  if (dateIndex < 0 || dateIndex >= n) return null;
  return dateIndex;
}

type StayRow = StayListDto & {
  CheckInDateTime?: string;
  ExpectedCheckOutDateTime?: string;
  ActualCheckOutDateTime?: string;
  RoomNumber?: string;
  StayNo?: string;
  GuestName?: string;
  Id?: string;
};

/** Effective checkout: actual if set, otherwise expected. */
const getStayCheckOutKey = (stay: StayRow): string => {
  const raw = stay.actualCheckOutDateTime ?? stay.ActualCheckOutDateTime ?? stay.expectedCheckOutDateTime ?? stay.ExpectedCheckOutDateTime;
  return toDateKey(raw);
};

/** Per-room date range from stay.stayRooms (ArrivalDate/DepartureDate) or fallback to stay-level check-in/checkout. */
const getStayRoomDateRange = (
  stay: StayRow,
  roomNum: string
): { arrivalKey: string; departureKey: string } => {
  const trim = (s: string) => (s ?? '').trim().toLowerCase();
  const rooms = stay.stayRooms ?? [];
  const sr = rooms.find(
    (r) => trim(r.roomNumber ?? (r as { RoomNumber?: string }).RoomNumber ?? '') === trim(roomNum)
  );
  if (sr) {
    const a = toDateKey(sr.arrivalDate ?? (sr as { ArrivalDate?: string }).ArrivalDate);
    const d = toDateKey(sr.departureDate ?? (sr as { DepartureDate?: string }).DepartureDate);
    if (a && d) return { arrivalKey: a, departureKey: d };
  }
  const checkIn = toDateKey(stay.checkInDateTime ?? stay.CheckInDateTime);
  const checkOut = getStayCheckOutKey(stay);
  return { arrivalKey: checkIn ?? '', departureKey: checkOut ?? '' };
};

/** Stay occupies this (room, date) using per-room ArrivalDate/DepartureDate when available. */
const stayRoomCoversDate = (stay: StayRow, roomNum: string, dateKey: string): boolean => {
  const { arrivalKey, departureKey } = getStayRoomDateRange(stay, roomNum);
  if (!arrivalKey || !departureKey) return false;
  return dateKey >= arrivalKey && dateKey <= departureKey;
};

/** True if grid start date is within or touches stay (any room) period; uses per-room dates when stayRooms present. */
const stayContainsStartDate = (stay: StayRow, startKey: string): boolean => {
  const rooms = stay.stayRooms ?? [];
  if (rooms.length > 0) {
    return rooms.some((sr) => {
      const a = toDateKey(sr.arrivalDate ?? (sr as { ArrivalDate?: string }).ArrivalDate);
      const d = toDateKey(sr.departureDate ?? (sr as { DepartureDate?: string }).DepartureDate);
      return a && d && startKey >= a && startKey <= d;
    });
  }
  const checkIn = toDateKey(stay.checkInDateTime ?? stay.CheckInDateTime);
  const checkOut = getStayCheckOutKey(stay);
  if (!checkIn || !checkOut) return false;
  return startKey >= checkIn && startKey <= checkOut;
};

/** Extract room number(s) from stay; prefer stayRooms when present. */
const getStayRoomNumbers = (stay: StayRow): string[] => {
  const rooms = stay.stayRooms ?? [];
  if (rooms.length > 0) {
    return rooms
      .map((r) => (r.roomNumber ?? (r as { RoomNumber?: string }).RoomNumber ?? '').trim())
      .filter(Boolean);
  }
  const raw = stay.roomNumber ?? stay.RoomNumber;
  if (typeof raw !== 'string' || !raw.trim()) return [];
  return raw.split(',').map((s) => s.trim()).filter(Boolean);
};

/** Reservation room occupies date if arrival <= date <= departure (departure day inclusive so bar shows on checkout day, then drawn half). */
const reservationRoomCoversDate = (room: ReservationRoomDetailDto, dateKey: string): boolean => {
  const arr = toDateKey(room.arrivalDate);
  const dep = toDateKey(room.departureDate);
  return dateKey >= arr && dateKey <= dep;
};

type CellInfo = { type: 'stay'; stayNo: string; guestName: string; stayId: string } | { type: 'reservation'; reservationNo: string; guestName: string; reservationId: string } | null;

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

/** Number of calendar days (inclusive) between start and end. */
const spanDays = (start: Date, end: Date): number => {
  const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
  const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime();
  return Math.round((endDay - startDay) / (24 * 60 * 60 * 1000)) + 1;
};

export const RoomRackPage = () => {
  const navigate = useNavigate();
  

  const [stayRange, setStayRange] = useState<[Date, Date]>(() => {
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    const end = new Date(today);
    end.setDate(end.getDate() + 14);
    return [today, end];
  });

  const [startDate, endDate] = stayRange;
  const setStartDate = (d: Date) => setStayRange(([, end]) => [d, end]);
  const setEndDate = (d: Date) => setStayRange(([start]) => [start, d]);

  const startKey = useMemo(() => toDateKey(startDate), [startDate]);
  const endKey = useMemo(() => toDateKey(endDate), [endDate]);
  const dateColumns = useMemo(() => {
    const out: string[] = [];
    const start = new Date(startKey);
    const end = new Date(endKey);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      out.push(toDateKey(d));
    }
    return out;
  }, [startKey, endKey]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const timelineDragRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  type GridSelection = {
    roomId: string;
    roomNumber: string;
    roomTypeId: string;
    roomTypeName: string;
    startIndex: number;
    endIndex: number;
  };
  const [selection, setSelection] = useState<GridSelection | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [quickReservationOpen, setQuickReservationOpen] = useState(false);
  const [quickReservationPayload, setQuickReservationPayload] = useState<QuickReservationPayload | null>(null);
  const [hoveredEmptyCell, setHoveredEmptyCell] = useState<{ roomId: string; dateIndex: number } | null>(null);
  const selectionRef = useRef<GridSelection | null>(null);
  selectionRef.current = selection;

  const updateScrollArrows = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 2);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 2);
  }, []);

  useEffect(() => {
    const run = () => updateScrollArrows();
    run();
    const t = setTimeout(run, 0);
    window.addEventListener('resize', run);
    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', run);
    };
  }, [updateScrollArrows, dateColumns.length]);

  const scrollBy = useCallback((delta: number) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: delta, behavior: 'smooth' });
  }, []);

  const { data: roomsData } = useQuery({
    queryKey: ['frontdesk-grid-rooms'],
    queryFn: () => resortService.getRooms('', 0, 500),
  });

  const roomIds = useMemo(
    () => (roomsData?.items ?? []).map((r: { id: string }) => r.id),
    [roomsData?.items]
  );

  const { data: staysData } = useQuery({
    queryKey: ['frontdesk-grid-stays-with-rooms', startKey, endKey, roomIds],
    queryFn: () =>
      resortService.getInHouseWithRooms({
        roomDateFrom: startKey,
        roomDateTo: endKey,
        roomIds: roomIds.length > 0 ? roomIds : undefined,
        maxResultCount: 500,
      }),
  });

  const { data: reservationsWithRoomsData } = useQuery({
    queryKey: ['frontdesk-grid-reservations-with-rooms', startKey, endKey, roomIds],
    queryFn: () =>
      resortService.getReservationsWithRooms({
        overlapStartDate: startKey,
        overlapEndDate: endKey,
        roomIds: roomIds.length > 0 ? roomIds : undefined,
        maxResultCount: 300,
      }),
  });

  /** Reservations with rooms (pending/confirmed only) for the grid. */
  const reservationDetails = useMemo(() => {
    const items = reservationsWithRoomsData?.items ?? [];
    return items.filter(
      (r) => r.status === ReservationStatus.Pending || r.status === ReservationStatus.Confirmed
    );
  }, [reservationsWithRoomsData?.items]);

  const roomsByType = useMemo(() => {
    const rooms = (roomsData?.items ?? []) as RoomListDto[];
    const map = new Map<string, RoomListDto[]>();
    rooms.forEach((r) => {
      const name = r.roomTypeName || 'Unknown';
      const list = map.get(name) ?? [];
      list.push(r);
      map.set(name, list);
    });
    map.forEach((list) => list.sort((a, b) => collator.compare(a.roomNumber, b.roomNumber)));
    return Array.from(map.entries()).sort((a, b) => collator.compare(a[0], b[0]));
  }, [roomsData]);

  const getCellInfo = useMemo((): ((roomNumber: string, dateKey: string) => CellInfo) => {
    const allStays = (staysData?.items ?? []) as StayRow[];
    const stays = allStays.filter((stay) => stayContainsStartDate(stay, startKey));
    const details = reservationDetails ?? [];
    const resByRoomDate = new Map<string, CellInfo>();

    stays.forEach((stay: StayRow) => {
      const roomNumbers = getStayRoomNumbers(stay);
      const stayNo = stay.stayNo ?? stay.StayNo ?? '';
      const guestName = stay.guestName ?? stay.GuestName ?? '';
      const stayId = stay.id ?? stay.Id ?? '';
      if (roomNumbers.length === 0) return;
      roomNumbers.forEach((roomNum) => {
        dateColumns.forEach((dateKey) => {
          if (!stayRoomCoversDate(stay, roomNum, dateKey)) return;
          const key = `${roomNum}|${dateKey}`;
          resByRoomDate.set(key, { type: 'stay', stayNo: String(stayNo), guestName: String(guestName), stayId: String(stayId) });
        });
      });
    });

    details.forEach((res: ReservationDetailDto) => {
      (res.rooms ?? []).forEach((room: ReservationRoomDetailDto) => {
        if (!room.roomNumber) return;
        const roomNum = room.roomNumber.trim();
        dateColumns.forEach((dateKey) => {
          if (reservationRoomCoversDate(room, dateKey)) {
            const key = `${roomNum}|${dateKey}`;
            if (!resByRoomDate.has(key))
              resByRoomDate.set(key, {
                type: 'reservation',
                reservationNo: res.reservationNo,
                guestName: res.guestName ?? '',
                reservationId: res.id,
              });
          }
        });
      });
    });

    return (roomNumber: string, dateKey: string) => resByRoomDate.get(`${roomNumber.trim()}|${dateKey}`) ?? null;
  }, [staysData, reservationDetails, dateColumns, startKey]);

  const isDateOccupied = useCallback(
    (roomNumber: string, dateIndex: number) => {
      if (dateIndex < 0 || dateIndex >= dateColumns.length) return true;
      const dateKey = dateColumns[dateIndex];
      const cell = getCellInfo(roomNumber, dateKey);
      if (!cell) return false;
      // Checkout/departure day: room is available for new check-in, so do not block selection
      if (cell.type === 'stay') {
        const stay = (staysData?.items ?? []).find(
          (s: StayRow) => s.id === cell.stayId || (s as { Id?: string }).Id === cell.stayId
        ) as StayRow | undefined;
        if (stay) {
          const { departureKey } = getStayRoomDateRange(stay, roomNumber);
          if (dateKey === departureKey) return false;
        }
      } else {
        const res = (reservationDetails ?? []).find((r) => r.id === cell.reservationId);
        const roomDetail = res?.rooms?.find(
          (rm) => (rm.roomNumber ?? '').trim() === roomNumber.trim()
        );
        if (roomDetail && dateKey === toDateKey(roomDetail.departureDate)) return false;
      }
      return true;
    },
    [getCellInfo, dateColumns, staysData?.items, reservationDetails]
  );

  useEffect(() => {
    if (!isDragging || !selection) return;
    const handleMove = (e: MouseEvent) => {
      const el = timelineDragRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const n = dateColumns.length;
      const x = e.clientX - rect.left;
      const pct = Math.max(0, Math.min(1, x / rect.width));
      const col = getDateIndexFromPosition(pct, n);
      if (col === null) return;
      const start = selection.startIndex;
      let newEnd = col;
      if (newEnd >= start) {
        for (let i = start; i <= newEnd; i++) {
          if (isDateOccupied(selection.roomNumber, i)) {
            newEnd = i - 1;
            break;
          }
        }
      } else {
        for (let i = start; i >= newEnd; i--) {
          if (isDateOccupied(selection.roomNumber, i)) {
            newEnd = i + 1;
            break;
          }
        }
      }
      setSelection((prev) => (prev ? { ...prev, endIndex: newEnd } : null));
    };
    const handleUp = () => {
      setIsDragging(false);
      timelineDragRef.current = null;
      const sel = selectionRef.current;
      if (sel) {
        const startIndex = sel.startIndex;
        const endIndex = sel.endIndex;
        const checkInDate = dateColumns[startIndex];
        const lastNight = new Date(dateColumns[endIndex] + 'T12:00:00');
        lastNight.setDate(lastNight.getDate() + 1);
        const checkOutDate = toDateKey(lastNight);
        setQuickReservationPayload({
          checkInDate,
          checkOutDate,
          roomTypeName: sel.roomTypeName,
          roomTypeId: sel.roomTypeId,
          roomNumber: sel.roomNumber,
          roomId: sel.roomId,
        });
        setQuickReservationOpen(true);
        // keep selection so highlight remains visible while dialog is open
      } else {
        setSelection(null);
      }
    };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [isDragging, dateColumns, isDateOccupied]);

  const roomNumberToType = useMemo(() => {
    const map = new Map<string, string>();
    roomsByType.forEach(([roomTypeName, roomList]) => {
      roomList.forEach((r) => map.set(r.roomNumber.trim(), roomTypeName));
    });
    return map;
  }, [roomsByType]);

  const bookingCountByRoomTypeAndDate = useMemo(() => {
    const countBy = new Map<string, number>();
    const key = (type: string, date: string) => `${type}|${date}`;
    const add = (type: string, date: string) => {
      const k = key(type, date);
      countBy.set(k, (countBy.get(k) ?? 0) + 1);
    };

    const staysForRange = ((staysData?.items ?? []) as StayRow[]).filter((stay) => stayContainsStartDate(stay, startKey));
    staysForRange.forEach((stay: StayRow) => {
      const roomNumbers = getStayRoomNumbers(stay);
      roomNumbers.forEach((roomNum) => {
        dateColumns.forEach((dateKey) => {
          if (!stayRoomCoversDate(stay, roomNum, dateKey)) return;
          const typeName = roomNumberToType.get(roomNum.trim());
          if (typeName) add(typeName, dateKey);
        });
      });
    });

    (reservationDetails ?? []).forEach((res: ReservationDetailDto) => {
      if (res.status === ReservationStatus.CheckedIn) return;
      (res.rooms ?? []).forEach((room: ReservationRoomDetailDto) => {
        const typeName = (room.roomNumber?.trim() ? roomNumberToType.get(room.roomNumber.trim()) : null) ?? room.roomTypeName?.trim() ?? '';
        if (!typeName) return;
        dateColumns.forEach((dateKey) => {
          if (reservationRoomCoversDate(room, dateKey)) add(typeName, dateKey);
        });
      });
    });

    return (roomTypeName: string, dateKey: string) => countBy.get(`${roomTypeName}|${dateKey}`) ?? 0;
  }, [staysData, reservationDetails, dateColumns, roomNumberToType, startKey]);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Room Rack</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Room occupancy by date. Rows = rooms (by type), columns = dates.</p>
          </div>
        </div>

        <section className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
          <div className="mb-4 flex flex-wrap items-center gap-0">
            <div className="flex h-9 items-center gap-0 rounded border border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-700">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center text-gray-500 dark:text-gray-400">
                <CalendarIcon className="h-5 w-5" />
              </span>
              <DatePicker
                selected={startDate}
                onChange={(d: Date | null) => setStartDate(d ?? startDate)}
                dateFormat="MMM dd"
                className="h-9 w-[7ch] min-w-0 border-0 bg-transparent py-0 pr-2 text-center focus:ring-0 dark:bg-transparent"
                popperClassName="!z-[100]"
              />
              <span className="text-gray-400 dark:text-gray-500">–</span>
              <DatePicker
                selected={endDate}
                onChange={(d: Date | null) => setEndDate(d ?? endDate)}
                minDate={startDate}
                dateFormat="MMM dd, yyyy"
                className="h-9 w-[14ch] min-w-0 border-0 bg-transparent py-0 pr-2 text-center focus:ring-0 dark:bg-transparent"
                popperClassName="!z-[100]"
              />
            </div>

            <button
              type="button"
              onClick={() => {
                const days = spanDays(startDate, endDate);
                const d1 = new Date(startDate);
                const d2 = new Date(endDate);
                d1.setDate(d1.getDate() - days);
                d2.setDate(d2.getDate() - days);
                setStartDate(d1);
                setEndDate(d2);
              }}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              title="Previous period"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => {
                const days = spanDays(startDate, endDate);
                const d1 = new Date(startDate);
                const d2 = new Date(endDate);
                d1.setDate(d1.getDate() + days);
                d2.setDate(d2.getDate() + days);
                setStartDate(d1);
                setEndDate(d2);
              }}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              title="Next period"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => {
                const days = spanDays(startDate, endDate);
                const today = new Date();
                today.setHours(12, 0, 0, 0);
                const end = new Date(today);
                end.setDate(end.getDate() + days - 1);
                setStartDate(today);
                setEndDate(end);
              }}
              className="flex h-9 shrink-0 items-center justify-center rounded border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              title="Go to today"
            >
              Today
            </button>
          </div>

          <div className="relative">
            <div
              ref={scrollRef}
              className="overflow-x-auto"
              onScroll={updateScrollArrows}
            >
              <table className="min-w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 dark:bg-gray-700">
                    <th className="sticky left-0 z-[30] min-w-[100px] border-b border-r bg-gray-50 p-2 text-left font-semibold text-gray-900 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)] dark:bg-gray-700 dark:text-white dark:shadow-[2px_0_4px_-2px_rgba(0,0,0,0.3)]">Room</th>
                    {dateColumns.map((dateKey) => {
                    const d = new Date(dateKey + 'T12:00:00');
                    return (
                      <th key={dateKey} className="min-w-[100px] border-b border-r p-2 text-center font-medium text-gray-700 last:border-r-0 dark:text-gray-200">
                        <div>{d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                        <div className="text-xs font-normal text-gray-500 dark:text-gray-400">{d.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {roomsByType.map(([roomTypeName, rooms]) => (
                  <React.Fragment key={roomTypeName}>
                    <tr className="bg-gray-100 dark:bg-gray-700">
                      <td className="sticky left-0 z-[30] min-w-[100px] border-b border-r bg-gray-100 p-2 font-medium text-gray-800 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)] dark:bg-gray-700 dark:text-gray-200 dark:shadow-[2px_0_4px_-2px_rgba(0,0,0,0.3)]">
                        {roomTypeName}
                      </td>
                      {dateColumns.map((dateKey) => (
                        <td key={dateKey} className="min-w-[100px] border-b border-r p-2 text-center last:border-r-0">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{bookingCountByRoomTypeAndDate(roomTypeName, dateKey)}</span>
                          <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">bookings</span>
                        </td>
                      ))}
                    </tr>
                    {rooms.map((room) => {
                      const roomNum = room.roomNumber;
                      const n = dateColumns.length;
                      type SegmentItem = { id: string; guestName: string; navPath: string; startIndex: number; endIndex: number; bgClass: string; textClass: string; extendsBefore: boolean; extendsAfter: boolean; firstDayHalf?: boolean; lastDayHalf?: boolean };
                      const segments: SegmentItem[] = [];
                      let i = 0;
                      while (i < dateColumns.length) {
                        const cell = getCellInfo(roomNum, dateColumns[i]);
                        if (!cell) {
                          i++;
                          continue;
                        }
                        const cellId = cell.type === 'stay' ? `s-${cell.stayId}` : `r-${cell.reservationId}`;
                        const startIndex = i;
                        let endIndex = i + 1;
                        while (endIndex < dateColumns.length) {
                          const nextCell = getCellInfo(roomNum, dateColumns[endIndex]);
                          const nextId = nextCell?.type === 'stay' ? `s-${nextCell.stayId}` : nextCell?.type === 'reservation' ? `r-${nextCell.reservationId}` : null;
                          if (nextId !== cellId) break;
                          endIndex++;
                        }
                        const guestName = cell.type === 'stay' ? cell.guestName : cell.guestName;
                        const navPath = cell.type === 'stay' ? `/stays/${cell.stayId}` : `/reservations/${cell.reservationId}`;
                        let bgClass: string;
                        let textClass: string;
                        if (cell.type === 'stay') {
                          bgClass = 'bg-blue-100 dark:bg-blue-900';
                          textClass = 'text-blue-900 hover:underline dark:text-blue-100';
                        } else {
                          const res = (reservationDetails ?? []).find((r) => r.id === cell.reservationId);
                          const isPending = res?.status === ReservationStatus.Pending;
                          bgClass = isPending ? 'bg-yellow-100 dark:bg-yellow-900' : 'bg-green-100 dark:bg-green-900';
                          textClass = isPending ? 'text-yellow-900 hover:underline dark:text-yellow-100' : 'text-green-900 hover:underline dark:text-green-100';
                        }
                        let extendsBefore = false;
                        let extendsAfter = false;
                        let firstDayHalf = false;
                        let lastDayHalf = false;
                        if (cell.type === 'stay') {
                          const stay = (staysData?.items ?? []).find((s: StayRow) => s.id === cell.stayId || (s as { Id?: string }).Id === cell.stayId) as StayRow | undefined;
                          if (stay) {
                            const { arrivalKey: recordStart, departureKey: recordEnd } = getStayRoomDateRange(stay, roomNum);
                            extendsBefore = recordStart !== '' && recordStart < startKey;
                            extendsAfter = recordEnd !== '' && recordEnd > endKey;
                            const firstDateKey = dateColumns[startIndex];
                            const lastDateKey = dateColumns[endIndex - 1];
                            if (recordEnd !== '' && firstDateKey === recordEnd) firstDayHalf = true;
                            if (recordEnd !== '' && lastDateKey === recordEnd) lastDayHalf = true;
                          }
                        } else {
                          const res = (reservationDetails ?? []).find((r) => r.id === cell.reservationId);
                          const roomDetail = res?.rooms?.find((rm) => (rm.roomNumber ?? '').trim() === roomNum.trim());
                          if (roomDetail) {
                            const recordStart = toDateKey(roomDetail.arrivalDate);
                            const recordEnd = toDateKey(roomDetail.departureDate);
                            extendsBefore = recordStart !== '' && recordStart < startKey;
                            extendsAfter = recordEnd !== '' && recordEnd > endKey;
                            const firstDateKey = dateColumns[startIndex];
                            const lastDateKey = dateColumns[endIndex - 1];
                            if (recordEnd !== '' && firstDateKey === recordEnd) firstDayHalf = true;
                            if (recordEnd !== '' && lastDateKey === recordEnd) lastDayHalf = true;
                          }
                        }
                        segments.push({ id: `${cellId}-${startIndex}`, guestName: guestName || '—', navPath, startIndex, endIndex, bgClass, textClass, extendsBefore, extendsAfter, firstDayHalf: firstDayHalf || undefined, lastDayHalf: lastDayHalf || undefined });
                        i = endIndex;
                      }
                      return (
                        <tr key={room.id} className="border-b">
                          <td className="sticky left-0 z-[30] h-[2.5rem] border-r bg-white p-2 font-medium text-gray-900 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)] dark:bg-gray-800 dark:text-white dark:shadow-[2px_0_4px_-2px_rgba(0,0,0,0.3)] align-middle">
                            {roomNum}
                          </td>
                          <td colSpan={n} className="min-w-0 p-0 align-middle h-[2.5rem]">
                            <div
                              className="relative w-full h-full min-h-8 border-b border-gray-200 dark:border-gray-600"
                              style={{
                                backgroundImage: `linear-gradient(to right, var(--tw-border-color, rgb(229 231 235)) 1px, transparent 1px)`,
                                backgroundSize: `${100 / n}% 100%`,
                              }}
                              onMouseMove={(e) => {
                                if (isDragging) return;
                                const rect = e.currentTarget.getBoundingClientRect();
                                const x = e.clientX - rect.left;
                                const pct = Math.max(0, Math.min(1, x / rect.width));
                                const dateIndex = getDateIndexFromPosition(pct, n);
                                if (dateIndex === null || isDateOccupied(roomNum, dateIndex)) {
                                  setHoveredEmptyCell(null);
                                  return;
                                }
                                setHoveredEmptyCell({ roomId: room.id, dateIndex });
                              }}
                              onMouseLeave={() => setHoveredEmptyCell(null)}
                              onMouseDown={(e) => {
                                if ((e.target as HTMLElement).closest('button')) return;
                                const el = e.currentTarget;
                                const rect = el.getBoundingClientRect();
                                const x = e.clientX - rect.left;
                                const pct = Math.max(0, Math.min(1, x / rect.width));
                                const dateIndex = getDateIndexFromPosition(pct, n);
                                if (dateIndex === null || isDateOccupied(roomNum, dateIndex)) return;
                                timelineDragRef.current = el;
                                setSelection({
                                  roomId: room.id,
                                  roomNumber: roomNum,
                                  roomTypeId: room.roomTypeId,
                                  roomTypeName: room.roomTypeName ?? roomTypeName,
                                  startIndex: dateIndex,
                                  endIndex: dateIndex,
                                });
                                setIsDragging(true);
                              }}
                            >
                              <div
                                className="absolute inset-0 z-0 cursor-pointer"
                                aria-hidden
                                style={{ pointerEvents: isDragging ? 'none' : 'auto' }}
                              />
                              {hoveredEmptyCell && hoveredEmptyCell.roomId === room.id && (
                                <div
                                  className="absolute top-0 bottom-0 z-[5] pointer-events-none bg-gray-200/60 dark:bg-gray-500/40"
                                  style={{
                                    left: `${((hoveredEmptyCell.dateIndex + CHECK_IN_HOUR_FRAC) / n) * 100}%`,
                                    width: `${((1 + CHECK_OUT_HOUR_FRAC - CHECK_IN_HOUR_FRAC) / n) * 100}%`,
                                    transform: 'skewX(-12deg)',
                                    transformOrigin: 'bottom left',
                                  }}
                                />
                              )}
                              {segments.map((seg) => {
                                const leftPct = seg.extendsBefore ? 0 : seg.firstDayHalf ? (seg.startIndex / n) * 100 : ((seg.startIndex + CHECK_IN_HOUR_FRAC) / n) * 100;
                                const rightPct = seg.extendsAfter ? 100 : seg.lastDayHalf ? ((seg.endIndex - 0.5) / n) * 100 : ((seg.endIndex + CHECK_OUT_HOUR_FRAC) / n) * 100;
                                const widthPct = rightPct - leftPct;
                                const bothExtend = seg.extendsBefore && seg.extendsAfter;
                                const onlyLeftExtends = seg.extendsBefore && !seg.extendsAfter;
                                const onlyRightExtends = !seg.extendsBefore && seg.extendsAfter;
                                const useFullSkew = !seg.extendsBefore && !seg.extendsAfter;
                                const clipPath = onlyLeftExtends
                                  ? 'polygon(0 0, 100% 0, 97% 100%, 0 100%)'
                                  : onlyRightExtends
                                    ? 'polygon(3% 0, 100% 0, 100% 100%, 0 100%)'
                                    : undefined;
                                return (
                                  <div
                                    key={seg.id}
                                    className={`absolute top-0 bottom-0 z-10 min-w-0 flex items-center overflow-hidden border border-gray-300 dark:border-gray-600 ${seg.bgClass}`}
                                    style={{
                                      left: `${leftPct}%`,
                                      width: `${widthPct}%`,
                                      ...(bothExtend ? {} : useFullSkew ? { transform: 'skewX(-12deg)', transformOrigin: 'bottom left' } : { clipPath }),
                                    }}
                                  >
                                    <button
                                      type="button"
                                      className={`flex-1 min-w-0 truncate px-1.5 py-0.5 text-left text-xs ${seg.textClass}`}
                                      style={bothExtend ? undefined : useFullSkew ? { transform: 'skewX(12deg)' } : undefined}
                                      onClick={() => navigate(seg.navPath)}
                                      title={seg.guestName}
                                    >
                                      {seg.guestName}
                                    </button>
                                  </div>
                                );
                              })}
                              {selection && selection.roomId === room.id && (() => {
                                const minStart = Math.min(selection.startIndex, selection.endIndex);
                                const maxEnd = Math.max(selection.startIndex, selection.endIndex);
                                const nights = maxEnd - minStart + 1;
                                const nightLabel = nights === 1 ? '1 night' : `${nights} nights`;
                                const leftPct = ((minStart + CHECK_IN_HOUR_FRAC) / n) * 100;
                                const rightPct = ((maxEnd + 1 + CHECK_OUT_HOUR_FRAC) / n) * 100;
                                const widthPct = rightPct - leftPct;
                                return (
                                  <div
                                    className="absolute top-0 bottom-0 z-20 min-w-0 flex items-center pointer-events-none border-2 border-primary-500 bg-primary-500/30 dark:bg-primary-400/30"
                                    style={{
                                      left: `${leftPct}%`,
                                      width: `${widthPct}%`,
                                      transform: 'skewX(-12deg)',
                                      transformOrigin: 'bottom left',
                                    }}
                                  >
                                    <span
                                      className="px-1.5 text-xs font-medium text-primary-800 dark:text-primary-200"
                                      style={{ transform: 'skewX(12deg)' }}
                                    >
                                      {nightLabel}
                                    </span>
                                  </div>
                                );
                              })()}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
            </div>
            {canScrollLeft && (
              <button
                type="button"
                onClick={() => scrollBy(-200)}
                className="absolute left-[100px] top-10 z-10 flex h-8 w-8 items-center justify-center rounded-md border border-gray-300 bg-white/95 text-gray-700 shadow hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800/95 dark:text-gray-200 dark:hover:bg-gray-700"
                aria-label="Scroll dates left"
              >
                <span className="text-lg leading-none">‹</span>
              </button>
            )}
            {canScrollRight && (
              <button
                type="button"
                onClick={() => scrollBy(200)}
                className="absolute right-0 top-10 z-10 flex h-8 w-8 items-center justify-center rounded-md border border-gray-300 bg-white/95 text-gray-700 shadow hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800/95 dark:text-gray-200 dark:hover:bg-gray-700"
                aria-label="Scroll dates right"
              >
                <span className="text-lg leading-none">›</span>
              </button>
            )}
          </div>
        </section>
      </div>
      <QuickReservationDialog
        open={quickReservationOpen}
        onClose={() => { setQuickReservationOpen(false); setQuickReservationPayload(null); setSelection(null); }}
        payload={quickReservationPayload}
      />
    </MainLayout>
  );
};
