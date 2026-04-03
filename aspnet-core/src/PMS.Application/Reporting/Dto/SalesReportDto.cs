using System;
using System.Collections.Generic;

namespace PMS.Reporting.Dto;

public class SalesReportDto
{
    public DateTime FromDate { get; set; }
    public DateTime ToDate { get; set; }
    public decimal TotalPayments { get; set; }
    public int PaymentsCount { get; set; }
    public List<SalesByPaymentMethodDto> ByPaymentMethod { get; set; } = [];
    public List<SalesPaymentRowDto> Payments { get; set; } = [];
}

public class SalesByPaymentMethodDto
{
    public Guid PaymentMethodId { get; set; }
    public string PaymentMethodName { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public int PaymentsCount { get; set; }
}

public class SalesPaymentRowDto
{
    public DateTime ReceivedAt { get; set; }
    public Guid PaymentMethodId { get; set; }
    public string PaymentMethodName { get; set; } = string.Empty;
    public string SourceType { get; set; } = string.Empty;
    public string DocumentNo { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string ReferenceNo { get; set; } = string.Empty;
    public decimal Amount { get; set; }
}