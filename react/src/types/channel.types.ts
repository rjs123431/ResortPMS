export interface ChannelListDto {
  id: string;
  name: string;
  icon?: string;
  sort: number;
  isActive: boolean;
}

export interface CreateChannelDto {
  name: string;
  icon?: string;
  sort: number;
}

export interface ChannelDto extends CreateChannelDto {
  id: string;
  isActive: boolean;
}
