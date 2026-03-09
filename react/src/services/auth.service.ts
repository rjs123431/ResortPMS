import axios from 'axios';
import { api } from './api.service';
import {
  LoginCredentials,
  AuthResponse,
  User,
  SessionResponse,
  ChangePasswordRequest,
  Application,
  UserConfigurationResponse,
} from '../types/auth.types';
import { ImpersonateRequest, ImpersonateResult, ImpersonatedAuthenticateResult } from '../types/impersonation.types';
import { API_CONFIG, AUTH_STORAGE_KEY, AUTH_EXPIRY_KEY, ENCRYPTED_AUTH_STORAGE_KEY } from '@config/api.config';
import { getDeviceFingerprint, getDeviceName, getBrowser } from '@utils/deviceFingerprint';

export const authService = {
  decodeTokenPayload: (token: string): Record<string, any> | null => {
    try {
      const payload = token.split('.')[1];
      if (!payload) {
        return null;
      }

      const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
      const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
      const decoded = atob(padded);
      return JSON.parse(decoded);
    } catch {
      return null;
    }
  },

  getImpersonatorUserId: (): number | null => {
    const token = authService.getToken();
    if (!token) {
      return null;
    }

    const payload = authService.decodeTokenPayload(token);
    if (!payload) {
      return null;
    }

    const claimKeys = [
      'impersonatorUserId',
      'http://www.aspnetboilerplate.com/identity/claims/impersonatorUserId',
    ];

    for (const key of claimKeys) {
      const value = payload[key];
      if (value !== undefined && value !== null) {
        const numeric = Number(value);
        return Number.isFinite(numeric) ? numeric : null;
      }
    }

    return null;
  },

  setAuthToken: (accessToken: string, expireInSeconds: number, encryptedAccessToken?: string): void => {
    localStorage.setItem(AUTH_STORAGE_KEY, accessToken);
    localStorage.setItem(AUTH_EXPIRY_KEY, (Date.now() + expireInSeconds * 1000).toString());
    if (encryptedAccessToken) {
      localStorage.setItem(ENCRYPTED_AUTH_STORAGE_KEY, encryptedAccessToken);
    }
  },

  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const payload = {
      ...credentials,
      deviceFingerprint: credentials.deviceFingerprint ?? getDeviceFingerprint(),
      deviceName: credentials.deviceName ?? getDeviceName(),
      browser: credentials.browser ?? getBrowser(),
    };
    const response = await api.post<AuthResponse>('/api/tokenauth/authenticate', payload);
    
    if (response.data.result.accessToken) {
      localStorage.setItem(AUTH_STORAGE_KEY, response.data.result.accessToken);
      const expiryTime = Date.now() + (response.data.result.expireInSeconds * 1000);
      localStorage.setItem(AUTH_EXPIRY_KEY, expiryTime.toString());
      if (response.data.result.encryptedAccessToken) {
        localStorage.setItem(ENCRYPTED_AUTH_STORAGE_KEY, response.data.result.encryptedAccessToken);
      }
    }
    
    return response.data;
  },

  logout: (): void => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(AUTH_EXPIRY_KEY);
    localStorage.removeItem(ENCRYPTED_AUTH_STORAGE_KEY);
  },

  getSessionInfo: async (): Promise<SessionResponse> => {
    const response = await api.get<SessionResponse>('/api/services/app/Session/GetCurrentLoginInformations');
    return response.data;
  },

  /** Get application info (e.g. version) from GetCurrentLoginInformations. Works when anonymous if backend allows. */
  getApplicationInfo: async (): Promise<Application | null> => {
    try {
      const response = await api.get<SessionResponse>('/api/services/app/Session/GetCurrentLoginInformations');
      return response.data.result?.application ?? null;
    } catch {
      console.warn('Failed to fetch application info. Server might be unreachable.');
      return null;
    }
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get<SessionResponse>('/api/services/app/Session/GetCurrentLoginInformations');
    if (!response.data.result.user) {
      throw new Error('User not found in session');
    }
    return response.data.result.user;
  },

  getGrantedPermissions: async (): Promise<string[]> => {
    const response = await api.get<UserConfigurationResponse>('/AbpUserConfiguration/GetAll');
    const granted = response.data.result?.auth?.grantedPermissions;

    if (!granted) {
      return [];
    }

    if (Array.isArray(granted)) {
      return granted;
    }

    return Object.keys(granted).filter((key) => Boolean(granted[key]));
  },

  isTokenExpired: (): boolean => {
    const expiry = localStorage.getItem(AUTH_EXPIRY_KEY);
    if (!expiry) return true;
    
    return Date.now() >= parseInt(expiry, 10);
  },

  isAuthenticated: (): boolean => {
    const hasToken = !!localStorage.getItem(AUTH_STORAGE_KEY);
    
    if (!hasToken) return false;
    
    // Check if token is expired
    if (authService.isTokenExpired()) {
      authService.logout();
      return false;
    }
    
    return true;
  },

  getToken: (): string | null => {
    return localStorage.getItem(AUTH_STORAGE_KEY);
  },

  /** Encrypted token used by SignalR (AbpCommonHub) via query string ss_enc_auth_token */
  getEncryptedToken: (): string | null => {
    return localStorage.getItem(ENCRYPTED_AUTH_STORAGE_KEY);
  },

  changePassword: async (data: ChangePasswordRequest): Promise<void> => {
    await api.post('/api/services/app/User/ChangePassword', data);
  },

  sendPasswordResetCode: async (emailAddress: string): Promise<void> => {
    await api.post('/api/services/app/Account/SendPasswordResetCode', { emailAddress });
  },

  impersonate: async (request: ImpersonateRequest): Promise<ImpersonateResult> => {
    const response = await api.post<ImpersonateResult | { result: ImpersonateResult }>(
      '/api/services/app/Account/Impersonate',
      request
    );

    if ('result' in response.data) {
      return response.data.result;
    }

    return response.data;
  },

  impersonatedAuthenticate: async (impersonationToken: string): Promise<ImpersonatedAuthenticateResult> => {
    const headers = {
      ...API_CONFIG.headers,
      'X-Device-Fingerprint': getDeviceFingerprint(),
      'X-Device-Name': getDeviceName(),
      'X-Device-Browser': getBrowser(),
    };
    const response = await axios.post<ImpersonatedAuthenticateResult | { result: ImpersonatedAuthenticateResult }>(
      `${API_CONFIG.baseURL}/api/TokenAuth/ImpersonatedAuthenticate`,
      null,
      {
        params: { impersonationToken },
        timeout: API_CONFIG.timeout,
        headers,
      }
    );
    if ('result' in response.data) {
      return response.data.result;
    }

    return response.data;
  },

  backToImpersonator: async (): Promise<ImpersonateResult> => {
    const response = await api.post<ImpersonateResult | { result: ImpersonateResult }>(
      '/api/services/app/Account/BackToImpersonator'
    );

    if ('result' in response.data) {
      return response.data.result;
    }

    return response.data;
  },
};
