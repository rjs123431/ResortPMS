using System;
using System.Collections.Generic;

namespace PMS.Reporting.Dto;

/// <summary>
/// Z-Report / End-of-Day report for POS: single-day summary with payment breakdown.
/// </summary>
public class PosZReportDto
{
    public DateTime ReportDate { get; set; }
    /// <summary>Display label: "Z-Report" or "EOD Summary".</summary>
    public string ReportType { get; set; } = "Z-Report";
    public Guid? OutletId { get; set; }
    public string OutletName { get; set; } = string.Empty;
    public DateTime GeneratedAt { get; set; }
    public int OrdersCount { get; set; }
    /// <summary>Sum of (quantity × price) for non-cancelled items, before discounts.</summary>
    public decimal GrossSales { get; set; }
    /// <summary>Total discounts (percent + amount + senior citizen) across orders.</summary>
    public decimal DiscountsTotal { get; set; }
    /// <summary>Total service charge + room service charge.</summary>
    public decimal ServiceChargesTotal { get; set; }
    /// <summary>Gross sales − discounts + service charges (net sales).</summary>
    public decimal NetSales { get; set; }
    public decimal PaymentsTotal { get; set; }
    public List<PosZReportPaymentRowDto> PaymentsByMethod { get; set; } = [];
}

public class PosZReportPaymentRowDto
{
    public Guid PaymentMethodId { get; set; }
    public string PaymentMethodName { get; set; } = string.Empty;
    public decimal Amount { get; set; }
}
