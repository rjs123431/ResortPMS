export interface GuestListDto {
  id: string;
  guestCode: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  nationality?: string;
  isActive: boolean;
  fullName: string;
}

export interface CreateGuestDto {
  guestCode: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  email?: string;
  phone: string;
  nationality?: string;
  notes?: string;
}

export interface GuestDto extends CreateGuestDto {
  id: string;
  isActive: boolean;
}
