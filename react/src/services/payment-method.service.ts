import { api } from './api.service';
import type { ApiResponse, PagedResultDto } from '@/types/common.types'
import type { CreateLookupDto, LookupDto, LookupListDto } from '@/types/lookup.types';

export const paymentMethodService = {
  getPaymentMethods: async () => {
    const response = await api.get<ApiResponse<LookupListDto[]>>('/api/services/app/PaymentMethod/GetAllActive');
    return response.data.result;
  },

  getPaymentMethodsPaged: async (filter = '', skipCount = 0, maxResultCount = 100) => {
    const response = await api.get<ApiResponse<PagedResultDto<LookupListDto>>>('/api/services/app/PaymentMethod/GetAll', {
      params: {
        Filter: filter,
        Sorting: 'Name asc',
        SkipCount: skipCount,
        MaxResultCount: maxResultCount,
      },
    });
    return response.data.result;
  },

  getPaymentMethod: async (id: string) => {
    const response = await api.get<ApiResponse<LookupDto>>('/api/services/app/PaymentMethod/Get', {
      params: { id },
    });
    return response.data.result;
  },

  createPaymentMethod: async (input: CreateLookupDto) => {
    const response = await api.post<ApiResponse<string>>('/api/services/app/PaymentMethod/Create', input);
    return response.data.result;
  },

  updatePaymentMethod: async (input: LookupDto) => {
    await api.put('/api/services/app/PaymentMethod/Update', input);
  },
};
