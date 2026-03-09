using Abp.Domain.Entities;
using Abp.Domain.Entities.Auditing;
using System;

namespace PMS.App;

public class ExtraBedType : AuditedEntity<Guid>, IPassivable
{
    public string Name { get; set; } = string.Empty;
    public decimal BasePrice { get; set; }
    public bool IsActive { get; set; } = true;
}
