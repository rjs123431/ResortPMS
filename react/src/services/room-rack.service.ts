import { api } from './api.service';
import { ApiResponse, GetRoomRackResultDto, RoomRackSettingsDto } from '@/types/resort.types';

export const roomRackService = {
  getRoomRackInfo: async (startDate: string, endDate: string) => {
    const response = await api.get<ApiResponse<GetRoomRackResultDto>>('/api/services/app/RoomRack/GetRoomInfo', {
      params: { startDate, endDate },
    });
    return response.data.result;
  },

  getRoomRackSettings: async (): Promise<RoomRackSettingsDto> => {
    const response = await api.get<ApiResponse<RoomRackSettingsDto>>('/api/services/app/RoomRackSettings/Get');
    return response.data.result;
  },

  updateRoomRackSettings: async (input: RoomRackSettingsDto): Promise<void> => {
    await api.put('/api/services/app/RoomRackSettings/Update', input);
  },
};
