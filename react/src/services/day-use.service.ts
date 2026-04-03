import { api } from './api.service';
import type { ApiResponse, PagedResultDto } from '@/types/common.types';
import type {
  CreateDayUseOfferDto,
  CreateDayUseSaleDto,
  DayUseGuestContext,
  DayUseOfferListDto,
  DayUseOfferType,
  DayUseVisitDto,
  DayUseVisitListDto,
  DayUseSaleResultDto,
  UpdateDayUseOfferDto,
} from '@/types/day-use.types';

export const dayUseService = {
  getDayUseOffersPaged: async (params?: {
    filter?: string;
    guestContext?: DayUseGuestContext;
    offerType?: DayUseOfferType;
    isActive?: boolean;
    skipCount?: number;
    maxResultCount?: number;
  }) => {
    const response = await api.get<ApiResponse<PagedResultDto<DayUseOfferListDto>>>('/api/services/app/DayUse/GetOffers', {
      params: {
        Filter: params?.filter ?? '',
        GuestContext: params?.guestContext,
        OfferType: params?.offerType,
        IsActive: params?.isActive,
        Sorting: 'SortOrder asc, Name asc',
        SkipCount: params?.skipCount ?? 0,
        MaxResultCount: params?.maxResultCount ?? 100,
      },
    });
    return response.data.result;
  },

  getDayUseActiveOffers: async (params?: { guestContext?: DayUseGuestContext; offerType?: DayUseOfferType }) => {
    const response = await api.get<ApiResponse<DayUseOfferListDto[]>>('/api/services/app/DayUse/GetActiveOffers', {
      params: {
        GuestContext: params?.guestContext,
        OfferType: params?.offerType,
      },
    });
    return response.data.result;
  },

  getDayUseVisitsPaged: async (params?: {
    filter?: string;
    guestContext?: DayUseGuestContext;
    visitDate?: string;
    skipCount?: number;
    maxResultCount?: number;
  }) => {
    const response = await api.get<ApiResponse<PagedResultDto<DayUseVisitListDto>>>('/api/services/app/DayUse/GetAll', {
      params: {
        Filter: params?.filter ?? '',
        GuestContext: params?.guestContext,
        VisitDate: params?.visitDate,
        Sorting: 'VisitDate desc, VisitNo desc',
        SkipCount: params?.skipCount ?? 0,
        MaxResultCount: params?.maxResultCount ?? 20,
      },
    });
    return response.data.result;
  },

  getDayUseVisit: async (id: string) => {
    const response = await api.get<ApiResponse<DayUseVisitDto>>('/api/services/app/DayUse/Get', {
      params: { id },
    });
    return response.data.result;
  },

  createDayUseOffer: async (input: CreateDayUseOfferDto) => {
    const response = await api.post<ApiResponse<string>>('/api/services/app/DayUse/CreateOffer', input);
    return response.data.result;
  },

  updateDayUseOffer: async (input: UpdateDayUseOfferDto) => {
    await api.put('/api/services/app/DayUse/UpdateOffer', input);
  },

  createDayUseSale: async (input: CreateDayUseSaleDto) => {
    const response = await api.post<ApiResponse<DayUseSaleResultDto>>('/api/services/app/DayUse/CreateSale', input);
    return response.data.result;
  },
};