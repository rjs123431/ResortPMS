import { api } from './api.service';
import {
  ApiResponse,
  ChannelDto,
  ChannelListDto,
  CreateChannelDto,
  PagedResultDto,
} from '@/types/resort.types';

export const channelService = {
  getChannels: async () => {
    const response = await api.get<ApiResponse<ChannelListDto[]>>('/api/services/app/Channel/GetAllActive');
    return response.data.result;
  },

  getChannelsPaged: async (filter = '', skipCount = 0, maxResultCount = 100) => {
    const response = await api.get<ApiResponse<PagedResultDto<ChannelListDto>>>('/api/services/app/Channel/GetAll', {
      params: {
        Filter: filter,
        Sorting: 'Sort asc, Name asc',
        SkipCount: skipCount,
        MaxResultCount: maxResultCount,
      },
    });
    return response.data.result;
  },

  getChannel: async (id: string) => {
    const response = await api.get<ApiResponse<ChannelDto>>('/api/services/app/Channel/Get', {
      params: { id },
    });
    return response.data.result;
  },

  createChannel: async (input: CreateChannelDto) => {
    const response = await api.post<ApiResponse<string>>('/api/services/app/Channel/Create', input);
    return response.data.result;
  },

  updateChannel: async (input: ChannelDto) => {
    await api.put('/api/services/app/Channel/Update', input);
  },
};
