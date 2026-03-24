using Abp.Application.Services;
using Abp.Authorization;
using PMS.Authorization;
using PMS.Reporting;
using PMS.Reporting.Dto;
using System;
using System.Threading.Tasks;

namespace PMS.App.Reports;

public interface IReportsDashboardAppService : IApplicationService
{
    Task<DashboardKpisDto> GetSummaryAsync(DateTime? asOfDate = null);
}

[AbpAuthorize(PermissionNames.Pages_Reports)]
public class ReportsDashboardAppService(
    IReportingAppService reportingAppService
) : ApplicationService, IReportsDashboardAppService
{
    public async Task<DashboardKpisDto> GetSummaryAsync(DateTime? asOfDate = null)
    {
        var kpis = await reportingAppService.GetDashboardKpisAsync(asOfDate);

        // Reports dashboard should present arrivals based on today's reservation arrivals,
        // matching front desk arrival planning and operational views.
        kpis.ArrivalsToday = kpis.ReservationsToday;

        return kpis;
    }
}
