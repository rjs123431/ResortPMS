import { api } from './api.service';
import {
  ApiResponse,
  CreateRoomTypeDto,
  PagedResultDto,
  RoomTypeDto,
  RoomTypeListDto,
} from '@/types/resort.types';

export const roomTypeService = {
  getRoomTypes: async () => {
    const response = await api.get<ApiResponse<RoomTypeListDto[]>>('/api/services/app/RoomType/GetAllActive');
    return response.data.result;
  },

  getRoomTypesPaged: async (filter = '', skipCount = 0, maxResultCount = 100) => {
    const response = await api.get<ApiResponse<PagedResultDto<RoomTypeListDto>>>('/api/services/app/RoomType/GetAll', {
      params: {
        Filter: filter,
        Sorting: 'Name asc',
        SkipCount: skipCount,
        MaxResultCount: maxResultCount,
      },
    });
    return response.data.result;
  },

  getRoomType: async (id: string) => {
    const response = await api.get<ApiResponse<RoomTypeDto>>('/api/services/app/RoomType/Get', {
      params: { id },
    });
    return response.data.result;
  },

  createRoomType: async (input: CreateRoomTypeDto) => {
    const response = await api.post<ApiResponse<string>>('/api/services/app/RoomType/Create', input);
    return response.data.result;
  },

  updateRoomType: async (input: RoomTypeDto) => {
    await api.put('/api/services/app/RoomType/Update', input);
  },
};
