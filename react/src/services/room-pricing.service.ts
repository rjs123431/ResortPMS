import { api } from './api.service';
import { ApiResponse, RoomTypeRatePlanOptionDto } from '@/types/resort.types';

export const roomPricingService = {
  getRoomTypeRatePlanOptions: async (
    roomTypeId: string,
    arrivalDate: string,
    departureDate: string,
    channelId?: string,
  ) => {
    const params: Record<string, string> = {
      RoomTypeId: roomTypeId,
      ArrivalDate: arrivalDate,
      DepartureDate: departureDate,
    };

    if (channelId && channelId.length > 0) {
      params.ChannelId = channelId;
    }

    const response = await api.get<ApiResponse<RoomTypeRatePlanOptionDto[]>>(
      '/api/services/app/RoomPricing/GetRatePlanOptions',
      { params },
    );
    return response.data.result;
  },

  getEffectiveRatePerNight: async (
    roomTypeId: string,
    arrivalDate: string,
    departureDate: string,
    channelId?: string,
  ) => {
    const params: Record<string, string> = {
      roomTypeId,
      arrivalDate,
      departureDate,
    };
    if (channelId) params.channelId = channelId;

    const response = await api.get<ApiResponse<number>>(
      '/api/services/app/RoomPricing/GetEffectiveRatePerNight',
      { params },
    );
    return response.data.result;
  },
};
