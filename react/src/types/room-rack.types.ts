import type { RoomListDto } from './room.types';

export interface RoomRackDayCellDto {
  roomId: string;
  roomNumber: string;
  inventoryDate: string;
  status: number;
  reservationId?: string;
  stayId?: string;
  reservationNo: string;
  stayNo: string;
  guestName: string;
  channelId?: string;
  channelName?: string;
  channelIcon?: string;
  /** Reservation status when cell is Reserved (e.g. Confirmed=2 → green, Pending=1 → yellow). */
  reservationStatus?: number;
  /** True when this date is the arrival date for the reservation/stay (bar starts at 2pm). */
  isArrivalDate?: boolean;
  /** True when this date is the departure date (bar ends at noon, half-day). */
  isDepartureDate?: boolean;
  /** When true, cell is included in "No. of bookings" count (stays, drafts, or reservations with at least one unassigned room). */
  countInBookings?: boolean;
  /** Maintenance request title when status is OutOfOrder. */
  maintenanceTitle?: string;
  /** Maintenance request description when status is OutOfOrder. */
  maintenanceReason?: string;
}

/** Unassigned reservation (no room) for bookings count/dialog per room type and date. */
export interface UnassignedBookingDto {
  roomTypeName: string;
  inventoryDate: string;
  reservationId: string;
  reservationNo: string;
  guestName: string;
  channelName?: string;
  channelIcon?: string;
  reservationStatus: number;
}

export interface GetRoomRackResultDto {
  rooms: RoomListDto[];
  cells: RoomRackDayCellDto[];
  unassignedBookings?: UnassignedBookingDto[];
}

export interface RoomRackSettingsDto {
  dateRangeDays: number;
  colorInHouse: string;
  colorInHouseDark: string;
  colorPendingReservation: string;
  colorPendingReservationDark: string;
  colorConfirmedReservation: string;
  colorConfirmedReservationDark: string;
  colorCheckoutToday: string;
  colorCheckoutTodayDark: string;
  colorOnHoldRoom: string;
  colorOnHoldRoomDark: string;
}
