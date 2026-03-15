using System;
using System.Collections.Generic;

namespace PMS.Reporting.Dto;

public class PosSalesSummaryDto
{
    public DateTime FromDate { get; set; }
    public DateTime ToDate { get; set; }
    public int OrdersCount { get; set; }
    public decimal SalesTotal { get; set; }
    public decimal PaymentsTotal { get; set; }
    public List<PosSalesByOutletDto> ByOutlet { get; set; } = [];
    public List<PosSalesByDayDto> ByDay { get; set; } = [];
}

public class PosSalesByOutletDto
{
    public Guid OutletId { get; set; }
    public string OutletName { get; set; } = string.Empty;
    public int OrdersCount { get; set; }
    public decimal SalesTotal { get; set; }
}

public class PosSalesByDayDto
{
    public DateTime Date { get; set; }
    public int OrdersCount { get; set; }
    public decimal SalesTotal { get; set; }
}
