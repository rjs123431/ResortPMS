export enum OvertimeStatus {
  Pending = 1,
  Approved = 2,
  Declined = 3,
  Cancelled = 4,
}

export interface MyOvertimeDto {
  id: number;
  employeeId: number;
  date: string;
  startTime: string | null;
  endTime: string | null;
  noOfHours: number;
  remarks: string | null;
  tenantId: number;
  status: OvertimeStatus;
  statusName: string;
  employeeCode: string;
  employeeName: string;
  viewOnly: boolean;
}

export interface MyOvertimeListResponse {
  result: {
    items: MyOvertimeDto[];
    totalCount: number;
  };
}

export interface ApplyOvertimeLogDto {
  id: number;
  overtimeRequestId: number;
  status: OvertimeStatus;
  statusName?: string;
  remarks?: string | null;
  employeeId?: number | null;
  employeeName?: string | null;
  logMessages?: string | null;
  creationTime?: string | null;
}

export interface ApplyOvertimeDto {
  id?: number;
  employeeId: number;
  date: string;
  startTime: string | null;
  endTime: string | null;
  noOfHours: number;
  remarks: string;
  tenantId?: number;
  status?: OvertimeStatus;
  statusName?: string;
  isPreShift?: boolean;
  employeeName?: string;
  approver1Id?: number;
  approver2Id?: number;
  approver3Id?: number;
  approver1Name?: string;
  approver2Name?: string;
  approver3Name?: string;
  logs?: ApplyOvertimeLogDto[];
}
