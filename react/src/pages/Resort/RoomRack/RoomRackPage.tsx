import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { ArrowLeftIcon, CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { MainLayout } from '@components/layout/MainLayout';
import { resortService } from '@services/resort.service';
import type { RoomListDto } from '@/types/resort.types';
import { ReservationStatus } from '@/types/resort.types';
import { QuickReservationDialog, type QuickReservationPayload } from './QuickReservationDialog';
import { RoomRackDetailPanel, type RoomRackPanelItem } from './RoomRackDetailPanel';
import { RoomRackBookingsDialog, type BookingsDialogItem } from './RoomRackBookingsDialog';

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

type CellInfo =
  | { type: 'stay'; stayNo: string; guestName: string; stayId: string; isArrivalDate?: boolean; isDepartureDate?: boolean }
  | { type: 'reservation'; reservationNo: string; guestName: string; reservationId: string; reservationStatus?: number; isArrivalDate?: boolean; isDepartureDate?: boolean }
  | { type: 'blocked'; label: string }
  | null;
type CellInfoNonNull = Exclude<CellInfo, null>;

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

/** Number of calendar days (inclusive) between start and end. */
const spanDays = (start: Date, end: Date): number => {
  const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
  const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime();
  return Math.round((endDay - startDay) / (24 * 60 * 60 * 1000)) + 1;
};

const reservationStatusLabel: Record<number, string> = {
  [ReservationStatus.Draft]: 'Draft',
  [ReservationStatus.Pending]: 'Pending',
  [ReservationStatus.Confirmed]: 'Confirmed',
  [ReservationStatus.Cancelled]: 'Cancelled',
  [ReservationStatus.NoShow]: 'No Show',
  [ReservationStatus.CheckedIn]: 'Checked In',
  [ReservationStatus.Completed]: 'Completed',
};

function formatDateRange(startKey: string, endKey: string): string {
  const start = new Date(startKey + 'T12:00:00');
  const end = new Date(endKey + 'T12:00:00');
  return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
}

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
  const [detailPanelOpen, setDetailPanelOpen] = useState(false);
  const [detailPanelItem, setDetailPanelItem] = useState<RoomRackPanelItem | null>(null);
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

  const { data: roomRackData } = useQuery({
    queryKey: ['room-rack-info', startKey, endKey],
    queryFn: () => resortService.getRoomRackInfo(startKey, endKey),
    staleTime: 30 * 1000,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });

  const roomsByType = useMemo(() => {
    const rooms = roomRackData?.rooms ?? [];
    const map = new Map<string, RoomListDto[]>();
    rooms.forEach((r) => {
      const name = r.roomTypeName || 'Unknown';
      const list = map.get(name) ?? [];
      list.push(r);
      map.set(name, list);
    });
    map.forEach((list) => list.sort((a, b) => collator.compare(a.roomNumber, b.roomNumber)));
    return Array.from(map.entries()).sort((a, b) => collator.compare(a[0], b[0]));
  }, [roomRackData?.rooms]);

  const cellsByKey = useMemo(() => {
    const map = new Map<string, import('@/types/resort.types').RoomRackDayCellDto>();
    (roomRackData?.cells ?? []).forEach((cell) => {
      const dateKey = toDateKey(cell.inventoryDate);
      map.set(`${(cell.roomNumber ?? '').trim()}|${dateKey}`, cell);
    });
    return map;
  }, [roomRackData?.cells]);

  const getCellsAt = useCallback(
    (roomNumber: string, dateKey: string): CellInfoNonNull[] => {
      const cell = cellsByKey.get(`${roomNumber.trim()}|${dateKey}`);
      if (!cell || cell.status === 1) return [];
      if (cell.status === 3)
        return [{
          type: 'stay',
          stayNo: cell.stayNo ?? '',
          guestName: cell.guestName ?? '',
          stayId: cell.stayId ?? '',
          isArrivalDate: cell.isArrivalDate,
          isDepartureDate: cell.isDepartureDate,
        }];
      if (cell.status === 2)
        return [
          {
            type: 'reservation',
            reservationNo: cell.reservationNo ?? '',
            guestName: cell.guestName ?? '',
            reservationId: cell.reservationId ?? '',
            reservationStatus: cell.reservationStatus,
            isArrivalDate: cell.isArrivalDate,
            isDepartureDate: cell.isDepartureDate,
          },
        ];
      return [{ type: 'blocked', label: 'Out of order' }];
    },
    [cellsByKey]
  );

  const isDateOccupied = useCallback(
    (roomNumber: string, dateIndex: number) => {
      if (dateIndex < 0 || dateIndex >= dateColumns.length) return true;
      const dateKey = dateColumns[dateIndex];
      const cell = cellsByKey.get(`${roomNumber.trim()}|${dateKey}`);
      if (!cell || cell.status === 1) return false;
      if (cell.status === 4 || cell.status === 5 || cell.status === 6) return true;
      const nextIndex = dateIndex + 1;
      if (nextIndex >= dateColumns.length) return false;
      const nextKey = dateColumns[nextIndex];
      const nextCell = cellsByKey.get(`${roomNumber.trim()}|${nextKey}`);
      if (!nextCell || nextCell.status === 1) return false;
      return true;
    },
    [cellsByKey, dateColumns]
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
        const room = roomRackData?.rooms?.find((r) => r.id === sel.roomId);
        const baseRate = room?.baseRate ?? 0;
        setQuickReservationPayload({
          checkInDate,
          checkOutDate,
          roomTypeName: sel.roomTypeName,
          roomTypeId: sel.roomTypeId,
          roomNumber: sel.roomNumber,
          roomId: sel.roomId,
          baseRate,
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
  }, [isDragging, dateColumns, isDateOccupied, roomRackData?.rooms]);

  const roomNumberToType = useMemo(() => {
    const map = new Map<string, string>();
    roomsByType.forEach(([roomTypeName, roomList]) => {
      roomList.forEach((r) => map.set((r.roomNumber ?? '').trim(), roomTypeName));
    });
    return map;
  }, [roomsByType]);

  const bookingCountByRoomTypeAndDate = useMemo(() => {
    const countBy = new Map<string, number>();
    (roomRackData?.cells ?? []).forEach((cell) => {
      if (cell.status !== 2) return;
      if (cell.countInBookings === false) return;
      const typeName = roomNumberToType.get((cell.roomNumber ?? '').trim());
      if (!typeName) return;
      const dateKey = toDateKey(cell.inventoryDate);
      const k = `${typeName}|${dateKey}`;
      countBy.set(k, (countBy.get(k) ?? 0) + 1);
    });
    return (roomTypeName: string, dateKey: string) => countBy.get(`${roomTypeName}|${dateKey}`) ?? 0;
  }, [roomRackData?.cells, roomNumberToType]);

  const bookingsListByRoomTypeAndDate = useMemo(() => {
    const listBy = new Map<string, BookingsDialogItem[]>();
    (roomRackData?.cells ?? []).forEach((cell) => {
      if (cell.status !== 2 || cell.countInBookings === false) return;
      if (!cell.reservationId) return;
      const typeName = roomNumberToType.get((cell.roomNumber ?? '').trim());
      if (!typeName) return;
      const dateKey = toDateKey(cell.inventoryDate);
      const k = `${typeName}|${dateKey}`;
      const list = listBy.get(k) ?? [];
      list.push({
        type: 'reservation',
        id: cell.reservationId,
        number: cell.reservationNo ?? '',
        guestName: cell.guestName ?? '—',
        roomNumber: (cell.roomNumber ?? '').trim(),
        status: cell.reservationStatus,
      });
      listBy.set(k, list);
    });
    return (roomTypeName: string, dateKey: string) => listBy.get(`${roomTypeName}|${dateKey}`) ?? [];
  }, [roomRackData?.cells, roomNumberToType]);

  const [bookingsDialogOpen, setBookingsDialogOpen] = useState(false);
  const [bookingsDialogPayload, setBookingsDialogPayload] = useState<{ roomTypeName: string; dateKey: string } | null>(null);

  const topScrollRef = useRef<HTMLDivElement>(null);
  const [tableScrollWidth, setTableScrollWidth] = useState(0);

  useEffect(() => {
    const top = topScrollRef.current;
    const table = scrollRef.current;
    if (!top || !table) return;
    const sync = (src: HTMLDivElement, dest: HTMLDivElement) => {
      dest.scrollLeft = src.scrollLeft;
    };
    top.onscroll = () => sync(top, table);
    table.onscroll = () => sync(table, top);
    return () => {
      top.onscroll = null;
      table.onscroll = null;
    };
  }, []);

  useEffect(() => {
    const table = scrollRef.current;
    if (!table) return;
    const updateWidth = () => setTableScrollWidth(table.scrollWidth);
    updateWidth();
    const ro = new ResizeObserver(updateWidth);
    ro.observe(table);
    return () => ro.disconnect();
  }, [dateColumns.length, roomsByType.length]);

  return (
    <MainLayout>
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="rounded p-1 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
              title="Back to Front Desk"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Room Rack</h1>
              {/* <p className="text-sm text-gray-500 dark:text-gray-400">Room occupancy by date. Rows = rooms (by type), columns = dates.</p> */}
            </div>
          </div>
          <div className="flex flex-nowrap items-center gap-2">
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
        </div>

        <section className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
          <div className="relative flex flex-col">
            {/* Top scrollbar: use overflow-x-scroll and min height so Safari shows the track; width synced via state */}
            <div
              ref={topScrollRef}
              className="min-h-[var(--scrollbar-thumb-height,20px)] shrink-0 overflow-x-scroll overflow-y-hidden scrollbar-custom"
              style={{ height: 'var(--scrollbar-thumb-height, 20px)' }}
              aria-hidden
            >
              <div style={{ width: tableScrollWidth || '100%', minHeight: 1 }} />
            </div>
            <div
              ref={scrollRef}
              className="min-h-0 flex-1 overflow-auto scrollbar-custom max-h-[min(70vh,800px)]"
              onScroll={updateScrollArrows}
            >
              <table className="min-w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 dark:bg-gray-700">
                    <th className="sticky top-0 left-0 z-[40] min-w-[160px] border-b border-r bg-gray-50 p-2 text-left font-semibold text-gray-900 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)] dark:bg-gray-700 dark:text-white dark:shadow-[2px_0_4px_-2px_rgba(0,0,0,0.3)]">Room</th>
                    {dateColumns.map((dateKey) => {
                      const d = new Date(dateKey + 'T12:00:00');
                      return (
                        <th key={dateKey} className="sticky top-0 z-[20] min-w-[100px] border-b border-r bg-gray-50 p-2 text-center font-medium text-gray-700 last:border-r-0 dark:bg-gray-700 dark:text-gray-200">
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
                        <td className="sticky left-0 z-[30] min-w-[160px] border-b border-r bg-gray-100 p-2 font-medium text-gray-800 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)] dark:bg-gray-700 dark:text-gray-200 dark:shadow-[2px_0_4px_-2px_rgba(0,0,0,0.3)]">
                          {roomTypeName}
                        </td>
                        {dateColumns.map((dateKey) => {
                          const count = bookingCountByRoomTypeAndDate(roomTypeName, dateKey);
                          return (
                            <td key={dateKey} className="min-w-[100px] border-b border-r p-2 text-center last:border-r-0" title={count > 0 ? 'No. of bookings' : undefined}>
                              {count > 0 ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setBookingsDialogPayload({ roomTypeName, dateKey });
                                    setBookingsDialogOpen(true);
                                  }}
                                  className="text-sm font-medium text-primary-600 hover:text-primary-700 hover:underline dark:text-primary-400 dark:hover:text-primary-300"
                                >
                                  {count}
                                </button>
                              ) : null}
                            </td>
                          );
                        })}
                      </tr>
                      {rooms.map((room) => {
                        const roomNum = room.roomNumber;
                        const n = dateColumns.length;
                        type SegmentItem = { id: string; guestName: string; navPath: string; startIndex: number; endIndex: number; bgClass: string; textClass: string; extendsBefore: boolean; extendsAfter: boolean; firstDayHalf?: boolean; lastDayHalf?: boolean; tooltip: string; panelItem: RoomRackPanelItem | null };
                        const segments: SegmentItem[] = [];
                        let i = 0;
                        while (i < dateColumns.length) {
                          const cells = getCellsAt(roomNum, dateColumns[i]);
                          if (cells.length === 0) {
                            i++;
                            continue;
                          }
                          const cell = cells[0];
                          const cellId =
                            cell.type === 'stay'
                              ? `s-${cell.stayId}`
                              : cell.type === 'reservation'
                                ? `r-${cell.reservationId}`
                                : `b-${i}`;
                          const startIndex = i;
                          let endIndex = i + 1;
                          while (endIndex < dateColumns.length) {
                            const nextCells = getCellsAt(roomNum, dateColumns[endIndex]);
                            const nextCell = nextCells.find((c) =>
                              cell.type === 'stay'
                                ? c.type === 'stay' && c.stayId === cell.stayId
                                : cell.type === 'reservation'
                                  ? c.type === 'reservation' && c.reservationId === cell.reservationId
                                  : c.type === 'blocked'
                            );
                            if (!nextCell) break;
                            endIndex++;
                          }
                          const guestName = cell.type === 'blocked' ? cell.label : cell.guestName;
                          const navPath =
                            cell.type === 'stay'
                              ? `/stays/${cell.stayId}`
                              : cell.type === 'reservation'
                                ? `/reservations/${cell.reservationId}`
                                : '#';
                          const isConfirmed = cell.type === 'reservation' && cell.reservationStatus === ReservationStatus.Confirmed;
                          const bgClass =
                            cell.type === 'stay'
                              ? 'bg-blue-100 dark:bg-blue-900'
                              : cell.type === 'reservation'
                                ? isConfirmed
                                  ? 'bg-green-100 dark:bg-green-900'
                                  : 'bg-yellow-100 dark:bg-yellow-900'
                                : 'bg-slate-200 dark:bg-slate-600';
                          const textClass =
                            cell.type === 'stay'
                              ? 'text-blue-900 hover:underline dark:text-blue-100'
                              : cell.type === 'reservation'
                                ? isConfirmed
                                  ? 'text-green-900 hover:underline dark:text-green-100'
                                  : 'text-yellow-900 hover:underline dark:text-yellow-100'
                                : 'text-slate-700 dark:text-slate-200 cursor-default';
                          const isStayOrRes = cell.type === 'stay' || cell.type === 'reservation';
                          const lastDayKey = dateColumns[endIndex - 1];
                          const lastDayDto = cellsByKey.get(`${roomNum.trim()}|${lastDayKey}`);
                          const extendsBefore = isStayOrRes && startIndex === 0 && !cell.isArrivalDate;
                          const extendsAfter = isStayOrRes && endIndex === dateColumns.length && !(lastDayDto?.isDepartureDate);
                          const firstDayHalf = isStayOrRes && !!cell.isDepartureDate;
                          const lastDayHalf = isStayOrRes && !!lastDayDto?.isDepartureDate;
                          const startDateKey = dateColumns[startIndex];
                          const endDateKey = dateColumns[endIndex - 1];
                          const dateRangeStr = formatDateRange(startDateKey, endDateKey);
                          let tooltip: string;
                          if (cell.type === 'stay') {
                            tooltip = `In-house · Stay ${cell.stayNo}\nGuest: ${cell.guestName || '—'}\nDates: ${dateRangeStr}`;
                          } else if (cell.type === 'reservation') {
                            const statusLabel = cell.reservationStatus != null ? reservationStatusLabel[cell.reservationStatus] ?? 'Unknown' : 'Unknown';
                            tooltip = `Reservation ${cell.reservationNo}\nGuest: ${cell.guestName || '—'}\nStatus: ${statusLabel}\nDates: ${dateRangeStr}`;
                          } else {
                            tooltip = cell.label;
                          }
                          let panelItem: RoomRackPanelItem | null = null;
                          if (cell.type === 'stay') {
                            panelItem = { type: 'stay', stayId: cell.stayId, stayNo: cell.stayNo ?? '', guestName: cell.guestName ?? '', dateRange: dateRangeStr };
                          } else if (cell.type === 'reservation') {
                            panelItem = { type: 'reservation', reservationId: cell.reservationId, reservationNo: cell.reservationNo ?? '', guestName: cell.guestName ?? '', status: cell.reservationStatus, dateRange: dateRangeStr };
                          }
                          segments.push({
                            id: `${cellId}-${startIndex}`,
                            guestName: guestName || '—',
                            navPath,
                            startIndex,
                            endIndex,
                            bgClass,
                            textClass,
                            extendsBefore,
                            extendsAfter,
                            firstDayHalf: firstDayHalf || undefined,
                            lastDayHalf: lastDayHalf || undefined,
                            tooltip,
                            panelItem,
                          });
                          i = endIndex;
                        }
                        return (
                          <tr key={room.id} className="border-b">
                            <td className="sticky left-0 z-[30] min-w-[160px] h-[2.5rem] border-r bg-white p-2 font-medium text-gray-900 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)] dark:bg-gray-800 dark:text-white dark:shadow-[2px_0_4px_-2px_rgba(0,0,0,0.3)] align-middle">
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
                                    }}
                                  />
                                )}
                                {segments.map((seg) => {
                                  // Check-in 2pm: first day always starts at 2pm (right half of column), never from midnight
                                  const leftPct = seg.firstDayHalf ? (seg.startIndex / n) * 100 : ((seg.startIndex + CHECK_IN_HOUR_FRAC) / n) * 100;
                                  const rightPct = seg.extendsAfter ? 100 : seg.lastDayHalf ? ((seg.endIndex - 0.5) / n) * 100 : ((seg.endIndex + CHECK_OUT_HOUR_FRAC) / n) * 100;
                                  const widthPct = rightPct - leftPct;
                                  return (
                                    <div
                                      key={seg.id}
                                      className={`absolute top-0 bottom-0 z-10 min-w-0 flex items-center overflow-hidden border border-gray-300 dark:border-gray-600 ${seg.bgClass}`}
                                      style={{
                                        left: `${leftPct}%`,
                                        width: `${widthPct}%`,
                                      }}
                                    >
                                      <button
                                        type="button"
                                        className={`flex-1 min-w-0 truncate px-1.5 py-0.5 text-left text-xs ${seg.textClass}`}
                                        onClick={() => {
                                          if (seg.panelItem) {
                                            setDetailPanelItem(seg.panelItem);
                                            setDetailPanelOpen(true);
                                          } else if (seg.navPath !== '#') {
                                            navigate(seg.navPath);
                                          }
                                        }}
                                        title={seg.tooltip}
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
                                      }}
                                    >
                                      <span className="px-1.5 text-xs font-medium text-primary-800 dark:text-primary-200">
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
            
          </div>
        </section>
      </div>
      <QuickReservationDialog
        open={quickReservationOpen}
        onClose={() => { setQuickReservationOpen(false); setQuickReservationPayload(null); setSelection(null); }}
        payload={quickReservationPayload}
      />
      <RoomRackDetailPanel
        open={detailPanelOpen}
        onClose={() => { setDetailPanelOpen(false); setDetailPanelItem(null); }}
        item={detailPanelItem}
      />

      <RoomRackBookingsDialog
        open={bookingsDialogOpen}
        onClose={() => { setBookingsDialogOpen(false); setBookingsDialogPayload(null); }}
        roomTypeName={bookingsDialogPayload?.roomTypeName ?? null}
        dateKey={bookingsDialogPayload?.dateKey ?? null}
        items={bookingsDialogPayload ? bookingsListByRoomTypeAndDate(bookingsDialogPayload.roomTypeName, bookingsDialogPayload.dateKey) : []}
      />
    </MainLayout>
  );
};
