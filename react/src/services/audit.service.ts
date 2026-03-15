import { api } from './api.service';

export interface MutationAuditLogDto {
  id: number;
  entityType: string;
  entityId: string;
  action: string;
  oldValueJson: string;
  newValueJson: string;
  userId: number | null;
  executionTime: string;
  methodName: string;
  extra: string;
}

export interface FinancialAuditLogDto {
  id: string;
  eventType: string;
  referenceType: string;
  referenceId: string;
  folioId: string;
  stayId: string | null;
  amount: number;
  description: string;
  userId: number | null;
  executionTime: string;
}

export interface GetMutationAuditLogInput {
  entityType?: string;
  entityId?: string;
  fromDate?: string;
  toDate?: string;
  skipCount?: number;
  maxResultCount?: number;
}

export interface GetFinancialAuditLogInput {
  eventType?: string;
  folioId?: string;
  stayId?: string;
  fromDate?: string;
  toDate?: string;
  skipCount?: number;
  maxResultCount?: number;
}

export interface PagedResultDto<T> {
  totalCount: number;
  items: T[];
}

export const auditService = {
  getMutationAuditPaged: async (
    input: GetMutationAuditLogInput
  ): Promise<PagedResultDto<MutationAuditLogDto>> => {
    const params: Record<string, string | number | undefined> = {
      SkipCount: input.skipCount ?? 0,
      MaxResultCount: input.maxResultCount ?? 50,
    };
    if (input.entityType) params.EntityType = input.entityType;
    if (input.entityId) params.EntityId = input.entityId;
    if (input.fromDate) params.FromDate = input.fromDate;
    if (input.toDate) params.ToDate = input.toDate;
    const res = await api.get<{ result: PagedResultDto<MutationAuditLogDto> }>(
      '/api/services/app/AuditTrail/GetMutationAuditPaged',
      { params }
    );
    return res.data.result;
  },

  getFinancialAuditPaged: async (
    input: GetFinancialAuditLogInput
  ): Promise<PagedResultDto<FinancialAuditLogDto>> => {
    const params: Record<string, string | number | undefined> = {
      SkipCount: input.skipCount ?? 0,
      MaxResultCount: input.maxResultCount ?? 50,
    };
    if (input.eventType) params.EventType = input.eventType;
    if (input.folioId) params.FolioId = input.folioId;
    if (input.stayId) params.StayId = input.stayId;
    if (input.fromDate) params.FromDate = input.fromDate;
    if (input.toDate) params.ToDate = input.toDate;
    const res = await api.get<{ result: PagedResultDto<FinancialAuditLogDto> }>(
      '/api/services/app/AuditTrail/GetFinancialAuditPaged',
      { params }
    );
    return res.data.result;
  },
};
