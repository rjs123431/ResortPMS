import { api } from './api.service';
import {
  ApiResponse,
  CreateLookupDto,
  LookupDto,
  LookupListDto,
  PagedResultDto,
} from '@/types/resort.types';

export const agencyService = {
  getAgencies: async () => {
    const response = await api.get<ApiResponse<LookupListDto[]>>('/api/services/app/Agency/GetAllActive');
    return response.data.result;
  },

  getAgenciesPaged: async (filter = '', skipCount = 0, maxResultCount = 100) => {
    const response = await api.get<ApiResponse<PagedResultDto<LookupListDto>>>('/api/services/app/Agency/GetAll', {
      params: {
        Filter: filter,
        Sorting: 'Name asc',
        SkipCount: skipCount,
        MaxResultCount: maxResultCount,
      },
    });
    return response.data.result;
  },

  getAgency: async (id: string) => {
    const response = await api.get<ApiResponse<LookupDto>>('/api/services/app/Agency/Get', {
      params: { id },
    });
    return response.data.result;
  },

  createAgency: async (input: CreateLookupDto) => {
    const response = await api.post<ApiResponse<string>>('/api/services/app/Agency/Create', input);
    return response.data.result;
  },

  updateAgency: async (input: LookupDto) => {
    await api.put('/api/services/app/Agency/Update', input);
  },
};
