using Abp.Application.Services.Dto;
using Abp.AutoMapper;
using Abp.Runtime.Validation;
using PMS.Dto;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace PMS.App.PreCheckIns.Dto;

[AutoMapFrom(typeof(PreCheckIn))]
public class PreCheckInDto : EntityDto<Guid>
{
    public string PreCheckInNo { get; set; }
    public Guid? ReservationId { get; set; }
    public Guid? GuestId { get; set; }
    public string GuestName { get; set; }
    public string FirstName { get; set; }
    public string LastName { get; set; }
    public string Phone { get; set; }
    public string Email { get; set; }
    public DateTime PreCheckInDate { get; set; }
    public DateTime ArrivalDate { get; set; }
    public DateTime DepartureDate { get; set; }
    public int Nights { get; set; }
    public int Adults { get; set; }
    public int Children { get; set; }
    public PreCheckInStatus Status { get; set; }
    public decimal TotalAmount { get; set; }
    public string Notes { get; set; }
    public string SpecialRequests { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public List<PreCheckInRoomDto> Rooms { get; set; } = [];
    public List<PreCheckInExtraBedDto> ExtraBeds { get; set; } = [];
}

[AutoMapFrom(typeof(PreCheckIn))]
public class PreCheckInListDto : EntityDto<Guid>
{
    public string PreCheckInNo { get; set; }
    public Guid? ReservationId { get; set; }
    public Guid? GuestId { get; set; }
    public string GuestName { get; set; }
    public DateTime ArrivalDate { get; set; }
    public DateTime DepartureDate { get; set; }
    public int Nights { get; set; }
    public PreCheckInStatus Status { get; set; }
    public decimal TotalAmount { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public DateTime CreationTime { get; set; }
    public bool IsFromReservation => ReservationId.HasValue;
}

public class CreatePreCheckInDto : IValidatableObject
{
    public Guid? ReservationId { get; set; }
    public Guid? GuestId { get; set; }
    [Required] public DateTime ArrivalDate { get; set; }
    [Required] public DateTime DepartureDate { get; set; }
    [Range(1, 20)] public int Adults { get; set; } = 1;
    [Range(0, 10)] public int Children { get; set; } = 0;
    public decimal TotalAmount { get; set; }
    [StringLength(1024)] public string Notes { get; set; }
    [StringLength(2048)] public string SpecialRequests { get; set; }
    [StringLength(256)] public string GuestName { get; set; }
    [StringLength(128)] public string FirstName { get; set; }
    [StringLength(128)] public string LastName { get; set; }
    [StringLength(64)] public string Phone { get; set; }
    [StringLength(256)] public string Email { get; set; }
    [Required][MinLength(1)] public List<CreatePreCheckInRoomDto> Rooms { get; set; } = [];
    public List<CreatePreCheckInExtraBedDto> ExtraBeds { get; set; } = [];

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (DepartureDate.Date <= ArrivalDate.Date)
            yield return new ValidationResult("DepartureDate must be after ArrivalDate.", [nameof(DepartureDate)]);
    }
}

public class UpdatePreCheckInDto : IValidatableObject
{
    [Required] public Guid Id { get; set; }
    public Guid? ReservationId { get; set; }
    public Guid? GuestId { get; set; }
    [Required] public DateTime ArrivalDate { get; set; }
    [Required] public DateTime DepartureDate { get; set; }
    [Range(1, 20)] public int Adults { get; set; } = 1;
    [Range(0, 10)] public int Children { get; set; } = 0;
    public decimal TotalAmount { get; set; }
    [StringLength(1024)] public string Notes { get; set; }
    [StringLength(2048)] public string SpecialRequests { get; set; }
    [StringLength(256)] public string GuestName { get; set; }
    [StringLength(128)] public string FirstName { get; set; }
    [StringLength(128)] public string LastName { get; set; }
    [StringLength(64)] public string Phone { get; set; }
    [StringLength(256)] public string Email { get; set; }
    [Required][MinLength(1)] public List<CreatePreCheckInRoomDto> Rooms { get; set; } = [];
    public List<CreatePreCheckInExtraBedDto> ExtraBeds { get; set; } = [];

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (DepartureDate.Date <= ArrivalDate.Date)
            yield return new ValidationResult("DepartureDate must be after ArrivalDate.", [nameof(DepartureDate)]);
    }
}

[AutoMapFrom(typeof(PreCheckInRoom))]
public class PreCheckInRoomDto : EntityDto<Guid>
{
    public Guid? ReservationRoomId { get; set; }
    public Guid RoomTypeId { get; set; }
    public string RoomTypeName { get; set; }
    public Guid? RoomId { get; set; }
    public string RoomNumber { get; set; }
    public decimal RatePerNight { get; set; }
    public int NumberOfNights { get; set; }
    public decimal Amount { get; set; }
    public int SeniorCitizenCount { get; set; }
    public decimal SeniorCitizenDiscountAmount { get; set; }
    public decimal NetAmount { get; set; }
}

public class CreatePreCheckInRoomDto
{
    public Guid? ReservationRoomId { get; set; }
    [Required] public Guid RoomTypeId { get; set; }
    public Guid? RoomId { get; set; }
    [StringLength(128)] public string RoomTypeName { get; set; }
    [StringLength(16)] public string RoomNumber { get; set; }
    [Range(0, double.MaxValue)] public decimal RatePerNight { get; set; }
    [Range(1, int.MaxValue)] public int NumberOfNights { get; set; }
    [Range(0, double.MaxValue)] public decimal Amount { get; set; }
    [Range(0, int.MaxValue)] public int SeniorCitizenCount { get; set; }
    [Range(0, double.MaxValue)] public decimal SeniorCitizenDiscountAmount { get; set; }
    [Range(0, double.MaxValue)] public decimal NetAmount { get; set; }
}

[AutoMapFrom(typeof(PreCheckInExtraBed))]
public class PreCheckInExtraBedDto : EntityDto<Guid>
{
    public Guid? ExtraBedTypeId { get; set; }
    public string ExtraBedTypeName { get; set; }
    public int Quantity { get; set; }
    public decimal RatePerNight { get; set; }
    public int NumberOfNights { get; set; }
    public decimal Amount { get; set; }
}

public class CreatePreCheckInExtraBedDto
{
    public Guid? ExtraBedTypeId { get; set; }
    [StringLength(128)] public string ExtraBedTypeName { get; set; }
    [Range(1, int.MaxValue)] public int Quantity { get; set; } = 1;
    [Range(0, double.MaxValue)] public decimal RatePerNight { get; set; }
    [Range(1, int.MaxValue)] public int NumberOfNights { get; set; }
    [Range(0, double.MaxValue)] public decimal Amount { get; set; }
}

public class GetPreCheckInsInput : PagedResultFilterRequestDto, IShouldNormalize
{
    public PreCheckInStatus? Status { get; set; }
    public bool? IncludeExpired { get; set; }
    public bool? WalkInOnly { get; set; }
    public bool? ReservationOnly { get; set; }
    public Guid? ReservationId { get; set; }

    public void Normalize()
    {
        Sorting ??= "CreationTime desc";
    }
}
