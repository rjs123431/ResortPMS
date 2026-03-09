import { AbpApiResponse } from './api.types';

export interface UserListItem {
  id: number;
  userName: string;
  name: string;
  surname: string;
  fullName?: string;
  emailAddress: string;
  isActive: boolean;
  employeeId?: number | null;
  lastLoginTime?: string | null;
}

export interface UserListResult {
  items: UserListItem[];
  totalCount: number;
}

export type UserListResponse = AbpApiResponse<UserListResult>;

export interface UserListFilters {
  keyword?: string;
  isActive?: boolean;
  skipCount?: number;
  maxResultCount?: number;
}
