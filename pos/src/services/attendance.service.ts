import { api } from './api.service';
import type {
  GetAttendanceLogsByUserInput,
  PagedResultDto,
  AttendanceLogDto,
} from '@/types/attendance.types';

export const attendanceService = {
  getAllByUser: async (input: GetAttendanceLogsByUserInput, signal?: AbortSignal) => {
    const response = await api.get<{ result: PagedResultDto<AttendanceLogDto> }>(
      '/api/services/app/AttendanceLog/GetAllByUser',
      {
        params: {
          DateFrom: input.dateFrom,
          DateTo: input.dateTo,
          Filter: input.filter ?? '',
          Sorting: input.sorting ?? 'LogDateTime DESC',
          SkipCount: input.skipCount,
          MaxResultCount: input.maxResultCount,
        },
        signal,
      }
    );
    return response.data;
  },
};
