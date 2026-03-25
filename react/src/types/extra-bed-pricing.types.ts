/** One date-effective pricing row for an extra-bed type. */
export interface ExtraBedPriceDto {
  id: string;
  extraBedTypeId: string;
  extraBedTypeName: string;
  ratePerNight: number;
  effectiveFrom: string;
  effectiveTo?: string;
  isActive: boolean;
}

/** Current (date-resolved) rate for a single extra-bed type. */
export interface ExtraBedCurrentPriceDto {
  extraBedTypeId: string;
  extraBedTypeName: string;
  ratePerNight: number;
}

export interface CreateExtraBedPriceDto {
  extraBedTypeId: string;
  ratePerNight: number;
  effectiveFrom: string;
  effectiveTo?: string;
}

export interface UpdateExtraBedPriceDto extends CreateExtraBedPriceDto {
  id: string;
  isActive: boolean;
}
