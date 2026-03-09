import { api } from './api.service';
import { AbpApiResponse } from '@/types/api.types';
import {
  ApplyOvertimeDto,
  MyOvertimeListResponse,
} from '@/types/overtime.types';
import { ApproverInfoDto } from '@/types/leave.types';

export const overtimeService = {
  getMyOvertimes: async (
    sorting?: string,
    skipCount?: number,
    maxResultCount?: number,
    status?: number | null,
    signal?: AbortSignal
  ) => {
    const params = new URLSearchParams();
    if (sorting) params.append('Sorting', sorting);
    if (skipCount !== undefined) params.append('SkipCount', skipCount.toString());
    if (maxResultCount !== undefined) params.append('MaxResultCount', maxResultCount.toString());
    if (status !== undefined && status !== null) params.append('Status', status.toString());

    const response = await api.get<MyOvertimeListResponse>(
      `/api/services/app/MyOvertime/GetAll?${params.toString()}`,
      { signal }
    );
    return response.data.result;
  },

  getOvertimeRequest: async (id: number, signal?: AbortSignal) => {
    const response = await api.get<{ result: ApplyOvertimeDto }>(
      `/api/services/app/MyOvertime/Get?id=${id}`,
      { signal }
    );
    return response.data.result;
  },

  createOvertimeRequest: async (data: ApplyOvertimeDto) => {
    const response = await api.post<{ result: { id: number } }>(
      '/api/services/app/MyOvertime/Create',
      data
    );
    return response.data.result;
  },

  cancelOvertimeRequest: async (id: number) => {
    await api.post('/api/services/app/MyOvertime/Cancel', { id });
  },

  getPendingCount: async (signal?: AbortSignal): Promise<number> => {
    const response = await api.get<MyOvertimeListResponse>(
      '/api/services/app/MyOvertime/GetAll?MaxResultCount=1000',
      { signal }
    );
    return response.data.result.items.filter((item) => item.status === 1).length;
  },

  getApprovers: async (employeeId: number, formType = 2, signal?: AbortSignal) => {
    const response = await api.get<AbpApiResponse<ApproverInfoDto[]>>(
      `/api/services/app/ApprovalGroup/GetApprovers?employeeId=${employeeId}&formType=${formType}`,
      { signal }
    );
    return response.data.result || [];
  },
};
