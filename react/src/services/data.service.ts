import { api } from './api.service';
import { ApiResponse, PaginatedResponse, ListItem } from '../types/api.types';

export const dataService = {
  getItems: async (page = 1, pageSize = 10, signal?: AbortSignal): Promise<PaginatedResponse<ListItem>> => {
    const response = await api.get<ApiResponse<PaginatedResponse<ListItem>>>(
      `/items?page=${page}&pageSize=${pageSize}`,
      { signal }
    );
    return response.data.data;
  },

  getItemById: async (id: string, signal?: AbortSignal): Promise<ListItem> => {
    const response = await api.get<ApiResponse<ListItem>>(`/items/${id}`, { signal });
    return response.data.data;
  },

  createItem: async (item: Omit<ListItem, 'id' | 'createdAt'>): Promise<ListItem> => {
    const response = await api.post<ApiResponse<ListItem>>('/items', item);
    return response.data.data;
  },

  updateItem: async (id: string, item: Partial<ListItem>): Promise<ListItem> => {
    const response = await api.put<ApiResponse<ListItem>>(`/items/${id}`, item);
    return response.data.data;
  },

  deleteItem: async (id: string): Promise<void> => {
    await api.delete(`/items/${id}`);
  },
};
