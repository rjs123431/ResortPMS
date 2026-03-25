import { api } from './api.service';
import type { ApiResponse, PagedResultDto } from '@/types/common.types'
import type { CreateExtraBedTypeDto, ExtraBedTypeDto, ExtraBedTypeListDto } from '@/types/extra-bed-type.types';

export const extraBedTypeService = {
  getExtraBedTypes: async () => {
    const response = await api.get<ApiResponse<ExtraBedTypeListDto[]>>('/api/services/app/ExtraBedType/GetAllActive');
    return response.data.result;
  },

  getExtraBedTypesPaged: async (filter = '', skipCount = 0, maxResultCount = 100) => {
    const response = await api.get<ApiResponse<PagedResultDto<ExtraBedTypeListDto>>>('/api/services/app/ExtraBedType/GetAll', {
      params: {
        Filter: filter,
        Sorting: 'Name asc',
        SkipCount: skipCount,
        MaxResultCount: maxResultCount,
      },
    });
    return response.data.result;
  },

  getExtraBedType: async (id: string) => {
    const response = await api.get<ApiResponse<ExtraBedTypeDto>>('/api/services/app/ExtraBedType/Get', {
      params: { id },
    });
    return response.data.result;
  },

  createExtraBedType: async (input: CreateExtraBedTypeDto) => {
    const response = await api.post<ApiResponse<string>>('/api/services/app/ExtraBedType/Create', input);
    return response.data.result;
  },

  updateExtraBedType: async (input: ExtraBedTypeDto) => {
    await api.put('/api/services/app/ExtraBedType/Update', input);
  },
};
