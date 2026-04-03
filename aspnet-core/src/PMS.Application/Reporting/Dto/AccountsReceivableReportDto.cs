using System;
using System.Collections.Generic;

namespace PMS.Reporting.Dto;

public class AccountsReceivableReportDto
{
    public DateTime AsOfDate { get; set; }
    public decimal TotalReceivables { get; set; }
    public decimal ReservationBalanceTotal { get; set; }
    public decimal ReservationRoomBalanceTotal { get; set; }
    public decimal ReservationExtrasBalanceTotal { get; set; }
    public decimal InHouseBalanceTotal { get; set; }
    public decimal InHouseChargesTotal { get; set; }
    public List<AccountsReceivableByChargeTypeDto> ByChargeType { get; set; } = [];
    public List<AccountsReceivableReservationRowDto> Reservations { get; set; } = [];
    public List<AccountsReceivableStayRowDto> InHouseStays { get; set; } = [];
}

public class AccountsReceivableByChargeTypeDto
{
    public string ChargeTypeName { get; set; } = string.Empty;
    public decimal Amount { get; set; }
}

public class AccountsReceivableReservationRowDto
{
    public string ReservationNo { get; set; } = string.Empty;
    public DateTime ArrivalDate { get; set; }
    public string GuestName { get; set; } = string.Empty;
    public decimal RoomAmount { get; set; }
    public decimal ExtrasAmount { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal DepositPaid { get; set; }
    public decimal RoomBalance { get; set; }
    public decimal ExtrasBalance { get; set; }
    public decimal Balance { get; set; }
}

public class AccountsReceivableStayRowDto
{
    public string StayNo { get; set; } = string.Empty;
    public DateTime CheckInDateTime { get; set; }
    public string GuestName { get; set; } = string.Empty;
    public string RoomNumber { get; set; } = string.Empty;
    public decimal Charges { get; set; }
    public decimal Balance { get; set; }
}