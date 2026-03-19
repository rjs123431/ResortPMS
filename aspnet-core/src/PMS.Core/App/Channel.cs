using Abp.Domain.Entities;
using Abp.Domain.Entities.Auditing;
using System;
using System.Collections.Generic;

namespace PMS.App;

public class Channel : AuditedEntity<Guid>, IPassivable
{
    public string Name { get; set; } = string.Empty;
    public string Icon { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;

    public virtual ICollection<RoomRatePlanGroupChannel> RoomRatePlanGroupChannels { get; set; } = [];
}