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

[AutoMapFrom(typeof(Channel))]
[AutoMapTo(typeof(Channel))]
public class ChannelDto : EntityDto<Guid>
{
    [Required]
    [StringLength(64)]
    public string Name { get; set; }

    [StringLength(256)]
    public string Icon { get; set; }

    public int Sort { get; set; }

    public bool IsActive { get; set; }
}

[AutoMapFrom(typeof(Channel))]
public class ChannelListDto : EntityDto<Guid>
{
    public string Name { get; set; }
    public string Icon { get; set; }
    public int Sort { get; set; }
    public bool IsActive { get; set; }
}

[AutoMapTo(typeof(Channel))]
public class CreateChannelDto
{
    [Required]
    [StringLength(64)]
    public string Name { get; set; }

    [StringLength(256)]
    public string Icon { get; set; }

    public int Sort { get; set; }
}

public class GetChannelsInput : PagedResultFilterRequestDto, IShouldNormalize
{
    public bool? IsActive { get; set; }

    public void Normalize()
    {
        Sorting ??= "Sort asc, Name asc";
    }
}

[AutoMapFrom(typeof(Agency))]
[AutoMapTo(typeof(Agency))]
public class AgencyDto : EntityDto<Guid>
{
    [Required]
    [StringLength(128)]
    public string Name { get; set; }

    public bool IsActive { get; set; }
}

[AutoMapFrom(typeof(Agency))]
public class AgencyListDto : EntityDto<Guid>
{
    public string Name { get; set; }
    public bool IsActive { get; set; }
}

[AutoMapTo(typeof(Agency))]
public class CreateAgencyDto
{
    [Required]
    [StringLength(128)]
    public string Name { get; set; }
}

public class GetAgenciesInput : PagedResultFilterRequestDto, IShouldNormalize
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

[AutoMapFrom(typeof(Staff))]
[AutoMapTo(typeof(Staff))]
public class StaffDto : EntityDto<Guid>
{
    [Required]
    [StringLength(64)]
    public string StaffCode { get; set; }

    [Required]
    [StringLength(128)]
    public string FullName { get; set; }

    [StringLength(64)]
    public string Department { get; set; }

    [StringLength(64)]
    public string Position { get; set; }

    [StringLength(32)]
    public string PhoneNumber { get; set; }

    public bool IsActive { get; set; }
}

[AutoMapFrom(typeof(Staff))]
public class StaffListDto : EntityDto<Guid>
{
    public string StaffCode { get; set; }
    public string FullName { get; set; }
    public string Department { get; set; }
    public string Position { get; set; }
    public string PhoneNumber { get; set; }
    public bool IsActive { get; set; }
}

[AutoMapTo(typeof(Staff))]
public class CreateStaffDto
{
    [Required]
    [StringLength(64)]
    public string StaffCode { get; set; }

    [Required]
    [StringLength(128)]
    public string FullName { get; set; }

    [StringLength(64)]
    public string Department { get; set; }

    [StringLength(64)]
    public string Position { get; set; }

    [StringLength(32)]
    public string PhoneNumber { get; set; }
}

public class GetStaffInput : PagedResultFilterRequestDto, IShouldNormalize
{
    public bool? IsActive { get; set; }

    public void Normalize()
    {
        Sorting ??= "FullName";
    }
}
