using Abp.Domain.Entities;
using Abp.Domain.Entities.Auditing;
using System;
using System.ComponentModel.DataAnnotations;

namespace PMS.App;

public class Staff : AuditedEntity<Guid>, IPassivable
{
    [Required]
    [StringLength(64)]
    public string StaffCode { get; set; } = string.Empty;

    [Required]
    [StringLength(128)]
    public string FullName { get; set; } = string.Empty;

    [StringLength(64)]
    public string Department { get; set; } = string.Empty;

    [StringLength(64)]
    public string Position { get; set; } = string.Empty;

    [StringLength(32)]
    public string PhoneNumber { get; set; } = string.Empty;

    public bool IsActive { get; set; } = true;
}
