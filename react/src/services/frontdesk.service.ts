import { api } from './api.service';

export interface FrontDeskDashboardDto {
  asOfDate: string;
  arrivalsToday: number;
  departuresToday: number;
  occupiedRooms: number;
  vacantRooms: number;
  roomsDirty: number;
  roomsOutOfOrder: number;
}

export interface FrontDeskArrivalRowDto {
  reservationId: string;
  reservationNo: string;
  guestName: string;
  roomNumber: string;
  estimatedArrivalTime?: string | null;
  isPastDue: boolean;
}

export interface FrontDeskDepartureRowDto {
  stayId: string;
  stayNo: string;
  guestName: string;
  roomNumber: string;
  estimatedDepartureTime?: string | null;
  balance?: number | null;
}

export const frontDeskService = {
  getDashboardSummary: async (): Promise<FrontDeskDashboardDto> => {
    const res = await api.get<{ result: FrontDeskDashboardDto }>(
      '/api/services/app/FrontDeskDashboard/GetSummary'
    );
    return res.data.result;
  },

  getTodayArrivals: async (): Promise<FrontDeskArrivalRowDto[]> => {
    const res = await api.get<{ result: FrontDeskArrivalRowDto[] }>(
      '/api/services/app/FrontDeskDashboard/GetArrivalsToday'
    );
    return res.data.result;
  },

  getTodayDepartures: async (): Promise<FrontDeskDepartureRowDto[]> => {
    const res = await api.get<{ result: FrontDeskDepartureRowDto[] }>(
      '/api/services/app/FrontDeskDashboard/GetDeparturesToday'
    );
    return res.data.result;
  },
};

