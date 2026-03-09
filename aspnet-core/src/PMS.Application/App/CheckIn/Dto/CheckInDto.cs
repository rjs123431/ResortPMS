using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace PMS.App.CheckIn.Dto;

public class CheckInFromReservationDto
{
    [Required] public Guid ReservationId { get; set; }
    [Required] public Guid RoomId { get; set; }
    public DateTime? ExpectedCheckOutDate { get; set; }
    public Guid[] AdditionalGuestIds { get; set; } = [];
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

public class CheckInResultDto
{
    public Guid StayId { get; set; }
    public string StayNo { get; set; }
    public Guid FolioId { get; set; }
    public string FolioNo { get; set; }
}
