import { api } from './api.service';
import type { ApiResponse } from '@/types/common.types';
import type { EventTypeDto } from '@/types/conference.types';

export const eventTypeService = {
  getActiveEventTypes: async () => {
    const response = await api.get<ApiResponse<{ items: EventTypeDto[] }>>('/api/services/app/EventType/GetAllActive');
    return response.data.result.items;
  },
};