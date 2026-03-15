export enum MissedPunchStatus {
  Pending = 1,
  Approved = 2,
  Declined = 3,
  Cancelled = 4,
}

export interface MyMissedPunchDto {
  id: number;
  employeeId: number;
  logDateTime: string;
  logState: number;
  remarks: string | null;
  tenantId: number;
  status: MissedPunchStatus;
  statusName: string;
  employeeCode: string;
  employeeName: string;
  viewOnly: boolean;
}

export interface MyMissedPunchListResponse {
  result: {
    items: MyMissedPunchDto[];
    totalCount: number;
  };
}

export interface ApplyMissedPunchLogDto {
  id: number;
  missedPunchRequestId: number;
  status: MissedPunchStatus;
  statusName?: string;
  remarks?: string | null;
  employeeId?: number | null;
  employeeName?: string | null;
  logMessages?: string | null;
  creationTime?: string | null;
}

export interface ApplyMissedPunchDto {
  id?: number;
  employeeId: number;
  logDateTime: string;
  logState: number;
  remarks: string;
  tenantId?: number;
  status?: MissedPunchStatus;
  statusName?: string;
  employeeName?: string;
  requestDate?: string | null;
  approver1Id?: number;
  approver2Id?: number;
  approver3Id?: number;
  approver1Name?: string;
  approver2Name?: string;
  approver3Name?: string;
  level?: number;
  logs?: ApplyMissedPunchLogDto[];
}
