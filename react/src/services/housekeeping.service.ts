import { api } from './api.service';
import {
  ApiResponse,
  CleaningBoardRoomDto,
  CreateHousekeepingTaskDto,
  HousekeepingLogDto,
  HousekeepingTaskDto,
  HousekeepingTaskStatus,
  HousekeepingTaskType,
  PagedResultDto,
  UpdateHousekeepingTaskStatusDto,
} from '@/types/resort.types';

export const housekeepingService = {
  getCleaningBoard: async (date?: string) => {
    const params: Record<string, string> = {};
    if (date) params.Date = date;
    const response = await api.get<ApiResponse<CleaningBoardRoomDto[]>>('/api/services/app/Housekeeping/GetCleaningBoard', { params });
    return response.data.result;
  },

  getHousekeepingTasks: async (params?: {
    status?: HousekeepingTaskStatus;
    taskType?: HousekeepingTaskType;
    roomId?: string;
    assignedToStaffId?: string;
    isUnassigned?: boolean;
    taskDate?: string;
    skipCount?: number;
    maxResultCount?: number;
  }) => {
    const query: Record<string, string> = {};
    if (params?.status !== undefined) query.Status = String(params.status);
    if (params?.taskType !== undefined) query.TaskType = String(params.taskType);
    if (params?.roomId) query.RoomId = params.roomId;
    if (params?.assignedToStaffId) query.AssignedToStaffId = params.assignedToStaffId;
    if (params?.isUnassigned) query.IsUnassigned = 'true';
    if (params?.taskDate) query.TaskDate = params.taskDate;
    if (params?.skipCount !== undefined) query.SkipCount = String(params.skipCount);
    if (params?.maxResultCount !== undefined) query.MaxResultCount = String(params.maxResultCount);
    const response = await api.get<ApiResponse<PagedResultDto<HousekeepingTaskDto>>>('/api/services/app/Housekeeping/GetTasks', { params: query });
    return response.data.result;
  },

  createHousekeepingTask: async (input: CreateHousekeepingTaskDto) => {
    const response = await api.post<ApiResponse<string>>('/api/services/app/Housekeeping/CreateTask', input);
    return response.data.result;
  },

  updateHousekeepingTaskStatus: async (input: UpdateHousekeepingTaskStatusDto) => {
    await api.put('/api/services/app/Housekeeping/UpdateTaskStatus', input);
  },

  getHousekeepingLogs: async (params?: {
    roomId?: string;
    fromDate?: string;
    toDate?: string;
    skipCount?: number;
    maxResultCount?: number;
  }) => {
    const query: Record<string, string> = {};
    if (params?.roomId) query.RoomId = params.roomId;
    if (params?.fromDate) query.FromDate = params.fromDate;
    if (params?.toDate) query.ToDate = params.toDate;
    if (params?.skipCount !== undefined) query.SkipCount = String(params.skipCount);
    if (params?.maxResultCount !== undefined) query.MaxResultCount = String(params.maxResultCount);
    const response = await api.get<ApiResponse<PagedResultDto<HousekeepingLogDto>>>('/api/services/app/Housekeeping/GetLogs', { params: query });
    return response.data.result;
  },
};
