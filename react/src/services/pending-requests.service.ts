import { api } from './api.service';
import { ApprovalCountByFormTypeResponse } from '@/types/approval.types';

export const pendingRequestsService = {
  /**
   * Get count of current user's pending requests by type
   */
  getPendingRequestsCount: async (signal?: AbortSignal) => {
    const response = await api.get<ApprovalCountByFormTypeResponse>(
      '/api/services/app/PendingRequests/GetPendingRequestsCount',
      { signal }
    );

    return response.data.result || [];
  },
};
