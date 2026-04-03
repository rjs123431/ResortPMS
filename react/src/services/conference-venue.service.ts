import { api } from './api.service';
import type { ApiResponse, PagedResultDto } from '@/types/common.types';
import type {
  ConferenceVenueDto,
  ConferenceVenueListDto,
  CreateConferenceVenueDto,
  UpdateConferenceVenueDto,
} from '@/types/conference.types';

export const conferenceVenueService = {
  getConferenceVenues: async (filter = '', skipCount = 0, maxResultCount = 100) => {
    const response = await api.get<ApiResponse<PagedResultDto<ConferenceVenueListDto>>>('/api/services/app/ConferenceVenue/GetAll', {
      params: {
        Filter: filter,
        Sorting: 'Name asc',
        SkipCount: skipCount,
        MaxResultCount: maxResultCount,
      },
    });

    return response.data.result;
  },

  getActiveConferenceVenues: async () => {
    const response = await api.get<ApiResponse<{ items: ConferenceVenueListDto[] }>>('/api/services/app/ConferenceVenue/GetAllActive');
    return response.data.result.items;
  },

  getConferenceVenue: async (id: string) => {
    const response = await api.get<ApiResponse<ConferenceVenueDto>>('/api/services/app/ConferenceVenue/Get', {
      params: { id },
    });

    return response.data.result;
  },

  createConferenceVenue: async (input: CreateConferenceVenueDto) => {
    const response = await api.post<ApiResponse<string>>('/api/services/app/ConferenceVenue/Create', input);
    return response.data.result;
  },

  updateConferenceVenue: async (input: UpdateConferenceVenueDto) => {
    await api.put('/api/services/app/ConferenceVenue/Update', input);
  },
};