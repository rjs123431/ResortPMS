export enum RoomChargeType {
  None = 0,
  Room = 1,
  ExtraBed = 2,
}

export interface ChargeTypeListDto {
  id: string;
  name: string;
  category: string;
  sort: number;
  roomChargeType: RoomChargeType;
  isActive: boolean;
}

export interface CreateChargeTypeDto {
  name: string;
  category: string;
  sort: number;
  roomChargeType: RoomChargeType;
}

export interface ChargeTypeDto extends CreateChargeTypeDto {
  id: string;
  isActive: boolean;
}
