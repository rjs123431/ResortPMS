import { AbpApiResponse } from './api.types';

export interface User {
  id: number;
  name: string;
  surname: string;
  userName: string;
  emailAddress: string;
  employeeId: number | null;
  profilePictureFileObjectId: string | null;
}

export interface LoginCredentials {
  userNameOrEmailAddress: string;
  password: string;
  rememberClient?: boolean;
  returnUrl?: string;
  /** Device fingerprint for token binding; sent by the app automatically. */
  deviceFingerprint?: string;
  /** Device/platform name for the device list (e.g. "Windows", "Mac OS"). */
  deviceName?: string;
  /** Browser name for the device list (e.g. "Chrome", "Safari"). */
  browser?: string;
}

export interface AuthContextType {
  user: User | null;
  application: Application | null;
  tenant: Tenant | null;
  grantedPermissions: string[];
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<AuthResponse>;
  logout: () => void;
  isGranted: (permissionName: string) => boolean;
}

export interface AuthResult {
  accessToken: string;
  encryptedAccessToken: string;
  expireInSeconds: number;
  userId: number;
  returnUrl: string | null;
}

export type AuthResponse = AbpApiResponse<AuthResult>;

export interface Tenant {
  tenancyName: string;
  name: string;
  id: number;
}

export interface Application {
  version: string;
  releaseDate: string;
  features: Record<string, any>;
}

export interface SessionResult {
  application: Application;
  user: User | null;
  tenant: Tenant;
}

export type SessionResponse = AbpApiResponse<SessionResult>;

export interface UserConfigurationResult {
  auth?: {
    grantedPermissions?: string[] | Record<string, boolean>;
  };
}

export type UserConfigurationResponse = AbpApiResponse<UserConfigurationResult>;

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}
