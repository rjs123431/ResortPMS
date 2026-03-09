import { api } from './api.service';
import { AbpApiResponse } from '@/types/api.types';
import {
  LeaveDetailsResponse,
  LeaveCredit,
  MyLeaveListResponse,
  LeaveTypeDto,
  ApplyLeaveDto,
  LeaveBalanceResponse,
  ApproverInfoDto
} from '../types/leave.types';

export const leaveService = {
  getLeaveCredits: async (signal?: AbortSignal): Promise<LeaveCredit[]> => {
    const response = await api.get<LeaveDetailsResponse>(
      `/api/services/app/MyLeave/GetDetails`,
      { signal }
    );

    const transactions = response.data.result.leaveTransactions;

    // Group transactions by leave type and sum credits for paid leaves
    const creditsMap = new Map<number, LeaveCredit>();

    transactions.forEach((transaction) => {
      const existing = creditsMap.get(transaction.leaveTypeId);
      if (existing) {
        // Only add to credits if paid
        if (transaction.isPaid) {
          existing.credits += transaction.noOfDays;
        }
        existing.transactions.push(transaction);
      } else {
        creditsMap.set(transaction.leaveTypeId, {
          leaveTypeId: transaction.leaveTypeId,
          leaveTypeName: transaction.leaveTypeName,
          credits: transaction.isPaid ? transaction.noOfDays : 0,
          transactions: [transaction],
        });
      }
    });

    return Array.from(creditsMap.values());
  },

  getLeaveTransactions: async (employeeId: number, signal?: AbortSignal) => {
    const response = await api.get<LeaveDetailsResponse>(
      `/api/services/app/Leave/GetDetails?id=${employeeId}`,
      { signal }
    );

    return response.data.result.leaveTransactions;
  },

  getMyLeaves: async (
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

    const response = await api.get<MyLeaveListResponse>(
      `/api/services/app/MyLeave/GetAll?${params.toString()}`,
      { signal }
    );
    return response.data.result;
  },

  getLeaveRequest: async (id: number, signal?: AbortSignal) => {
    const response = await api.get<{ result: ApplyLeaveDto }>(
      `/api/services/app/MyLeave/Get?id=${id}`,
      { signal }
    );
    return response.data.result;
  },

  createLeaveRequest: async (data: ApplyLeaveDto) => {
    const response = await api.post<{ result: { id: number } }>(
      '/api/services/app/MyLeave/Create',
      data
    );
    return response.data.result;
  },

  updateLeaveRequest: async (data: ApplyLeaveDto) => {
    await api.put('/api/services/app/MyLeave/Update', data);
  },

  cancelLeaveRequest: async (id: number) => {
    await api.post('/api/services/app/MyLeave/Cancel', { id });
  },

  getPendingCount: async (signal?: AbortSignal): Promise<number> => {
    const response = await api.get<MyLeaveListResponse>(
      '/api/services/app/MyLeave/GetAll?MaxResultCount=1000',
      { signal }
    );
    return response.data.result.items.filter((item) => item.status === 1).length;
  },

  getLeaveTypes: async (signal?: AbortSignal) => {
    const response = await api.get<{ result: { items: LeaveTypeDto[] } }>(
      '/api/services/app/LeaveType/GetList',
      { signal }
    );
    return response.data.result.items;
  },

  getLeaveBalance: async (leaveTypeId: number, signal?: AbortSignal) => {
    const response = await api.get<LeaveBalanceResponse>(
      `/api/services/app/MyLeave/GetBalance?leaveTypeId=${leaveTypeId}`,
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

  uploadLeaveRequestAttachment: async (leaveRequestId: number, files: File[]) => {
    if (!files.length) return;

    const formData = new FormData();
    files.forEach((file) => {
      formData.append('file', file);
    });

    const apiBaseUrl = api.defaults.baseURL || '';
    const rootUrl = apiBaseUrl.replace(/\/api\/?$/, '');
    const uploadUrl = `${rootUrl}/document/UploadLeaveRequestAttachment?leaveRequestId=${leaveRequestId}`;

    await api.post(uploadUrl, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};
