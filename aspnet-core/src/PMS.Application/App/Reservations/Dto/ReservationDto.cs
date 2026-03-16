using Abp.Application.Services.Dto;
using Abp.AutoMapper;
using Abp.Runtime.Validation;
using PMS.Dto;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;

namespace PMS.App.Reservations.Dto;

// ── Detail DTO ───────────────────────────────────────────────────────────────
[AutoMapFrom(typeof(Reservation))]
public class ReservationDto : EntityDto<Guid>
{
    public string ReservationNo { get; set; }
    public Guid? GuestId { get; set; }
    public string GuestName { get; set; }
    public string FirstName { get; set; }
    public string LastName { get; set; }
    public string Phone { get; set; }
    public string Email { get; set; }
    public DateTime ReservationDate { get; set; }
    public DateTime ArrivalDate { get; set; }
    public DateTime DepartureDate { get; set; }
    public int Nights { get; set; }
    public int Adults { get; set; }
    public int Children { get; set; }
    public ReservationStatus Status { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal DepositPercentage { get; set; }
    public decimal DepositRequired { get; set; }
    public decimal DepositPaid { get; set; }
    public string Notes { get; set; }
    public string ReservationConditions { get; set; }
    public string SpecialRequests { get; set; }
    public List<ReservationRoomDto> Rooms { get; set; } = [];
    public List<ReservationExtraBedDto> ExtraBeds { get; set; } = [];
    public List<ReservationGuestDto> Guests { get; set; } = [];
    public List<ReservationDepositDto> Deposits { get; set; } = [];
}

// ── List DTO ─────────────────────────────────────────────────────────────────
[AutoMapFrom(typeof(Reservation))]
public class ReservationListDto : EntityDto<Guid>
{
    public string ReservationNo { get; set; }
    public Guid? GuestId { get; set; }
    public string GuestName { get; set; }
    public string FirstName { get; set; }
    public string LastName { get; set; }
    public string Phone { get; set; }
    public string Email { get; set; }
    public DateTime ArrivalDate { get; set; }
    public DateTime DepartureDate { get; set; }
    public int Nights { get; set; }
    public ReservationStatus Status { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal DepositPercentage { get; set; }
    public decimal DepositPaid { get; set; }
}

// ── Create DTO ───────────────────────────────────────────────────────────────
public class CreateReservationDto : IValidatableObject
{
    public Guid? GuestId { get; set; }
    [Required] public DateTime ArrivalDate { get; set; }
    [Required] public DateTime DepartureDate { get; set; }
    [Range(1, 20)] public int Adults { get; set; } = 1;
    [Range(0, 10)] public int Children { get; set; } = 0;
    public decimal TotalAmount { get; set; }
    [Range(0, 100)] public decimal DepositPercentage { get; set; }
    public decimal DepositRequired { get; set; }
    [StringLength(1024)] public string Notes { get; set; }
    [StringLength(2048)] public string ReservationConditions { get; set; }
    [StringLength(2048)] public string SpecialRequests { get; set; }
    [Required][StringLength(128)] public string FirstName { get; set; }
    [Required][StringLength(128)] public string LastName { get; set; }
    [Required][StringLength(64)] public string Phone { get; set; }
    [StringLength(256)] public string Email { get; set; }
    /// <summary>When true, creates a draft reservation with room type/dates/rates but no room assignment (RoomId and RoomNumber are not saved; no inventory reserved).</summary>
    public bool IsTempReservation { get; set; }
    public List<CreateReservationRoomDto> Rooms { get; set; } = [];
    public List<CreateReservationExtraBedDto> ExtraBeds { get; set; } = [];
    public List<Guid> AdditionalGuestIds { get; set; } = [];

