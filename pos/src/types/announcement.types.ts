export interface AnnouncementDto {
  id: number;
  docDate: string;
  title: string;
  description: string;
  fileObjectId?: string;
}

export interface GetAnnouncementsInput {
  filter?: string;
  sorting?: string;
  skipCount?: number;
  maxResultCount?: number;
}

export interface AnnouncementListResponse {
  totalCount: number;
  items: AnnouncementDto[];
}
