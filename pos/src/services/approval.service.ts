import { api } from './api.service';
import {
  ApprovalCountByFormTypeResponse,
  ApprovalListResponse,
  FormType,
} from '@/types/approval.types';

export interface GetApprovalListParams {
  filter?: string;
  status?: number | null;
  formTypes?: FormType[];
  sorting?: string;
  skipCount?: number;
  maxResultCount?: number;
}

export const approvalService = {
  getApprovalList: async (params: GetApprovalListParams, signal?: AbortSignal) => {
    const query = new URLSearchParams();
    if (params.filter) query.append('Filter', params.filter);
    if (params.status !== undefined && params.status !== null) {
      query.append('Status', params.status.toString());
    }
    if (params.formTypes && params.formTypes.length > 0) {
      params.formTypes.forEach((formType) => {
        query.append('FormTypes', formType.toString());
      });
    }
    if (params.sorting) query.append('Sorting', params.sorting);
    if (params.skipCount !== undefined) query.append('SkipCount', params.skipCount.toString());
    if (params.maxResultCount !== undefined) {
      query.append('MaxResultCount', params.maxResultCount.toString());
    }

    const response = await api.get<ApprovalListResponse>(
      `/api/services/app/ForApproval/GetApprovalList?${query.toString()}`,
      { signal }
    );

    return response.data.result;
  },

  getForApprovalCount: async (signal?: AbortSignal) => {
    const response = await api.get<ApprovalCountByFormTypeResponse>(
      '/api/services/app/ForApproval/GetForApprovalCount',
      { signal }
    );

    return response.data.result || [];
  },

  approveLeave: async (id: number, originalApproverEmployeeId?: number | null) => {
    const payload = {
      id,
      originalApproverEmployeeId: originalApproverEmployeeId ?? undefined,
    };

    await api.post('/api/services/app/LeaveApproval/Approve', payload);
  },

  declineLeave: async (id: number, remarks: string, originalApproverEmployeeId?: number | null) => {
    const payload = {
      id,
      remarks,
      originalApproverEmployeeId: originalApproverEmployeeId ?? undefined,
    };

    await api.post('/api/services/app/LeaveApproval/Decline', payload);
  },

  approveMissedPunch: async (id: number, originalApproverEmployeeId?: number | null) => {
    const payload = {
      id,
      originalApproverEmployeeId: originalApproverEmployeeId ?? undefined,
    };

    await api.post('/api/services/app/MissedPunchApproval/Approve', payload);
  },

  declineMissedPunch: async (id: number, remarks: string, originalApproverEmployeeId?: number | null) => {
    const payload = {
      id,
      remarks,
      originalApproverEmployeeId: originalApproverEmployeeId ?? undefined,
    };

    await api.post('/api/services/app/MissedPunchApproval/Decline', payload);
  },

  approveOvertime: async (id: number, originalApproverEmployeeId?: number | null) => {
    const payload = {
      id,
      originalApproverEmployeeId: originalApproverEmployeeId ?? undefined,
    };
    await api.post('/api/services/app/OvertimeApproval/Approve', payload);
  },

  declineOvertime: async (id: number, remarks: string, originalApproverEmployeeId?: number | null) => {
    const payload = {
      id,
      remarks,
      originalApproverEmployeeId: originalApproverEmployeeId ?? undefined,
    };
    await api.post('/api/services/app/OvertimeApproval/Decline', payload);
  },

  approveTravelOrder: async (id: number, originalApproverEmployeeId?: number | null) => {
    const payload = {
      id,
      originalApproverEmployeeId: originalApproverEmployeeId ?? undefined,
    };
    await api.post('/api/services/app/TravelOrderApproval/Approve', payload);
  },

  declineTravelOrder: async (id: number, remarks: string, originalApproverEmployeeId?: number | null) => {
    const payload = {
      id,
      remarks,
      originalApproverEmployeeId: originalApproverEmployeeId ?? undefined,
    };
    await api.post('/api/services/app/TravelOrderApproval/Decline', payload);
  },
};
