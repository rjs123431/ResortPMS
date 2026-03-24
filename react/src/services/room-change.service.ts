import { api } from './api.service';
import {
  ApiResponse,
  ApproveRoomChangeRequestDto,
  AvailableRoomForChangeDto,
  CancelRoomChangeRequestDto,
  CreateRoomChangeRequestDto,
  ExecuteRoomChangeDto,
  RejectRoomChangeRequestDto,
  RoomChangeRequestDto,
  RoomChangeRequestListDto,
} from '@/types/resort.types';

export const roomChangeService = {
  createRoomChangeRequest: async (input: CreateRoomChangeRequestDto) => {
    const response = await api.post<ApiResponse<string>>('/api/services/app/RoomChange/CreateRequest', input);
    return response.data.result;
  },

  getAvailableRoomsForChange: async (requestId: string) => {
    const response = await api.get<ApiResponse<AvailableRoomForChangeDto[]>>(
      '/api/services/app/RoomChange/GetAvailableRoomsForChange',
      { params: { requestId } },
    );
    return response.data.result;
  },

  approveRoomChangeRequest: async (input: ApproveRoomChangeRequestDto) => {
    await api.post('/api/services/app/RoomChange/ApproveRequest', input);
  },

  rejectRoomChangeRequest: async (input: RejectRoomChangeRequestDto) => {
    await api.post('/api/services/app/RoomChange/RejectRequest', input);
  },

  cancelRoomChangeRequest: async (input: CancelRoomChangeRequestDto) => {
    await api.post('/api/services/app/RoomChange/CancelRequest', input);
  },

  executeRoomChange: async (input: ExecuteRoomChangeDto) => {
    const response = await api.post<ApiResponse<string>>('/api/services/app/RoomChange/ExecuteRoomChange', input);
    return response.data.result;
  },

  getRoomChangeRequest: async (requestId: string) => {
    const response = await api.get<ApiResponse<RoomChangeRequestDto>>('/api/services/app/RoomChange/GetRequest', {
      params: { requestId },
    });
    return response.data.result;
  },

  getPendingRoomChangeRequests: async () => {
    const response = await api.get<ApiResponse<RoomChangeRequestListDto[]>>('/api/services/app/RoomChange/GetPendingRequests');
    return response.data.result;
  },

  getRoomChangeRequestsByStay: async (stayId: string) => {
    const response = await api.get<ApiResponse<RoomChangeRequestListDto[]>>(
      '/api/services/app/RoomChange/GetRequestsByStay',
      { params: { stayId } },
    );
    return response.data.result;
  },
};
