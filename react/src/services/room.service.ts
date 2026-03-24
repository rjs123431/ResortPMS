import { api } from './api.service';
import {
  ApiResponse,
  CreateRoomDto,
  HousekeepingStatus,
  PagedResultDto,
  RoomDto,
  RoomListDto,
  UpdateHousekeepingStatusDto,
} from '@/types/resort.types';

export const roomService = {
  getRooms: async (filter = '', skipCount = 0, maxResultCount = 100, roomTypeId?: string) => {
    const response = await api.get<ApiResponse<PagedResultDto<RoomListDto>>>('/api/services/app/Room/GetAll', {
      params: {
        Filter: filter,
        Sorting: 'RoomNumber asc',
        SkipCount: skipCount,
        MaxResultCount: maxResultCount,
        RoomTypeId: roomTypeId,
      },
    });
    return response.data.result;
  },

  getRoom: async (id: string) => {
    const response = await api.get<ApiResponse<RoomDto>>('/api/services/app/Room/Get', {
      params: { id },
    });
    return response.data.result;
  },

  createRoom: async (input: CreateRoomDto) => {
    const response = await api.post<ApiResponse<string>>('/api/services/app/Room/Create', input);
    return response.data.result;
  },

  updateRoom: async (input: RoomDto) => {
    await api.put('/api/services/app/Room/Update', input);
  },

  updateRoomHousekeepingStatus: async (
    roomId: string,
    housekeepingStatus: HousekeepingStatus,
    remarks?: string,
    staffId?: string,
  ) => {
    const payload: UpdateHousekeepingStatusDto = { roomId, housekeepingStatus, remarks, staffId };
    await api.put('/api/services/app/Room/UpdateHousekeepingStatus', payload);
  },
};
