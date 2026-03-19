using Abp.Application.Services.Dto;
using Abp.AutoMapper;
using Abp.Runtime.Validation;
using PMS.App;
using PMS.Dto;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace PMS.App.RoomRatePlans.Dto;

[AutoMapFrom(typeof(RoomRatePlan))]
[AutoMapTo(typeof(RoomRatePlan))]
public class RoomRatePlanDto : EntityDto<Guid>
{
    public Guid RoomTypeId { get; set; }
    public string RoomTypeName { get; set; } = string.Empty;
    [Required][StringLength(32)] public string Code { get; set; } = string.Empty;
    [Required][StringLength(128)] public string Name { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public int Priority { get; set; }
    public bool IsDefault { get; set; }
    public bool IsActive { get; set; } = true;
    public List<Guid> ChannelIds { get; set; } = new();
    public List<string> ChannelNames { get; set; } = new();
    public TimeSpan CheckInTime { get; set; } = new TimeSpan(14, 0, 0);
    public TimeSpan CheckOutTime { get; set; } = new TimeSpan(12, 0, 0);
    public List<RoomRatePlanDayDto> DayRates { get; set; } = new();
    public List<RatePlanDateOverrideDto> DateOverrides { get; set; } = new();
}

[AutoMapFrom(typeof(RoomRatePlan))]
public class RoomRatePlanListDto : EntityDto<Guid>
{
    public Guid RoomTypeId { get; set; }
    public string RoomTypeName { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public int Priority { get; set; }
    public bool IsDefault { get; set; }
    public bool IsActive { get; set; }
    public List<Guid> ChannelIds { get; set; } = new();
    public List<string> ChannelNames { get; set; } = new();
    public TimeSpan CheckInTime { get; set; } = new TimeSpan(14, 0, 0);
    public TimeSpan CheckOutTime { get; set; } = new TimeSpan(12, 0, 0);
}


[AutoMapTo(typeof(RoomRatePlan))]
public class CreateRoomRatePlanDto
{
    public Guid RoomTypeId { get; set; }
    [Required][StringLength(32)] public string Code { get; set; } = string.Empty;
    [Required][StringLength(128)] public string Name { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public int Priority { get; set; }
    public bool IsDefault { get; set; }
    public bool IsActive { get; set; } = true;
    public List<Guid> ChannelIds { get; set; } = new();
    public TimeSpan CheckInTime { get; set; } = new TimeSpan(14, 0, 0);
    public TimeSpan CheckOutTime { get; set; } = new TimeSpan(12, 0, 0);
    public List<RoomRatePlanDayDto> DayRates { get; set; } = new();
    public List<RatePlanDateOverrideDto> DateOverrides { get; set; } = new();
}

[AutoMapTo(typeof(RoomRatePlan))]
public class UpdateRoomRatePlanDto : CreateRoomRatePlanDto
{
    public Guid Id { get; set; }
}

[AutoMapFrom(typeof(RoomRatePlanDay))]
[AutoMapTo(typeof(RoomRatePlanDay))]
public class RoomRatePlanDayDto
{
    public Guid? Id { get; set; }
    public Guid RoomRatePlanId { get; set; }
    public DayOfWeek DayOfWeek { get; set; }
    public decimal BasePrice { get; set; }
}

[AutoMapFrom(typeof(RatePlanDateOverride))]
[AutoMapTo(typeof(RatePlanDateOverride))]
public class RatePlanDateOverrideDto
{
    public Guid? Id { get; set; }
    public Guid RoomRatePlanId { get; set; }
    public DateTime RateDate { get; set; }
    public decimal OverridePrice { get; set; }
    [StringLength(256)] public string Description { get; set; } = string.Empty;
}

public class GetRoomRatePlansInput : PagedResultFilterRequestDto, IShouldNormalize
{
    public Guid? RoomTypeId { get; set; }
    public bool? IsActive { get; set; }
    public void Normalize() { Sorting ??= "Priority asc, Name asc"; }
}

public class GetRoomTypeRatePlanOptionsInput
{
    [Required]
    public Guid RoomTypeId { get; set; }

    [Required]
    public DateTime ArrivalDate { get; set; }

    [Required]
    public DateTime DepartureDate { get; set; }

    public Guid? ChannelId { get; set; }
}

public class RoomTypeRatePlanOptionDto
{
    public Guid RoomRatePlanId { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public decimal PricePerNight { get; set; }
    public int Priority { get; set; }
}
