import { api } from './api.service';
import {
  ApiResponse,
  CheckOutRecordDto,
  CheckOutResultDto,
  CheckOutStatementDto,
  ClearStayRoomDto,
  ReceiptDto,
  StayRoomRecordDto,
} from '@/types/resort.types';

export const checkOutService = {
  getCheckoutStatement: async (stayId: string) => {
    const response = await api.get<ApiResponse<CheckOutStatementDto>>('/api/services/app/CheckOut/GetStatement', {
      params: { stayId },
    });
    return response.data.result;
  },

  processCheckout: async (
    inputOrStayId:
      | {
          stayId: string;
          payments?: { paymentMethodId: string; amount: number; referenceNo?: string }[];
        }
      | string,
    paymentMethodId?: string,
    amount?: number,
    referenceNo?: string,
  ) => {
    const payload =
      typeof inputOrStayId === 'string'
        ? {
            stayId: inputOrStayId,
            payments:
              paymentMethodId && amount && amount > 0
                ? [{ paymentMethodId, amount, referenceNo }]
                : [],
          }
        : {
            stayId: inputOrStayId.stayId,
            payments: inputOrStayId.payments ?? [],
          };

    const response = await api.post<ApiResponse<CheckOutResultDto>>('/api/services/app/CheckOut/ProcessCheckOut', payload);
    return response.data.result;
  },

  writeOffBalance: async (stayId: string, reason: string) => {
    await api.post('/api/services/app/CheckOut/WriteOffBalance', { stayId, reason });
  },

  getLatestReceiptByStay: async (stayId: string) => {
    const response = await api.get<ApiResponse<ReceiptDto>>('/api/services/app/CheckOut/GetLatestReceiptByStay', {
      params: { stayId },
    });
    return response.data.result;
  },

  getCheckOutRecord: async (id: string) => {
    const response = await api.get<ApiResponse<CheckOutRecordDto>>('/api/services/app/CheckOut/GetCheckOutRecord', {
      params: { id },
    });
    return response.data.result;
  },

  clearStayRoom: async (input: ClearStayRoomDto) => {
    const response = await api.post<ApiResponse<StayRoomRecordDto>>('/api/services/app/CheckOut/ClearStayRoom', input);
    return response.data.result;
  },
};
