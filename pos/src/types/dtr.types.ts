/** Summary row for My DTR list (one per payroll schedule per employee) */
export interface MyDTRSummaryDto {
  employeeId: number;
  payrollScheduleId: number;
  payrollScheduleName: string;
  payDate: string;
  employeeCode?: string;
  employeeName: string;
  biometricsId?: string;
  regHours: number;
  tardy: number;
  undertime: number;
  overtime: number;
}

export interface GetMyDTRSummaryInput {
  payrollScheduleId?: number;
  type?: string;
  filter?: string;
  sorting?: string;
  year?: number;
  skipCount: number;
  maxResultCount: number;
}

export interface PagedResultDto<T> {
  items: T[];
  totalCount: number;
}

export interface ListResultDto<T> {
  items: T[];
}

/** Single day row for DTR detail */
export interface DTRDto {
  id: number;
  payrollScheduleId: number;
  employeeId: number;
  shiftId: number;
  departmentId?: number;
  shiftName: string;
  shiftTimeIn?: string;
  shiftTimeOut?: string;
  shiftBreakStart?: string;
  shiftBreakEnd?: string;
  employeeName?: string;
  dayType: number;
  dateFrom: string;
  dateTo: string;
  logIn1?: string;
  logOut1?: string;
  logIn2?: string;
  logOut2?: string;
  logIn3?: string;
  logOut3?: string;
  logIn4?: string;
  logOut4?: string;
  logIn5?: string;
  logOut5?: string;
  logIn6?: string;
  logOut6?: string;
  requiredHours: number;
  regularHours: number;
  minutesTardy: number;
  minutesUndertime: number;
  oTHours: number;
  actualOTHours: number;
  pendingRestDayHours: number;
  restDayOvertimeId?: number;
  pendingOTHours: number;
  overtimeId?: number;
  nightHours: number;
  nightOTHours?: number;
  overrideNightHours?: boolean;
  wfhHours?: number;
  offsetHours?: number;
  officialBusinessLabel?: string;
  isRestDay: boolean;
  isAbsent: boolean;
  isLocked: boolean;
  isOnLeave: boolean;
  isOnTravel: boolean;
  isCompanyHoliday: boolean;
  leaveTypeName?: string;
  leaveHours: number;
  unpaidLeaveHours: number;
  dtrLocations?: DTRLocationDto[];
}

export interface DTRLocationDto {
  id: number;
  dtrId: number;
  locationId: number;
  noOfHours: number;
  remarks?: string;
  locationName?: string;
}

export interface PayrollScheduleDto {
  id: number;
  name: string;
  payDate: string;
  payrollGroupId?: number;
  startDate?: string;
  endDate?: string;
  status?: number;
}
