using Abp.Application.Services.Dto;
using Abp.Runtime.Validation;
using PMS.Dto;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;

namespace PMS.App.Stays.Dto;

// ── Stay DTOs ──────────────────────────────────────────────────────────────────
public class StayDto : EntityDto<Guid>
{
    public string StayNo { get; set; }
    public Guid? ReservationId { get; set; }
    public Guid GuestId { get; set; }
    public string GuestName { get; set; }
    public DateTime CheckInDateTime { get; set; }
    public DateTime ExpectedCheckOutDateTime { get; set; }
    public DateTime? ActualCheckOutDateTime { get; set; }
    public StayStatus Status { get; set; }
    public string RoomNumber { get; set; }
    public string RoomTypeName { get; set; }
    public List<StayGuestDto> Guests { get; set; } = [];
}

public class StayListDto : EntityDto<Guid>
{
    public string StayNo { get; set; }
    public string GuestName { get; set; }
    public DateTime CheckInDateTime { get; set; }
    public DateTime ExpectedCheckOutDateTime { get; set; }
    public StayStatus Status { get; set; }
    public string RoomNumber { get; set; }
    public int NightsElapsed => (int)(DateTime.Now - CheckInDateTime).TotalDays;
}

public class StayGuestDto : EntityDto<Guid>
{
    public Guid GuestId { get; set; }
    public string GuestName { get; set; }
    public bool IsPrimary { get; set; }
}

public class GetStaysInput : PagedResultFilterRequestDto, IShouldNormalize
{
    public void Normalize() { Sorting ??= "CheckInDateTime desc"; }
}

public class GetInHouseWithRoomsInput : PagedResultFilterRequestDto, IShouldNormalize
{
    public DateTime? RoomDateFrom { get; set; }
    public DateTime? RoomDateTo { get; set; }
    public string RoomIdsCsv { get; set; }
    public List<Guid> RoomIds { get; set; }

    public void Normalize()
    {
        Sorting ??= "CheckInDateTime desc";
        if (RoomIds == null && !string.IsNullOrWhiteSpace(RoomIdsCsv))
        {
            RoomIds = RoomIdsCsv.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Where(s => Guid.TryParse(s, out _))
                .Select(Guid.Parse)
                .ToList();
        }
    }
}

public class TransferRoomDto
{
    [Required] public Guid StayId { get; set; }
    [Required] public Guid ToRoomId { get; set; }
    [StringLength(512)] public string Reason { get; set; }
}

// ── Room Change Request DTOs ───────────────────────────────────────────────────
public class CreateRoomChangeRequestDto
{
    [Required] public Guid StayId { get; set; }
    public Guid? StayRoomId { get; set; }
    [Required] public RoomChangeSource Source { get; set; }
    [Required] public RoomChangeReason Reason { get; set; }
    [StringLength(1024)] public string ReasonDetails { get; set; }
    public Guid? PreferredRoomTypeId { get; set; }
    public Guid? PreferredRoomId { get; set; }
}

public class ApproveRoomChangeRequestDto
{
    [Required] public Guid RequestId { get; set; }
    [Required] public Guid ToRoomId { get; set; }
}

public class RejectRoomChangeRequestDto
{
    [Required] public Guid RequestId { get; set; }
    [Required][StringLength(512)] public string RejectionReason { get; set; }
}

public class CancelRoomChangeRequestDto
{
    [Required] public Guid RequestId { get; set; }
    [StringLength(512)] public string CancellationReason { get; set; }
}

public class ExecuteRoomChangeDto
{
    [Required] public Guid RequestId { get; set; }
}

