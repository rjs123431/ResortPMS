export interface MyPayslipListDto {
  id: number;
  payDate: string;
  netPay: number;
  payslipFileObjectId?: string;
}

export interface GetMyPayslipsInput {
  sorting?: string;
  year?: number;
  skipCount: number;
  maxResultCount: number;
}

export interface PagedResultDto<T> {
  items: T[];
  totalCount: number;
}
