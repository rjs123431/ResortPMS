export interface RoleDto {
  id: number;
  name: string;
  displayName: string;
  normalizedName: string;
  description?: string;
}

export interface RoleListResponse {
  result: {
    items: RoleDto[];
  };
}
