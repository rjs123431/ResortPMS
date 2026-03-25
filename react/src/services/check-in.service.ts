import { api } from './api.service';
import type { ApiResponse } from '@/types/common.types'
import type { CheckInResultDto } from '@/types/check-in.types';

export const checkInService = {
  checkInFromReservation: async (
    reservationIdOrInput:
      | string
      | {
          reservationId: string;
          roomId: string;
          reservationRoomId?: string;
          expectedCheckOutDate?: string;
          reservationRooms?: { reservationRoomId: string; roomTypeId: string; roomId: string }[];
          extraBeds?: {
            extraBedTypeId?: string;
            arrivalDate: string;
            departureDate: string;
            quantity: number;
            ratePerNight: number;
            numberOfNights: number;
            amount: number;
          }[];
          payments?: { paymentMethodId: string; amount: number; paidDate?: string; referenceNo?: string }[];
          refundableCashDepositAmount?: number;
          refundableCashDepositPaymentMethodId?: string;
          refundableCashDepositReference?: string;
          additionalGuestIds?: string[];
        },
    roomId?: string,
    expectedCheckOutDate?: string,
    reservationRoomId?: string,
  ) => {
    const payload =
      typeof reservationIdOrInput === 'string'
        ? {
            reservationId: reservationIdOrInput,
            roomId: roomId ?? '',
            reservationRoomId,
            expectedCheckOutDate,
            additionalGuestIds: [],
          }
        : {
            ...reservationIdOrInput,
            additionalGuestIds: reservationIdOrInput.additionalGuestIds ?? [],
          };

    const response = await api.post<ApiResponse<CheckInResultDto>>('/api/services/app/CheckIn/CheckInFromReservation', payload);
    return response.data.result;
  },

  walkInCheckIn: async (input: {
    guestId: string;
    roomId: string;
    expectedCheckOutDate: string;
    advancePaymentAmount?: number;
    paymentMethodId?: string;
    paymentReference?: string;
  }) => {
    const response = await api.post<ApiResponse<CheckInResultDto>>('/api/services/app/CheckIn/WalkInCheckIn', {
      ...input,
      additionalGuestIds: [],
    });
    return response.data.result;
  },

  checkInWalkIn: async (input: {
    guestId?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    email?: string;
    roomId: string;
    reservationRoomId?: string;
    expectedCheckOutDate?: string;
    reservationRooms?: {
      reservationRoomId?: string;
      roomTypeId: string;
      roomId: string;
      ratePerNight?: number;
      numberOfNights?: number;
      amount?: number;
      discountAmount?: number;
      netAmount?: number;
    }[];
    extraBeds?: {
      extraBedTypeId?: string;
      arrivalDate: string;
      departureDate: string;
      quantity: number;
      ratePerNight: number;
      numberOfNights: number;
      amount: number;
    }[];
    payments?: { paymentMethodId: string; amount: number; paidDate?: string; referenceNo?: string }[];
    refundableCashDepositAmount?: number;
    refundableCashDepositPaymentMethodId?: string;
    refundableCashDepositReference?: string;
    additionalGuestIds?: string[];
  }) => {
    const response = await api.post<ApiResponse<CheckInResultDto>>('/api/services/app/CheckIn/CheckInWalkIn', {
      ...input,
      additionalGuestIds: input.additionalGuestIds ?? [],
    });
    return response.data.result;
  },
};
