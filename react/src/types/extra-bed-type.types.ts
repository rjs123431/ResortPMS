export interface CreateExtraBedTypeDto {
  name: string;
}

export interface ExtraBedTypeDto extends CreateExtraBedTypeDto {
  id: string;
  isActive: boolean;
}

export interface ExtraBedTypeListDto {
  id: string;
  name: string;
  isActive: boolean;
}
