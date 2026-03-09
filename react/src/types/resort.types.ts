export interface PagedResultDto<T> {
  totalCount: number;
  items: T[];
}

export interface ApiResponse<T> {
  result: T;
}

export enum RoomStatus {
  VacantClean = 0,
  VacantDirty = 1,
  Occupied = 2,
  OutOfOrder = 3,
  Maintenance = 4,
}

export enum ReservationStatus {
  Draft = 0,
  Pending = 1,
  Confirmed = 2,
  Cancelled = 3,
  NoShow = 4,
  CheckedIn = 5,
  Completed = 6,
}

export enum StayStatus {
  CheckedIn = 0,
  InHouse = 1,
  CheckedOut = 2,
  Cancelled = 3,
}

export interface GuestListDto {
  id: string;
  guestCode: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  nationality?: string;
  isActive: boolean;
  fullName: string;
}

export interface CreateGuestDto {
  guestCode: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  email?: string;
  phone?: string;
  nationality?: string;
  notes?: string;
}

export interface GuestDto extends CreateGuestDto {
  id: string;
  isActive: boolean;
}

export interface RoomTypeListDto {
  id: string;
  name: string;
  baseRate: number;
  maxAdults: number;
  maxChildren: number;
  isActive: boolean;
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
  status: RoomStatus;
  isActive: boolean;
}

export interface CreateRoomDto {
  roomNumber: string;
  roomTypeId: string;
  floor?: string;
  status?: RoomStatus;
}

export interface RoomDto extends CreateRoomDto {
  id: string;
  isActive: boolean;
}

export interface CreateRoomTypeDto {
  name: string;
  description?: string;
  maxAdults: number;
  maxChildren: number;
  baseRate: number;
}

export interface RoomTypeDto extends CreateRoomTypeDto {
  id: string;
  isActive: boolean;
}

export interface CreateExtraBedTypeDto {
  name: string;
  basePrice: number;
}

export interface ExtraBedTypeDto extends CreateExtraBedTypeDto {
  id: string;
  isActive: boolean;
}

export interface ExtraBedTypeListDto {
  id: string;
  name: string;
  basePrice: number;
  isActive: boolean;
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
  guestName: string;
  arrivalDate: string;
  departureDate: string;
  nights: number;
  status: ReservationStatus;
  totalAmount: number;
  depositPercentage: number;
  depositPaid: number;
}

export interface CreateReservationDto {
  guestId: string;
  arrivalDate: string;
  departureDate: string;
  adults: number;
  children: number;
  totalAmount: number;
  depositPercentage: number;
  depositRequired: number;
  notes?: string;
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

export interface CheckInResultDto {
  stayId: string;
  stayNo: string;
  folioId: string;
  folioNo: string;
}

export interface CheckOutResultDto {
  stayId: string;
  stayNo: string;
  receiptId: string;
  receiptNo: string;
  totalCharged: number;
  totalPaid: number;
  balanceDue: number;
}

export interface StayListDto {
  id: string;
  stayNo: string;
  guestName: string;
  checkInDateTime: string;
  expectedCheckOutDateTime: string;
  status: StayStatus;
  roomNumber: string;
}

export interface FolioSummaryDto {
  folioId: string;
  folioNo: string;
  status: number;
  totalCharges: number;
  totalDiscounts: number;
  totalPayments: number;
  balance: number;
}

export interface CheckOutStatementDto {
  stayId: string;
  stayNo: string;
  guestName: string;
  roomNumber: string;
  folioNo: string;
  totalCharges: number;
  totalDiscounts: number;
  totalPayments: number;
  balanceDue: number;
  overPayment: number;
  transactions?: StatementLineDto[];
  payments?: StatementPaymentDto[];
}

export interface StatementLineDto {
  date: string;
  description: string;
  chargeTypeName?: string;
  type: string;
  amount: number;
}

export interface StatementPaymentDto {
  date: string;
  paymentMethodName?: string;
  amount: number;
  referenceNo?: string;
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
  guestName: string;
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

export interface FolioTransactionDto {
  id: string;
  transactionType: number;
  chargeTypeId?: string;
  chargeTypeName?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  taxAmount: number;
  discountAmount: number;
  netAmount: number;
  transactionDate: string;
  isVoided: boolean;
  voidReason?: string;
}

export interface FolioPaymentDto {
  id: string;
  paymentMethodId: string;
  paymentMethodName?: string;
  amount: number;
  paidDate: string;
  referenceNo?: string;
  isVoided: boolean;
}

export interface FolioDto {
  id: string;
  folioNo: string;
  stayId: string;
  status: number;
  balance: number;
  transactions: FolioTransactionDto[];
  payments: FolioPaymentDto[];
}

export interface LookupListDto {
  id: string;
  name: string;
  isActive: boolean;
}

export interface CreateLookupDto {
  name: string;
}

export interface LookupDto extends CreateLookupDto {
  id: string;
  isActive: boolean;
}

export interface ReceiptPaymentDto {
  paymentMethodId: string;
  paymentMethodName?: string;
  amount: number;
}

export interface ReceiptDto {
  id: string;
  receiptNo: string;
  stayId: string;
  stayNo?: string;
  guestName?: string;
  roomNumber?: string;
  issuedDate: string;
  amount: number;
  payments: ReceiptPaymentDto[];
}
