using Abp.Domain.Entities;
using Abp.Domain.Entities.Auditing;
using System;

namespace PMS.App;

public class ChargeType : AuditedEntity<Guid>, IPassivable
{
    public string Name { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public bool IsRoomCharge { get; set; } = false;
    public bool IsActive { get; set; } = true;
}
