import { api } from './api.service';

export interface DashboardKpisDto {
  asOfDate: string;
  totalRooms: number;
  inHouseRooms: number;
  inHouseStays: number;
  arrivalsToday: number;
  departuresToday: number;
  reservationsToday: number;
  noShowsToday: number;
  cancellationsToday: number;
  occupancyPercent: number;
  adr: number;
  revPar: number;
  roomRevenueToday: number;
  totalRevenueToday: number;
  paymentsToday: number;
}

export interface AccountsReceivableReportDto {
  asOfDate: string;
  totalReceivables: number;
  reservationBalanceTotal: number;
  reservationRoomBalanceTotal: number;
  reservationExtrasBalanceTotal: number;
  conferenceBalanceTotal: number;
  inHouseBalanceTotal: number;
  inHouseChargesTotal: number;
  byChargeType: AccountsReceivableByChargeTypeDto[];
  reservations: AccountsReceivableReservationRowDto[];
  conferenceBookings: AccountsReceivableConferenceBookingRowDto[];
  inHouseStays: AccountsReceivableStayRowDto[];
}

export interface AccountsReceivableByChargeTypeDto {
  chargeTypeName: string;
  amount: number;
}

export interface AccountsReceivableReservationRowDto {
  reservationNo: string;
  arrivalDate: string;
  guestName: string;
  roomAmount: number;
  extrasAmount: number;
  totalAmount: number;
  depositPaid: number;
  roomBalance: number;
  extrasBalance: number;
  balance: number;
}

export interface AccountsReceivableConferenceBookingRowDto {
  bookingNo: string;
  startDateTime: string;
  organizerName: string;
  venueName: string;
  totalAmount: number;
  depositPaid: number;
  balance: number;
}

export interface AccountsReceivableStayRowDto {
  stayNo: string;
  checkInDateTime: string;
  guestName: string;
  roomNumber: string;
  charges: number;
  balance: number;
}

export interface OccupancyReportDto {
  fromDate: string;
  toDate: string;
  totalRooms: number;
  totalRoomNightsAvailable: number;
  roomNightsSold: number;
  occupancyPercent: number;
  byDay: OccupancyByDayDto[];
}

export interface OccupancyByDayDto {
  date: string;
  roomsOccupied: number;
  roomsAvailable: number;
  occupancyPercent: number;
}

export interface RevenueReportDto {
  fromDate: string;
  toDate: string;
  totalCharges: number;
  totalPayments: number;
  totalDiscounts: number;
  conferenceChargesTotal: number;
  conferencePaymentsTotal: number;
  byDay: RevenueByDayDto[];
  byChargeType: RevenueByChargeTypeDto[];
}

export interface RevenueByDayDto {
  date: string;
  charges: number;
  payments: number;
}

export interface RevenueByChargeTypeDto {
  chargeTypeName: string;
  amount: number;
}

export interface SalesReportDto {
  fromDate: string;
  toDate: string;
  totalPayments: number;
  paymentsCount: number;
  byPaymentMethod: SalesByPaymentMethodDto[];
  payments: SalesPaymentRowDto[];
}

export interface SalesByPaymentMethodDto {
  paymentMethodId: string;
  paymentMethodName: string;
  amount: number;
  paymentsCount: number;
}

export interface SalesPaymentRowDto {
  receivedAt: string;
  paymentMethodId: string;
  paymentMethodName: string;
  sourceType: string;
  documentNo: string;
  description: string;
  referenceNo: string;
  amount: number;
}

export interface NightAuditSummaryDto {
  auditDate: string;
  arrivals: number;
  departures: number;
  inHouseAtStart: number;
  inHouseAtEnd: number;
  roomsSold: number;
  roomRevenue: number;
  otherRevenue: number;
  totalCharges: number;
  totalPayments: number;
  outstandingBalance: number;
  folioSummary: NightAuditFolioRowDto[];
}

export interface NightAuditFolioRowDto {
  stayNo: string;
  guestName: string;
  roomNumber: string;
  charges: number;
  payments: number;
  balance: number;
}

