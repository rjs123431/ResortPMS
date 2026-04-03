using Abp.Application.Services.Dto;
using Abp.AutoMapper;
using PMS.App;
using System;

namespace PMS.App.EventTypes.Dto;

[AutoMapFrom(typeof(EventType))]
public class EventTypeDto : EntityDto<Guid>
{
    public string Code { get; set; }
    public string Name { get; set; }
    public int SortOrder { get; set; }
    public bool IsActive { get; set; }
}