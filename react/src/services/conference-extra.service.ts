import { api } from './api.service';
import type { ApiResponse, PagedResultDto } from '@/types/common.types';
import type {
  ConferenceExtraDto,
  ConferenceExtraListDto,
  CreateConferenceExtraDto,
  UpdateConferenceExtraDto,
} from '@/types/conference.types';

export const conferenceExtraService = {
  getConferenceExtras: async (filter = '') => {
    const response = await api.get<ApiResponse<PagedResultDto<ConferenceExtraListDto>>>('/api/services/app/ConferenceExtra/GetAll', {
      params: {
        Filter: filter,
        Sorting: 'Category asc, SortOrder asc, Name asc',
        SkipCount: 0,
        MaxResultCount: 200,
      },
    });

    return response.data.result;
  },

  getActiveConferenceExtras: async () => {
    const response = await api.get<ApiResponse<{ items: ConferenceExtraDto[] }>>('/api/services/app/ConferenceExtra/GetAllActive');
    return response.data.result.items;
  },

  getConferenceExtra: async (id: string) => {
    const response = await api.get<ApiResponse<ConferenceExtraDto>>('/api/services/app/ConferenceExtra/Get', {
      params: { id },
    });

    return response.data.result;
  },

  createConferenceExtra: async (input: CreateConferenceExtraDto) => {
    const response = await api.post<ApiResponse<string>>('/api/services/app/ConferenceExtra/Create', input);
    return response.data.result;
  },

  updateConferenceExtra: async (input: UpdateConferenceExtraDto) => {
    await api.put('/api/services/app/ConferenceExtra/Update', input);
  },
};