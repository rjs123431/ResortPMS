import { api } from './api.service';
import {
  ApiResponse,
  ChargeTypeDto,
  ChargeTypeListDto,
  CheckInResultDto,
  CreateChargeTypeDto,
  CreateLookupDto,
  CheckOutResultDto,
  CheckOutStatementDto,
  CreateGuestDto,
  CreateReservationDto,
  CreateExtraBedTypeDto,
  CreateRoomDto,
  CreateRoomTypeDto,
  ExtraBedTypeDto,
  ExtraBedTypeListDto,
  FolioDto,
  FolioSummaryDto,
  GuestDto,
  GuestListDto,
  LookupDto,
  LookupListDto,
  StaffDto,
  StaffListDto,
  CreateStaffDto,
  PagedResultDto,
  ReceiptDto,
  RecordReservationDepositDto,
  ReservationDetailDto,
  ReservationListDto,
  RoomListDto,
  RoomDto,
  RoomTypeDto,
  RoomTypeListDto,
  StayListDto,
  RoomOperationalStatus,
  HousekeepingStatus,
  HousekeepingTaskDto,
  CreateHousekeepingTaskDto,
  UpdateHousekeepingTaskStatusDto,
  CleaningBoardRoomDto,
  HousekeepingTaskStatus,
  HousekeepingTaskType,
  HousekeepingLogDto,
  UpdateHousekeepingStatusDto,
  AddGuestRequestDto,
  CompleteGuestRequestDto,
  GuestRequestCompletionContextDto,
  GuestRequestListDto,
  QuotationDto,
  QuotationListDto,
  CreateQuotationDto,
  UpdateQuotationDto,
  QuotationStatus,
  PreCheckInDto,
  PreCheckInListDto,
  CreatePreCheckInDto,
  UpdatePreCheckInDto,
  PreCheckInStatus,
} from '@/types/resort.types';

