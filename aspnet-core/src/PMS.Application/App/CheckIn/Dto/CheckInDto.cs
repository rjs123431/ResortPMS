using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace PMS.App.CheckIn.Dto;

public class CheckInFromReservationDto
{
    [Required] public Guid ReservationId { get; set; }
    [Required] public Guid RoomId { get; set; }
    public Guid? ReservationRoomId { get; set; }
    public DateTime? ExpectedCheckOutDate { get; set; }
    public List<CheckInReservationRoomUpdateDto> ReservationRooms { get; set; } = [];
    public List<CheckInReservationExtraBedDto> ExtraBeds { get; set; } = [];
    public List<CheckInReservationPaymentDto> Payments { get; set; } = [];
    public decimal? RefundableCashDepositAmount { get; set; }
    public Guid? RefundableCashDepositPaymentMethodId { get; set; }
    [StringLength(64)] public string RefundableCashDepositReference { get; set; }
    public Guid[] AdditionalGuestIds { get; set; } = [];
}

public class CheckInReservationRoomUpdateDto
{
    [Required] public Guid ReservationRoomId { get; set; }
    [Required] public Guid RoomTypeId { get; set; }
    [Required] public Guid RoomId { get; set; }
    public decimal RatePerNight { get; set; }
    public int NumberOfNights { get; set; }
    public decimal Amount { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal NetAmount { get; set; }
}

public class CheckInReservationExtraBedDto
{
    public Guid? ExtraBedTypeId { get; set; }
    [Required] public DateTime ArrivalDate { get; set; }
    [Required] public DateTime DepartureDate { get; set; }
    public int Quantity { get; set; } = 1;
    public decimal RatePerNight { get; set; }
    public int NumberOfNights { get; set; }
    public decimal Amount { get; set; }
}

public class CheckInReservationPaymentDto
{
    [Required] public Guid PaymentMethodId { get; set; }
    [Range(0.0001, double.MaxValue)] public decimal Amount { get; set; }
    public DateTime? PaidDate { get; set; }
    [StringLength(64)] public string ReferenceNo { get; set; }
}

public class WalkInCheckInDto
{
    [Required] public Guid GuestId { get; set; }
    [Required] public Guid RoomId { get; set; }
    [Required] public DateTime ExpectedCheckOutDate { get; set; }
    public Guid[] AdditionalGuestIds { get; set; } = [];
    public decimal AdvancePaymentAmount { get; set; } = 0;
    public Guid? PaymentMethodId { get; set; }
    [StringLength(64)] public string PaymentReference { get; set; }
}

public class CheckInWalkInDto
{
    [Required] public Guid GuestId { get; set; }
    [Required] public Guid RoomId { get; set; }
    public Guid? ReservationRoomId { get; set; }
    public DateTime? ExpectedCheckOutDate { get; set; }
    public Guid[] AdditionalGuestIds { get; set; } = [];
    public List<CheckInReservationRoomUpdateDto> ReservationRooms { get; set; } = [];
    public List<CheckInReservationExtraBedDto> ExtraBeds { get; set; } = [];
    public List<CheckInReservationPaymentDto> Payments { get; set; } = [];
    public decimal? RefundableCashDepositAmount { get; set; }
    public Guid? RefundableCashDepositPaymentMethodId { get; set; }
    [StringLength(64)] public string RefundableCashDepositReference { get; set; }
}

public class CheckInResultDto
{
    public Guid StayId { get; set; }
    public string StayNo { get; set; }
    public Guid FolioId { get; set; }
    public string FolioNo { get; set; }
}