    public System.Collections.Generic.IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (DepartureDate.Date <= ArrivalDate.Date)
            yield return new ValidationResult("DepartureDate must be after ArrivalDate.", [nameof(DepartureDate)]);
        if (IsTempReservation)
        {
            if (Rooms == null || Rooms.Count == 0)
                yield return new ValidationResult("Temp reservation must have at least one room (room type and dates).", [nameof(Rooms)]);
            else if (Rooms.Any(r => r.RoomId.HasValue))
                yield return new ValidationResult("Temp reservation rooms must not have a room assignment (RoomId).", [nameof(Rooms)]);
        }
        else
        {
            if (Rooms == null || Rooms.Count == 0)
                yield return new ValidationResult("At least one room is required when not creating a temp reservation.", [nameof(Rooms)]);
        }
    }
}

// ── Update DTO ───────────────────────────────────────────────────────────────
public class UpdateReservationDto
{
    [Required] public Guid Id { get; set; }
    [Required] public DateTime ArrivalDate { get; set; }
    [Required] public DateTime DepartureDate { get; set; }
    [Range(1, 20)] public int Adults { get; set; } = 1;
    [Range(0, 10)] public int Children { get; set; } = 0;
    public decimal TotalAmount { get; set; }
    [Range(0, 100)] public decimal DepositPercentage { get; set; }
    public decimal DepositRequired { get; set; }
    [StringLength(1024)] public string Notes { get; set; }
    [StringLength(2048)] public string ReservationConditions { get; set; }
        [StringLength(2048)] public string SpecialRequests { get; set; }
        public List<ReservationRoomDto> Rooms { get; set; } = new();
}

public class CancelReservationDto
{
    [Required] public Guid ReservationId { get; set; }
    [StringLength(512)] public string Reason { get; set; }
}

public class RecordReservationDepositDto
{
    [Required] public Guid ReservationId { get; set; }
    [Range(0.01, double.MaxValue)] public decimal Amount { get; set; }
    [Required] public Guid PaymentMethodId { get; set; }
    public DateTime? PaidDate { get; set; }
    [StringLength(64)] public string ReferenceNo { get; set; }
}

public class AddReservationGuestsDto
{
    [Required] public Guid ReservationId { get; set; }
    [Required][MinLength(1)] public List<AddReservationGuestItemDto> Guests { get; set; } = [];
}

public class AddReservationRoomTypesDto
{
    [Required] public Guid ReservationId { get; set; }
    [Required][MinLength(1)] public List<AddReservationRoomTypeItemDto> RoomTypes { get; set; } = [];
}

public class AddReservationExtraBedsDto
{
    [Required] public Guid ReservationId { get; set; }
    [Required][MinLength(1)] public List<AddReservationExtraBedItemDto> ExtraBeds { get; set; } = [];
}

public class AddReservationRoomTypeItemDto
{
    [Required] public Guid RoomTypeId { get; set; }
    [Range(1, int.MaxValue)] public int Quantity { get; set; } = 1;
}

public class AddReservationExtraBedItemDto
{
    [Required] public Guid ExtraBedTypeId { get; set; }
    [Range(1, int.MaxValue)] public int Quantity { get; set; } = 1;
}

public class AddReservationGuestItemDto
{
    [Required] public Guid GuestId { get; set; }
    [Range(0, 150)] public int Age { get; set; }
}

public class UpdateReservationGuestAgeDto
{
    [Required] public Guid ReservationId { get; set; }
    [Required] public Guid ReservationGuestId { get; set; }
    [Range(0, 150)] public int Age { get; set; }
}

public class RemoveReservationGuestDto
{
    [Required] public Guid ReservationId { get; set; }
    [Required] public Guid ReservationGuestId { get; set; }
}

public class RemoveReservationRoomDto
{
    [Required] public Guid ReservationId { get; set; }
    [Required] public Guid ReservationRoomId { get; set; }
}

public class RemoveReservationExtraBedDto
{
    [Required] public Guid ReservationId { get; set; }
    [Required] public Guid ReservationExtraBedId { get; set; }
}

public class AssignReservationRoomDto
{
    [Required] public Guid ReservationId { get; set; }
    [Required] public Guid ReservationRoomId { get; set; }
    [Required] public Guid RoomId { get; set; }
}

// ── Children DTOs ─────────────────────────────────────────────────────────────
[AutoMapFrom(typeof(ReservationRoom))]
public class ReservationRoomDto : EntityDto<Guid>
{
    public Guid RoomTypeId { get; set; }
    public string RoomTypeName { get; set; }
    public Guid? RoomId { get; set; }
    public string RoomNumber { get; set; }
    public DateTime ArrivalDate { get; set; }
    public DateTime DepartureDate { get; set; }
    public decimal RatePerNight { get; set; }
    public int NumberOfNights { get; set; }
    public decimal Amount { get; set; }
    public decimal DiscountPercent { get; set; }
    public decimal DiscountAmount { get; set; }
    public int SeniorCitizenCount { get; set; }
    public decimal SeniorCitizenPercent { get; set; }
    public decimal SeniorCitizenDiscountAmount { get; set; }
    public decimal NetAmount { get; set; }
}

public class CreateReservationRoomDto
{
    [Required] public Guid RoomTypeId { get; set; }
    public Guid? RoomId { get; set; }
    [Range(0, double.MaxValue)] public decimal RatePerNight { get; set; }
    [Range(0, int.MaxValue)] public int NumberOfNights { get; set; }
    [Range(0, double.MaxValue)] public decimal Amount { get; set; }
    [Range(0, 100)] public decimal DiscountPercent { get; set; }
    [Range(0, double.MaxValue)] public decimal DiscountAmount { get; set; }
    [Range(0, int.MaxValue)] public int SeniorCitizenCount { get; set; }
    [Range(0, 100)] public decimal SeniorCitizenPercent { get; set; } = 20;
    [Range(0, double.MaxValue)] public decimal SeniorCitizenDiscountAmount { get; set; }
    [Range(0, double.MaxValue)] public decimal NetAmount { get; set; }
}

[AutoMapFrom(typeof(ReservationExtraBed))]
public class ReservationExtraBedDto : EntityDto<Guid>
{
    public Guid? ExtraBedTypeId { get; set; }
    public string ExtraBedTypeName { get; set; }
    public DateTime ArrivalDate { get; set; }
    public DateTime DepartureDate { get; set; }
    public int Quantity { get; set; }
    public decimal RatePerNight { get; set; }
    public int NumberOfNights { get; set; }
    public decimal Amount { get; set; }
    public decimal DiscountPercent { get; set; }
    public decimal DiscountAmount { get; set; }
    public int SeniorCitizenCount { get; set; }
    public decimal SeniorCitizenPercent { get; set; }
    public decimal SeniorCitizenDiscountAmount { get; set; }
    public decimal NetAmount { get; set; }
}

public class CreateReservationExtraBedDto
{
    public Guid? ExtraBedTypeId { get; set; }
    public DateTime? ArrivalDate { get; set; }
    public DateTime? DepartureDate { get; set; }
    [Range(1, int.MaxValue)] public int Quantity { get; set; } = 1;
    [Range(0, double.MaxValue)] public decimal RatePerNight { get; set; }
    [Range(0, int.MaxValue)] public int NumberOfNights { get; set; }
    [Range(0, double.MaxValue)] public decimal Amount { get; set; }
    [Range(0, 100)] public decimal DiscountPercent { get; set; }
    [Range(0, double.MaxValue)] public decimal DiscountAmount { get; set; }
    [Range(0, int.MaxValue)] public int SeniorCitizenCount { get; set; }
    [Range(0, 100)] public decimal SeniorCitizenPercent { get; set; } = 20;
    [Range(0, double.MaxValue)] public decimal SeniorCitizenDiscountAmount { get; set; }
    [Range(0, double.MaxValue)] public decimal NetAmount { get; set; }
}

[AutoMapFrom(typeof(ReservationGuest))]
public class ReservationGuestDto : EntityDto<Guid>
{
    public Guid GuestId { get; set; }
    public string GuestName { get; set; }
    public int Age { get; set; }
    public bool IsPrimary { get; set; }
}

[AutoMapFrom(typeof(ReservationDeposit))]
public class ReservationDepositDto : EntityDto<Guid>
{
    public decimal Amount { get; set; }
    public Guid PaymentMethodId { get; set; }
    public string PaymentMethodName { get; set; }
    public DateTime PaidDate { get; set; }
    public string ReferenceNo { get; set; }
}

// ── Query Input ───────────────────────────────────────────────────────────────
public class GetReservationsInput : PagedResultFilterRequestDto, IShouldNormalize
{
    public ReservationStatus? Status { get; set; }
    public DateTime? ArrivalDateFrom { get; set; }
    public DateTime? ArrivalDateTo { get; set; }
    public DateTime? OverlapStartDate { get; set; }
    public DateTime? OverlapEndDate { get; set; }
    public Guid? GuestId { get; set; }
    /// <summary>Comma-separated room IDs to filter reservations that have an assigned room in this set.</summary>
    public string RoomIdsCsv { get; set; }
    public List<Guid> RoomIds { get; set; }

    public void Normalize()
    {
        Sorting ??= "ArrivalDate asc, CreationTime asc";
        if (RoomIds == null && !string.IsNullOrWhiteSpace(RoomIdsCsv))
        {
            RoomIds = RoomIdsCsv.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Where(s => Guid.TryParse(s, out _))
                .Select(Guid.Parse)
                .ToList();
        }
    }
}
