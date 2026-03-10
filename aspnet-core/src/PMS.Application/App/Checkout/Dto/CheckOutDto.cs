using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace PMS.App.Checkout.Dto;

public class CheckOutStatementDto
{
    public Guid StayId { get; set; }
    public string StayNo { get; set; }
    public string GuestName { get; set; }
    public string RoomNumber { get; set; }
    public DateTime CheckInDateTime { get; set; }
    public DateTime ExpectedCheckOutDateTime { get; set; }
    public Guid FolioId { get; set; }
    public string FolioNo { get; set; }
    public FolioStatus FolioStatus { get; set; }
    public decimal TotalCharges { get; set; }
    public decimal TotalDiscounts { get; set; }
    public decimal TotalPayments { get; set; }
    public decimal BalanceDue { get; set; }
    public decimal OverPayment { get; set; }
    public List<StayRoomRecordDto> StayRooms { get; set; } = [];
    public List<StatementLineDto> Transactions { get; set; } = [];
    public List<StatementPaymentDto> Payments { get; set; } = [];
}

public class StayRoomRecordDto
{
    public Guid StayRoomId { get; set; }
    public Guid RoomId { get; set; }
    public string RoomNumber { get; set; }
    public DateTime AssignedAt { get; set; }
    public DateTime? ReleasedAt { get; set; }
}

public class StatementLineDto
{
    public DateTime Date { get; set; }
    public string Description { get; set; }
    public string ChargeTypeName { get; set; }
    public string Type { get; set; }
    public decimal Amount { get; set; }
}

public class StatementPaymentDto
{
    public DateTime Date { get; set; }
    public string PaymentMethodName { get; set; }
    public decimal Amount { get; set; }
    public string ReferenceNo { get; set; }
}

public class ProcessCheckOutDto
{
    [Required] public Guid StayId { get; set; }
    [Required][MinLength(0)] public List<CheckOutPaymentDto> Payments { get; set; } = [];
}

public class CheckOutPaymentDto
{
    [Required] public Guid PaymentMethodId { get; set; }
    [Range(0.01, double.MaxValue)] public decimal Amount { get; set; }
    [StringLength(64)] public string ReferenceNo { get; set; }
}

public class WriteOffBalanceDto
{
    [Required] public Guid StayId { get; set; }
    [Required][StringLength(512)] public string Reason { get; set; }
}

public class CheckOutResultDto
{
    public Guid StayId { get; set; }
    public string StayNo { get; set; }
    public Guid ReceiptId { get; set; }
    public string ReceiptNo { get; set; }
    public decimal TotalCharged { get; set; }
    public decimal TotalPaid { get; set; }
    public decimal BalanceDue { get; set; }
}

public class ReceiptDto
{
    public Guid Id { get; set; }
    public string ReceiptNo { get; set; }
    public Guid StayId { get; set; }
    public string StayNo { get; set; }
    public string GuestName { get; set; }
    public string RoomNumber { get; set; }
    public DateTime IssuedDate { get; set; }
    public decimal Amount { get; set; }
    public List<ReceiptPaymentDto> Payments { get; set; } = [];
}

public class ReceiptPaymentDto
{
    public Guid PaymentMethodId { get; set; }
    public string PaymentMethodName { get; set; }
    public decimal Amount { get; set; }
}
