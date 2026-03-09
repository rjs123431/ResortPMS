export enum HolidayType {
  Legal = 1,
  Special = 2,
  Company = 3,
}

export interface HolidayDto {
  id: number;
  name: string;
  date: string;
  type: HolidayType;
  typeName: string;
  allLocations: boolean;
  regularOnly: boolean;
  allEmployees: boolean;
  locationNames?: string;
}

export interface GetHolidaysInput {
  filter?: string;
  sorting?: string;
  skipCount?: number;
  maxResultCount?: number;
}

export interface HolidayListResponse {
  totalCount: number;
  items: HolidayDto[];
}
