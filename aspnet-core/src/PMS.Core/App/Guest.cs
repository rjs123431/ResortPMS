using Abp.Domain.Entities;
using Abp.Domain.Entities.Auditing;
using System;
using System.Collections.Generic;

namespace PMS.App;

public class Guest : AuditedEntity<Guid>, IPassivable
{
    public string GuestCode { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string MiddleName { get; set; } = string.Empty;
    public System.DateTime? DateOfBirth { get; set; }
    public string Gender { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Nationality { get; set; } = string.Empty;
    public string Notes { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;

    public virtual ICollection<GuestIdentification> Identifications { get; set; } = [];
}

public class GuestIdentification : CreationAuditedEntity<Guid>
{
    public Guid GuestId { get; set; }
    public string IdentificationType { get; set; } = string.Empty;
    public string IdentificationNumber { get; set; } = string.Empty;
    public System.DateTime? ExpiryDate { get; set; }
    public System.DateTime? IssuedDate { get; set; }

    public virtual Guest Guest { get; set; }
}
