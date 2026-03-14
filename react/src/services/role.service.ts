import { api } from './api.service';

export interface RoleDto {
  id: number;
  name: string;
  displayName: string;
  normalizedName?: string;
  description?: string;
  grantedPermissions?: string[];
}

export interface CreateRoleDto {
  name: string;
  displayName: string;
  description?: string;
  grantedPermissions?: string[];
}

export interface FlatPermissionDto {
  parentName?: string | null;
  name: string;
  displayName: string;
  description?: string;
}

/** Permission from GetAllPermissions (no parent); we derive parent from name in the UI. */
export interface PermissionDto {
  name: string;
  displayName: string;
  description?: string;
}

export interface RoleEditDto {
  id: number;
  name: string;
  displayName: string;
  description?: string;
  isStatic?: boolean;
}

export interface GetRoleForEditOutput {
  role: RoleEditDto;
  permissions: FlatPermissionDto[];
  grantedPermissionNames: string[];
}

export interface PagedRoleResult {
  items: RoleDto[];
  totalCount: number;
}

export interface GetAllRolesInput {
  filter?: string;
  skipCount?: number;
  maxResultCount?: number;
  sorting?: string;
}

export const roleService = {
  getAll: async (input: GetAllRolesInput = {}): Promise<PagedRoleResult> => {
    const params: Record<string, unknown> = {
      SkipCount: input.skipCount ?? 0,
      MaxResultCount: input.maxResultCount ?? 10,
    };
    if (input.filter) params.Filter = input.filter;
    if (input.sorting) params.Sorting = input.sorting;
    const response = await api.get<{ result: PagedRoleResult }>(
      '/api/services/app/Role/GetAll',
      { params }
    );
    return response.data.result;
  },

  get: async (id: number): Promise<RoleDto> => {
    const response = await api.get<{ result: RoleDto }>('/api/services/app/Role/Get', {
      params: { id },
    });
    return response.data.result;
  },

  getForEdit: async (id: number): Promise<GetRoleForEditOutput> => {
    const response = await api.get<{ result: GetRoleForEditOutput }>(
      '/api/services/app/Role/GetRoleForEdit',
      { params: { id } }
    );
    const r = response.data.result;
    return {
      role: r.role,
      permissions: r.permissions ?? [],
      grantedPermissionNames: r.grantedPermissionNames ?? [],
    };
  },

  getAllPermissions: async (): Promise<FlatPermissionDto[]> => {
    const response = await api.get<{ result: { items: PermissionDto[] } }>(
      '/api/services/app/Role/GetAllPermissions'
    );
    const items = response.data.result?.items ?? [];
    return items.map((p) => ({
      ...p,
      parentName: p.name.includes('.')
        ? p.name.split('.').slice(0, -1).join('.')
        : null,
    }));
  },

  create: async (dto: CreateRoleDto): Promise<RoleDto> => {
    const payload = {
      ...dto,
      grantedPermissions: dto.grantedPermissions ?? [],
    };
    const response = await api.post<{ result: RoleDto }>(
      '/api/services/app/Role/Create',
      payload
    );
    return response.data.result;
  },

  update: async (dto: RoleDto): Promise<RoleDto> => {
    const payload = {
      ...dto,
      grantedPermissions: dto.grantedPermissions ?? [],
    };
    const response = await api.put<{ result: RoleDto }>(
      '/api/services/app/Role/Update',
      payload
    );
    return response.data.result;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete('/api/services/app/Role/Delete', { params: { id } });
  },
};
