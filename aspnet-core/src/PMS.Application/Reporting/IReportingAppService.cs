using System;
using System.Threading.Tasks;
using Abp.Application.Services;
using PMS.Reporting.Dto;

namespace PMS.Reporting;

public interface IReportingAppService : IApplicationService
{
    Task<DashboardKpisDto> GetDashboardKpisAsync(DateTime? asOfDate = null);
    Task<OccupancyReportDto> GetOccupancyReportAsync(DateTime fromDate, DateTime toDate);
    Task<RevenueReportDto> GetRevenueReportAsync(DateTime fromDate, DateTime toDate);
    Task<SalesReportDto> GetSalesReportAsync(DateTime fromDate, DateTime toDate);
    Task<NightAuditSummaryDto> GetNightAuditSummaryAsync(DateTime auditDate);
    Task<PosSalesSummaryDto> GetPosSalesSummaryAsync(DateTime fromDate, DateTime toDate, Guid? outletId = null);
    Task<PosZReportDto> GetPosZReportAsync(DateTime reportDate, Guid? outletId = null);
}
