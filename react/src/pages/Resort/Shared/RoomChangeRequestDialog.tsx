import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { useQuery } from '@tanstack/react-query';
import { resortService } from '@services/resort.service';
import {
  RoomChangeSource,
  RoomChangeReason,
  HousekeepingStatus,
} from '@/types/resort.types';
import { formatMoney } from '@utils/helpers';

export const ROOM_CHANGE_SOURCE_OPTIONS: Array<{ value: RoomChangeSource; label: string }> = [
  { value: RoomChangeSource.GuestRequest, label: 'Guest Request' },
  { value: RoomChangeSource.Internal, label: 'Internal' },
  { value: RoomChangeSource.Maintenance, label: 'Maintenance' },
  { value: RoomChangeSource.Upgrade, label: 'Upgrade' },
  { value: RoomChangeSource.Downgrade, label: 'Downgrade' },
];

export const ROOM_CHANGE_REASON_OPTIONS: Array<{ value: RoomChangeReason; label: string }> = [
  { value: RoomChangeReason.GuestPreference, label: 'Guest Preference' },
  { value: RoomChangeReason.RoomIssue, label: 'Room Issue' },
  { value: RoomChangeReason.Maintenance, label: 'Maintenance' },
  { value: RoomChangeReason.Noise, label: 'Noise' },
  { value: RoomChangeReason.ViewChange, label: 'View Change' },
  { value: RoomChangeReason.Accessibility, label: 'Accessibility' },
  { value: RoomChangeReason.FamilyReunion, label: 'Family Reunion' },
  { value: RoomChangeReason.Upgrade, label: 'Upgrade' },
  { value: RoomChangeReason.Downgrade, label: 'Downgrade' },
  { value: RoomChangeReason.Overbooking, label: 'Overbooking' },
  { value: RoomChangeReason.Other, label: 'Other' },
];

const getHousekeepingStatusLabel = (status: HousekeepingStatus) => {
  switch (status) {
    case HousekeepingStatus.Clean:
      return 'Clean';
    case HousekeepingStatus.Dirty:
      return 'Dirty';
    case HousekeepingStatus.Inspected:
      return 'Inspected';
    case HousekeepingStatus.Pickup:
      return 'Pickup';
    default:
      return 'Unknown';
  }
};

