import { api } from './api.service';
import type { ApiResponse, PagedResultDto } from '@/types/common.types'
import type { CreateStaffDto, StaffDto, StaffListDto } from '@/types/staff.types';

export const staffService = {
  getStaffsPaged: async (filter = '', skipCount = 0, maxResultCount = 100) => {
    const response = await api.get<ApiResponse<PagedResultDto<StaffListDto>>>('/api/services/app/Staff/GetAll', {
      params: {
        Filter: filter,
        Sorting: 'FullName asc',
        SkipCount: skipCount,
        MaxResultCount: maxResultCount,
      },
    });
    return response.data.result;
  },

  getStaffs: async () => {
    const response = await api.get<ApiResponse<StaffListDto[]>>('/api/services/app/Staff/GetAllActive');
    return response.data.result;
  },

  getStaff: async (id: string) => {
    const response = await api.get<ApiResponse<StaffDto>>('/api/services/app/Staff/Get', { params: { id } });
    return response.data.result;
  },

  createStaff: async (input: CreateStaffDto) => {
    const response = await api.post<ApiResponse<string>>('/api/services/app/Staff/Create', input);
    return response.data.result;
  },

  updateStaff: async (input: StaffDto) => {
    await api.put('/api/services/app/Staff/Update', input);
  },
};
