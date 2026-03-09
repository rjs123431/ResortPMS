import { api } from './api.service';

export interface UserSessionDto {
  id: number;
  deviceName: string;
  browser: string;
  location: string;
  firstLoginAt: string;
  lastActivityAt: string;
  isCurrent: boolean;
  /** Set when this session was created via impersonation. */
  impersonatorUserId?: number | null;
}

interface GetMySessionsResponse {
  result?: UserSessionDto[];
}

export const userSessionService = {
  getMySessions: async (deviceFingerprint?: string): Promise<UserSessionDto[]> => {
    const params = deviceFingerprint ? { deviceFingerprint } : {};
    const response = await api.get<GetMySessionsResponse>('/api/services/app/UserSession/GetMySessions', {
      params,
    });
    const data = response.data as GetMySessionsResponse;
    return data.result ?? [];
  },

  revokeSession: async (sessionId: number): Promise<void> => {
    await api.post('/api/services/app/UserSession/RevokeSession', { sessionId });
  },
};
