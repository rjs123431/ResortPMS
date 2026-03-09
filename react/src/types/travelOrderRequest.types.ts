export enum TravelOrderStatus {
  Pending = 1,
  Approved = 2,
  Declined = 3,
  Cancelled = 4,
}

export interface MyTravelOrderRequestDto {
  id: number;
  employeeId: number;
  dateFrom: string;
  dateTo: string;
  noOfDays: number;
  remarks: string | null;
  isPaid: boolean;
  duration: number;
  status: TravelOrderStatus;
  statusName: string;
  employeeCode: string;
  employeeName: string;
  viewOnly: boolean;
}

export interface MyTravelOrderRequestListResult {
  items: MyTravelOrderRequestDto[];
  totalCount: number;
}

export interface ApplyTravelOrderRequestLogDto {
  id: number;
  travelOrderRequestId: number;
  status: TravelOrderStatus;
  statusName?: string;
  remarks?: string | null;
  employeeId?: number | null;
  employeeName?: string | null;
  substituteEmployeeId?: number | null;
  substituteEmployeeName?: string | null;
  creationTime?: string | null;
  logMessages?: string;
}

export interface TravelOrderRequestFileDto {
  id: number;
  travelOrderRequestId: number;
  binaryObjectId: string;
  fileName?: string | null;
  creationTime?: string | null;
}

export interface ApplyTravelOrderDto {
  id?: number;
  employeeId: number;
  dateFrom: string;
  dateTo: string;
  noOfDays: number;
  remarks: string;
  isPaid: boolean;
  duration: number;
  status?: TravelOrderStatus;
  statusName?: string;
  employeeName?: string;
  approver1Id?: number;
  approver2Id?: number;
  approver3Id?: number;
  approver1Name?: string;
  approver2Name?: string;
  approver3Name?: string;
  logs?: ApplyTravelOrderRequestLogDto[];
  files?: TravelOrderRequestFileDto[];
}

export interface ApproverInfoDto {
  level: number;
  approverEmployeeId: number;
  approverName: string;
}