public class RoomChangeRequestDto : EntityDto<Guid>
{
    public Guid StayId { get; set; }
    public string StayNo { get; set; }
    public string GuestName { get; set; }
    public RoomChangeSource Source { get; set; }
    public RoomChangeReason Reason { get; set; }
    public string ReasonDetails { get; set; }
    public string FromRoomNumber { get; set; }
    public string FromRoomTypeName { get; set; }
    public string ToRoomNumber { get; set; }
    public string ToRoomTypeName { get; set; }
    public string PreferredRoomTypeName { get; set; }
    public RoomChangeRequestStatus Status { get; set; }
    public DateTime RequestedAt { get; set; }
    public string RequestedBy { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public string ApprovedBy { get; set; }
    public DateTime? CompletedAt { get; set; }
    public string CompletedBy { get; set; }
}

public class RoomChangeRequestListDto : EntityDto<Guid>
{
    public string StayNo { get; set; }
    public string GuestName { get; set; }
    public RoomChangeSource Source { get; set; }
    public RoomChangeReason Reason { get; set; }
    public string FromRoomNumber { get; set; }
    public string ToRoomNumber { get; set; }
    public RoomChangeRequestStatus Status { get; set; }
    public DateTime RequestedAt { get; set; }
}

public class AvailableRoomForChangeDto
{
    public Guid RoomId { get; set; }
    public string RoomNumber { get; set; }
    public Guid RoomTypeId { get; set; }
    public string RoomTypeName { get; set; }
    public decimal BaseRate { get; set; }
    public string Floor { get; set; }
    public HousekeepingStatus HousekeepingStatus { get; set; }
    public bool IsUpgrade { get; set; }
    public bool IsDowngrade { get; set; }
    public bool IsSameType { get; set; }
}

public class ExtendStayDto
{
    [Required] public Guid StayId { get; set; }
    [Required] public DateTime NewDepartureDate { get; set; }
    [StringLength(128)] public string ApprovedBy { get; set; }
    [StringLength(512)] public string Reason { get; set; }
}

public class AddGuestRequestDto
{
    [Required] public Guid StayId { get; set; }
    [Required] public List<GuestRequestType> RequestTypes { get; set; } = [];
    [StringLength(1024)] public string Description { get; set; }
}

public class AddIncidentDto
{
    [Required] public Guid StayId { get; set; }
    [Required][StringLength(2048)] public string Description { get; set; }
}

public class GuestRequestListDto : EntityDto<Guid>
{
    public GuestRequestType RequestTypes { get; set; }
    public string Description { get; set; }
    public string Status { get; set; }
    public DateTime RequestedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
}

public class CompleteGuestRequestDto
{
    [Required] public Guid GuestRequestId { get; set; }
    [StringLength(512)] public string Remarks { get; set; }
}

public class GuestRequestTaskStatusDto
{
    public Guid TaskId { get; set; }
    public string RoomNumber { get; set; }
    public HousekeepingTaskType TaskType { get; set; }
    public HousekeepingTaskStatus Status { get; set; }
    public DateTime TaskDate { get; set; }
    public DateTime? StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public string Remarks { get; set; }
}

public class GuestRequestCompletionContextDto
{
    public Guid GuestRequestId { get; set; }
    public Guid StayId { get; set; }
    public GuestRequestType RequestTypes { get; set; }
    public string Description { get; set; }
    public string Status { get; set; }
    public DateTime RequestedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public List<GuestRequestTaskStatusDto> RelatedTasks { get; set; } = [];
}

// ── Folio DTOs ────────────────────────────────────────────────────────────────
public class FolioDto : EntityDto<Guid>
{
    public string FolioNo { get; set; }
    public Guid StayId { get; set; }
    public FolioStatus Status { get; set; }
    public decimal Balance { get; set; }
    public List<FolioTransactionDto> Transactions { get; set; } = [];
    public List<FolioPaymentDto> Payments { get; set; } = [];
}

public class FolioSummaryDto
{
    public Guid FolioId { get; set; }
    public string FolioNo { get; set; }
    public FolioStatus Status { get; set; }
    public decimal TotalCharges { get; set; }
    public decimal TotalDiscounts { get; set; }
    public decimal TotalPayments { get; set; }
    public decimal Balance { get; set; }
}

public class FolioTransactionDto : EntityDto<Guid>
{
    public FolioTransactionType TransactionType { get; set; }
    public Guid? ChargeTypeId { get; set; }
    public string ChargeTypeName { get; set; }
    public string Description { get; set; }
    public decimal Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal Amount { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal NetAmount { get; set; }
    public DateTime TransactionDate { get; set; }
    public bool IsVoided { get; set; }
    public string VoidReason { get; set; }
}

public class FolioPaymentDto : EntityDto<Guid>
{
    public Guid PaymentMethodId { get; set; }
    public string PaymentMethodName { get; set; }
    public decimal Amount { get; set; }
    public DateTime PaidDate { get; set; }
    public string ReferenceNo { get; set; }
    public bool IsVoided { get; set; }
}

public class PostChargeDto
{
    [Required] public Guid StayId { get; set; }
    [Required] public Guid ChargeTypeId { get; set; }
    [StringLength(512)] public string Description { get; set; }
    [Range(0.01, double.MaxValue)] public decimal Amount { get; set; }
    [Range(0.01, 999)] public decimal Quantity { get; set; } = 1;
    public decimal TaxAmount { get; set; } = 0;
    public decimal DiscountAmount { get; set; } = 0;
}

public class PostPaymentDto
{
    [Required] public Guid StayId { get; set; }
    [Required] public Guid PaymentMethodId { get; set; }
    [Range(0.01, double.MaxValue)] public decimal Amount { get; set; }
    [StringLength(64)] public string ReferenceNo { get; set; }
    [StringLength(512)] public string Notes { get; set; }
}

public class PostRefundDto
{
    [Required] public Guid StayId { get; set; }
    [Range(0.01, double.MaxValue)] public decimal Amount { get; set; }
    [StringLength(512)] public string Description { get; set; }
}

public class VoidTransactionDto
{
    [Required] public Guid StayId { get; set; }
    [Required] public Guid TransactionId { get; set; }
    [Required][StringLength(512)] public string Reason { get; set; }
}

public class SettleFolioDto
{
    [Required] public Guid StayId { get; set; }
}
