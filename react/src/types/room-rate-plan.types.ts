// Room rate plan pricing (0 = Sunday, 6 = Saturday)
export interface RoomRatePlanDayDto {
  id?: string;
  roomRatePlanId: string;
  dayOfWeek: number;
  basePrice: number;
}

export interface RatePlanDateOverrideDto {
  id?: string;
  roomRatePlanId: string;
  rateDate: string;
  overridePrice: number;
  description?: string;
}

export interface RoomRatePlanDto {
  id: string;
  roomTypeId: string;
  roomTypeName: string;
  code: string;
  name: string;
  startDate: string;
  endDate?: string;
  priority: number;
  isDefault: boolean;
  isActive: boolean;
  channelIds: string[];
  channelNames: string[];
  dayRates: RoomRatePlanDayDto[];
  dateOverrides: RatePlanDateOverrideDto[];
}

export interface RoomRatePlanListDto {
  id: string;
  roomTypeId: string;
  roomTypeName: string;
  code: string;
  name: string;
  startDate: string;
  endDate?: string;
  priority: number;
  isDefault: boolean;
  isActive: boolean;
  channelIds: string[];
  channelNames: string[];
}

export interface RoomTypeRatePlanOptionDto {
  roomRatePlanId: string;
  code: string;
  name: string;
  pricePerNight: number;
  priority: number;
}

export interface CreateRoomRatePlanDto {
  roomTypeId: string;
  code: string;
  name: string;
  startDate: string;
  endDate?: string;
  priority: number;
  isDefault: boolean;
  isActive: boolean;
  channelIds: string[];
  dayRates: RoomRatePlanDayDto[];
  dateOverrides: RatePlanDateOverrideDto[];
}

export interface UpdateRoomRatePlanDto extends CreateRoomRatePlanDto {
  id: string;
}
