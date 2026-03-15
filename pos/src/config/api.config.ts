import { getBaseUrl } from '@/utils/baseUrl';

export const API_CONFIG = {
  baseURL: getBaseUrl(),
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
};

export const AUTH_STORAGE_KEY = 'simplesweldo_auth_token';
export const AUTH_EXPIRY_KEY = 'simplesweldo_auth_expiry';
/** Encrypted token for SignalR; backend expects query param ss_enc_auth_token */
export const ENCRYPTED_AUTH_STORAGE_KEY = 'ss_enc_auth_token';
