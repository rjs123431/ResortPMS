import { api } from './api.service';
import type { ApiResponse, PagedResultDto } from '@/types/common.types'
import {
  type CreateReservationDto,
  type RecordReservationDepositDto,
  type ReservationDetailDto,
  type ReservationListDto,
  ReservationStatus,
} from '@/types/reservation.types';

export const reservationService = {
  getReservations: async (
    filter = '',
    skipCount = 0,
    maxResultCount = 50,
    options?: {
      overlapStartDate?: string;
      overlapEndDate?: string;
      roomIds?: string[];
    },
  ) => {
    const params: Record<string, string | number | undefined> = {
      Filter: filter,
      Sorting: 'ArrivalDate desc',
      SkipCount: skipCount,
      MaxResultCount: maxResultCount,
    };
    if (options?.overlapStartDate) params.OverlapStartDate = options.overlapStartDate;
    if (options?.overlapEndDate) params.OverlapEndDate = options.overlapEndDate;
    if (options?.roomIds?.length) params.RoomIdsCsv = options.roomIds.join(',');
    const response = await api.get<ApiResponse<PagedResultDto<ReservationListDto>>>('/api/services/app/Reservation/GetAll', {
      params,
    });
    return response.data.result;
  },

  getReservationsWithRooms: async (options: {
    overlapStartDate: string;
    overlapEndDate: string;
    roomIds?: string[];
    status?: ReservationStatus;
    maxResultCount?: number;
  }) => {
    const params: Record<string, string | number | undefined> = {
      Sorting: 'ArrivalDate desc',
      SkipCount: 0,
      MaxResultCount: options.maxResultCount ?? 300,
      OverlapStartDate: options.overlapStartDate,
      OverlapEndDate: options.overlapEndDate,
    };
    if (options.roomIds?.length) params.RoomIdsCsv = options.roomIds.join(',');
    if (options.status !== undefined) params.Status = options.status;
    const response = await api.get<ApiResponse<PagedResultDto<ReservationDetailDto>>>(
      '/api/services/app/Reservation/GetReservationsWithRooms',
      { params },
    );
    return response.data.result;
  },

  getReservation: async (id: string) => {
    const response = await api.get<ApiResponse<ReservationDetailDto>>('/api/services/app/Reservation/Get', {
      params: { id },
    });
    return response.data.result;
  },

  createReservation: async (input: CreateReservationDto) => {
    const response = await api.post<ApiResponse<string>>('/api/services/app/Reservation/Create', input);
    return response.data.result;
  },

  confirmReservation: async (reservationId: string) => {
    await api.post('/api/services/app/Reservation/Confirm', null, { params: { reservationId } });
  },

  setReservationPending: async (reservationId: string) => {
    await api.post('/api/services/app/Reservation/SetPending', null, { params: { reservationId } });
  },

  markReservationNoShow: async (reservationId: string) => {
    await api.post('/api/services/app/Reservation/MarkNoShow', null, { params: { reservationId } });
  },

  cancelReservation: async (reservationId: string, reason?: string, remarks?: string) => {
    await api.post('/api/services/app/Reservation/Cancel', {
      reservationId,
      reason: reason ?? '',
      remarks: remarks ?? '',
    });
  },

  recordReservationDeposit: async (input: RecordReservationDepositDto) => {
    const response = await api.post<ApiResponse<string>>('/api/services/app/Reservation/RecordDeposit', input);
    return response.data.result;
  },

  addReservationGuests: async (reservationId: string, guests: { guestId: string; age: number }[]) => {
    const response = await api.post<ApiResponse<number>>('/api/services/app/Reservation/AddGuests', {
      reservationId,
      guests,
    });
    return response.data.result;
  },

  linkReservationGuest: async (reservationId: string, guestId: string) => {
    await api.post('/api/services/app/Reservation/LinkGuest', {
      reservationId,
      guestId,
    });
  },

  addReservationRoomTypes: async (reservationId: string, roomTypes: { roomTypeId: string; quantity: number }[]) => {
    const response = await api.post<ApiResponse<number>>('/api/services/app/Reservation/AddRoomTypes', {
      reservationId,
      roomTypes,
    });
    return response.data.result;
  },

  addReservationExtraBeds: async (reservationId: string, extraBeds: { extraBedTypeId: string; quantity: number }[]) => {
    const response = await api.post<ApiResponse<number>>('/api/services/app/Reservation/AddExtraBeds', {
      reservationId,
      extraBeds,
    });
    return response.data.result;
  },

  updateReservationGuestAge: async (reservationId: string, reservationGuestId: string, age: number) => {
    await api.put('/api/services/app/Reservation/UpdateGuestAge', {
      reservationId,
      reservationGuestId,
      age,
    });
  },

  removeReservationGuest: async (reservationId: string, reservationGuestId: string) => {
    await api.delete('/api/services/app/Reservation/RemoveGuest', {
      params: {
        reservationId,
        reservationGuestId,
      },
    });
  },

  removeReservationRoom: async (reservationId: string, reservationRoomId: string) => {
    await api.delete('/api/services/app/Reservation/RemoveRoom', {
      params: {
        reservationId,
        reservationRoomId,
      },
    });
  },

  removeReservationExtraBed: async (reservationId: string, reservationExtraBedId: string) => {
    await api.delete('/api/services/app/Reservation/RemoveExtraBed', {
      params: {
        reservationId,
        reservationExtraBedId,
      },
    });
  },

  assignReservationRoom: async (input: { reservationId: string; reservationRoomId: string; roomId: string }) => {
    await api.post('/api/services/app/Reservation/AssignRooms', {
      reservationId: input.reservationId,
      assignments: [{ reservationRoomId: input.reservationRoomId, roomId: input.roomId }],
    });
  },

  assignReservationRoomsBatch: async (input: {
    reservationId: string;
    assignments: Array<{ reservationRoomId: string; roomId: string }>;
  }) => {
    await api.post('/api/services/app/Reservation/AssignRooms', input);
  },

  applyReservationChanges: async (input: {
    reservationId: string;
    linkedGuestId?: string;
    roomTypesToAdd?: Array<{ roomTypeId: string; quantity: number }>;
    reservationRoomIdsToRemove?: string[];
    roomAssignments?: Array<{ reservationRoomId: string; roomId: string }>;
    extraBedsToAdd?: Array<{ extraBedTypeId: string; quantity: number }>;
    reservationExtraBedIdsToRemove?: string[];
    depositsToAdd?: Array<{
      reservationId: string;
      amount: number;
      paymentMethodId: string;
      paidDate: string;
      referenceNo?: string;
    }>;
  }) => {
    const payload = {
      reservationId: input.reservationId,
      linkedGuestId: input.linkedGuestId,
      roomTypesToAdd: input.roomTypesToAdd ?? [],
      reservationRoomIdsToRemove: input.reservationRoomIdsToRemove ?? [],
      roomAssignments: input.roomAssignments ?? [],
      extraBedsToAdd: input.extraBedsToAdd ?? [],
      reservationExtraBedIdsToRemove: input.reservationExtraBedIdsToRemove ?? [],
      depositsToAdd: input.depositsToAdd ?? [],
    };

    await api.post('/api/services/app/Reservation/ApplyChanges', payload);
  },
};
