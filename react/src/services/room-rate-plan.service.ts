import { api } from './api.service';
import {
  ApiResponse,
  CreateRoomRatePlanDto,
  PagedResultDto,
  RoomRatePlanDto,
  RoomRatePlanListDto,
  UpdateRoomRatePlanDto,
} from '@/types/resort.types';

export const roomRatePlanService = {
  getRoomRatePlansPaged: async (params?: {
    roomTypeId?: string;
    isActive?: boolean;
    filter?: string;
    skipCount?: number;
    maxResultCount?: number;
  }) => {
    const queryParams: Record<string, string | number> = {
      Filter: params?.filter ?? '',
      Sorting: 'Priority asc, Name asc',
      SkipCount: params?.skipCount ?? 0,
      MaxResultCount: params?.maxResultCount ?? 100,
    };
    if (params?.roomTypeId && params.roomTypeId.length > 0) {
      queryParams.RoomTypeId = params.roomTypeId;
    }
    if (params?.isActive !== undefined) {
      queryParams.IsActive = String(params.isActive);
    }
    const response = await api.get<ApiResponse<PagedResultDto<RoomRatePlanListDto>>>('/api/services/app/RoomRatePlan/GetAll', {
      params: queryParams,
    });
    return response.data.result;
  },

  getRoomRatePlan: async (id: string) => {
    const response = await api.get<ApiResponse<RoomRatePlanDto>>('/api/services/app/RoomRatePlan/Get', {
      params: { id },
    });
    return response.data.result;
  },

  createRoomRatePlan: async (input: CreateRoomRatePlanDto) => {
    const response = await api.post<ApiResponse<string>>('/api/services/app/RoomRatePlan/Create', input);
    return response.data.result;
  },

  updateRoomRatePlan: async (input: UpdateRoomRatePlanDto) => {
    await api.put('/api/services/app/RoomRatePlan/Update', input);
  },

  deleteRoomRatePlan: async (id: string) => {
    await api.delete('/api/services/app/RoomRatePlan/Delete', { params: { id } });
  },
};
