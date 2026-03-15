export interface LeaveTransaction {
  id: number;
  employeeId: number;
  employeeCode: string;
  employeeName: string;
  leaveTypeId: number;
  leaveTypeName: string;
  date: string;
  startTime: string | null;
  endTime: string | null;
  noOfHours: number;
  noOfDays: number;
  remarks: string;
  dateFiled: string | null;
  isPaid: boolean;
  batchId: string;
}

export interface LeaveDetailsOutput {
  employeeId: number;
  employeeCode: string;
  employeeName: string;
  leaveTransactions: LeaveTransaction[];
}

export interface LeaveDetailsResponse {
  result: LeaveDetailsOutput;
}

export interface LeaveCredit {
  leaveTypeId: number;
  leaveTypeName: string;
  credits: number;
  transactions: LeaveTransaction[];
}

export enum LeaveStatus {
  Pending = 1,
  Approved = 2,
  Declined = 3,
  Cancelled = 4,
}

export interface MyLeaveDto {
  id: number;
  employeeId: number;
  leaveTypeId: number;
  dateFrom: string;
  dateTo: string;
  startTime: string | null;
  endTime: string | null;
  noOfHours: number;
  noOfDays: number;
  remarks: string | null;
  status: LeaveStatus;
  statusName: string;
  employeeCode: string;
  employeeName: string;
  leaveTypeName: string;
  viewOnly: boolean;
}

export interface MyLeaveListResponse {
  result: {
    items: MyLeaveDto[];
    totalCount: number;
  };
}

export interface LeaveTypeDto {
  id: number;
  name: string;
  isPaid: boolean;
  creditRequired: boolean;
  includeRestDay: boolean;
  includeHoliday: boolean;
  defaultNoOfDays: number;
  forOpenLeave: boolean;
}

export interface ApproverInfoDto {
  level: number;
  approverEmployeeId: number;
  approverName: string;
}

export interface ApplyLeaveRequestLogDto {
  id: number;
  leaveRequestId: number;
  status: LeaveStatus;
  statusName?: string;
  remarks?: string | null;
  employeeId?: number | null;
  employeeName?: string | null;
  substituteEmployeeId?: number | null;
  substituteEmployeeName?: string | null;
  creationTime?: string | null;
}

export interface LeaveRequestFileDto {
  id: number;
  leaveRequestId: number;
  binaryObjectId: string;
  fileName?: string | null;
  creationTime?: string | null;
}

export interface ApplyLeaveDto {
  id?: number;
  employeeId: number;
  leaveTypeId: number;
  dateFrom: string;
  dateTo: string;
  startTime: string | null;
  endTime: string | null;
  noOfHours: number;
  noOfDays: number;
  remarks: string;
  status?: LeaveStatus;
  statusName?: string;
  employeeName?: string;
  leaveTypeName?: string;
  isPaid: boolean;
  dayType: number;
  duration: number;
  approver1Id?: number;
  approver2Id?: number;
  approver3Id?: number;
  approver1Name?: string;
  approver2Name?: string;
  approver3Name?: string;
  logs?: ApplyLeaveRequestLogDto[];
  files?: LeaveRequestFileDto[];
}

export interface LeaveBalanceResponse {
  result: {
    balance: number;
    pendingRequests?: number;
    totalCredits?: number;
    leaveTypeName?: string;
    year?: number;
  };
}
