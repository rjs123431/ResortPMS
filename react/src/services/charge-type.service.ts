import { api } from './api.service';
import {
  ApiResponse,
  ChargeTypeDto,
  ChargeTypeListDto,
  CreateChargeTypeDto,
  PagedResultDto,
} from '@/types/resort.types';

export const chargeTypeService = {
  getChargeTypes: async () => {
    const response = await api.get<ApiResponse<ChargeTypeListDto[]>>('/api/services/app/ChargeType/GetAllActive');
    return response.data.result;
  },

  getChargeTypesPaged: async (filter = '', skipCount = 0, maxResultCount = 100) => {
    const response = await api.get<ApiResponse<PagedResultDto<ChargeTypeListDto>>>('/api/services/app/ChargeType/GetAll', {
      params: {
        Filter: filter,
        Sorting: 'Sort asc, Name asc',
        SkipCount: skipCount,
        MaxResultCount: maxResultCount,
      },
    });
    return response.data.result;
  },

  getChargeType: async (id: string) => {
    const response = await api.get<ApiResponse<ChargeTypeDto>>('/api/services/app/ChargeType/Get', {
      params: { id },
    });
    return response.data.result;
  },

  createChargeType: async (input: CreateChargeTypeDto) => {
    const response = await api.post<ApiResponse<string>>('/api/services/app/ChargeType/Create', input);
    return response.data.result;
  },

  updateChargeType: async (input: ChargeTypeDto) => {
    await api.put('/api/services/app/ChargeType/Update', input);
  },
};
