import { api } from './api.service';
import { GetMyPayslipsInput, PagedResultDto, MyPayslipListDto } from '@/types/payslip.types';

export const payslipService = {
  getAll: async (input: GetMyPayslipsInput, signal?: AbortSignal) => {
    const response = await api.get<{ result: PagedResultDto<MyPayslipListDto> }>(
      '/api/services/app/MyPayslip/GetAll',
      {
        params: {
          Sorting: input.sorting || 'PayDate DESC',
          SkipCount: input.skipCount,
          MaxResultCount: input.maxResultCount,
          ...(typeof input.year === 'number' ? { Year: input.year } : {}),
        },
        signal,
      }
    );
    return response.data;
  },
};
