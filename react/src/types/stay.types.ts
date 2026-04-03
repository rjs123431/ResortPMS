import type { HousekeepingTaskType, HousekeepingTaskStatus } from './housekeeping.types';

export enum StayStatus {
  CheckedIn = 0,
  InHouse = 1,
  CheckedOut = 2,
  Cancelled = 3,
}

export enum GuestRequestType {
  None = 0,
  PickupCleaning = 1,
  StayoverCleaning = 2,
  ExtraTowels = 4,
  ExtraPillows = 8,
  DrinkingWater = 16,
  Toiletries = 32,
  LateCheckoutAssistance = 64,
  MaintenanceVisit = 128,
  Other = 256,
}

export interface StayRoomDto {
  id: string;
  stayId: string;
  roomId: string;
  roomNumber: string;
  roomTypeId: string;
  roomTypeName: string;
  assignedAt: string;
  releasedAt?: string;
  arrivalDate: string;
  departureDate: string;
}

export interface StayListDto {
  id: string;
  stayNo: string;
  guestId: string;
  guestName: string;
  checkInDateTime: string;
  expectedCheckOutDateTime: string;
  actualCheckOutDateTime?: string;
  status: StayStatus;
  roomNumber: string;
  stayRooms?: StayRoomDto[];
}

export interface AddGuestRequestDto {
  stayId: string;
  requestTypes: GuestRequestType[];
  description?: string;
}

export interface GuestRequestListDto {
  id: string;
  requestTypes: GuestRequestType;
  description?: string;
  status: string;
  requestedAt: string;
  completedAt?: string;
}

export interface CompleteGuestRequestDto {
  guestRequestId: string;
  remarks?: string;
}

export interface GuestRequestTaskStatusDto {
  taskId: string;
  roomNumber: string;
  taskType: HousekeepingTaskType;
  status: HousekeepingTaskStatus;
  taskDate: string;
  startedAt?: string;
  completedAt?: string;
  remarks?: string;
}

export interface GuestRequestCompletionContextDto {
  guestRequestId: string;
  stayId: string;
  requestTypes: GuestRequestType;
  description?: string;
  status: string;
  requestedAt: string;
  completedAt?: string;
  relatedTasks: GuestRequestTaskStatusDto[];
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
  creatorUserName?: string;
  voidedAt?: string;
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

export interface TransferRoomDto {
  stayId: string;
  toRoomId: string;
  reason?: string;
  chargeTypeId?: string;
  chargeAmount?: number;
  chargeDescription?: string;
}
