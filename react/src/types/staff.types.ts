export interface CreateStaffDto {
  staffCode: string;
  fullName: string;
  department?: string;
  position?: string;
  phoneNumber?: string;
}

export interface StaffDto extends CreateStaffDto {
  id: string;
  isActive: boolean;
}

export interface StaffListDto {
  id: string;
  staffCode: string;
  fullName: string;
  department?: string;
  position?: string;
  phoneNumber?: string;
  isActive: boolean;
}
