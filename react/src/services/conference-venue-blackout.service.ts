import { api } from './api.service';
import type { ApiResponse, PagedResultDto } from '@/types/common.types';
import type {
  ConferenceVenueBlackoutDto,
  ConferenceVenueBlackoutListDto,
  CreateConferenceVenueBlackoutDto,
  UpdateConferenceVenueBlackoutDto,
} from '@/types/conference.types';

export const conferenceVenueBlackoutService = {
  getConferenceVenueBlackouts: async (params?: {
    venueId?: string;
    filter?: string;
    startFrom?: string;
    endTo?: string;
  }) => {
    const response = await api.get<ApiResponse<PagedResultDto<ConferenceVenueBlackoutListDto>>>('/api/services/app/ConferenceVenueBlackout/GetAll', {
      params: {
        VenueId: params?.venueId,
        Filter: params?.filter,
        StartFrom: params?.startFrom,
        EndTo: params?.endTo,
        Sorting: 'StartDateTime asc',
        SkipCount: 0,
        MaxResultCount: 200,
      },
    });

    return response.data.result;
  },

  getConferenceVenueBlackout: async (id: string) => {
    const response = await api.get<ApiResponse<ConferenceVenueBlackoutDto>>('/api/services/app/ConferenceVenueBlackout/Get', {
      params: { id },
    });

    return response.data.result;
  },

  createConferenceVenueBlackout: async (input: CreateConferenceVenueBlackoutDto) => {
    const response = await api.post<ApiResponse<string>>('/api/services/app/ConferenceVenueBlackout/Create', input);
    return response.data.result;
  },

  updateConferenceVenueBlackout: async (input: UpdateConferenceVenueBlackoutDto) => {
    await api.put('/api/services/app/ConferenceVenueBlackout/Update', input);
  },

  deleteConferenceVenueBlackout: async (id: string) => {
    await api.delete('/api/services/app/ConferenceVenueBlackout/Delete', { params: { id } });
  },
};