export enum RoomOperationalStatus {
  Vacant = 1,
  Occupied = 2,
  Reserved = 3,
  OutOfOrder = 4,
  OutOfService = 5,
}

export enum HousekeepingStatus {
  Clean = 1,
  Dirty = 2,
  Inspected = 3,
  Pickup = 4,
}

/** Room rack: daily inventory status (matches backend RoomDailyInventoryStatus). */
export enum RoomDailyInventoryStatus {
  Vacant = 1,
  Reserved = 2,
  InHouse = 3,
  OutOfOrder = 4,
  Blocked = 5,
  HouseUse = 6,
}

export interface RoomListDto {
  id: string;
  roomNumber: string;
  roomTypeId: string;
  roomTypeName: string;
  roomTypeDescription?: string;
  bedTypeSummary?: string;
  featureTags?: string[];
  amenityItems?: string[];
  maxAdults: number;
  maxChildren: number;
  baseRate: number;
  floor?: string;
  housekeepingStatus: HousekeepingStatus;
  isActive: boolean;
  /** Compact current room status code derived from daily inventory + housekeeping, e.g. VC, VD, OC, OD, OOO. */
  roomStatusCode?: string;
  /** Maintenance request title when room is Out of Order. */
  maintenanceTitle?: string;
  /** Maintenance request description when room is Out of Order. */
  maintenanceReason?: string;
}

export interface CreateRoomDto {
  roomNumber: string;
  roomTypeId: string;
  floor?: string;
  housekeepingStatus?: HousekeepingStatus;
  isActive?: boolean;
}

export interface RoomDto extends CreateRoomDto {
  id: string;
  isActive: boolean;
}

export interface UpdateHousekeepingStatusDto {
  roomId: string;
  housekeepingStatus: HousekeepingStatus;
  staffId?: string;
  remarks?: string;
}
