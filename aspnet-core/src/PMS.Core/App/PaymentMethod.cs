using Abp.Domain.Entities;
using Abp.Domain.Entities.Auditing;
using System;

namespace PMS.App;

public class PaymentMethod : AuditedEntity<Guid>, IPassivable
{
    public string Name { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
}
