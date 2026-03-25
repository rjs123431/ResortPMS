import { api } from './api.service';
import type { ApiResponse, PagedResultDto } from '@/types/common.types'
import {
  type CreateQuotationDto,
  type QuotationDto,
  type QuotationListDto,
  QuotationStatus,
  type UpdateQuotationDto,
} from '@/types/quotation.types';

export const quotationService = {
  getQuotations: async (params?: {
    filter?: string;
    status?: QuotationStatus;
    includeExpired?: boolean;
    skipCount?: number;
    maxResultCount?: number;
  }) => {
    const query: Record<string, string> = {};
    if (params?.filter) query.Filter = params.filter;
    if (params?.status !== undefined) query.Status = String(params.status);
    if (params?.includeExpired !== undefined) query.IncludeExpired = String(params.includeExpired);
    if (params?.skipCount !== undefined) query.SkipCount = String(params.skipCount);
    if (params?.maxResultCount !== undefined) query.MaxResultCount = String(params.maxResultCount);
    const response = await api.get<ApiResponse<PagedResultDto<QuotationListDto>>>('/api/services/app/Quotation/GetAll', { params: query });
    return response.data.result;
  },

  getQuotation: async (id: string) => {
    const response = await api.get<ApiResponse<QuotationDto>>('/api/services/app/Quotation/Get', { params: { id } });
    return response.data.result;
  },

  createQuotation: async (input: CreateQuotationDto) => {
    const response = await api.post<ApiResponse<string>>('/api/services/app/Quotation/Create', input);
    return response.data.result;
  },

  updateQuotation: async (input: UpdateQuotationDto) => {
    const response = await api.put<ApiResponse<string>>('/api/services/app/Quotation/Update', input);
    return response.data.result;
  },

  cancelQuotation: async (id: string) => {
    await api.post('/api/services/app/Quotation/Cancel', null, { params: { id } });
  },
};
