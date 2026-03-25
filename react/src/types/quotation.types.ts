export enum QuotationStatus {
  Draft = 0,
  Active = 1,
  Converted = 2,
  Expired = 3,
  Cancelled = 4,
}

export interface QuotationListDto {
  id: string;
  quotationNo: string;
  guestId?: string;
  guestName?: string;
  arrivalDate: string;
  departureDate: string;
  nights: number;
  status: QuotationStatus;
  totalAmount: number;
  expiresAt?: string;
  creationTime: string;
}

export interface QuotationRoomDto {
  id: string;
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

export interface QuotationExtraBedDto {
  id: string;
  extraBedTypeId?: string;
  extraBedTypeName?: string;
  quantity: number;
  ratePerNight: number;
  numberOfNights: number;
  amount: number;
}

export interface QuotationDto {
  id: string;
  quotationNo: string;
  guestId?: string;
  guestName?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  quotationDate: string;
  arrivalDate: string;
  departureDate: string;
  nights: number;
  adults: number;
  children: number;
  status: QuotationStatus;
  totalAmount: number;
  notes?: string;
  specialRequests?: string;
  expiresAt?: string;
  rooms: QuotationRoomDto[];
  extraBeds: QuotationExtraBedDto[];
}

export interface CreateQuotationRoomDto {
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

export interface CreateQuotationExtraBedDto {
  extraBedTypeId?: string;
  extraBedTypeName?: string;
  quantity: number;
  ratePerNight: number;
  numberOfNights: number;
  amount: number;
}

export interface CreateQuotationDto {
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
  rooms: CreateQuotationRoomDto[];
  extraBeds?: CreateQuotationExtraBedDto[];
}

export interface UpdateQuotationDto extends CreateQuotationDto {
  id: string;
}
