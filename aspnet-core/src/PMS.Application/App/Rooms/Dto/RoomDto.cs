using Abp.Application.Services.Dto;
using System;
using Abp.AutoMapper;
using Abp.Runtime.Validation;
using PMS.Dto;
using System.ComponentModel.DataAnnotations;

namespace PMS.App.Rooms.Dto;

// ── RoomType DTOs ──────────────────────────────────────────────────────────

[AutoMapFrom(typeof(RoomType))]
[AutoMapTo(typeof(RoomType))]
public class RoomTypeDto : EntityDto<Guid>
{
    [Required][StringLength(128)] public string Name { get; set; }
    [StringLength(512)] public string Description { get; set; }
    [Range(1, 20)] public int MaxAdults { get; set; } = 2;
    [Range(0, 10)] public int MaxChildren { get; set; } = 0;
    public decimal BaseRate { get; set; }
    public bool IsActive { get; set; }
}

[AutoMapFrom(typeof(RoomType))]
public class RoomTypeListDto : EntityDto<Guid>
{
    public string Name { get; set; }
    public int MaxAdults { get; set; }
    public int MaxChildren { get; set; }
    public decimal BaseRate { get; set; }
    public bool IsActive { get; set; }
}

[AutoMapTo(typeof(RoomType))]
public class CreateRoomTypeDto
{
    [Required][StringLength(128)] public string Name { get; set; }
    [StringLength(512)] public string Description { get; set; }
    [Range(1, 20)] public int MaxAdults { get; set; } = 2;
    [Range(0, 10)] public int MaxChildren { get; set; } = 0;
    [Range(0, double.MaxValue)] public decimal BaseRate { get; set; }
}

public class GetRoomTypesInput : PagedResultFilterRequestDto, IShouldNormalize
{
    public bool? IsActive { get; set; }
    public void Normalize() { Sorting ??= "Name"; }
}

// ── Room DTOs ──────────────────────────────────────────────────────────────

[AutoMapFrom(typeof(Room))]
[AutoMapTo(typeof(Room))]
public class RoomDto : EntityDto<Guid>
{
    [Required][StringLength(16)] public string RoomNumber { get; set; }
    public Guid RoomTypeId { get; set; }
    public string RoomTypeName { get; set; }
    [StringLength(32)] public string Floor { get; set; }
    public RoomStatus Status { get; set; }
    public bool IsActive { get; set; }
}

[AutoMapFrom(typeof(Room))]
public class RoomListDto : EntityDto<Guid>
{
    public string RoomNumber { get; set; }
    public Guid RoomTypeId { get; set; }
    public string RoomTypeName { get; set; }
    public string RoomTypeDescription { get; set; }
    public string BedTypeSummary { get; set; }
    public string[] FeatureTags { get; set; } = Array.Empty<string>();
    public string[] AmenityItems { get; set; } = Array.Empty<string>();
    public int MaxAdults { get; set; }
    public int MaxChildren { get; set; }
    public decimal BaseRate { get; set; }
    public string Floor { get; set; }
    public RoomStatus Status { get; set; }
    public bool IsActive { get; set; }
}

[AutoMapTo(typeof(Room))]
public class CreateRoomDto
{
    [Required][StringLength(16)] public string RoomNumber { get; set; }
    public Guid RoomTypeId { get; set; }
    [StringLength(32)] public string Floor { get; set; }
    public RoomStatus Status { get; set; } = RoomStatus.VacantClean;
}

public class GetRoomsInput : PagedResultFilterRequestDto, IShouldNormalize
{
    public RoomStatus? Status { get; set; }
    public Guid? RoomTypeId { get; set; }
    public bool? IsActive { get; set; }
    public void Normalize() { Sorting ??= "RoomNumber"; }
}

public class GetAvailableRoomsInput
{
    public Guid? RoomTypeId { get; set; }
    public DateTime? ArrivalDate { get; set; }
    public DateTime? DepartureDate { get; set; }
    public Guid? ReservationId { get; set; }
}

public class UpdateRoomStatusDto
{
    [Required] public Guid RoomId { get; set; }
    public RoomStatus Status { get; set; }
    public string Remarks { get; set; }
}