export interface PosSalesSummaryDto {
  fromDate: string;
  toDate: string;
  ordersCount: number;
  salesTotal: number;
  paymentsTotal: number;
  byOutlet: PosSalesByOutletDto[];
  byDay: PosSalesByDayDto[];
}

export interface PosSalesByOutletDto {
  outletId: string;
  outletName: string;
  ordersCount: number;
  salesTotal: number;
}

export interface PosSalesByDayDto {
  date: string;
  ordersCount: number;
  salesTotal: number;
}

export interface PosZReportDto {
  reportDate: string;
  reportType: string;
  outletId: string | null;
  outletName: string;
  generatedAt: string;
  ordersCount: number;
  grossSales: number;
  discountsTotal: number;
  serviceChargesTotal: number;
  netSales: number;
  paymentsTotal: number;
  paymentsByMethod: PosZReportPaymentRowDto[];
}

export interface PosZReportPaymentRowDto {
  paymentMethodId: string;
  paymentMethodName: string;
  amount: number;
}

export const reportingService = {
  getDashboardKpis: async (asOfDate?: string): Promise<DashboardKpisDto> => {
    const params = asOfDate ? { AsOfDate: asOfDate } : {};
    const res = await api.get<{ result: DashboardKpisDto }>(
      '/api/services/app/ReportsDashboard/GetSummary',
      { params }
    );
    return res.data.result;
  },

  getAccountsReceivableReport: async (asOfDate?: string): Promise<AccountsReceivableReportDto> => {
    const params = asOfDate ? { AsOfDate: asOfDate } : {};
    const res = await api.get<{ result: AccountsReceivableReportDto }>(
      '/api/services/app/Reporting/GetAccountsReceivableReport',
      { params }
    );
    return res.data.result;
  },

  getOccupancyReport: async (fromDate: string, toDate: string): Promise<OccupancyReportDto> => {
    const res = await api.get<{ result: OccupancyReportDto }>(
      '/api/services/app/Reporting/GetOccupancyReport',
      { params: { FromDate: fromDate, ToDate: toDate } }
    );
    return res.data.result;
  },

  getRevenueReport: async (fromDate: string, toDate: string): Promise<RevenueReportDto> => {
    const res = await api.get<{ result: RevenueReportDto }>(
      '/api/services/app/Reporting/GetRevenueReport',
      { params: { FromDate: fromDate, ToDate: toDate } }
    );
    return res.data.result;
  },

  getSalesReport: async (fromDate: string, toDate: string): Promise<SalesReportDto> => {
    const res = await api.get<{ result: SalesReportDto }>(
      '/api/services/app/Reporting/GetSalesReport',
      { params: { FromDate: fromDate, ToDate: toDate } }
    );
    return res.data.result;
  },

  getNightAuditSummary: async (auditDate: string): Promise<NightAuditSummaryDto> => {
    const res = await api.get<{ result: NightAuditSummaryDto }>(
      '/api/services/app/Reporting/GetNightAuditSummary',
      { params: { AuditDate: auditDate } }
    );
    return res.data.result;
  },

  getPosSalesSummary: async (
    fromDate: string,
    toDate: string,
    outletId?: string
  ): Promise<PosSalesSummaryDto> => {
    const params: Record<string, string> = { FromDate: fromDate, ToDate: toDate };
    if (outletId) params.OutletId = outletId;
    const res = await api.get<{ result: PosSalesSummaryDto }>(
      '/api/services/app/Reporting/GetPosSalesSummary',
      { params }
    );
    return res.data.result;
  },

  getPosZReport: async (
    reportDate: string,
    outletId?: string
  ): Promise<PosZReportDto> => {
    const params: Record<string, string> = { ReportDate: reportDate };
    if (outletId) params.OutletId = outletId;
    const res = await api.get<{ result: PosZReportDto }>(
      '/api/services/app/Reporting/GetPosZReport',
      { params }
    );
    return res.data.result;
  },
};
