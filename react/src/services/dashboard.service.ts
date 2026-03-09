import { api } from './api.service';
import { DashboardEventsDto, DashboardBirthdaysDto, DashboardMetricsDto } from '@/types/dashboard.types';
import { AbpApiResponse } from '@/types/api.types';

export const dashboardService = {
  /**
   * Get dashboard events (holidays, payroll dates, and events) for a date range
   */
  async getEvents(startDate: Date, endDate: Date, signal?: AbortSignal): Promise<DashboardEventsDto[]> {
    const query = new URLSearchParams();
    query.append('StartDate', startDate.toISOString());
    query.append('EndDate', endDate.toISOString());

    const response = await api.get<AbpApiResponse<{ items: DashboardEventsDto[] }>>(
      `/api/services/app/Dashboard/GetEvents?${query.toString()}`,
      { signal }
    );

    return response.data.result.items;
  },

  /**
   * Get upcoming birthdays
   */
  async getBirthdays(signal?: AbortSignal): Promise<DashboardBirthdaysDto[]> {
    const response = await api.get<AbpApiResponse<{ items: DashboardBirthdaysDto[] }>>(
      '/api/services/app/Dashboard/GetBirthdays',
      { signal }
    );

    return response.data.result.items;
  },

  /**
   * Get dashboard metrics
   */
  async getMetrics(signal?: AbortSignal): Promise<DashboardMetricsDto> {
    const response = await api.get<AbpApiResponse<DashboardMetricsDto>>(
      '/api/services/app/Dashboard/GetDashboardMetrics',
      { signal }
    );

    return response.data.result;
  },
};