const getHousekeepingStatusColor = (status: HousekeepingStatus) => {
  switch (status) {
    case HousekeepingStatus.Clean:
      return 'bg-green-100 text-green-800';
    case HousekeepingStatus.Inspected:
      return 'bg-blue-100 text-blue-800';
    case HousekeepingStatus.Dirty:
      return 'bg-red-100 text-red-800';
    case HousekeepingStatus.Pickup:
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const toDateInputValue = (value: Date) => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

type RoomChangeValues = {
  source: RoomChangeSource;
  reason: RoomChangeReason;
  reasonDetails: string;
  toRoomId: string;
  chargeMode: 'post_charge' | 'no_charge';
  rateDifferencePerNight?: number | null;
  toRoomNumber?: string;
};

type RoomChangeRequestDialogProps = {
  open: boolean;
  stayId: string;
  stayRoomId?: string;
  currentRoomId?: string;
  currentRoomNumber?: string;
  expectedCheckOutDateTime?: string;
  isSaving?: boolean;
  onClose: () => void;
  onSave: (values: RoomChangeValues) => void;
};

const defaultForm = (): RoomChangeValues => ({
  source: RoomChangeSource.Internal,
  reason: RoomChangeReason.Other,
  reasonDetails: '',
  toRoomId: '',
  chargeMode: 'post_charge',
});

export const RoomChangeRequestDialog = ({
  open,
  stayId,
  stayRoomId: _stayRoomId,
  currentRoomId,
  currentRoomNumber,
  expectedCheckOutDateTime,
  isSaving = false,
  onClose,
  onSave,
}: RoomChangeRequestDialogProps) => {
  const [form, setForm] = useState<RoomChangeValues>(defaultForm());
  const [selectedRoomTypeId, setSelectedRoomTypeId] = useState<string>('');
  const [pricingWindow] = useState(() => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    return {
      arrivalDate: toDateInputValue(today),
      departureDate: toDateInputValue(tomorrow),
    };
  });

  const { data: roomTypes } = useQuery({
    queryKey: ['resort-room-types'],
    queryFn: () => resortService.getRoomTypes(),
    enabled: open,
  });

  const { data: availableRooms, isFetching: isFetchingRooms } = useQuery({
    queryKey: ['resort-available-rooms-for-transfer', stayId, selectedRoomTypeId],
    queryFn: () => resortService.getAvailableRooms(selectedRoomTypeId || undefined, undefined, undefined, undefined, undefined, true),
    enabled: open && !!stayId,
  });

  const { data: currentRoom } = useQuery({
    queryKey: ['resort-room-transfer-current-room', currentRoomId],
    queryFn: () => resortService.getRoom(currentRoomId as string),
    enabled: open && !!currentRoomId,
  });

  const cleanRooms = useMemo(() => {
    return (availableRooms ?? []).filter(
      (room) =>
        room.housekeepingStatus === HousekeepingStatus.Clean ||
        room.housekeepingStatus === HousekeepingStatus.Inspected,
    );
  }, [availableRooms]);

  const roomTypeIdsForPricing = useMemo(
    () =>
      Array.from(
        new Set([
          ...cleanRooms.map((room) => room.roomTypeId),
          ...(currentRoom?.roomTypeId ? [currentRoom.roomTypeId] : []),
        ]),
      ).sort(),
    [cleanRooms, currentRoom?.roomTypeId],
  );

  const { data: currentRateByRoomType } = useQuery<Record<string, number | null>>({
    queryKey: [
      'resort-room-transfer-current-rates',
      pricingWindow.arrivalDate,
      pricingWindow.departureDate,
      ...roomTypeIdsForPricing,
    ],
    queryFn: async () => {
      const entries = await Promise.all(
        roomTypeIdsForPricing.map(async (roomTypeId) => {
          try {
            const rate = await resortService.getEffectiveRatePerNight(
              roomTypeId,
              pricingWindow.arrivalDate,
              pricingWindow.departureDate,
            );
            return [roomTypeId, rate] as const;
          } catch {
            return [roomTypeId, null] as const;
          }
        }),
      );

      return Object.fromEntries(entries);
    },
    enabled: open && roomTypeIdsForPricing.length > 0,
    staleTime: 60_000,
  });

  const previousRoomCurrentRate = currentRoom?.roomTypeId ? currentRateByRoomType?.[currentRoom.roomTypeId] ?? null : null;

  const getCurrentPriceForRoom = (roomTypeId: string, fallbackBaseRate?: number) => {
    const computedRate = currentRateByRoomType?.[roomTypeId];
    if (computedRate != null) {
      return computedRate;
    }
    return fallbackBaseRate ?? null;
  };

  const formatRateDifference = (difference: number) => {
    return `${difference > 0 ? '+' : ''}${formatMoney(difference)}`;
  };

  const getDateOnlyKey = (value: Date) => {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const remainingNightsUntilCheckout = useMemo(() => {
    if (!expectedCheckOutDateTime) return 0;

    const checkout = new Date(expectedCheckOutDateTime);
    if (Number.isNaN(checkout.getTime())) return 0;

    const today = new Date();
    const todayDateOnly = new Date(getDateOnlyKey(today));
    const checkoutDateOnly = new Date(getDateOnlyKey(checkout));
    const msPerDay = 24 * 60 * 60 * 1000;
    const nights = Math.round((checkoutDateOnly.getTime() - todayDateOnly.getTime()) / msPerDay);

    return Math.max(0, nights);
  }, [expectedCheckOutDateTime]);

  const selectedTargetRoom = cleanRooms.find((room) => room.id === form.toRoomId);
  const selectedTargetRate = selectedTargetRoom
    ? getCurrentPriceForRoom(selectedTargetRoom.roomTypeId, selectedTargetRoom.baseRate)
    : null;
  const selectedRateDifference =
    selectedTargetRate != null && previousRoomCurrentRate != null ? selectedTargetRate - previousRoomCurrentRate : null;
  const selectedTotalDifference =
    selectedRateDifference != null ? Number((selectedRateDifference * remainingNightsUntilCheckout).toFixed(2)) : null;

  useEffect(() => {
    if (selectedRateDifference == null) {
      return;
    }

    if (selectedRateDifference <= 0 && form.chargeMode !== 'no_charge') {
      setForm((prev) => ({ ...prev, chargeMode: 'no_charge' }));
    }
  }, [selectedRateDifference, form.chargeMode]);

  useEffect(() => {
    if (open) {
      setForm(defaultForm());
      setSelectedRoomTypeId('');
    }
  }, [open]);

  const canSave = form.toRoomId && form.source && form.reason;

  const handleRoomSelect = (roomId: string) => {
    setForm((prev) => ({ ...prev, toRoomId: roomId }));
  };

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  return (
    <Dialog open={open} onClose={() => {}} className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50 pointer-events-none" aria-hidden />
      <div className="relative flex min-h-screen items-top justify-center p-4 pointer-events-none">
        <DialogPanel className="w-full max-w-2xl rounded-lg bg-white p-4 shadow-xl dark:bg-gray-800 pointer-events-auto">
          <DialogTitle as="h3" className="text-lg font-semibold text-gray-900 dark:text-white">
            Room Transfer
          </DialogTitle>
          {currentRoomNumber && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Current Room: <span className="font-medium">{currentRoomNumber}</span>
              {previousRoomCurrentRate != null && (
                <>
                  {' '}
                  | Previous Price: <span className="font-medium">{formatMoney(previousRoomCurrentRate)}</span> / night
                </>
              )}
            </p>
          )}

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Source</label>
              <select
                value={form.source}
                onChange={(e) => setForm((s) => ({ ...s, source: Number(e.target.value) as RoomChangeSource }))}
                className="w-full rounded border border-gray-300 p-2 text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              >
                {ROOM_CHANGE_SOURCE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Reason</label>
              <select
                value={form.reason}
                onChange={(e) => setForm((s) => ({ ...s, reason: Number(e.target.value) as RoomChangeReason }))}
                className="w-full rounded border border-gray-300 p-2 text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              >
                {ROOM_CHANGE_REASON_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-3">
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Details (Optional)</label>
            <textarea
              rows={1}
              value={form.reasonDetails}
              onChange={(e) => setForm((s) => ({ ...s, reasonDetails: e.target.value }))}
              className="w-full rounded border border-gray-300 p-2 text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              placeholder="Additional details about the room change..."
            />
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between">
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Select New Room</label>
              <select
                value={selectedRoomTypeId}
                onChange={(e) => setSelectedRoomTypeId(e.target.value)}
                className="rounded border border-gray-300 p-1 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              >
                <option value="">All Room Types</option>
                {(roomTypes ?? []).map((rt) => (
                  <option key={rt.id} value={rt.id}>
                    {rt.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-2 max-h-60 overflow-y-auto rounded border border-gray-200 dark:border-gray-600">
              {isFetchingRooms ? (
                <p className="p-3 text-center text-sm text-gray-500">Loading available rooms...</p>
              ) : cleanRooms.length === 0 ? (
                <p className="p-3 text-center text-sm text-gray-500">No clean rooms available for transfer.</p>
              ) : (
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="p-2 text-left">Room</th>
                      <th className="p-2 text-left">Type</th>
                      <th className="p-2 text-left">Floor</th>
                      <th className="p-2 text-left">Status</th>
                      <th className="p-2 text-right">Current Price</th>
                      <th className="p-2 text-right">Diff / Night</th>
                      <th className="p-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {cleanRooms.map((room) => (
                      <tr
                        key={room.id}
                        className={`border-b cursor-pointer hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700 ${
                          form.toRoomId === room.id ? 'bg-primary-50 dark:bg-primary-900/20' : ''
                        }`}
                        onClick={() => handleRoomSelect(room.id)}
                      >
                        <td className="p-2 font-medium">{room.roomNumber}</td>
                        <td className="p-2">{room.roomTypeName}</td>
                        <td className="p-2">{room.floor || '-'}</td>
                        <td className="p-2">
                          <span
                            className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${getHousekeepingStatusColor(
                              room.housekeepingStatus,
                            )}`}
                          >
                            {getHousekeepingStatusLabel(room.housekeepingStatus)}
                          </span>
                        </td>
                        <td className="p-2 text-right">{(() => {
                          const targetRate = getCurrentPriceForRoom(room.roomTypeId, room.baseRate);
                          return targetRate != null ? formatMoney(targetRate) : '-';
                        })()}</td>
                        <td className="p-2 text-right">{(() => {
                          const targetRate = getCurrentPriceForRoom(room.roomTypeId, room.baseRate);
                          if (targetRate == null || previousRoomCurrentRate == null) {
                            return '-';
                          }

                          const difference = targetRate - previousRoomCurrentRate;
                          const diffClass =
                            difference > 0
                              ? 'text-red-600 dark:text-red-400'
                              : difference < 0
                                ? 'text-green-600 dark:text-green-400'
                                : 'text-gray-500 dark:text-gray-400';

                          return <span className={diffClass}>{formatRateDifference(difference)}</span>;
                        })()}</td>
                        <td className="p-2 text-center">
                          <input
                            type="radio"
                            name="selectedRoom"
                            checked={form.toRoomId === room.id}
                            onChange={() => handleRoomSelect(room.id)}
                            className="cursor-pointer"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {selectedRateDifference != null && (
            <div className="mt-2 space-y-2">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Rate adjustment to post in folio (per night):{' '}
                <span
                  className={`font-medium ${
                    selectedRateDifference > 0
                      ? 'text-red-600 dark:text-red-400'
                      : selectedRateDifference < 0
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-gray-600 dark:text-gray-300'
                  }`}
                >
                  {formatRateDifference(selectedRateDifference)}
                </span>
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Total until checkout ({remainingNightsUntilCheckout} night{remainingNightsUntilCheckout === 1 ? '' : 's'}):{' '}
                <span className="font-medium">
                  {selectedTotalDifference != null ? formatRateDifference(selectedTotalDifference) : '-'}
                </span>
              </p>

              <div className="rounded border border-gray-200 p-2 dark:border-gray-600">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Folio Charge Option</p>
                <label className="mt-1 flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <input
                    type="radio"
                    name="transferChargeMode"
                    checked={form.chargeMode === 'post_charge'}
                    onChange={() => setForm((prev) => ({ ...prev, chargeMode: 'post_charge' }))}
                    disabled={selectedRateDifference <= 0}
                  />
                  Post rate difference as charge
                </label>
                <label className="mt-1 flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <input
                    type="radio"
                    name="transferChargeMode"
                    checked={form.chargeMode === 'no_charge'}
                    onChange={() => setForm((prev) => ({ ...prev, chargeMode: 'no_charge' }))}
                  />
                  Do not charge anything
                </label>
              </div>
            </div>
          )}

          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() =>
                onSave({
                  ...form,
                  rateDifferencePerNight: selectedRateDifference,
                  toRoomNumber: selectedTargetRoom?.roomNumber,
                })
              }
              disabled={isSaving || !canSave}
              className="rounded bg-primary-600 px-3 py-2 text-sm text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {isSaving ? 'Processing...' : 'Transfer Room'}
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
};
