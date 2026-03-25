export interface RoomTypeListDto {
  id: string;
  name: string;
  baseRate: number;
  maxAdults: number;
  maxChildren: number;
  isActive: boolean;
  numberOfRooms: number;
}

export interface CreateRoomTypeDto {
  name: string;
  description?: string;
  maxAdults: number;
  maxChildren: number;
}

export interface RoomTypeDto extends CreateRoomTypeDto {
  id: string;
  isActive: boolean;
}
