// Generic ABP API Response wrapper
export interface AbpApiResponse<T> {
  result: T;
  targetUrl: string | null;
  success: boolean;
  error: any;
  unAuthorizedRequest: boolean;
  __abp: boolean;
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ListItem {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  status: 'active' | 'inactive';
}
