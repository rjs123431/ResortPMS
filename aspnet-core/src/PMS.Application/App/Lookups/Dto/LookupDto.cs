using Abp.Application.Services.Dto;
using Abp.AutoMapper;
using Abp.Runtime.Validation;
using PMS.Dto;
using System;
using System.ComponentModel.DataAnnotations;

namespace PMS.App.Lookups.Dto;

[AutoMapFrom(typeof(ChargeType))]
[AutoMapTo(typeof(ChargeType))]
public class ChargeTypeDto : EntityDto<Guid>
{
    [Required]
    [StringLength(64)]
    public string Name { get; set; }

    [Required]
    [StringLength(64)]
    public string Category { get; set; }

    public int Sort { get; set; }

    public RoomChargeType RoomChargeType { get; set; }

    public bool IsActive { get; set; }
}

[AutoMapFrom(typeof(ChargeType))]
public class ChargeTypeListDto : EntityDto<Guid>
{
    public string Name { get; set; }
    public string Category { get; set; }
    public int Sort { get; set; }
    public RoomChargeType RoomChargeType { get; set; }
    public bool IsActive { get; set; }
}

[AutoMapTo(typeof(ChargeType))]
public class CreateChargeTypeDto
{
    [Required]
    [StringLength(64)]
    public string Name { get; set; }

    [Required]
    [StringLength(64)]
    public string Category { get; set; }

    public int Sort { get; set; }

    public RoomChargeType RoomChargeType { get; set; }

}

public class GetChargeTypesInput : PagedResultFilterRequestDto, IShouldNormalize
{
    public bool? IsActive { get; set; }

    public void Normalize()
    {
        Sorting ??= "Sort asc, Name asc";
    }
}

[AutoMapFrom(typeof(PaymentMethod))]
[AutoMapTo(typeof(PaymentMethod))]
public class PaymentMethodDto : EntityDto<Guid>
{
    [Required]
    [StringLength(64)]
    public string Name { get; set; }

    public bool IsActive { get; set; }
}

[AutoMapFrom(typeof(PaymentMethod))]
public class PaymentMethodListDto : EntityDto<Guid>
{
    public string Name { get; set; }
    public bool IsActive { get; set; }
}

[AutoMapTo(typeof(PaymentMethod))]
public class CreatePaymentMethodDto
{
    [Required]
    [StringLength(64)]
    public string Name { get; set; }

}

public class GetPaymentMethodsInput : PagedResultFilterRequestDto, IShouldNormalize
{
    public bool? IsActive { get; set; }

    public void Normalize()
    {
        Sorting ??= "Name";
    }
}

[AutoMapFrom(typeof(ExtraBedType))]
[AutoMapTo(typeof(ExtraBedType))]
public class ExtraBedTypeDto : EntityDto<Guid>
{
    [Required]
    [StringLength(128)]
    public string Name { get; set; }

    [Range(0, double.MaxValue)]
    public decimal BasePrice { get; set; }

    public bool IsActive { get; set; }
}

[AutoMapFrom(typeof(ExtraBedType))]
public class ExtraBedTypeListDto : EntityDto<Guid>
{
    public string Name { get; set; }
    public decimal BasePrice { get; set; }
    public bool IsActive { get; set; }
}

[AutoMapTo(typeof(ExtraBedType))]
public class CreateExtraBedTypeDto
{
    [Required]
    [StringLength(128)]
    public string Name { get; set; }

    [Range(0, double.MaxValue)]
    public decimal BasePrice { get; set; }
}

public class GetExtraBedTypesInput : PagedResultFilterRequestDto, IShouldNormalize
{
    public bool? IsActive { get; set; }

    public void Normalize()
    {
        Sorting ??= "Name";
    }
}
