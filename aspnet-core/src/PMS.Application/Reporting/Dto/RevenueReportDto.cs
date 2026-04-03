using System;
using System.Collections.Generic;

namespace PMS.Reporting.Dto;

public class RevenueReportDto
{
    public DateTime FromDate { get; set; }
    public DateTime ToDate { get; set; }
    public decimal TotalCharges { get; set; }
    public decimal TotalPayments { get; set; }
    public decimal TotalDiscounts { get; set; }
    public decimal ConferenceChargesTotal { get; set; }
    public decimal ConferencePaymentsTotal { get; set; }
    public List<RevenueByDayDto> ByDay { get; set; } = [];
    public List<RevenueByChargeTypeDto> ByChargeType { get; set; } = [];
}

public class RevenueByDayDto
{
    public DateTime Date { get; set; }
    public decimal Charges { get; set; }
    public decimal Payments { get; set; }
}

public class RevenueByChargeTypeDto
{
    public string ChargeTypeName { get; set; } = string.Empty;
    public decimal Amount { get; set; }
}
