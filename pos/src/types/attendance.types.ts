export interface AttendanceLogDto {
  id: number;
  employeeId: number;
  employeeCode?: string;
  employeeName?: string;
  biometricsId?: string;
  logDateTime: string;
  logState: number;
  originalLogDateTime?: string;
  originalLogState?: number;
  isMissedPunch: boolean;
  remarks?: string;
  isUsed?: boolean;
  locationId?: number;
}

export interface GetAttendanceLogsByUserInput {
  dateFrom: string;
  dateTo: string;
  filter?: string;
  sorting?: string;
  skipCount: number;
  maxResultCount: number;
}

export interface PagedResultDto<T> {
  items: T[];
  totalCount: number;
}
