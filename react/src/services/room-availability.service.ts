import { api } from './api.service';
import { ApiResponse, RoomListDto } from '@/types/resort.types';

export const roomAvailabilityService = {
  getAvailableRooms: async (
    roomTypeId?: string,
    arrivalDate?: string,
    departureDate?: string,
    reservationId?: string,
    excludeReservedWithoutAssignedRoom?: boolean,
    checkInReadyOnly?: boolean,
    channelId?: string,
    preCheckInId?: string,
  ) => {
    const params: Record<string, string> = {};
    if (roomTypeId) params.RoomTypeId = roomTypeId;
    if (arrivalDate) params.ArrivalDate = arrivalDate;
    if (departureDate) params.DepartureDate = departureDate;
    if (reservationId) params.ReservationId = reservationId;
    if (excludeReservedWithoutAssignedRoom !== undefined) {
      params.ExcludeReservedWithoutAssignedRoom = String(excludeReservedWithoutAssignedRoom);
    }
    if (checkInReadyOnly !== undefined) {
      params.CheckInReadyOnly = String(checkInReadyOnly);
    }
    if (channelId) params.ChannelId = channelId;
    if (preCheckInId) params.PreCheckInId = preCheckInId;

    const response = await api.get<ApiResponse<RoomListDto[]>>(
      '/api/services/app/RoomAvailability/GetAvailableRooms',
      { params },
    );
    return response.data.result;
  },
};
