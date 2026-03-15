import { api } from './api.service';
import {
  MyTravelOrderRequestListResult,
  ApplyTravelOrderDto,
  ApproverInfoDto,
} from '@/types/travelOrderRequest.types';
import { AbpApiResponse } from '@/types/api.types';

export const travelOrderRequestService = {
  getAll: async (
    sorting?: string,
    skipCount?: number,
    maxResultCount?: number,
    status?: number | null,
    signal?: AbortSignal
  ): Promise<MyTravelOrderRequestListResult> => {
    const params = new URLSearchParams();
    if (sorting) params.append('Sorting', sorting);
    if (skipCount !== undefined) params.append('SkipCount', skipCount.toString());
    if (maxResultCount !== undefined) params.append('MaxResultCount', maxResultCount.toString());
    if (status !== undefined && status !== null) params.append('Status', status.toString());

    const response = await api.get<{ result: MyTravelOrderRequestListResult }>(
      `/api/services/app/MyTravelOrderRequest/GetAll?${params.toString()}`,
      { signal }
    );
    return response.data.result;
  },

  get: async (id: number, signal?: AbortSignal): Promise<ApplyTravelOrderDto> => {
    const response = await api.get<{ result: ApplyTravelOrderDto }>(
      `/api/services/app/MyTravelOrderRequest/Get?id=${id}`,
      { signal }
    );
    return response.data.result;
  },

  create: async (data: ApplyTravelOrderDto): Promise<{ id: number }> => {
    const response = await api.post<{ result: { id: number } }>(
      '/api/services/app/MyTravelOrderRequest/Create',
      data
    );
    return response.data.result;
  },

  cancel: async (id: number): Promise<void> => {
    await api.post('/api/services/app/MyTravelOrderRequest/Cancel', { id });
  },

  /** FormTypes.TravelOrder = 14 */
  getApprovers: async (
    employeeId: number,
    formType = 14,
    signal?: AbortSignal
  ): Promise<ApproverInfoDto[]> => {
    const response = await api.get<AbpApiResponse<ApproverInfoDto[]>>(
      `/api/services/app/ApprovalGroup/GetApprovers?employeeId=${employeeId}&formType=${formType}`,
      { signal }
    );
    return response.data.result || [];
  },
};
