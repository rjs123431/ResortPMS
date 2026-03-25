export interface LookupListDto {
  id: string;
  name: string;
  isActive: boolean;
}

export interface CreateLookupDto {
  name: string;
}

export interface LookupDto extends CreateLookupDto {
  id: string;
  isActive: boolean;
}
