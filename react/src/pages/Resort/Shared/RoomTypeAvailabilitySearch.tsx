import { useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { resortService } from '@services/resort.service';
import type { RoomListDto, RoomTypeListDto } from '@/types/resort.types';

export type RoomTypeAvailabilitySearchCriteria = {
  roomTypeIds: string[];
  arrivalDate: string;
  departureDate: string;
};

export type RoomTypeAvailabilityRow = {
  roomTypeId: string;
  roomTypeName: string;
  bedTypeSummary?: string;
  maxAdults: number;
  maxChildren: number;
  baseRate: number;
  availableCount: number;
};

type RoomTypeAvailabilityChange = {
  availableRooms: RoomListDto[];
  availabilityRows: RoomTypeAvailabilityRow[];
};

type RoomTypeAvailabilitySearchProps = {
  roomTypes?: RoomTypeListDto[];
  arrivalDate?: string;
  departureDate?: string;
  reservationId?: string;
  channelId?: string;
  selectedRoomTypeIds: string[];
  onSelectedRoomTypeIdsChange: (roomTypeIds: string[]) => void;
  selectedAmounts: Record<string, number>;
  onSelectedAmountsChange: (amounts: Record<string, number>) => void;
  searchCriteria: RoomTypeAvailabilitySearchCriteria | null;
  onSearch: (criteria: RoomTypeAvailabilitySearchCriteria) => void;
  errorMessage?: string;
  onErrorMessageChange: (message: string) => void;
  onAvailabilityChange?: (result: RoomTypeAvailabilityChange) => void;
  excludeReservedWithoutAssignedRoom?: boolean;
  checkInReadyOnly?: boolean;
  resultTitle?: string;
};

export const RoomTypeAvailabilitySearch = ({
  roomTypes,
  arrivalDate,
  departureDate,
  reservationId,
  channelId,
  selectedRoomTypeIds,
  onSelectedRoomTypeIdsChange,
  selectedAmounts,
  onSelectedAmountsChange,
  searchCriteria,
  onSearch,
  errorMessage,
  onErrorMessageChange,
  onAvailabilityChange,
  excludeReservedWithoutAssignedRoom = true,
  checkInReadyOnly = false,
  resultTitle = 'Available Room Types',
}: RoomTypeAvailabilitySearchProps) => {
  const allRoomTypeIds = useMemo(() => (roomTypes ?? []).map((roomType) => roomType.id), [roomTypes]);

  const isAllRoomTypesSelected =
    allRoomTypeIds.length > 0 && allRoomTypeIds.every((roomTypeId) => selectedRoomTypeIds.includes(roomTypeId));

  const availableRoomsQuery = useQuery({
    queryKey: [
      'room-type-availability-search',
      searchCriteria?.roomTypeIds.join(','),
      searchCriteria?.arrivalDate,
      searchCriteria?.departureDate,
      reservationId,
      excludeReservedWithoutAssignedRoom,
      checkInReadyOnly,
      channelId,
    ],
    queryFn: async () => {
      if (!searchCriteria) return [] as RoomListDto[];

      const responseList = await Promise.all(
        searchCriteria.roomTypeIds.map((roomTypeId) =>
          resortService.getAvailableRooms(
            roomTypeId,
            searchCriteria.arrivalDate,
            searchCriteria.departureDate,
            reservationId,
            excludeReservedWithoutAssignedRoom,
            checkInReadyOnly,
            channelId,
          )
        )
      );

      return responseList.flat();
    },
    enabled: Boolean(
      searchCriteria &&
        searchCriteria.roomTypeIds.length > 0 &&
        searchCriteria.arrivalDate &&
        searchCriteria.departureDate,
    ),
  });

  const availabilityRows = useMemo<RoomTypeAvailabilityRow[]>(() => {
    const map = new Map<string, RoomTypeAvailabilityRow>();

    for (const room of availableRoomsQuery.data ?? []) {
      const current = map.get(room.roomTypeId);
      if (!current) {
        map.set(room.roomTypeId, {
          roomTypeId: room.roomTypeId,
          roomTypeName: room.roomTypeName,
          bedTypeSummary: room.bedTypeSummary,
          maxAdults: room.maxAdults,
          maxChildren: room.maxChildren,
          baseRate: room.baseRate,
          availableCount: 1,
        });
      } else {
        current.availableCount += 1;
      }
    }

    return Array.from(map.values()).sort((left, right) => left.baseRate - right.baseRate);
  }, [availableRoomsQuery.data]);

  useEffect(() => {
    if (!onAvailabilityChange) return;

    onAvailabilityChange({
      availableRooms: availableRoomsQuery.data ?? [],
      availabilityRows,
    });
  }, [availableRoomsQuery.data, availabilityRows, onAvailabilityChange]);

  const toggleRoomType = (roomTypeId: string) => {
    onSelectedRoomTypeIdsChange(
      selectedRoomTypeIds.includes(roomTypeId)
        ? selectedRoomTypeIds.filter((id) => id !== roomTypeId)
        : [...selectedRoomTypeIds, roomTypeId]
    );
  };

  const toggleAllRoomTypes = () => {
    onSelectedRoomTypeIdsChange(isAllRoomTypesSelected ? [] : allRoomTypeIds);
  };

  const handleSearch = () => {
    if (!arrivalDate || !departureDate || selectedRoomTypeIds.length === 0) {
      onErrorMessageChange('Please select stay date range and at least one room type before searching.');
      return;
    }

    if (arrivalDate >= departureDate) {
      onErrorMessageChange('Check-Out date must be after Check-In date.');
      return;
    }

    onErrorMessageChange('');
    onSelectedAmountsChange({});
    onSearch({
      roomTypeIds: selectedRoomTypeIds,
      arrivalDate,
      departureDate,
    });
  };

  const handleQuantityChange = (roomTypeId: string, rawValue: string, maxSelectable: number) => {
    const parsed = Number(rawValue);
    const requested = Number.isNaN(parsed) ? 0 : Math.max(0, Math.floor(parsed));

    onErrorMessageChange('');
    onSelectedAmountsChange({
      ...selectedAmounts,
      [roomTypeId]: Math.min(requested, maxSelectable),
    });
  };

  return (
    <div className="space-y-4">
      <div className="rounded border p-3 dark:border-gray-700">
        <div className="mb-2 flex items-center justify-start gap-4">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter by room type:</p>
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={isAllRoomTypesSelected}
              disabled={allRoomTypeIds.length === 0}
              onChange={toggleAllRoomTypes}
            />
            <span>Select all</span>
          </label>
        </div>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-4">
          {(roomTypes ?? []).map((roomType) => (
            <label key={roomType.id} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={selectedRoomTypeIds.includes(roomType.id)}
                onChange={() => toggleRoomType(roomType.id)}
              />
              <span>{roomType.name}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handleSearch}
          disabled={availableRoomsQuery.isFetching}
          className="rounded bg-primary-600 px-4 py-2 text-white hover:bg-primary-700 disabled:opacity-50"
        >
          {availableRoomsQuery.isFetching ? 'Searching...' : searchCriteria ? 'Change Search' : 'Search'}
        </button>
        {searchCriteria ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Check-In {searchCriteria.arrivalDate} to Check-Out {searchCriteria.departureDate}
          </p>
        ) : null}
      </div>

      {errorMessage ? <p className="text-sm text-rose-600">{errorMessage}</p> : null}

      {searchCriteria ? (
        <div>
          <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">{resultTitle}</h2>
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
                {availableRoomsQuery.isFetching ? (
                  <tr>
                    <td colSpan={4} className="border border-gray-200 p-3 text-center text-gray-500 dark:border-gray-700 dark:text-gray-400">
                      Loading available room types...
                    </td>
                  </tr>
                ) : null}
                {!availableRoomsQuery.isFetching
                  ? availabilityRows.map((row) => {
                      const selected = selectedAmounts[row.roomTypeId] ?? 0;
                      const maxSelectable = row.availableCount;

                      return (
                        <tr key={row.roomTypeId} className="align-top">
                          <td className="border border-gray-200 p-2 dark:border-gray-700">
                            <p className="font-semibold text-blue-700 dark:text-blue-300">{row.roomTypeName}</p>
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                              {row.bedTypeSummary ?? 'Standard layout'}
                            </p>
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{row.availableCount} room(s) available</p>
                          </td>
                          <td className="border border-gray-200 p-2 dark:border-gray-700">
                            <p>{row.maxAdults} adults</p>
                            <p>{row.maxChildren} children</p>
                          </td>
                          <td className="border border-gray-200 p-2 dark:border-gray-700">
                            <p className="font-semibold">P {row.baseRate.toLocaleString()}</p>
                          </td>
                          <td className="border border-gray-200 p-2 dark:border-gray-700">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                className="rounded border border-gray-300 px-2 py-1 text-sm font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                                disabled={selected <= 0}
                                onClick={() => handleQuantityChange(row.roomTypeId, String(selected - 1), maxSelectable)}
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
                                onClick={() => handleQuantityChange(row.roomTypeId, String(selected + 1), maxSelectable)}
                              >
                                +
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  : null}
                {!availableRoomsQuery.isFetching && availabilityRows.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="border border-gray-200 p-3 text-center text-gray-500 dark:border-gray-700 dark:text-gray-400">
                      No rooms available for the selected criteria.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
};