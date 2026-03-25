export enum ReservationStatus {
  Draft = 0,
  Pending = 1,
  Confirmed = 2,
  Cancelled = 3,
  NoShow = 4,
  CheckedIn = 5,
  Completed = 6,
}

export interface ReservationRoomDto {
  roomTypeId: string;
  roomId?: string;
  ratePerNight: number;
  numberOfNights?: number;
  amount?: number;
  discountPercent?: number;
  discountAmount?: number;
  seniorCitizenCount?: number;
  seniorCitizenPercent?: number;
  seniorCitizenDiscountAmount?: number;
  netAmount?: number;
}

export interface ReservationExtraBedDto {
  extraBedTypeId?: string;
  arrivalDate?: string;
  departureDate?: string;
  quantity?: number;
  ratePerNight: number;
  numberOfNights?: number;
  amount?: number;
  discountPercent?: number;
  discountAmount?: number;
  seniorCitizenCount?: number;
  seniorCitizenPercent?: number;
  seniorCitizenDiscountAmount?: number;
  netAmount?: number;
}

export interface ReservationListDto {
  id: string;
  reservationNo: string;
  roomRatePlanCode?: string;
  channelId?: string;
  channelName?: string;
  channelIcon?: string;
  agencyId?: string;
  agencyName?: string;
  guestName: string;
  arrivalDate: string;
  departureDate: string;
  nights: number;
  status: ReservationStatus;
  totalAmount: number;
  depositPercentage: number;
  depositPaid: number;
  roomNumbers?: string;
}

export interface CreateReservationDto {
  guestId?: string;
  channelId?: string;
  agencyId?: string;
  roomRatePlanCode?: string;
  arrivalDate: string;
  departureDate: string;
  adults: number;
  children: number;
  totalAmount: number;
  depositPercentage: number;
  depositRequired: number;
  notes?: string;
  reservationConditions?: string;
  specialRequests?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  /** When true, creates a draft reservation with no room assignment (rooms must be empty). */
  isTempReservation?: boolean;
  rooms: ReservationRoomDto[];
  extraBeds: ReservationExtraBedDto[];
  additionalGuestIds: string[];
}

export interface RecordReservationDepositDto {
  reservationId: string;
  amount: number;
  paymentMethodId: string;
  paidDate?: string;
  referenceNo?: string;
}

export interface AddReservationRoomTypeItemDto {
  roomTypeId: string;
  quantity: number;
}

export interface AddReservationRoomTypesDto {
  reservationId: string;
  roomTypes: AddReservationRoomTypeItemDto[];
}

export interface ReservationGuestDto {
  id: string;
  guestId: string;
  guestName: string;
  age: number;
  isPrimary: boolean;
}

export interface ReservationDepositDto {
  id: string;
  amount: number;
  paymentMethodId: string;
  paymentMethodName: string;
  paidDate: string;
  referenceNo?: string;
}

export interface ReservationDetailDto {
  id: string;
  reservationNo: string;
  roomRatePlanCode?: string;
  channelId?: string;
  channelName?: string;
  channelIcon?: string;
  agencyId?: string;
  agencyName?: string;
  guestId?: string;
  guestName: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  arrivalDate: string;
  departureDate: string;
  nights: number;
  adults: number;
  children: number;
  status: ReservationStatus;
  totalAmount: number;
  depositPercentage: number;
  depositRequired: number;
  depositPaid: number;
  notes?: string;
  reservationConditions?: string;
  specialRequests?: string;
  rooms: ReservationRoomDetailDto[];
  extraBeds: ReservationExtraBedDetailDto[];
  guests: ReservationGuestDto[];
  deposits: ReservationDepositDto[];
}

export interface ReservationExtraBedDetailDto {
  id: string;
  extraBedTypeId?: string;
  extraBedTypeName?: string;
  arrivalDate: string;
  departureDate: string;
  quantity: number;
  ratePerNight: number;
  numberOfNights: number;
  amount: number;
  discountPercent: number;
  discountAmount: number;
  seniorCitizenCount: number;
  seniorCitizenPercent: number;
  seniorCitizenDiscountAmount: number;
  netAmount: number;
}

export interface ReservationRoomDetailDto {
  id: string;
  roomTypeId: string;
  roomTypeName: string;
  roomId?: string;
  roomNumber?: string;
  arrivalDate: string;
  departureDate: string;
  ratePerNight: number;
  numberOfNights: number;
  amount: number;
  discountPercent: number;
  discountAmount: number;
  seniorCitizenCount: number;
  seniorCitizenPercent: number;
  seniorCitizenDiscountAmount: number;
  netAmount: number;
}
