export interface PagedResultDto<T> {
  totalCount: number;
  items: T[];
}

export interface ApiResponse<T> {
  result: T;
}

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

export enum HousekeepingTaskType {
  CheckoutCleaning = 1,
  StayoverCleaning = 2,
  PickupCleaning = 3,
  Inspection = 4,
}

export enum HousekeepingTaskStatus {
  Pending = 1,
  InProgress = 2,
  Completed = 3,
  Cancelled = 4,
}

export enum RoomMaintenancePriority {
  Low = 1,
  Medium = 2,
  High = 3,
  Critical = 4,
}

export enum RoomMaintenanceStatus {
  Open = 1,
  Assigned = 2,
  InProgress = 3,
  Completed = 4,
  Cancelled = 5,
}

export enum MaintenanceCategory {
  Reactive = 1,
  Preventive = 2,
}

export interface RoomMaintenanceTypeDto {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
}

export interface CreateUpdateRoomMaintenanceTypeDto {
  name: string;
  description: string;
  isActive: boolean;
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

export enum RoomChargeType {
  None = 0,
  Room = 1,
  ExtraBed = 2,
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
  phone: string;
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
  numberOfRooms: number;
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

/** Room rack: daily inventory status (matches backend RoomDailyInventoryStatus). */
export enum RoomDailyInventoryStatus {
  Vacant = 1,
  Reserved = 2,
  InHouse = 3,
  OutOfOrder = 4,
  Blocked = 5,
  HouseUse = 6,
}

export interface RoomRackDayCellDto {
  roomId: string;
  roomNumber: string;
  inventoryDate: string;
  status: number;
  reservationId?: string;
  stayId?: string;
  reservationNo: string;
  stayNo: string;
  guestName: string;
  channelId?: string;
  channelName?: string;
  channelIcon?: string;
  /** Reservation status when cell is Reserved (e.g. Confirmed=2 → green, Pending=1 → yellow). */
  reservationStatus?: number;
  /** True when this date is the arrival date for the reservation/stay (bar starts at 2pm). */
  isArrivalDate?: boolean;
  /** True when this date is the departure date (bar ends at noon, half-day). */
  isDepartureDate?: boolean;
  /** When true, cell is included in "No. of bookings" count (stays, drafts, or reservations with at least one unassigned room). */
  countInBookings?: boolean;
}

/** Unassigned reservation (no room) for bookings count/dialog per room type and date. */
export interface UnassignedBookingDto {
  roomTypeName: string;
  inventoryDate: string;
  reservationId: string;
  reservationNo: string;
  guestName: string;
  channelName?: string;
  channelIcon?: string;
  reservationStatus: number;
}

export interface GetRoomRackResultDto {
  rooms: RoomListDto[];
  cells: RoomRackDayCellDto[];
  unassignedBookings?: UnassignedBookingDto[];
}

export interface RoomRackSettingsDto {
  dateRangeDays: number;
  colorInHouse: string;
  colorInHouseDark: string;
  colorPendingReservation: string;
  colorPendingReservationDark: string;
  colorConfirmedReservation: string;
  colorConfirmedReservationDark: string;
  colorCheckoutToday: string;
  colorCheckoutTodayDark: string;
  colorOnHoldRoom: string;
  colorOnHoldRoomDark: string;
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

export interface HousekeepingTaskDto {
  id: string;
  roomId: string;
  roomNumber: string;
  roomTypeName: string;
  taskType: HousekeepingTaskType;
  status: HousekeepingTaskStatus;
  assignedToStaffId?: string;
  assignedToStaffName?: string;
  startedAt?: string;
  completedAt?: string;
  remarks?: string;
  taskDate: string;
}

export interface CreateHousekeepingTaskDto {
  roomId: string;
  taskType: HousekeepingTaskType;
  assignedToStaffId?: string;
  remarks?: string;
  taskDate?: string;
}

export interface UpdateHousekeepingTaskStatusDto {
  taskId: string;
  status: HousekeepingTaskStatus;
  assignedToStaffId?: string;
  remarks?: string;
}

export interface UpdateHousekeepingStatusDto {
  roomId: string;
  housekeepingStatus: HousekeepingStatus;
  staffId?: string;
  remarks?: string;
}

export interface HousekeepingLogDto {
  id: string;
  roomId: string;
  roomNumber: string;
  oldStatus: HousekeepingStatus;
  newStatus: HousekeepingStatus;
  staffId?: string;
  staffName?: string;
  remarks?: string;
  loggedAt: string;
}

export interface CleaningBoardRoomDto {
  roomId: string;
  roomNumber: string;
  roomTypeName: string;
  floor?: string;
  housekeepingStatus: HousekeepingStatus;
  cleaningType: string;
  pendingTaskId?: string;
}

export interface RoomMaintenanceRequestDto {
  id: string;
  roomId: string;
  roomNumber: string;
  assignedStaffId?: string;
  assignedStaffName: string;
  title: string;
  description: string;
  priority: RoomMaintenancePriority;
  status: RoomMaintenanceStatus;
  category: MaintenanceCategory;
  startDate: string;
  endDate: string;
  openedAt: string;
  assignedAt?: string;
  startedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  cancellationReason: string;
  typeIds: string[];
  typeNames: string[];
}

export interface CreateRoomMaintenanceRequestDto {
  roomId: string;
  assignedStaffId?: string;
  title: string;
  description: string;
  priority: RoomMaintenancePriority;
  category: MaintenanceCategory;
  startDate: string;
  endDate: string;
  typeIds: string[];
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

export interface CheckInResultDto {
  stayId: string;
  stayNo: string;
  folioId: string;
  folioNo: string;
}

export interface CheckOutResultDto {
  checkOutRecordId: string;
  stayId: string;
  stayNo: string;
  receiptId: string;
  receiptNo: string;
  totalCharged: number;
  totalPaid: number;
  balanceDue: number;
}

export interface CheckOutRecordDto {
  id: string;
  stayId: string;
  stayNo: string;
  guestName: string;
  roomNumber: string;
  checkOutDateTime: string;
  totalCharges: number;
  totalPayments: number;
  totalDiscounts: number;
  balanceDue: number;
  settledAmount: number;
  receipt: ReceiptDto | null;
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

export interface CheckOutStatementDto {
  stayId: string;
  stayNo: string;
  guestName: string;
  roomNumber: string;
  checkInDateTime: string;
  expectedCheckOutDateTime: string;
  folioId: string;
  folioNo: string;
  folioStatus: number;
  totalCharges: number;
  totalDiscounts: number;
  totalPayments: number;
  balanceDue: number;
  overPayment: number;
  stayRooms?: StayRoomRecordDto[];
  transactions?: StatementLineDto[];
  payments?: StatementPaymentDto[];
}

export interface StayRoomRecordDto {
  stayRoomId: string;
  roomId: string;
  roomNumber: string;
  assignedAt: string;
  releasedAt?: string;
  isCleared: boolean;
  clearedAt?: string;
  clearedByStaffId?: string;
  clearedByStaffName?: string;
}

export interface ClearStayRoomDto {
  stayRoomId: string;
  staffId?: string;
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

export interface ChannelListDto {
  id: string;
  name: string;
  icon?: string;
  sort: number;
  isActive: boolean;
}

export interface CreateChannelDto {
  name: string;
  icon?: string;
  sort: number;
}

export interface ChannelDto extends CreateChannelDto {
  id: string;
  isActive: boolean;
}

export interface CreateStaffDto {
  staffCode: string;
  fullName: string;
  department?: string;
  position?: string;
  phoneNumber?: string;
}

export interface StaffDto extends CreateStaffDto {
  id: string;
  isActive: boolean;
}

export interface StaffListDto {
  id: string;
  staffCode: string;
  fullName: string;
  department?: string;
  position?: string;
  phoneNumber?: string;
  isActive: boolean;
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

// ── Room Change Request Types ──────────────────────────────────────────────────

export enum RoomChangeSource {
  GuestRequest = 1,
  Internal = 2,
  Maintenance = 3,
  Upgrade = 4,
  Downgrade = 5,
}

export enum RoomChangeReason {
  GuestPreference = 1,
  RoomIssue = 2,
  Maintenance = 3,
  Noise = 4,
  ViewChange = 5,
  Accessibility = 6,
  FamilyReunion = 7,
  Upgrade = 8,
  Downgrade = 9,
  Overbooking = 10,
  Other = 99,
}

export enum RoomChangeRequestStatus {
  Pending = 1,
  Approved = 2,
  InProgress = 3,
  Completed = 4,
  Cancelled = 5,
  Rejected = 6,
}

export interface CreateRoomChangeRequestDto {
  stayId: string;
  stayRoomId?: string;
  source: RoomChangeSource;
  reason: RoomChangeReason;
  reasonDetails?: string;
  preferredRoomTypeId?: string;
  preferredRoomId?: string;
}

export interface ApproveRoomChangeRequestDto {
  requestId: string;
  toRoomId: string;
}

export interface RejectRoomChangeRequestDto {
  requestId: string;
  rejectionReason: string;
}

export interface CancelRoomChangeRequestDto {
  requestId: string;
  cancellationReason?: string;
}

export interface ExecuteRoomChangeDto {
  requestId: string;
}

export interface RoomChangeRequestDto {
  id: string;
  stayId: string;
  stayNo: string;
  guestName: string;
  source: RoomChangeSource;
  reason: RoomChangeReason;
  reasonDetails?: string;
  fromRoomNumber: string;
  fromRoomTypeName: string;
  toRoomNumber?: string;
  toRoomTypeName?: string;
  preferredRoomTypeName?: string;
  status: RoomChangeRequestStatus;
  requestedAt: string;
  requestedBy: string;
  approvedAt?: string;
  approvedBy?: string;
  completedAt?: string;
  completedBy?: string;
}

export interface RoomChangeRequestListDto {
  id: string;
  stayNo: string;
  guestName: string;
  source: RoomChangeSource;
  reason: RoomChangeReason;
  fromRoomNumber: string;
  toRoomNumber?: string;
  status: RoomChangeRequestStatus;
  requestedAt: string;
}

export interface AvailableRoomForChangeDto {
  roomId: string;
  roomNumber: string;
  roomTypeId: string;
  roomTypeName: string;
  baseRate: number;
  floor?: string;
  housekeepingStatus: HousekeepingStatus;
  isUpgrade: boolean;
  isDowngrade: boolean;
  isSameType: boolean;
}

export interface TransferRoomDto {
  stayId: string;
  toRoomId: string;
  reason?: string;
}
