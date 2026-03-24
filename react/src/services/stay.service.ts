import { api } from './api.service';
import {
  ApiResponse,
  AddGuestRequestDto,
  CompleteGuestRequestDto,
  FolioDto,
  FolioSummaryDto,
  GuestRequestCompletionContextDto,
  GuestRequestListDto,
  PagedResultDto,
  StayListDto,
  TransferRoomDto,
} from '@/types/resort.types';

export const stayService = {
  getInHouseStays: async (filter = '', skipCount = 0, maxResultCount = 50) => {
    const response = await api.get<ApiResponse<PagedResultDto<StayListDto>>>('/api/services/app/Stay/GetInHouse', {
      params: {
        Filter: filter,
        Sorting: 'CheckInDateTime desc',
        SkipCount: skipCount,
        MaxResultCount: maxResultCount,
      },
    });
    return response.data.result;
  },

  getInHouseWithRooms: async (options: {
    roomDateFrom: string;
    roomDateTo: string;
    roomIds?: string[];
    filter?: string;
    maxResultCount?: number;
  }) => {
    const params: Record<string, string | number | undefined> = {
      Sorting: 'CheckInDateTime desc',
      SkipCount: 0,
      MaxResultCount: options.maxResultCount ?? 500,
      RoomDateFrom: options.roomDateFrom,
      RoomDateTo: options.roomDateTo,
    };
    if (options.filter) params.Filter = options.filter;
    if (options.roomIds?.length) params.RoomIdsCsv = options.roomIds.join(',');
    const response = await api.get<ApiResponse<PagedResultDto<StayListDto>>>(
      '/api/services/app/Stay/GetInHouseWithRooms',
      { params },
    );
    return response.data.result;
  },

  getFolioSummary: async (stayId: string) => {
    const response = await api.get<ApiResponse<FolioSummaryDto>>('/api/services/app/Stay/GetFolioSummary', {
      params: { stayId },
    });
    return response.data.result;
  },

  getFolio: async (stayId: string) => {
    const response = await api.get<ApiResponse<FolioDto>>('/api/services/app/Stay/GetFolio', {
      params: { stayId },
    });
    return response.data.result;
  },

  postCharge: async (input: {
    stayId: string;
    chargeTypeId: string;
    amount: number;
    quantity?: number;
    taxAmount?: number;
    discountAmount?: number;
    description?: string;
  }) => {
    await api.post('/api/services/app/Stay/PostCharge', {
      ...input,
      quantity: input.quantity ?? 1,
      taxAmount: input.taxAmount ?? 0,
      discountAmount: input.discountAmount ?? 0,
    });
  },

  postPayment: async (input: {
    stayId: string;
    paymentMethodId: string;
    amount: number;
    referenceNo?: string;
    notes?: string;
  }) => {
    await api.post('/api/services/app/Stay/PostPayment', input);
  },

  postRefund: async (input: { stayId: string; amount: number; description?: string }) => {
    await api.post('/api/services/app/Stay/PostRefund', input);
  },

  settleFolio: async (stayId: string) => {
    await api.post('/api/services/app/Stay/SettleFolio', { stayId });
  },

  addGuestRequest: async (input: AddGuestRequestDto) => {
    const response = await api.post<ApiResponse<string>>('/api/services/app/Stay/AddGuestRequest', input);
    return response.data.result;
  },

  getGuestRequests: async (stayId: string) => {
    const response = await api.get<ApiResponse<GuestRequestListDto[]>>('/api/services/app/Stay/GetGuestRequests', {
      params: { stayId },
    });
    return response.data.result;
  },

  getGuestRequestCompletionContext: async (guestRequestId: string) => {
    const response = await api.get<ApiResponse<GuestRequestCompletionContextDto>>(
      '/api/services/app/Stay/GetGuestRequestCompletionContext',
      { params: { guestRequestId } },
    );
    return response.data.result;
  },

  completeGuestRequest: async (input: CompleteGuestRequestDto) => {
    await api.post('/api/services/app/Stay/CompleteGuestRequest', input);
  },

  transferRoom: async (input: TransferRoomDto) => {
    await api.post('/api/services/app/Stay/TransferRoom', input);
  },
};
