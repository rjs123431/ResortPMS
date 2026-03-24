import { api } from './api.service';
import type {
  ApiResponse,
  PagedResultDto,
  RoomMaintenanceRequestDto,
  RoomMaintenanceStatus,
  MaintenanceCategory,
  CreateRoomMaintenanceRequestDto,
  RoomMaintenanceTypeDto,
  CreateUpdateRoomMaintenanceTypeDto,
} from '@/types/resort.types';

export const roomMaintenanceService = {
  getRoomMaintenanceRequests: async (params?: {
    roomId?: string;
    assignedStaffId?: string;
    status?: RoomMaintenanceStatus;
    category?: MaintenanceCategory;
    startDateFrom?: string;
    endDateTo?: string;
    filter?: string;
    skipCount?: number;
    maxResultCount?: number;
  }) => {
    const query: Record<string, string> = {};
    if (params?.roomId) query.RoomId = params.roomId;
    if (params?.assignedStaffId) query.AssignedStaffId = params.assignedStaffId;
    if (params?.status !== undefined) query.Status = String(params.status);
    if (params?.category !== undefined) query.Category = String(params.category);
    if (params?.startDateFrom) query.StartDateFrom = params.startDateFrom;
    if (params?.endDateTo) query.EndDateTo = params.endDateTo;
    if (params?.filter) query.Filter = params.filter;
    if (params?.skipCount !== undefined) query.SkipCount = String(params.skipCount);
    if (params?.maxResultCount !== undefined) query.MaxResultCount = String(params.maxResultCount);

    const response = await api.get<ApiResponse<PagedResultDto<RoomMaintenanceRequestDto>>>(
      '/api/services/app/RoomMaintenance/GetList',
      { params: query },
    );

    return response.data.result;
  },

  createRoomMaintenanceRequest: async (input: CreateRoomMaintenanceRequestDto) => {
    const response = await api.post<ApiResponse<string>>('/api/services/app/RoomMaintenance/Create', input);
    return response.data.result;
  },

  assignRoomMaintenanceRequest: async (id: string, staffId: string) => {
    await api.put('/api/services/app/RoomMaintenance/Assign', { id, staffId });
  },

  startRoomMaintenanceRequest: async (id: string) => {
    await api.put('/api/services/app/RoomMaintenance/Start', { id });
  },

  completeRoomMaintenanceRequest: async (id: string) => {
    await api.put('/api/services/app/RoomMaintenance/Complete', { id });
  },

  cancelRoomMaintenanceRequest: async (id: string, reason?: string) => {
    await api.put('/api/services/app/RoomMaintenance/Cancel', { id, reason: reason ?? '' });
  },

  // Maintenance types
  getMaintenanceTypes: async () => {
    const response = await api.get<ApiResponse<RoomMaintenanceTypeDto[]>>(
      '/api/services/app/RoomMaintenanceType/GetAll',
    );
    return response.data.result;
  },

  createMaintenanceType: async (input: CreateUpdateRoomMaintenanceTypeDto) => {
    const response = await api.post<ApiResponse<RoomMaintenanceTypeDto>>(
      '/api/services/app/RoomMaintenanceType/Create',
      input,
    );
    return response.data.result;
  },

  updateMaintenanceType: async (id: string, input: CreateUpdateRoomMaintenanceTypeDto) => {
    const response = await api.put<ApiResponse<RoomMaintenanceTypeDto>>(
      `/api/services/app/RoomMaintenanceType/Update?id=${id}`,
      input,
    );
    return response.data.result;
  },

  deleteMaintenanceType: async (id: string) => {
    await api.delete(`/api/services/app/RoomMaintenanceType/Delete?id=${id}`);
  },
};

