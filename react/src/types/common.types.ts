export interface PagedResultDto<T> {
  totalCount: number;
  items: T[];
}

export interface ApiResponse<T> {
  result: T;
}
