import { api } from './api.service';
import { AbpApiResponse } from '@/types/api.types';
import {
  GetNotificationsOutput,
  DeleteAllUserNotificationsInput,
  GuidEntityDto,
  UserNotificationState
} from '@/types/notification.types';

export const notificationService = {
  getUserNotifications: async (
    state?: UserNotificationState,
    startDate?: string,
    endDate?: string,
    maxResultCount: number = 5,
    skipCount: number = 0,
    signal?: AbortSignal
  ): Promise<GetNotificationsOutput> => {
    const params: any = {
      MaxResultCount: maxResultCount,
      SkipCount: skipCount,
    };

    if (state !== undefined) {
      params.State = state;
    }
    if (startDate) {
      params.StartDate = startDate;
    }
    if (endDate) {
      params.EndDate = endDate;
    }

    const response = await api.get<AbpApiResponse<GetNotificationsOutput>>(
      '/api/services/app/Notification/GetUserNotifications',
      { params, signal }
    );

    return response.data.result;
  },

  setNotificationAsRead: async (input: GuidEntityDto): Promise<void> => {
    await api.post<AbpApiResponse<void>>(
      '/api/services/app/Notification/SetNotificationAsRead',
      input
    );
  },

  setAllNotificationsAsRead: async (): Promise<void> => {
    await api.post<AbpApiResponse<void>>(
      '/api/services/app/Notification/SetAllNotificationsAsRead'
    );
  },

  deleteNotification: async (id: string): Promise<void> => {
    await api.delete<AbpApiResponse<void>>(
      `/api/services/app/Notification/DeleteNotification?Id=${id}`
    );
  },

  deleteAllUserNotifications: async (
    state?: UserNotificationState,
    startDate?: string,
    endDate?: string
  ): Promise<void> => {
    const params: DeleteAllUserNotificationsInput = {};

    if (state !== undefined) {
      params.state = state;
    }
    if (startDate) {
      params.startDate = startDate;
    }
    if (endDate) {
      params.endDate = endDate;
    }

    await api.delete<AbpApiResponse<void>>(
      '/api/services/app/Notification/DeleteAllUserNotifications',
      { data: params }
    );
  },
};
