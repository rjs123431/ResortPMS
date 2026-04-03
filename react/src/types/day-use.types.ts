export enum DayUseOfferType {
  EntranceFee = 0,
  Activity = 1,
}

export enum DayUseGuestContext {
  WalkIn = 0,
  InHouse = 1,
}

export enum DayUseGuestCategory {
  General = 0,
  Adult = 1,
  Kid = 2,
  SeniorPwd = 3,
  ChildBelowFour = 4,
}

export enum DayUseStatus {
  Open = 0,
  Completed = 1,
  Cancelled = 2,
}

export interface DayUseOfferListDto {
  id: string;
  code: string;
  name: string;
  variantName: string;
  description: string;
  offerType: DayUseOfferType;
  guestContext: DayUseGuestContext;
  guestCategory?: DayUseGuestCategory;
  durationMinutes?: number;
  chargeTypeId: string;
  chargeTypeName: string;
  amount: number;
  sortOrder: number;
  isActive: boolean;
}

export interface DayUseOfferDto extends DayUseOfferListDto {
  description: string;
}

export interface CreateDayUseOfferDto {
  code: string;
  name: string;
  variantName: string;
  description: string;
  offerType: DayUseOfferType;
  guestContext: DayUseGuestContext;
  guestCategory?: DayUseGuestCategory;
  durationMinutes?: number;
  chargeTypeId: string;
  amount: number;
  sortOrder: number;
}

export interface UpdateDayUseOfferDto extends CreateDayUseOfferDto {
  id: string;
  isActive: boolean;
}

export interface CreateDayUseSaleLineDto {
  offerId: string;
  quantity: number;
  description?: string;
}

export interface CreateDayUsePaymentDto {
  paymentMethodId: string;
  amount: number;
  referenceNo?: string;
  notes?: string;
}

export interface CreateDayUseSaleDto {
  guestId: string;
  stayId?: string;
  roomId?: string;
  visitDate: string;
  accessStartTime: string;
  accessEndTime: string;
  guestContext: DayUseGuestContext;
  remarks?: string;
  lines: CreateDayUseSaleLineDto[];
  payments?: CreateDayUsePaymentDto[];
}

export interface DayUseSaleResultDto {
  visitId: string;
  visitNo: string;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  postedToFolio: boolean;
}

export interface DayUseVisitLineDto {
  id: string;
  dayUseOfferId: string;
  chargeTypeId: string;
  chargeTypeName: string;
  offerType: DayUseOfferType;
  guestContext: DayUseGuestContext;
  guestCategory?: DayUseGuestCategory;
  offerCode: string;
  offerName: string;
  variantName: string;
  description: string;
  durationMinutes?: number;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface DayUsePaymentDto {
  id: string;
  paymentMethodId: string;
  paymentMethodName: string;
  amount: number;
  paidAt: string;
  referenceNo: string;
  notes: string;
}

export interface DayUseVisitDto {
  id: string;
  visitNo: string;
  guestId: string;
  guestName: string;
  stayId?: string;
  roomId?: string;
  visitDate: string;
  accessStartTime: string;
  accessEndTime: string;
  guestContext: DayUseGuestContext;
  status: DayUseStatus;
  remarks: string;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  lines: DayUseVisitLineDto[];
  payments: DayUsePaymentDto[];
}

export interface DayUseVisitListDto {
  id: string;
  visitNo: string;
  guestName: string;
  visitDate: string;
  guestContext: DayUseGuestContext;
  status: DayUseStatus;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
}