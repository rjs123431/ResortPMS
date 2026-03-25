import { api } from './api.service';
import type { ApiResponse, PagedResultDto } from '@/types/common.types'
import {
  type CreatePreCheckInDto,
  type PreCheckInDto,
  type PreCheckInListDto,
  PreCheckInStatus,
  type UpdatePreCheckInDto,
} from '@/types/pre-check-in.types';

export const preCheckInService = {
  getPreCheckIns: async (params?: {
    filter?: string;
    status?: PreCheckInStatus;
    includeExpired?: boolean;
    walkInOnly?: boolean;
    reservationOnly?: boolean;
    reservationId?: string;
    skipCount?: number;
    maxResultCount?: number;
  }) => {
    const query: Record<string, string> = {};
    if (params?.filter) query.Filter = params.filter;
    if (params?.status !== undefined) query.Status = String(params.status);
    if (params?.includeExpired !== undefined) query.IncludeExpired = String(params.includeExpired);
    if (params?.walkInOnly !== undefined) query.WalkInOnly = String(params.walkInOnly);
    if (params?.reservationOnly !== undefined) query.ReservationOnly = String(params.reservationOnly);
    if (params?.reservationId) query.ReservationId = params.reservationId;
    if (params?.skipCount !== undefined) query.SkipCount = String(params.skipCount);
    if (params?.maxResultCount !== undefined) query.MaxResultCount = String(params.maxResultCount);
    const response = await api.get<ApiResponse<PagedResultDto<PreCheckInListDto>>>('/api/services/app/PreCheckIn/GetAll', { params: query });
    return response.data.result;
  },

  getPreCheckIn: async (id: string) => {
    const response = await api.get<ApiResponse<PreCheckInDto>>('/api/services/app/PreCheckIn/Get', { params: { id } });
    return response.data.result;
  },

  getPreCheckInByReservationId: async (reservationId: string) => {
    const response = await api.get<ApiResponse<PreCheckInDto | null>>('/api/services/app/PreCheckIn/GetByReservationId', { params: { reservationId } });
    return response.data.result;
  },

  createPreCheckIn: async (input: CreatePreCheckInDto) => {
    const response = await api.post<ApiResponse<string>>('/api/services/app/PreCheckIn/Create', input);
    return response.data.result;
  },

  updatePreCheckIn: async (input: UpdatePreCheckInDto) => {
    const response = await api.put<ApiResponse<string>>('/api/services/app/PreCheckIn/Update', input);
    return response.data.result;
  },

  cancelPreCheckIn: async (id: string) => {
    await api.post('/api/services/app/PreCheckIn/Cancel', null, { params: { id } });
  },

  markPreCheckInReady: async (id: string) => {
    await api.post('/api/services/app/PreCheckIn/MarkReady', null, { params: { id } });
  },

  markPreCheckInCheckedIn: async (id: string) => {
    await api.post('/api/services/app/PreCheckIn/MarkCheckedIn', null, { params: { id } });
  },
};
