import { api } from './api.service';
import { UserListFilters, UserListResponse } from '../types/user.types';

// UserDto type for update (should match BE UserDto)
export interface UserDto {
  id: number;
  userName: string;
  name: string;
  surname: string;
  emailAddress: string;
  isActive: boolean;
  fullName?: string;
  lastLoginTime?: string;
  creationTime?: string;
  roleNames?: string[];
  employeeId?: number | null;
  teamId?: number | null;
  employees?: Array<{
    userId: number;
    employeeId: number;
    employeeName: string;
    id: number;
  }>;
}

export const userService = {
  getAll: async (filters: UserListFilters): Promise<UserListResponse> => {
    const params: any = {
      SkipCount: filters.skipCount || 0,
      MaxResultCount: filters.maxResultCount || 10,
    };

    if (filters.keyword) {
      params.Keyword = filters.keyword;
    }

    if (filters.isActive !== undefined) {
      params.IsActive = filters.isActive;
    }

    const response = await api.get<UserListResponse>('/api/services/app/User/GetAll', { params });
    return response.data;
  },
  /**
   * Update user using UserDto structure
   */
  update: async (user: UserDto) => {
    const response = await api.put(`/api/services/app/User/Update`, user);
    return response.data;
  },
};
