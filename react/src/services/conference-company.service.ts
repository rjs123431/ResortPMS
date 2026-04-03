import { api } from './api.service';
import type { ApiResponse, PagedResultDto } from '@/types/common.types';
import type {
  ConferenceCompanyDto,
  ConferenceCompanyListDto,
  CreateConferenceCompanyDto,
  UpdateConferenceCompanyDto,
} from '@/types/conference.types';

export const conferenceCompanyService = {
  getConferenceCompanies: async (filter = '') => {
    const response = await api.get<ApiResponse<PagedResultDto<ConferenceCompanyListDto>>>('/api/services/app/ConferenceCompany/GetAll', {
      params: {
        Filter: filter,
        Sorting: 'Name asc',
        SkipCount: 0,
        MaxResultCount: 200,
      },
    });

    return response.data.result;
  },

  getActiveConferenceCompanies: async () => {
    const response = await api.get<ApiResponse<{ items: ConferenceCompanyListDto[] }>>('/api/services/app/ConferenceCompany/GetAllActive');
    return response.data.result.items;
  },

  getConferenceCompany: async (id: string) => {
    const response = await api.get<ApiResponse<ConferenceCompanyDto>>('/api/services/app/ConferenceCompany/Get', {
      params: { id },
    });

    return response.data.result;
  },

  createConferenceCompany: async (input: CreateConferenceCompanyDto) => {
    const response = await api.post<ApiResponse<string>>('/api/services/app/ConferenceCompany/Create', input);
    return response.data.result;
  },

  updateConferenceCompany: async (input: UpdateConferenceCompanyDto) => {
    await api.put('/api/services/app/ConferenceCompany/Update', input);
  },
};