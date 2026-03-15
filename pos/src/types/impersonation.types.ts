import { AbpApiResponse } from './api.types';

export interface ImpersonateRequest {
  userId: number;
  tenantId?: number | null;
}

export interface ImpersonateResult {
  impersonationToken: string;
  tenancyName?: string | null;
}

export type ImpersonateResponse = AbpApiResponse<ImpersonateResult> | ImpersonateResult;

export interface ImpersonatedAuthenticateResult {
  accessToken: string;
  encryptedAccessToken: string;
  expireInSeconds: number;
}
