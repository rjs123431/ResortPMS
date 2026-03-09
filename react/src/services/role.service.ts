import { api } from './api.service';
import type { RoleListResponse } from '../types/role.types';

export const roleService = {
  getAll: async (): Promise<RoleListResponse> => {
    const response = await api.get<RoleListResponse>('/api/services/app/User/GetRoles');
    return response.data;
  },
};
