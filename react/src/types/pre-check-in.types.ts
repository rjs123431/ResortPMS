export enum PreCheckInStatus {
  Pending = 0,
  ReadyForCheckIn = 1,
  CheckedIn = 2,
  Cancelled = 3,
  Expired = 4,
}

export interface PreCheckInListDto {
  id: string;
  preCheckInNo: string;
  reservationId?: string;
  guestId?: string;
  guestName?: string;
  arrivalDate: string;
  departureDate: string;
  nights: number;
  status: PreCheckInStatus;
  totalAmount: number;
  expiresAt?: string;
  creationTime: string;
  isFromReservation: boolean;
}

export interface PreCheckInRoomDto {
  id: string;
  reservationRoomId?: string;
  roomTypeId: string;
  roomTypeName?: string;
  roomId?: string;
  roomNumber?: string;
  ratePerNight: number;
  numberOfNights: number;
  amount: number;
  seniorCitizenCount: number;
  seniorCitizenDiscountAmount: number;
  netAmount: number;
}

export interface PreCheckInExtraBedDto {
  id: string;
  extraBedTypeId?: string;
  extraBedTypeName?: string;
  quantity: number;
  ratePerNight: number;
  numberOfNights: number;
  amount: number;
}

export interface PreCheckInDto {
  id: string;
  preCheckInNo: string;
  reservationId?: string;
  guestId?: string;
  guestName?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  preCheckInDate: string;
  arrivalDate: string;
  departureDate: string;
  nights: number;
  adults: number;
  children: number;
  status: PreCheckInStatus;
  totalAmount: number;
  notes?: string;
  specialRequests?: string;
  expiresAt?: string;
  rooms: PreCheckInRoomDto[];
  extraBeds: PreCheckInExtraBedDto[];
}

export interface CreatePreCheckInRoomDto {
  reservationRoomId?: string;
  roomTypeId: string;
  roomId?: string;
  roomTypeName?: string;
  roomNumber?: string;
  ratePerNight: number;
  numberOfNights: number;
  amount: number;
  seniorCitizenCount: number;
  seniorCitizenDiscountAmount: number;
  netAmount: number;
}

export interface CreatePreCheckInExtraBedDto {
  extraBedTypeId?: string;
  extraBedTypeName?: string;
  quantity: number;
  ratePerNight: number;
  numberOfNights: number;
  amount: number;
}

export interface CreatePreCheckInDto {
  reservationId?: string;
  guestId?: string;
  arrivalDate: string;
  departureDate: string;
  adults: number;
  children: number;
  totalAmount: number;
  notes?: string;
  specialRequests?: string;
  guestName?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  rooms: CreatePreCheckInRoomDto[];
  extraBeds?: CreatePreCheckInExtraBedDto[];
}

export interface UpdatePreCheckInDto extends CreatePreCheckInDto {
  id: string;
}
