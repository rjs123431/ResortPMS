import { api } from './api.service';
import type {
  GetMyDTRSummaryInput,
  PagedResultDto,
  MyDTRSummaryDto,
  ListResultDto,
  DTRDto,
  PayrollScheduleDto,
} from '@/types/dtr.types';

export const dtrService = {
  getDtrSummary: async (input: GetMyDTRSummaryInput, signal?: AbortSignal) => {
    const response = await api.get<{ result: PagedResultDto<MyDTRSummaryDto> }>(
      '/api/services/app/MyDtr/GetDtrSummary',
      {
        params: {
          PayrollScheduleId: input.payrollScheduleId ?? 0,
          Type: input.type ?? '',
          Filter: input.filter ?? '',
          Sorting: input.sorting ?? 'PayDate desc',
          SkipCount: input.skipCount,
          MaxResultCount: input.maxResultCount,
          ...(typeof input.year === 'number' ? { Year: input.year } : {}),
        },
        signal,
      }
    );
    return response.data;
  },

  getAll: async (payScheduleId: number, signal?: AbortSignal) => {
    const response = await api.get<{ result: ListResultDto<DTRDto> }>(
      '/api/services/app/MyDtr/GetAll',
      {
        params: {
          PayScheduleId: payScheduleId,
        },
        signal,
      }
    );
    return response.data;
  },
};

export const payrollScheduleService = {
  getList: async (status?: number, payrollGroupId?: number, signal?: AbortSignal) => {
    const response = await api.get<{ result: ListResultDto<PayrollScheduleDto> }>(
      '/api/services/app/PayrollSchedule/GetList',
      {
        params: {
          Status: status,
          PayrollGroupId: payrollGroupId,
        },
        signal,
      }
    );
    return response.data;
  },
};
