import { api } from './api.service';
import type { ApiResponse } from '@/types/common.types'
import type {
  CreateExtraBedPriceDto,
  ExtraBedCurrentPriceDto,
  ExtraBedPriceDto,
  UpdateExtraBedPriceDto,
} from '@/types/extra-bed-pricing.types';

export const extraBedPricingService = {
  /** Returns date-effective pricing history for one extra-bed type. */
  getByType: async (extraBedTypeId: string): Promise<ExtraBedPriceDto[]> => {
    const response = await api.get<ApiResponse<ExtraBedPriceDto[]>>(
      '/api/services/app/ExtraBedPricing/GetByType',
      { params: { ExtraBedTypeId: extraBedTypeId } },
    );
    return response.data.result;
  },

  /**
   * Returns the currently-effective rate-per-night for every active extra-bed type.
   * Optionally pass asOfDate (ISO date string) to resolve prices for a specific date.
   */
  getCurrentPrices: async (asOfDate?: string): Promise<ExtraBedCurrentPriceDto[]> => {
    const response = await api.get<ApiResponse<ExtraBedCurrentPriceDto[]>>(
      '/api/services/app/ExtraBedPricing/GetCurrentPrices',
      { params: asOfDate ? { AsOfDate: asOfDate } : undefined },
    );
    return response.data.result;
  },

  createExtraBedPrice: async (input: CreateExtraBedPriceDto): Promise<string> => {
    const response = await api.post<ApiResponse<string>>(
      '/api/services/app/ExtraBedPricing/Create',
      input,
    );
    return response.data.result;
  },

  updateExtraBedPrice: async (input: UpdateExtraBedPriceDto): Promise<void> => {
    await api.put('/api/services/app/ExtraBedPricing/Update', input);
  },
};
