import { api } from './api.service';
import type { ApiResponse, PagedResultDto } from '@/types/common.types'
import type { CreateGuestDto, GuestDto, GuestListDto } from '@/types/guest.types';

export const guestService = {
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
    const normalizedInput: CreateGuestDto = {
      ...input,
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      phone: input.phone.trim(),
      middleName: input.middleName?.trim() || undefined,
      email: input.email?.trim() || undefined,
      nationality: input.nationality?.trim() || undefined,
      notes: input.notes?.trim() || undefined,
    };

    const response = await api.post<ApiResponse<string>>('/api/services/app/Guest/Create', normalizedInput);
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
};
