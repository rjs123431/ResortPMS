export enum ConferenceBookingStatus {
  Inquiry = 0,
  Tentative = 1,
  Confirmed = 2,
  InProgress = 3,
  Completed = 4,
  Cancelled = 5,
}

export enum ConferenceOrganizerType {
  Individual = 0,
  Company = 1,
}

export enum ConferencePricingType {
  Hourly = 0,
  HalfDay = 1,
  FullDay = 2,
  Custom = 3,
}

export interface ConferenceVenueListDto {
  id: string;
  code: string;
  name: string;
  category: string;
  capacity: number;
  hourlyRate: number;
  halfDayRate: number;
  fullDayRate: number;
  isActive: boolean;
}

export interface ConferenceVenueDto extends ConferenceVenueListDto {
  setupBufferMinutes: number;
  teardownBufferMinutes: number;
  description: string;
}

export interface CreateConferenceVenueDto {
  code: string;
  name: string;
  category?: string;
  capacity: number;
  hourlyRate: number;
  halfDayRate: number;
  fullDayRate: number;
  setupBufferMinutes: number;
  teardownBufferMinutes: number;
  description?: string;
  isActive: boolean;
}

export interface UpdateConferenceVenueDto extends CreateConferenceVenueDto {
  id: string;
}

export interface ConferenceBookingAddOnDto {
  id?: string;
  name: string;
  quantity: number;
  unitPrice: number;
  amount?: number;
}

export interface ConferenceBookingPaymentDto {
  id: string;
  paymentMethodId: string;
  paymentMethodName: string;
  amount: number;
  paidDate: string;
  referenceNo: string;
}

export interface ConferenceBookingListDto {
  id: string;
  bookingNo: string;
  venueId: string;
  venueName: string;
  conferenceCompanyId?: string | null;
  eventTypeId?: string | null;
  conferenceCompanyName?: string;
  eventName: string;
  eventType: string;
  organizerName: string;
  companyName: string;
  startDateTime: string;
  endDateTime: string;
  status: ConferenceBookingStatus;
  totalAmount: number;
  depositRequired: number;
  depositPaid: number;
  attendeeCount: number;
  creationTime: string;
}

export interface ConferenceBookingDto extends ConferenceBookingListDto {
  guestId?: string | null;
  conferenceCompanyId?: string | null;
  bookingDate: string;
  organizerType: ConferenceOrganizerType;
  contactPerson: string;
  phone: string;
  email: string;
  attendeeCount: number;
  pricingType: ConferencePricingType;
  baseAmount: number;
  addOnAmount: number;
  depositRequired: number;
  setupBufferMinutes: number;
  teardownBufferMinutes: number;
  notes: string;
  specialRequests: string;
  addOns: ConferenceBookingAddOnDto[];
  payments: ConferenceBookingPaymentDto[];
}

export interface CreateConferenceBookingDto {
  venueId: string;
  guestId?: string | null;
  conferenceCompanyId?: string | null;
  eventTypeId?: string | null;
  eventName: string;
  eventType?: string;
  organizerType: ConferenceOrganizerType;
  organizerName: string;
  companyName?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  startDateTime: string;
  endDateTime: string;
  attendeeCount: number;
  pricingType: ConferencePricingType;
  customBaseAmount?: number | null;
  depositRequired: number;
  setupBufferMinutes?: number | null;
  teardownBufferMinutes?: number | null;
  status: ConferenceBookingStatus;
  notes?: string;
  specialRequests?: string;
  addOns: ConferenceBookingAddOnDto[];
}

export interface UpdateConferenceBookingDto extends CreateConferenceBookingDto {
  id: string;
}

export interface GetConferenceBookingsInput {
  filter?: string;
  status?: ConferenceBookingStatus;
  venueId?: string;
  startFrom?: string;
  endTo?: string;
  excludeBookingId?: string;
  skipCount?: number;
  maxResultCount?: number;
}

export interface CheckConferenceBookingAvailabilityInput {
  venueId: string;
  startDateTime: string;
  endDateTime: string;
  bookingId?: string;
  setupBufferMinutes?: number | null;
  teardownBufferMinutes?: number | null;
}

export interface ConferenceBookingAvailabilityDto {
  isAvailable: boolean;
  conflictingBookingId?: string | null;
  conflictingBookingNo?: string;
  message: string;
}

export interface RecordConferenceBookingPaymentDto {
  conferenceBookingId: string;
  paymentMethodId: string;
  amount: number;
  paidDate: string;
  referenceNo?: string;
}

export interface ConferenceCompanyListDto {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  isActive: boolean;
}

export interface ConferenceCompanyDto extends ConferenceCompanyListDto {
  notes: string;
}

export interface CreateConferenceCompanyDto {
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  notes?: string;
  isActive: boolean;
}

export interface UpdateConferenceCompanyDto extends CreateConferenceCompanyDto {
  id: string;
}

export interface ConferenceVenueBlackoutListDto {
  id: string;
  venueId: string;
  venueName: string;
  title: string;
  startDateTime: string;
  endDateTime: string;
  notes: string;
}

export interface ConferenceVenueBlackoutDto extends ConferenceVenueBlackoutListDto {}

export interface CreateConferenceVenueBlackoutDto {
  venueId: string;
  title: string;
  startDateTime: string;
  endDateTime: string;
  notes?: string;
}

export interface UpdateConferenceVenueBlackoutDto extends CreateConferenceVenueBlackoutDto {
  id: string;
}

export interface ConferenceExtraDto {
  id: string;
  code: string;
  name: string;
  category: string;
  unitLabel: string;
  defaultPrice: number;
  sortOrder: number;
  isActive: boolean;
}

export interface ConferenceExtraListDto extends ConferenceExtraDto {}

export interface CreateConferenceExtraDto {
  code: string;
  name: string;
  category?: string;
  unitLabel?: string;
  defaultPrice: number;
  sortOrder: number;
  isActive: boolean;
}

export interface UpdateConferenceExtraDto extends CreateConferenceExtraDto {
  id: string;
}

export interface EventTypeDto {
  id: string;
  code: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
}