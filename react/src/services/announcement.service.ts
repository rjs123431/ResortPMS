import { api } from './api.service';
import { AbpApiResponse } from '@/types/api.types';
import { AnnouncementDto, GetAnnouncementsInput, AnnouncementListResponse } from '@/types/announcement.types';

export const announcementService = {
  getAnnouncements: async (params: GetAnnouncementsInput, signal?: AbortSignal): Promise<AnnouncementListResponse> => {
    const query = new URLSearchParams();
    
    if (params.filter) query.append('Filter', params.filter);
    if (params.sorting) query.append('Sorting', params.sorting);
    if (params.skipCount !== undefined) query.append('SkipCount', params.skipCount.toString());
    if (params.maxResultCount !== undefined) {
      query.append('MaxResultCount', params.maxResultCount.toString());
    }

    const response = await api.get<AbpApiResponse<AnnouncementListResponse>>(
      `/api/services/app/Announcement/GetAll?${query.toString()}`,
      { signal }
    );

    return response.data.result;
  },

  getLatestAnnouncements: async (count: number = 5, signal?: AbortSignal): Promise<AnnouncementDto[]> => {
    const result = await announcementService.getAnnouncements(
      {
        sorting: 'DocDate desc',
        maxResultCount: count,
        skipCount: 0,
      },
      signal
    );

    return result.items;
  },
};
