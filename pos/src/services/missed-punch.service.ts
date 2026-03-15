import { api } from './api.service';
import { AbpApiResponse } from '@/types/api.types';
import {
  ApplyMissedPunchDto,
  MyMissedPunchListResponse,
} from '@/types/missed-punch.types';
import { ApproverInfoDto } from '@/types/leave.types';

export const missedPunchService = {
  getMyMissedPunches: async (
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

    const response = await api.get<MyMissedPunchListResponse>(
      `/api/services/app/MyMissedPunch/GetAll?${params.toString()}`,
      { signal }
    );
    return response.data.result;
  },

  getMissedPunchRequest: async (id: number, signal?: AbortSignal) => {
    const response = await api.get<{ result: ApplyMissedPunchDto }>(
      `/api/services/app/MyMissedPunch/Get?id=${id}`,
      { signal }
    );
    return response.data.result;
  },

  createMissedPunchRequest: async (data: ApplyMissedPunchDto) => {
    const response = await api.post<{ result: { id: number } }>(
      '/api/services/app/MyMissedPunch/Create',
      data
    );
    return response.data.result;
  },

  cancelMissedPunchRequest: async (id: number) => {
    await api.post('/api/services/app/MyMissedPunch/Cancel', { id });
  },

  getPendingCount: async (signal?: AbortSignal) => {
    const response = await api.get<{ result: number }>(
      '/api/services/app/MyMissedPunch/GetPending',
      { signal }
    );
    return response.data.result;
  },

  getApprovers: async (employeeId: number, formType = 1, signal?: AbortSignal) => {
    const response = await api.get<AbpApiResponse<ApproverInfoDto[]>>(
      `/api/services/app/ApprovalGroup/GetApprovers?employeeId=${employeeId}&formType=${formType}`,
      { signal }
    );
    return response.data.result || [];
  },
};
