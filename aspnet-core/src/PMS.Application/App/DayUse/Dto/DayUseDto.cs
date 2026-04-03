using Abp.Application.Services.Dto;
using Abp.Runtime.Validation;
using PMS.Dto;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace PMS.App.DayUse.Dto;

public class DayUseOfferDto : EntityDto<Guid>
{
    [Required]
    [StringLength(64)]
    public string Code { get; set; } = string.Empty;

    [Required]
    [StringLength(128)]
    public string Name { get; set; } = string.Empty;

    [StringLength(128)]
    public string VariantName { get; set; } = string.Empty;

    [StringLength(512)]
    public string Description { get; set; } = string.Empty;

    public DayUseOfferType OfferType { get; set; }
    public DayUseGuestContext GuestContext { get; set; }
    public DayUseGuestCategory? GuestCategory { get; set; }
    public int? DurationMinutes { get; set; }

    [Required]
    public Guid ChargeTypeId { get; set; }

    public string ChargeTypeName { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public int SortOrder { get; set; }
    public bool IsActive { get; set; }
}

public class DayUseOfferListDto : EntityDto<Guid>
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string VariantName { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DayUseOfferType OfferType { get; set; }
    public DayUseGuestContext GuestContext { get; set; }
    public DayUseGuestCategory? GuestCategory { get; set; }
    public int? DurationMinutes { get; set; }
    public Guid ChargeTypeId { get; set; }
    public string ChargeTypeName { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public int SortOrder { get; set; }
    public bool IsActive { get; set; }
}

public class CreateDayUseOfferDto
{
    [Required]
    [StringLength(64)]
    public string Code { get; set; } = string.Empty;

    [Required]
    [StringLength(128)]
    public string Name { get; set; } = string.Empty;

    [StringLength(128)]
    public string VariantName { get; set; } = string.Empty;

    [StringLength(512)]
    public string Description { get; set; } = string.Empty;

    public DayUseOfferType OfferType { get; set; }
    public DayUseGuestContext GuestContext { get; set; }
    public DayUseGuestCategory? GuestCategory { get; set; }
    public int? DurationMinutes { get; set; }

    [Required]
    public Guid ChargeTypeId { get; set; }

    [Range(0, double.MaxValue)]
    public decimal Amount { get; set; }

    public int SortOrder { get; set; }
}

public class UpdateDayUseOfferDto : CreateDayUseOfferDto
{
    [Required]
    public Guid Id { get; set; }

    public bool IsActive { get; set; }
}

public class GetDayUseOffersInput : PagedResultFilterRequestDto, IShouldNormalize
{
    public DayUseGuestContext? GuestContext { get; set; }
    public DayUseOfferType? OfferType { get; set; }
    public bool? IsActive { get; set; }

    public void Normalize()
    {
        Sorting ??= "SortOrder asc, Name asc";
    }
}

public class DayUseOfferAvailabilityInput
{
    public DayUseGuestContext? GuestContext { get; set; }
    public DayUseOfferType? OfferType { get; set; }
}

public class DayUseVisitLineDto : EntityDto<Guid>
{
    public Guid DayUseOfferId { get; set; }
    public Guid ChargeTypeId { get; set; }
    public string ChargeTypeName { get; set; } = string.Empty;
    public DayUseOfferType OfferType { get; set; }
    public DayUseGuestContext GuestContext { get; set; }
    public DayUseGuestCategory? GuestCategory { get; set; }
    public string OfferCode { get; set; } = string.Empty;
    public string OfferName { get; set; } = string.Empty;
    public string VariantName { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int? DurationMinutes { get; set; }
    public decimal Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal Amount { get; set; }
}

public class DayUsePaymentDto : EntityDto<Guid>
{
    public Guid PaymentMethodId { get; set; }
    public string PaymentMethodName { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public DateTime PaidAt { get; set; }
    public string ReferenceNo { get; set; } = string.Empty;
    public string Notes { get; set; } = string.Empty;
}

public class DayUseVisitDto : EntityDto<Guid>
{
    public string VisitNo { get; set; } = string.Empty;
    public Guid GuestId { get; set; }
    public string GuestName { get; set; } = string.Empty;
    public Guid? StayId { get; set; }
    public Guid? RoomId { get; set; }
    public DateTime VisitDate { get; set; }
    public TimeSpan AccessStartTime { get; set; }
    public TimeSpan AccessEndTime { get; set; }
    public DayUseGuestContext GuestContext { get; set; }
    public DayUseStatus Status { get; set; }
    public string Remarks { get; set; } = string.Empty;
    public decimal TotalAmount { get; set; }
    public decimal PaidAmount { get; set; }
    public decimal BalanceAmount { get; set; }
    public List<DayUseVisitLineDto> Lines { get; set; } = [];
    public List<DayUsePaymentDto> Payments { get; set; } = [];
}

public class DayUseVisitListDto : EntityDto<Guid>
{
    public string VisitNo { get; set; } = string.Empty;
    public string GuestName { get; set; } = string.Empty;
    public DateTime VisitDate { get; set; }
    public DayUseGuestContext GuestContext { get; set; }
    public DayUseStatus Status { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal PaidAmount { get; set; }
    public decimal BalanceAmount { get; set; }
}

public class GetDayUseVisitsInput : PagedResultFilterRequestDto, IShouldNormalize
{
    public DayUseGuestContext? GuestContext { get; set; }
    public DayUseStatus? Status { get; set; }
    public DateTime? VisitDate { get; set; }

    public void Normalize()
    {
        Sorting ??= "VisitDate desc, VisitNo desc";
    }
}

public class CreateDayUseSaleLineDto
{
    [Required]
    public Guid OfferId { get; set; }

    [Range(0.0001, double.MaxValue)]
    public decimal Quantity { get; set; } = 1;

    [StringLength(512)]
    public string Description { get; set; } = string.Empty;
}

public class CreateDayUsePaymentDto
{
    [Required]
    public Guid PaymentMethodId { get; set; }

    [Range(0.0001, double.MaxValue)]
    public decimal Amount { get; set; }

    [StringLength(64)]
    public string ReferenceNo { get; set; } = string.Empty;

    [StringLength(512)]
    public string Notes { get; set; } = string.Empty;
}

public class CreateDayUseSaleDto
{
    [Required]
    public Guid GuestId { get; set; }

    public Guid? StayId { get; set; }
    public Guid? RoomId { get; set; }

    [Required]
    public DateTime VisitDate { get; set; }

    [Required]
    public TimeSpan AccessStartTime { get; set; }

    [Required]
    public TimeSpan AccessEndTime { get; set; }

    public DayUseGuestContext GuestContext { get; set; }

    [StringLength(512)]
    public string Remarks { get; set; } = string.Empty;

    [Required]
    public List<CreateDayUseSaleLineDto> Lines { get; set; } = [];

    public List<CreateDayUsePaymentDto> Payments { get; set; } = [];
}

public class DayUseSaleResultDto
{
    public Guid VisitId { get; set; }
    public string VisitNo { get; set; } = string.Empty;
    public decimal TotalAmount { get; set; }
    public decimal PaidAmount { get; set; }
    public decimal BalanceAmount { get; set; }
    public bool PostedToFolio { get; set; }
}