export enum FormType {
  Leave = 1,
  Overtime = 2,
  Undertime = 3,
  ChangeInfoRequest = 6,
  MissedPunch = 13,
  TravelOrder = 14,
}

export interface ApprovalItemDto {
  id: number;
  employeeName: string;
  formType: string;
  formTypeName: string;
  status: number;
  statusName: string;
  requestDate: string;
  details: string;
}

export interface ApprovalListResult {
  items: ApprovalItemDto[];
  totalCount: number;
}

export interface ApprovalListResponse {
  result: ApprovalListResult;
}

export interface ApprovalCountByFormTypeDto {
  formType: FormType;
  formTypeName: string;
  count: number;
}

export interface ApprovalCountByFormTypeResponse {
  result: ApprovalCountByFormTypeDto[];
}
