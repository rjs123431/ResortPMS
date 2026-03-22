import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { API_CONFIG, AUTH_STORAGE_KEY, AUTH_EXPIRY_KEY } from '@config/api.config';
import { getDeviceFingerprint } from '@utils/deviceFingerprint';
import { showErrorDialog } from '@utils/alerts';
import { getAbpErrorMessage, getAbpValidationMap } from '@utils/abpValidation';

type AbpErrorPayload = {
  error?: {
    message?: string;
    details?: string;
    validationErrors?: Array<{ message?: string; members?: string[] }>;
  };
  __abp?: boolean;
};

class ApiService {
  private api: AxiosInstance;
  private isShowingErrorDialog = false;

  constructor() {
    this.api = axios.create({
      baseURL: API_CONFIG.baseURL,
      timeout: API_CONFIG.timeout,
      headers: API_CONFIG.headers,
    });

    this.setupInterceptors();
  }

  private isTokenExpired(): boolean {
    const expiry = localStorage.getItem(AUTH_EXPIRY_KEY);
    if (!expiry) return true;
    return Date.now() >= parseInt(expiry, 10);
  }

  private clearAuthData(): void {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(AUTH_EXPIRY_KEY);
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem(AUTH_STORAGE_KEY);
        
        if (token) {
          // Check if token is expired before adding it to the request
          if (this.isTokenExpired()) {
            this.clearAuthData();
            window.location.href = '/login';
            return Promise.reject(new Error('Token expired'));
          }

          if (config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
            config.headers['X-Device-Fingerprint'] = getDeviceFingerprint();
          }
        }
        
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        // Request cancellations are expected in some flows (navigation/refetch),
        // so they should not surface as user-facing errors.
        if (axios.isCancel(error) || error?.code === 'ERR_CANCELED') {
          return Promise.reject(error);
        }

        if (error.response?.status === 401) {
          // Redirect to login on 401
          this.clearAuthData();
          window.location.href = '/login';
          return Promise.reject(error);
        }

        if (error.response?.status === 400) {
          const responseData = error?.response?.data as AbpErrorPayload | undefined;
          if (responseData?.__abp || responseData?.error) {
            const normalizedMessage = getAbpErrorMessage(error);
            const validationMap = getAbpValidationMap(error);

            (error as Error & { validationMap?: Record<string, string[]> }).message = normalizedMessage;
            (error as Error & { validationMap?: Record<string, string[]> }).validationMap = validationMap;
          }

          return Promise.reject(error);
        }

        // Show global error dialog only for server errors.
        if (error.response?.status !== 500) {
          return Promise.reject(error);
        }

        const messageToShow = getAbpErrorMessage(error);

        if (!this.isShowingErrorDialog && messageToShow) {
          this.isShowingErrorDialog = true;
          try {
            await showErrorDialog(messageToShow, 'Request Failed');
          } finally {
            this.isShowingErrorDialog = false;
          }
        }

        return Promise.reject(error);
      }
    );
  }

  public getApi(): AxiosInstance {
    return this.api;
  }
}

export const apiService = new ApiService();
export const api = apiService.getApi();