export const resortService = {
  getGuests: async (filter = '', skipCount = 0, maxResultCount = 50) => {
    const response = await api.get<ApiResponse<PagedResultDto<GuestListDto>>>('/api/services/app/Guest/GetAll', {
      params: {
        Filter: filter,
        Sorting: 'LastName asc',
        SkipCount: skipCount,
        MaxResultCount: maxResultCount,
      },
    });
    return response.data.result;
  },

  createGuest: async (input: CreateGuestDto) => {
    const response = await api.post<ApiResponse<string>>('/api/services/app/Guest/Create', input);
    return response.data.result;
  },

  getGuest: async (id: string) => {
    const response = await api.get<ApiResponse<GuestDto>>('/api/services/app/Guest/Get', {
      params: { id },
    });
    return response.data.result;
  },

  updateGuest: async (input: GuestDto) => {
    await api.put('/api/services/app/Guest/Update', input);
  },

  getRoomTypes: async () => {
    const response = await api.get<ApiResponse<RoomTypeListDto[]>>('/api/services/app/RoomType/GetAllActive');
    return response.data.result;
  },

  getRoomTypesPaged: async (filter = '', skipCount = 0, maxResultCount = 100) => {
    const response = await api.get<ApiResponse<PagedResultDto<RoomTypeListDto>>>('/api/services/app/RoomType/GetAll', {
      params: {
        Filter: filter,
        Sorting: 'Name asc',
        SkipCount: skipCount,
        MaxResultCount: maxResultCount,
      },
    });
    return response.data.result;
  },

  getRoomType: async (id: string) => {
    const response = await api.get<ApiResponse<RoomTypeDto>>('/api/services/app/RoomType/Get', {
      params: { id },
    });
    return response.data.result;
  },

  createRoomType: async (input: CreateRoomTypeDto) => {
    const response = await api.post<ApiResponse<string>>('/api/services/app/RoomType/Create', input);
    return response.data.result;
  },

  updateRoomType: async (input: RoomTypeDto) => {
    await api.put('/api/services/app/RoomType/Update', input);
  },

  getRooms: async (filter = '', skipCount = 0, maxResultCount = 100) => {
    const response = await api.get<ApiResponse<PagedResultDto<RoomListDto>>>('/api/services/app/Room/GetAll', {
      params: {
        Filter: filter,
        Sorting: 'RoomNumber asc',
        SkipCount: skipCount,
        MaxResultCount: maxResultCount,
      },
    });
    return response.data.result;
  },

  createRoom: async (input: CreateRoomDto) => {
    const response = await api.post<ApiResponse<string>>('/api/services/app/Room/Create', input);
    return response.data.result;
  },

  getRoom: async (id: string) => {
    const response = await api.get<ApiResponse<RoomDto>>('/api/services/app/Room/Get', {
      params: { id },
    });
    return response.data.result;
  },

  updateRoom: async (input: RoomDto) => {
    await api.put('/api/services/app/Room/Update', input);
  },

  getAvailableRooms: async (
    roomTypeId?: string,
    arrivalDate?: string,
    departureDate?: string,
    reservationId?: string,
    excludeReservedWithoutAssignedRoom?: boolean,
    checkInReadyOnly?: boolean,
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

    const response = await api.get<ApiResponse<RoomListDto[]>>('/api/services/app/Room/GetAvailableRooms', {
      params,
    });
    return response.data.result;
  },

  getReservations: async (filter = '', skipCount = 0, maxResultCount = 50) => {
    const response = await api.get<ApiResponse<PagedResultDto<ReservationListDto>>>('/api/services/app/Reservation/GetAll', {
      params: {
        Filter: filter,
        Sorting: 'ArrivalDate desc',
        SkipCount: skipCount,
        MaxResultCount: maxResultCount,
      },
    });
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

  markReservationNoShow: async (reservationId: string) => {
    await api.post('/api/services/app/Reservation/MarkNoShow', null, { params: { reservationId } });
  },

  cancelReservation: async (reservationId: string, reason?: string) => {
    await api.post('/api/services/app/Reservation/Cancel', { reservationId, reason: reason ?? '' });
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

  assignReservationRoom: async (input: { reservationId: string; reservationRoomId: string; roomId: string }) => {
    await api.post('/api/services/app/Reservation/AssignRoom', input);
  },

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
    guestId: string;
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

  getInHouseStays: async (filter = '', skipCount = 0, maxResultCount = 50) => {
    const response = await api.get<ApiResponse<PagedResultDto<StayListDto>>>('/api/services/app/Stay/GetInHouse', {
      params: {
        Filter: filter,
        Sorting: 'CheckInDateTime desc',
        SkipCount: skipCount,
        MaxResultCount: maxResultCount,
      },
    });
    return response.data.result;
  },

  getFolioSummary: async (stayId: string) => {
    const response = await api.get<ApiResponse<FolioSummaryDto>>('/api/services/app/Stay/GetFolioSummary', {
      params: { stayId },
    });
    return response.data.result;
  },

  getFolio: async (stayId: string) => {
    const response = await api.get<ApiResponse<FolioDto>>('/api/services/app/Stay/GetFolio', {
      params: { stayId },
    });
    return response.data.result;
  },

  getChargeTypes: async () => {
    const response = await api.get<ApiResponse<ChargeTypeListDto[]>>('/api/services/app/ChargeType/GetAllActive');
    return response.data.result;
  },

  getChargeTypesPaged: async (filter = '', skipCount = 0, maxResultCount = 100) => {
    const response = await api.get<ApiResponse<PagedResultDto<ChargeTypeListDto>>>('/api/services/app/ChargeType/GetAll', {
      params: {
        Filter: filter,
        Sorting: 'Sort asc, Name asc',
        SkipCount: skipCount,
        MaxResultCount: maxResultCount,
      },
    });
    return response.data.result;
  },

  getChargeType: async (id: string) => {
    const response = await api.get<ApiResponse<ChargeTypeDto>>('/api/services/app/ChargeType/Get', {
      params: { id },
    });
    return response.data.result;
  },

  createChargeType: async (input: CreateChargeTypeDto) => {
    const response = await api.post<ApiResponse<string>>('/api/services/app/ChargeType/Create', input);
    return response.data.result;
  },

  updateChargeType: async (input: ChargeTypeDto) => {
    await api.put('/api/services/app/ChargeType/Update', input);
  },

  getPaymentMethods: async () => {
    const response = await api.get<ApiResponse<LookupListDto[]>>('/api/services/app/PaymentMethod/GetAllActive');
    return response.data.result;
  },

  getPaymentMethodsPaged: async (filter = '', skipCount = 0, maxResultCount = 100) => {
    const response = await api.get<ApiResponse<PagedResultDto<LookupListDto>>>('/api/services/app/PaymentMethod/GetAll', {
      params: {
        Filter: filter,
        Sorting: 'Name asc',
        SkipCount: skipCount,
        MaxResultCount: maxResultCount,
      },
    });
    return response.data.result;
  },

  getPaymentMethod: async (id: string) => {
    const response = await api.get<ApiResponse<LookupDto>>('/api/services/app/PaymentMethod/Get', {
      params: { id },
    });
    return response.data.result;
  },

  createPaymentMethod: async (input: CreateLookupDto) => {
    const response = await api.post<ApiResponse<string>>('/api/services/app/PaymentMethod/Create', input);
    return response.data.result;
  },

  updatePaymentMethod: async (input: LookupDto) => {
    await api.put('/api/services/app/PaymentMethod/Update', input);
  },

  getExtraBedTypes: async () => {
    const response = await api.get<ApiResponse<ExtraBedTypeListDto[]>>('/api/services/app/ExtraBedType/GetAllActive');
    return response.data.result;
  },

  getExtraBedTypesPaged: async (filter = '', skipCount = 0, maxResultCount = 100) => {
    const response = await api.get<ApiResponse<PagedResultDto<ExtraBedTypeListDto>>>('/api/services/app/ExtraBedType/GetAll', {
      params: {
        Filter: filter,
        Sorting: 'Name asc',
        SkipCount: skipCount,
        MaxResultCount: maxResultCount,
      },
    });
    return response.data.result;
  },

  getExtraBedType: async (id: string) => {
    const response = await api.get<ApiResponse<ExtraBedTypeDto>>('/api/services/app/ExtraBedType/Get', {
      params: { id },
    });
    return response.data.result;
  },

  createExtraBedType: async (input: CreateExtraBedTypeDto) => {
    const response = await api.post<ApiResponse<string>>('/api/services/app/ExtraBedType/Create', input);
    return response.data.result;
  },

  updateExtraBedType: async (input: ExtraBedTypeDto) => {
    await api.put('/api/services/app/ExtraBedType/Update', input);
  },

  postCharge: async (input: {
    stayId: string;
    chargeTypeId: string;
    amount: number;
    quantity?: number;
    taxAmount?: number;
    discountAmount?: number;
    description?: string;
  }) => {
    await api.post('/api/services/app/Stay/PostCharge', {
      ...input,
      quantity: input.quantity ?? 1,
      taxAmount: input.taxAmount ?? 0,
      discountAmount: input.discountAmount ?? 0,
    });
  },

  postPayment: async (input: { stayId: string; paymentMethodId: string; amount: number; referenceNo?: string; notes?: string }) => {
    await api.post('/api/services/app/Stay/PostPayment', input);
  },

  postRefund: async (input: { stayId: string; amount: number; description?: string }) => {
    await api.post('/api/services/app/Stay/PostRefund', input);
  },

  addGuestRequest: async (input: AddGuestRequestDto) => {
    const response = await api.post<ApiResponse<string>>('/api/services/app/Stay/AddGuestRequest', input);
    return response.data.result;
  },

  getGuestRequests: async (stayId: string) => {
    const response = await api.get<ApiResponse<GuestRequestListDto[]>>('/api/services/app/Stay/GetGuestRequests', {
      params: { stayId },
    });
    return response.data.result;
  },

  getGuestRequestCompletionContext: async (guestRequestId: string) => {
    const response = await api.get<ApiResponse<GuestRequestCompletionContextDto>>('/api/services/app/Stay/GetGuestRequestCompletionContext', {
      params: { guestRequestId },
    });
    return response.data.result;
  },

  completeGuestRequest: async (input: CompleteGuestRequestDto) => {
    await api.post('/api/services/app/Stay/CompleteGuestRequest', input);
  },

  getCheckoutStatement: async (stayId: string) => {
    const response = await api.get<ApiResponse<CheckOutStatementDto>>('/api/services/app/CheckOut/GetStatement', {
      params: { stayId },
    });
    return response.data.result;
  },

  processCheckout: async (
    inputOrStayId:
      | {
          stayId: string;
          payments?: { paymentMethodId: string; amount: number; referenceNo?: string }[];
        }
      | string,
    paymentMethodId?: string,
    amount?: number,
    referenceNo?: string,
  ) => {
    const payload =
      typeof inputOrStayId === 'string'
        ? {
            stayId: inputOrStayId,
            payments:
              paymentMethodId && amount && amount > 0
                ? [{ paymentMethodId, amount, referenceNo }]
                : [],
          }
        : {
            stayId: inputOrStayId.stayId,
            payments: inputOrStayId.payments ?? [],
          };

    const response = await api.post<ApiResponse<CheckOutResultDto>>('/api/services/app/CheckOut/ProcessCheckOut', payload);
    return response.data.result;
  },

  writeOffBalance: async (stayId: string, reason: string) => {
    await api.post('/api/services/app/CheckOut/WriteOffBalance', { stayId, reason });
  },

  getLatestReceiptByStay: async (stayId: string) => {
    const response = await api.get<ApiResponse<ReceiptDto>>('/api/services/app/CheckOut/GetLatestReceiptByStay', {
      params: { stayId },
    });
    return response.data.result;
  },

  updateRoomOperationalStatus: async (roomId: string, operationalStatus: RoomOperationalStatus, remarks?: string) => {
    await api.put('/api/services/app/Room/UpdateOperationalStatus', { roomId, operationalStatus, remarks });
  },

  updateRoomHousekeepingStatus: async (roomId: string, housekeepingStatus: HousekeepingStatus, remarks?: string, staffId?: string) => {
    const payload: UpdateHousekeepingStatusDto = { roomId, housekeepingStatus, remarks, staffId };
    await api.put('/api/services/app/Room/UpdateHousekeepingStatus', payload);
  },

  getCleaningBoard: async (date?: string) => {
    const params: Record<string, string> = {};
    if (date) params.Date = date;
    const response = await api.get<ApiResponse<CleaningBoardRoomDto[]>>('/api/services/app/Housekeeping/GetCleaningBoard', { params });
    return response.data.result;
  },

  getHousekeepingTasks: async (params?: {
    status?: HousekeepingTaskStatus;
    taskType?: HousekeepingTaskType;
    roomId?: string;
    assignedToStaffId?: string;
    isUnassigned?: boolean;
    taskDate?: string;
    skipCount?: number;
    maxResultCount?: number;
  }) => {
    const query: Record<string, string> = {};
    if (params?.status !== undefined) query.Status = String(params.status);
    if (params?.taskType !== undefined) query.TaskType = String(params.taskType);
    if (params?.roomId) query.RoomId = params.roomId;
    if (params?.assignedToStaffId) query.AssignedToStaffId = params.assignedToStaffId;
    if (params?.isUnassigned) query.IsUnassigned = 'true';
    if (params?.taskDate) query.TaskDate = params.taskDate;
    if (params?.skipCount !== undefined) query.SkipCount = String(params.skipCount);
    if (params?.maxResultCount !== undefined) query.MaxResultCount = String(params.maxResultCount);
    const response = await api.get<ApiResponse<PagedResultDto<HousekeepingTaskDto>>>('/api/services/app/Housekeeping/GetTasks', { params: query });
    return response.data.result;
  },

  createHousekeepingTask: async (input: CreateHousekeepingTaskDto) => {
    const response = await api.post<ApiResponse<string>>('/api/services/app/Housekeeping/CreateTask', input);
    return response.data.result;
  },

  updateHousekeepingTaskStatus: async (input: UpdateHousekeepingTaskStatusDto) => {
    await api.put('/api/services/app/Housekeeping/UpdateTaskStatus', input);
  },

  getHousekeepingLogs: async (params?: { roomId?: string; fromDate?: string; toDate?: string; skipCount?: number; maxResultCount?: number }) => {
    const query: Record<string, string> = {};
    if (params?.roomId) query.RoomId = params.roomId;
    if (params?.fromDate) query.FromDate = params.fromDate;
    if (params?.toDate) query.ToDate = params.toDate;
    if (params?.skipCount !== undefined) query.SkipCount = String(params.skipCount);
    if (params?.maxResultCount !== undefined) query.MaxResultCount = String(params.maxResultCount);
    const response = await api.get<ApiResponse<PagedResultDto<HousekeepingLogDto>>>('/api/services/app/Housekeeping/GetLogs', { params: query });
    return response.data.result;
  },

  getStaffsPaged: async (filter = '', skipCount = 0, maxResultCount = 100) => {
    const response = await api.get<ApiResponse<PagedResultDto<StaffListDto>>>('/api/services/app/Staff/GetAll', {
      params: {
        Filter: filter,
        Sorting: 'FullName asc',
        SkipCount: skipCount,
        MaxResultCount: maxResultCount,
      },
    });
    return response.data.result;
  },

  getStaffs: async () => {
    const response = await api.get<ApiResponse<StaffListDto[]>>('/api/services/app/Staff/GetAllActive');
    return response.data.result;
  },

  getStaff: async (id: string) => {
    const response = await api.get<ApiResponse<StaffDto>>('/api/services/app/Staff/Get', { params: { id } });
    return response.data.result;
  },

  createStaff: async (input: CreateStaffDto) => {
    const response = await api.post<ApiResponse<string>>('/api/services/app/Staff/Create', input);
    return response.data.result;
  },

  updateStaff: async (input: StaffDto) => {
    await api.put('/api/services/app/Staff/Update', input);
  },

  getQuotations: async (params?: { filter?: string; status?: QuotationStatus; includeExpired?: boolean; skipCount?: number; maxResultCount?: number }) => {
    const query: Record<string, string> = {};
    if (params?.filter) query.Filter = params.filter;
    if (params?.status !== undefined) query.Status = String(params.status);
    if (params?.includeExpired !== undefined) query.IncludeExpired = String(params.includeExpired);
    if (params?.skipCount !== undefined) query.SkipCount = String(params.skipCount);
    if (params?.maxResultCount !== undefined) query.MaxResultCount = String(params.maxResultCount);
    const response = await api.get<ApiResponse<PagedResultDto<QuotationListDto>>>('/api/services/app/Quotation/GetAll', { params: query });
    return response.data.result;
  },

  getQuotation: async (id: string) => {
    const response = await api.get<ApiResponse<QuotationDto>>('/api/services/app/Quotation/Get', { params: { id } });
    return response.data.result;
  },

  createQuotation: async (input: CreateQuotationDto) => {
    const response = await api.post<ApiResponse<string>>('/api/services/app/Quotation/Create', input);
    return response.data.result;
  },

  updateQuotation: async (input: UpdateQuotationDto) => {
    const response = await api.put<ApiResponse<string>>('/api/services/app/Quotation/Update', input);
    return response.data.result;
  },

  cancelQuotation: async (id: string) => {
    await api.post('/api/services/app/Quotation/Cancel', null, { params: { id } });
  },

  getPreCheckIns: async (params?: {
    filter?: string;
    status?: PreCheckInStatus;
    includeExpired?: boolean;
    walkInOnly?: boolean;
    reservationOnly?: boolean;
    reservationId?: string;
    skipCount?: number;
    maxResultCount?: number;
  }) => {
    const query: Record<string, string> = {};
    if (params?.filter) query.Filter = params.filter;
    if (params?.status !== undefined) query.Status = String(params.status);
    if (params?.includeExpired !== undefined) query.IncludeExpired = String(params.includeExpired);
    if (params?.walkInOnly !== undefined) query.WalkInOnly = String(params.walkInOnly);
    if (params?.reservationOnly !== undefined) query.ReservationOnly = String(params.reservationOnly);
    if (params?.reservationId) query.ReservationId = params.reservationId;
    if (params?.skipCount !== undefined) query.SkipCount = String(params.skipCount);
    if (params?.maxResultCount !== undefined) query.MaxResultCount = String(params.maxResultCount);
    const response = await api.get<ApiResponse<PagedResultDto<PreCheckInListDto>>>('/api/services/app/PreCheckIn/GetAll', { params: query });
    return response.data.result;
  },

  getPreCheckIn: async (id: string) => {
    const response = await api.get<ApiResponse<PreCheckInDto>>('/api/services/app/PreCheckIn/Get', { params: { id } });
    return response.data.result;
  },

  getPreCheckInByReservationId: async (reservationId: string) => {
    const response = await api.get<ApiResponse<PreCheckInDto | null>>('/api/services/app/PreCheckIn/GetByReservationId', { params: { reservationId } });
    return response.data.result;
  },

  createPreCheckIn: async (input: CreatePreCheckInDto) => {
    const response = await api.post<ApiResponse<string>>('/api/services/app/PreCheckIn/Create', input);
    return response.data.result;
  },

  updatePreCheckIn: async (input: UpdatePreCheckInDto) => {
    const response = await api.put<ApiResponse<string>>('/api/services/app/PreCheckIn/Update', input);
    return response.data.result;
  },

  cancelPreCheckIn: async (id: string) => {
    await api.post('/api/services/app/PreCheckIn/Cancel', null, { params: { id } });
  },

  markPreCheckInReady: async (id: string) => {
    await api.post('/api/services/app/PreCheckIn/MarkReady', null, { params: { id } });
  },

  markPreCheckInCheckedIn: async (id: string) => {
    await api.post('/api/services/app/PreCheckIn/MarkCheckedIn', null, { params: { id } });
  },
};
