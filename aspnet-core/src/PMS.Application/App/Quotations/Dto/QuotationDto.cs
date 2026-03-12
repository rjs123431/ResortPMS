using Abp.Application.Services.Dto;
using Abp.AutoMapper;
using Abp.Runtime.Validation;
using PMS.Dto;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace PMS.App.Quotations.Dto;

[AutoMapFrom(typeof(Quotation))]
public class QuotationDto : EntityDto<Guid>
{
    public string QuotationNo { get; set; }
    public Guid? GuestId { get; set; }
    public string GuestName { get; set; }
    public string FirstName { get; set; }
    public string LastName { get; set; }
    public string Phone { get; set; }
    public string Email { get; set; }
    public DateTime QuotationDate { get; set; }
    public DateTime ArrivalDate { get; set; }
    public DateTime DepartureDate { get; set; }
    public int Nights { get; set; }
    public int Adults { get; set; }
    public int Children { get; set; }
    public QuotationStatus Status { get; set; }
    public decimal TotalAmount { get; set; }
    public string Notes { get; set; }
    public string SpecialRequests { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public List<QuotationRoomDto> Rooms { get; set; } = [];
    public List<QuotationExtraBedDto> ExtraBeds { get; set; } = [];
}

[AutoMapFrom(typeof(Quotation))]
public class QuotationListDto : EntityDto<Guid>
{
    public string QuotationNo { get; set; }
    public Guid? GuestId { get; set; }
    public string GuestName { get; set; }
    public DateTime ArrivalDate { get; set; }
    public DateTime DepartureDate { get; set; }
    public int Nights { get; set; }
    public QuotationStatus Status { get; set; }
    public decimal TotalAmount { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public DateTime CreationTime { get; set; }
}

public class CreateQuotationDto : IValidatableObject
{
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
    [Required][MinLength(1)] public List<CreateQuotationRoomDto> Rooms { get; set; } = [];
    public List<CreateQuotationExtraBedDto> ExtraBeds { get; set; } = [];

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (DepartureDate.Date <= ArrivalDate.Date)
            yield return new ValidationResult("DepartureDate must be after ArrivalDate.", [nameof(DepartureDate)]);
    }
}

public class UpdateQuotationDto : IValidatableObject
{
    [Required] public Guid Id { get; set; }
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
    [Required][MinLength(1)] public List<CreateQuotationRoomDto> Rooms { get; set; } = [];
    public List<CreateQuotationExtraBedDto> ExtraBeds { get; set; } = [];

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (DepartureDate.Date <= ArrivalDate.Date)
            yield return new ValidationResult("DepartureDate must be after ArrivalDate.", [nameof(DepartureDate)]);
    }
}

[AutoMapFrom(typeof(QuotationRoom))]
public class QuotationRoomDto : EntityDto<Guid>
{
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

public class CreateQuotationRoomDto
{
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

[AutoMapFrom(typeof(QuotationExtraBed))]
public class QuotationExtraBedDto : EntityDto<Guid>
{
    public Guid? ExtraBedTypeId { get; set; }
    public string ExtraBedTypeName { get; set; }
    public int Quantity { get; set; }
    public decimal RatePerNight { get; set; }
    public int NumberOfNights { get; set; }
    public decimal Amount { get; set; }
}

public class CreateQuotationExtraBedDto
{
    public Guid? ExtraBedTypeId { get; set; }
    [StringLength(128)] public string ExtraBedTypeName { get; set; }
    [Range(1, int.MaxValue)] public int Quantity { get; set; } = 1;
    [Range(0, double.MaxValue)] public decimal RatePerNight { get; set; }
    [Range(1, int.MaxValue)] public int NumberOfNights { get; set; }
    [Range(0, double.MaxValue)] public decimal Amount { get; set; }
}

public class GetQuotationsInput : PagedResultFilterRequestDto, IShouldNormalize
{
    public QuotationStatus? Status { get; set; }
    public bool? IncludeExpired { get; set; }

    public void Normalize()
    {
        Sorting ??= "CreationTime desc";
    }
}
