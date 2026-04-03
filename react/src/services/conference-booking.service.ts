import { api } from './api.service';
import type { ApiResponse, PagedResultDto } from '@/types/common.types';
import type {
  CheckConferenceBookingAvailabilityInput,
  ConferenceBookingAvailabilityDto,
  ConferenceBookingDto,
  ConferenceBookingListDto,
  CreateConferenceBookingDto,
  GetConferenceBookingsInput,
  RecordConferenceBookingPaymentDto,
  UpdateConferenceBookingDto,
} from '@/types/conference.types';

export const conferenceBookingService = {
  getConferenceBookings: async (params?: GetConferenceBookingsInput) => {
    const query: Record<string, string> = {
      Sorting: 'StartDateTime desc',
      SkipCount: String(params?.skipCount ?? 0),
      MaxResultCount: String(params?.maxResultCount ?? 100),
    };

    if (params?.filter) query.Filter = params.filter;
    if (params?.status !== undefined) query.Status = String(params.status);
    if (params?.venueId) query.VenueId = params.venueId;
    if (params?.startFrom) query.StartFrom = params.startFrom;
    if (params?.endTo) query.EndTo = params.endTo;
    if (params?.excludeBookingId) query.ExcludeBookingId = params.excludeBookingId;

    const response = await api.get<ApiResponse<PagedResultDto<ConferenceBookingListDto>>>('/api/services/app/ConferenceBooking/GetAll', {
      params: query,
    });

    return response.data.result;
  },

  getConferenceBooking: async (id: string) => {
    const response = await api.get<ApiResponse<ConferenceBookingDto>>('/api/services/app/ConferenceBooking/Get', {
      params: { id },
    });

    return response.data.result;
  },

  createConferenceBooking: async (input: CreateConferenceBookingDto) => {
    const response = await api.post<ApiResponse<string>>('/api/services/app/ConferenceBooking/Create', input);
    return response.data.result;
  },

  updateConferenceBooking: async (input: UpdateConferenceBookingDto) => {
    await api.put('/api/services/app/ConferenceBooking/Update', input);
  },

  confirmConferenceBooking: async (id: string) => {
    await api.post('/api/services/app/ConferenceBooking/Confirm', null, { params: { id } });
  },

  markConferenceBookingTentative: async (id: string) => {
    await api.post('/api/services/app/ConferenceBooking/MarkTentative', null, { params: { id } });
  },

  startConferenceBooking: async (id: string) => {
    await api.post('/api/services/app/ConferenceBooking/StartEvent', null, { params: { id } });
  },

  completeConferenceBooking: async (id: string) => {
    await api.post('/api/services/app/ConferenceBooking/Complete', null, { params: { id } });
  },

  cancelConferenceBooking: async (id: string, reason = '') => {
    await api.post('/api/services/app/ConferenceBooking/Cancel', null, { params: { id, reason } });
  },

  checkConferenceBookingAvailability: async (input: CheckConferenceBookingAvailabilityInput) => {
    const response = await api.post<ApiResponse<ConferenceBookingAvailabilityDto>>('/api/services/app/ConferenceBooking/CheckAvailability', {
      venueId: input.venueId,
      startDateTime: input.startDateTime,
      endDateTime: input.endDateTime,
      bookingId: input.bookingId,
      setupBufferMinutes: input.setupBufferMinutes,
      teardownBufferMinutes: input.teardownBufferMinutes,
    });

    return response.data.result;
  },

  recordConferenceBookingPayment: async (input: RecordConferenceBookingPaymentDto) => {
    const response = await api.post<ApiResponse<string>>('/api/services/app/ConferenceBooking/RecordPayment', input);
    return response.data.result;
  },
};