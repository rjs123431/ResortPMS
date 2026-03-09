import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { MainLayout } from '@components/layout/MainLayout';
import { resortService } from '@services/resort.service';

const formatDateLocal = (value: Date) => {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
};

type SearchCriteria = {
  roomTypeIds: string[];
  arrivalDate: string;
  departureDate: string;
  adults: number;
  children: number;
  rooms: number;
};

type AvailabilityRow = {
  roomTypeId: string;
  roomTypeName: string;
  roomTypeDescription?: string;
  bedTypeSummary?: string;
  featureTags: string[];
  amenityItems: string[];
  maxAdults: number;
  maxChildren: number;
  baseRate: number;
  availableCount: number;
};

const normalizeFeatureTags = (tags?: string[]) =>
  (tags ?? [])
    .flatMap((tag) => tag.split(';'))
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);

export const FindAvailableRoomPage = () => {
  const navigate = useNavigate();
  const [stayRange, setStayRange] = useState<[Date | null, Date | null]>([null, null]);
  const [selectedRoomTypeIds, setSelectedRoomTypeIds] = useState<string[]>([]);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [roomCount, setRoomCount] = useState(1);
  const [searchError, setSearchError] = useState('');
  const [searchCriteria, setSearchCriteria] = useState<SearchCriteria | null>(null);
  const [selectedAmounts, setSelectedAmounts] = useState<Record<string, number>>({});

  const [startDate, endDate] = stayRange;

  const { data: roomTypes } = useQuery({
    queryKey: ['resort-room-types'],
    queryFn: () => resortService.getRoomTypes(),
  });

  const searchMutation = useMutation({
    mutationFn: async (input: SearchCriteria) => {
      const responseList = await Promise.all(
        input.roomTypeIds.map((roomTypeId) =>
          resortService.getAvailableRooms(roomTypeId, input.arrivalDate, input.departureDate)
        )
      );
      return responseList.flat();
    },
  });

  const availabilityRows = useMemo<AvailabilityRow[]>(() => {
    const map = new Map<string, AvailabilityRow>();
    for (const room of searchMutation.data ?? []) {
      const current = map.get(room.roomTypeId);
      if (!current) {
        map.set(room.roomTypeId, {
          roomTypeId: room.roomTypeId,
          roomTypeName: room.roomTypeName,
          roomTypeDescription: room.roomTypeDescription,
          bedTypeSummary: room.bedTypeSummary,
          featureTags: normalizeFeatureTags(room.featureTags),
          amenityItems: room.amenityItems ?? [],
          maxAdults: room.maxAdults,
          maxChildren: room.maxChildren,
          baseRate: room.baseRate,
          availableCount: 1,
        });
      } else {
        current.availableCount += 1;
      }
    }

    return Array.from(map.values()).sort((a, b) => a.baseRate - b.baseRate);
  }, [searchMutation.data]);

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

  const toggleRoomType = (roomTypeId: string) => {
    setSelectedRoomTypeIds((prev) =>
      prev.includes(roomTypeId) ? prev.filter((id) => id !== roomTypeId) : [...prev, roomTypeId]
    );
  };

  const handleSearch = () => {
    if (selectedRoomTypeIds.length === 0 || !startDate || !endDate) {
      setSearchError('Please select stay date range and at least one room type before searching.');
      return;
    }

    if (startDate >= endDate) {
      setSearchError('Check-Out date must be after Check-In date.');
      return;
    }

    const nextCriteria: SearchCriteria = {
      roomTypeIds: selectedRoomTypeIds,
      arrivalDate: formatDateLocal(startDate),
      departureDate: formatDateLocal(endDate),
      adults,
      children,
      rooms: roomCount,
    };

    setSearchError('');
    setSelectedAmounts({});
    setSearchCriteria(nextCriteria);
    searchMutation.mutate(nextCriteria);
  };

  const handleQuantityChange = (roomTypeId: string, rawValue: string, maxSelectable: number) => {
    const parsed = Number(rawValue);
    const requested = Number.isNaN(parsed) ? 0 : Math.max(0, Math.floor(parsed));

    const nextValue = Math.min(requested, maxSelectable);
    setSearchError('');

    setSelectedAmounts((prev) => ({
      ...prev,
      [roomTypeId]: nextValue,
    }));
  };

  const handleReserve = () => {
    if (!searchCriteria) return;

    const selectedTypes = selectedSummary.rows.map((row) => row.roomTypeId);
    if (selectedTypes.length === 0) {
      setSearchError('Select at least one room from the table before reserving.');
      return;
    }

    navigate('/reservations/new', {
      state: {
        fromAvailability: true,
        arrivalDate: searchCriteria.arrivalDate,
        departureDate: searchCriteria.departureDate,
        roomTypeIds: selectedTypes,
      },
    });
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Availability</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Find available rooms by date range, occupancy, and room type.</p>
          </div>
          <Link to="/reservations" className="rounded border px-3 py-2 text-sm dark:border-gray-600">
            Back to Reservations
          </Link>
        </div>

        <section className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Check-In and Check-Out Dates</label>
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

          <div className="mt-4 rounded border p-3 dark:border-gray-700">
            <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Filter by room type</p>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
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

          <div className="mt-4 flex items-center justify-between">
            <button
              type="button"
              onClick={handleSearch}
              disabled={searchMutation.isPending}
              className="rounded bg-primary-600 px-4 py-2 text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {searchMutation.isPending ? 'Searching...' : searchCriteria ? 'Change Search' : 'Search'}
            </button>
            {searchCriteria ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Check-In {searchCriteria.arrivalDate} to Check-Out {searchCriteria.departureDate}
              </p>
            ) : null}
          </div>

          {searchError ? <p className="mt-2 text-sm text-rose-600">{searchError}</p> : null}
        </section>

        {searchCriteria ? (
          <section className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
            <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">Available Room Types</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-200 text-sm dark:border-gray-700">
                <thead className="bg-blue-700 text-white dark:bg-blue-900">
                  <tr>
                    <th className="border border-blue-500 p-2 text-left dark:border-blue-800">Room Type</th>
                    <th className="border border-blue-500 p-2 text-left dark:border-blue-800">Number of Guests</th>
                    <th className="border border-blue-500 p-2 text-left dark:border-blue-800">Today's Price</th>
                    <th className="border border-blue-500 p-2 text-right dark:border-blue-800">Quantity</th>
                  </tr>
                </thead>
                <tbody className="text-gray-800 dark:text-gray-200">
                  {availabilityRows.map((row) => {
                    const selected = selectedAmounts[row.roomTypeId] ?? 0;
                    const maxSelectable = row.availableCount;
                    const leadingAmenities = row.amenityItems.slice(0, 6);

                    return (
                      <tr key={row.roomTypeId} className="align-top">
                        <td className="border border-gray-200 p-2 dark:border-gray-700">
                          <p className="font-semibold text-blue-700 dark:text-blue-300">{row.roomTypeName}</p>
                          <p className="mt-1 text-base text-gray-800 dark:text-gray-100">{row.bedTypeSummary ?? '1 bed'}</p>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {row.featureTags.map((tag) => (
                              <span key={tag} className="rounded border border-gray-400 bg-gray-50 px-2 py-0.5 text-xs text-gray-700 dark:border-gray-500 dark:bg-gray-700 dark:text-gray-300">
                                {tag}
                              </span>
                            ))}
                          </div>
                          <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-green-700 dark:text-green-400">
                            {leadingAmenities.map((item) => (
                              <span key={item}>✓ {item}</span>
                            ))}
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{row.availableCount} room(s) available</p>
                        </td>
                        <td className="border border-gray-200 p-2 dark:border-gray-700">
                          <p>{row.maxAdults} adults</p>
                          <p>{row.maxChildren} children</p>
                        </td>
                        <td className="border border-gray-200 p-2 dark:border-gray-700">
                          <p className="text-xl font-semibold">P {row.baseRate.toLocaleString()}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Includes taxes and fees</p>
                        </td>
                        <td className="border border-gray-200 p-2 dark:border-gray-700">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              className="rounded border border-gray-300 px-2 py-1 text-sm font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                              disabled={selected <= 0}
                              onClick={() =>
                                handleQuantityChange(row.roomTypeId, String(selected - 1), maxSelectable)
                              }
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min={0}
                              max={maxSelectable}
                              value={selected}
                              onChange={(e) => handleQuantityChange(row.roomTypeId, e.target.value, maxSelectable)}
                              className="w-20 rounded border border-gray-300 p-1 text-right text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                            />
                            <button
                              type="button"
                              className="rounded border border-gray-300 px-2 py-1 text-sm font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                              disabled={selected >= maxSelectable}
                              onClick={() =>
                                handleQuantityChange(row.roomTypeId, String(selected + 1), maxSelectable)
                              }
                            >
                              +
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {availabilityRows.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="border border-gray-200 p-3 text-center text-gray-500 dark:border-gray-700 dark:text-gray-400">
                        No rooms available for the selected criteria.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex items-center justify-between rounded border bg-slate-100 p-3 dark:border-gray-700 dark:bg-gray-700/40">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Selected package</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">Quantity: {totalSelectedQuantity}</p>
                <p className="font-semibold text-gray-900 dark:text-white">P {selectedSummary.perNightTotal.toLocaleString()} per night</p>
              </div>
              <button
                type="button"
                onClick={handleReserve}
                className="rounded bg-primary-600 px-4 py-2 text-white hover:bg-primary-700"
              >
                I'll reserve
              </button>
            </div>
          </section>
        ) : null}
      </div>
    </MainLayout>
  );
};
