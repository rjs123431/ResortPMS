import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { MainLayout } from '@components/layout/MainLayout';
import { resortService } from '@services/resort.service';
import type { RoomListDto, StayListDto, ReservationDetailDto, ReservationRoomDetailDto } from '@/types/resort.types';
import { ReservationStatus } from '@/types/resort.types';

const toDateKey = (d: Date | string | undefined): string => {
  if (d == null) return '';
  const date = typeof d === 'string' ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

/** Property policy: check-in at 2:00 PM, checkout at 12:00 PM. Used for grid bar positioning. */
const CHECK_IN_HOUR_FRAC = 14 / 24; // 2pm = start of bar on check-in day
const CHECK_OUT_HOUR_FRAC = 12 / 24; // 12 noon = end of bar on checkout day

type StayRow = StayListDto & { CheckInDateTime?: string; ExpectedCheckOutDateTime?: string; RoomNumber?: string; StayNo?: string; GuestName?: string; Id?: string };

/** Stay occupies date if checkIn <= date < expectedCheckOut (checkout day exclusive). Supports camelCase and PascalCase from API. */
const stayCoversDate = (stay: StayRow, dateKey: string): boolean => {
  const checkInRaw = stay.checkInDateTime ?? stay.CheckInDateTime;
  const checkOutRaw = stay.expectedCheckOutDateTime ?? stay.ExpectedCheckOutDateTime;
  const checkIn = toDateKey(checkInRaw);
  const checkOut = toDateKey(checkOutRaw);
  if (!checkIn || !checkOut) return false;
  return dateKey >= checkIn && dateKey < checkOut;
};

/** Extract room number(s) from stay; API may return one or comma-separated, camelCase or PascalCase. */
const getStayRoomNumbers = (stay: StayRow): string[] => {
  const raw = stay.roomNumber ?? stay.RoomNumber;
  if (typeof raw !== 'string' || !raw.trim()) return [];
  return raw.split(',').map((s) => s.trim()).filter(Boolean);
};

const reservationRoomCoversDate = (room: ReservationRoomDetailDto, dateKey: string): boolean => {
  const arr = toDateKey(room.arrivalDate);
  const dep = toDateKey(room.departureDate);
  return dateKey >= arr && dateKey < dep;
};

type CellInfo = { type: 'stay'; stayNo: string; guestName: string; stayId: string } | { type: 'reservation'; reservationNo: string; guestName: string; reservationId: string } | null;

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

export const FrontDeskGridPage = () => {
  const navigate = useNavigate();
  const [startDate, setStartDate] = useState<Date>(() => new Date());
  const [endDate, setEndDate] = useState<Date>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 13);
    return d;
  });

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
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

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

  const { data: staysData } = useQuery({
    queryKey: ['frontdesk-grid-stays'],
    queryFn: () => resortService.getInHouseStays('', 0, 500),
  });

  const { data: reservationsListData } = useQuery({
    queryKey: ['frontdesk-grid-reservations-list'],
    queryFn: () => resortService.getReservations('', 0, 300),
  });

  const overlappingReservationIds = useMemo(() => {
    const list = reservationsListData?.items ?? [];
    return list
      .filter(
        (r) =>
          (r.status === ReservationStatus.Pending || r.status === ReservationStatus.Confirmed) &&
          toDateKey(r.departureDate) >= startKey &&
          toDateKey(r.arrivalDate) <= endKey
      )
      .map((r) => r.id)
      .slice(0, 80);
  }, [reservationsListData, startKey, endKey]);

  const { data: reservationDetails } = useQuery({
    queryKey: ['frontdesk-grid-reservation-details', overlappingReservationIds],
    enabled: overlappingReservationIds.length > 0,
    queryFn: async () => Promise.all(overlappingReservationIds.map((id) => resortService.getReservation(id))),
  });

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
    const stays = staysData?.items ?? [];
    const details = reservationDetails ?? [];
    const resByRoomDate = new Map<string, CellInfo>();

    stays.forEach((stay: StayRow) => {
      const roomNumbers = getStayRoomNumbers(stay);
      const stayNo = stay.stayNo ?? stay.StayNo ?? '';
      const guestName = stay.guestName ?? stay.GuestName ?? '';
      const stayId = stay.id ?? stay.Id ?? '';
      if (roomNumbers.length === 0) return;
      dateColumns.forEach((dateKey) => {
        if (!stayCoversDate(stay, dateKey)) return;
        roomNumbers.forEach((roomNum) => {
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
  }, [staysData, reservationDetails, dateColumns]);

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

    (staysData?.items ?? []).forEach((stay: StayRow) => {
      const roomNumbers = getStayRoomNumbers(stay);
      dateColumns.forEach((dateKey) => {
        if (!stayCoversDate(stay, dateKey)) return;
        roomNumbers.forEach((roomNum) => {
          const typeName = roomNumberToType.get(roomNum.trim());
          if (typeName) add(typeName, dateKey);
        });
      });
    });

    (reservationDetails ?? []).forEach((res: ReservationDetailDto) => {
      if (res.status === ReservationStatus.CheckedIn) return;
      (res.rooms ?? []).forEach((room: ReservationRoomDetailDto) => {
        if (room.roomId || (room.roomNumber?.trim() ?? '')) return;
        const typeName = room.roomTypeName?.trim() ?? '';
        if (!typeName) return;
        dateColumns.forEach((dateKey) => {
          if (reservationRoomCoversDate(room, dateKey)) add(typeName, dateKey);
        });
      });
    });

    return (roomTypeName: string, dateKey: string) => countBy.get(`${roomTypeName}|${dateKey}`) ?? 0;
  }, [staysData, reservationDetails, dateColumns, roomNumberToType]);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Front Desk Grid</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Room occupancy by date. Rows = rooms (by type), columns = dates.</p>
          </div>
        </div>

        <section className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
          <div className="mb-4 flex flex-wrap items-end gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">From</label>
              <DatePicker
                selected={startDate}
                onChange={(d: Date | null) => setStartDate(d ?? new Date())}
                dateFormat="yyyy-MM-dd"
                className="w-full min-w-[140px] rounded border p-2 dark:bg-gray-700"
                popperClassName="!z-[100]"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">To</label>
              <DatePicker
                selected={endDate}
                onChange={(d: Date | null) => setEndDate(d ?? new Date())}
                dateFormat="yyyy-MM-dd"
                className="w-full min-w-[140px] rounded border p-2 dark:bg-gray-700"
                popperClassName="!z-[100]"
              />
            </div>
          </div>

          <div className="relative">
            <div
              ref={scrollRef}
              className="overflow-x-auto"
              onScroll={updateScrollArrows}
            >
              <table className="min-w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 dark:bg-gray-700/50">
                    <th className="sticky left-0 z-[1] min-w-[100px] border-b border-r bg-gray-50 p-2 text-left font-semibold text-gray-900 dark:bg-gray-700/50 dark:text-white">Room</th>
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
                    <tr className="bg-gray-100 dark:bg-gray-700/30">
                      <td className="sticky left-0 z-[1] min-w-[100px] border-b border-r bg-gray-100 p-2 font-medium text-gray-800 dark:bg-gray-700/30 dark:text-gray-200">
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
                      const segments: { id: string; guestName: string; navPath: string; startIndex: number; endIndex: number; bgClass: string; textClass: string }[] = [];
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
                        const bgClass = cell.type === 'stay' ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-green-100 dark:bg-green-900/30';
                        const textClass = cell.type === 'stay' ? 'text-blue-900 hover:underline dark:text-blue-100' : 'text-green-900 hover:underline dark:text-green-100';
                        segments.push({ id: `${cellId}-${startIndex}`, guestName: guestName || '—', navPath, startIndex, endIndex, bgClass, textClass });
                        i = endIndex;
                      }
                      return (
                        <tr key={room.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-700/20">
                          <td className="sticky left-0 z-[1] border-r bg-white p-2 font-medium text-gray-900 dark:bg-gray-800 dark:text-white">
                            {roomNum}
                          </td>
                          <td colSpan={n} className="min-w-0 p-0 align-top">
                            <div
                              className="relative w-full h-8 min-h-[2rem] border-b border-gray-200 dark:border-gray-600"
                              style={{
                                backgroundImage: `linear-gradient(to right, var(--tw-border-color, rgb(229 231 235)) 1px, transparent 1px)`,
                                backgroundSize: `${100 / n}% 100%`,
                              }}
                            >
                              {segments.map((seg) => {
                                const leftPct = ((seg.startIndex + CHECK_IN_HOUR_FRAC) / n) * 100;
                                const rightPct = ((seg.endIndex + CHECK_OUT_HOUR_FRAC) / n) * 100;
                                const widthPct = rightPct - leftPct;
                                return (
                                  <div
                                    key={seg.id}
                                    className={`absolute top-0 bottom-0 min-w-0 flex items-center overflow-hidden border border-gray-300/50 dark:border-gray-600/50 ${seg.bgClass}`}
                                    style={{
                                      left: `${leftPct}%`,
                                      width: `${widthPct}%`,
                                      transform: 'skewX(-12deg)',
                                      transformOrigin: 'bottom left',
                                    }}
                                  >
                                    <button
                                      type="button"
                                      className={`flex-1 min-w-0 truncate px-1.5 py-0.5 text-left text-xs ${seg.textClass}`}
                                      style={{ transform: 'skewX(12deg)' }}
                                      onClick={() => navigate(seg.navPath)}
                                      title={seg.guestName}
                                    >
                                      {seg.guestName}
                                    </button>
                                  </div>
                                );
                              })}
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
    </MainLayout>
  );
};
