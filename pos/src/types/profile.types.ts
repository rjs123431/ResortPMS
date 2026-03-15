import { AbpApiResponse } from './api.types';

export enum Gender {
  Male = 1,
  Female = 2,
}

export enum MaritalStatus {
  Single = 1,
  Married = 2,
  Widowed = 3,
  Separated = 4,
  Divorced = 5,
}

export enum PaymentMethod {
  Cash = 1,
  Check = 2,
  BankTransfer = 3,
}

export enum EmploymentStatus {
  Active = 1,
  Resigned = 2,
  Terminated = 3,
  Retired = 4,
}

export enum EmploymentType {
  Regular = 1,
  Probationary = 2,
  Contractual = 3,
  ProjectBased = 4,
}

export interface EmployeeSalaryDto {
  effectiveDate: string;
  rate: number;
  salaryTypeName: string;
}

export interface EmployeeBankDto {
  bankAccountId: number;
  bankAccountName: string;
  accountNumber: string;
  isActive: boolean;
}

export interface EmployeeDependentDto {
  fullName: string;
  dateOfBirth: string;
  relationship: string;
}

export interface DocumentDto {
  id: number;
  fileName: string;
  fileType: string;
  binaryObjectId: string;
}

export interface MyProfileDto {
  employeeId?: number;
  code?: string;
  lastName?: string;
  firstName?: string;
  middleName?: string;
  departmentName?: string;
  jobTitleName?: string;
  branchName?: string;
  biometricsId?: string;
  isDTRExempt: boolean;
  isNoWorkNoPay: boolean;
  managerName?: string;
  payrollGroupName?: string;
  dateHired?: string;
  dateEnd?: string;
  employmentStatus: EmploymentStatus;
  employmentStatusName?: string;
  employmentType: EmploymentType;
  employmentTypeName?: string;
  paymentMethod: PaymentMethod;
  paymentMethodName?: string;
  defaultShiftGroupName?: string;
  dateOfBirth?: string;
  placeOfBirth?: string;
  gender: Gender;
  genderName?: string;
  maritalStatus: MaritalStatus;
  maritalStatusName?: string;
  spouseName?: string;
  bloodType?: string;
  motherMaidenName?: string;
  presentAddress?: string;
  permanentAddress?: string;
  email?: string;
  personalEmail?: string;
  mobileNumber?: string;
  telephoneNumber?: string;
  contactPersonName?: string;
  contactPersonRelation?: string;
  contactPersonNumber?: string;
  profilePictureFileObjectId?: string | null;
  sssNumber?: string;
  phicNumber?: string;
  hdmfNumber?: string;
  tin?: string;
  salaries?: EmployeeSalaryDto[];
  bankAccounts?: EmployeeBankDto[];
  dependents?: EmployeeDependentDto[];
}

export interface DocumentListResult {
  items: DocumentDto[];
}

export type ProfileResponse = AbpApiResponse<MyProfileDto>;
export type DocumentListResponse = AbpApiResponse<DocumentListResult>;
