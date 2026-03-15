using System;
using System.Collections.Generic;

namespace PMS.Reporting.Dto;

public class NightAuditSummaryDto
{
    public DateTime AuditDate { get; set; }
    public int Arrivals { get; set; }
    public int Departures { get; set; }
    public int InHouseAtStart { get; set; }
    public int InHouseAtEnd { get; set; }
    public int RoomsSold { get; set; }
    public decimal RoomRevenue { get; set; }
    public decimal OtherRevenue { get; set; }
    public decimal TotalCharges { get; set; }
    public decimal TotalPayments { get; set; }
    public decimal OutstandingBalance { get; set; }
    public List<NightAuditFolioRowDto> FolioSummary { get; set; } = [];
}

public class NightAuditFolioRowDto
{
    public string StayNo { get; set; } = string.Empty;
    public string GuestName { get; set; } = string.Empty;
    public string RoomNumber { get; set; } = string.Empty;
    public decimal Charges { get; set; }
    public decimal Payments { get; set; }
    public decimal Balance { get; set; }
}
