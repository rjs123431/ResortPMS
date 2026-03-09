import { api } from './api.service';
import { AbpApiResponse } from '@/types/api.types';
import { HolidayDto, GetHolidaysInput, HolidayListResponse } from '@/types/holiday.types';

export const holidayService = {
  getHolidays: async (params: GetHolidaysInput, signal?: AbortSignal): Promise<HolidayListResponse> => {
    const query = new URLSearchParams();
    
    if (params.filter) query.append('Filter', params.filter);
    if (params.sorting) query.append('Sorting', params.sorting);
    if (params.skipCount !== undefined) query.append('SkipCount', params.skipCount.toString());
    if (params.maxResultCount !== undefined) {
      query.append('MaxResultCount', params.maxResultCount.toString());
    }

    const response = await api.get<AbpApiResponse<HolidayListResponse>>(
      `/api/services/app/Holiday/GetAll?${query.toString()}`,
      { signal }
    );

    return response.data.result;
  },

  getUpcomingHolidays: async (days: number = 30, signal?: AbortSignal): Promise<HolidayDto[]> => {
    const response = await api.get<AbpApiResponse<HolidayListResponse>>(
      `/api/services/app/Holiday/GetUpcoming?days=${days}`,
      { signal }
    );

    return response.data.result.items;
  },
};
