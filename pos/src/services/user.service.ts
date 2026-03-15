import { api } from './api.service';
import { UserListFilters, UserListResponse } from '../types/user.types';

// UserDto type for get/update (should match BE UserDto)
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

export interface CreateUserDto {
  userName: string;
  name: string;
  surname: string;
  emailAddress: string;
  isActive: boolean;
  password: string;
  roleNames?: string[];
}

export const userService = {
  getAll: async (filters: UserListFilters): Promise<UserListResponse> => {
    const params: Record<string, unknown> = {
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

  get: async (id: number): Promise<UserDto> => {
    const response = await api.get<{ result: UserDto }>(`/api/services/app/User/Get`, {
      params: { id },
    });
    return response.data.result;
  },

  create: async (dto: CreateUserDto): Promise<UserDto> => {
    const response = await api.post<{ result: UserDto }>('/api/services/app/User/Create', dto);
    return response.data.result;
  },

  update: async (user: UserDto): Promise<UserDto> => {
    const response = await api.put<{ result: UserDto }>('/api/services/app/User/Update', user);
    return response.data.result;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete('/api/services/app/User/Delete', { params: { id } });
  },

  getRoles: async (): Promise<RoleOption[]> => {
    const response = await api.get<{ result: { items: RoleOption[] } }>(
      '/api/services/app/User/GetRoles'
    );
    return response.data.result?.items ?? [];
  },
};

export interface RoleOption {
  id: number;
  name: string;
  displayName: string;
  normalizedName?: string;
  description?: string;
  isDefault?: boolean;
}
