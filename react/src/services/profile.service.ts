import { api } from './api.service';
import { ProfileResponse, DocumentListResponse } from '@/types/profile.types';

export const profileService = {
  getProfile: async (signal?: AbortSignal): Promise<ProfileResponse> => {
    const response = await api.get<ProfileResponse>('/api/services/app/MyProfile/GetProfile', { signal });
    return response.data;
  },

  getDocuments: async (signal?: AbortSignal): Promise<DocumentListResponse> => {
    const response = await api.get<DocumentListResponse>('/api/services/app/MyProfile/GetDocuments', { signal });
    return response.data;
  },

  getProfilePicture: async (id: string, signal?: AbortSignal): Promise<string> => {
    const response = await api.get<string>('/api/services/app/Employee/GetProfilePicture', {
      params: { id },
      signal,
    });
    return response.data;
  },

  getProfilePictureUrl: (employeeId?: number): string => {
    if (!employeeId) return '/assets/img/user.png';
    return `/api/services/app/Profile/GetProfilePictureByEmployee?employeeId=${employeeId}`;
  },
};
