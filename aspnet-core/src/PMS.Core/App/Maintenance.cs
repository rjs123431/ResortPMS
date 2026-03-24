using Abp.Domain.Entities.Auditing;
using Abp.Timing;
using Abp.UI;
using System;
using System.Collections.Generic;

namespace PMS.App;

public enum RoomMaintenancePriority
{
    Low = 1,
    Medium = 2,
    High = 3,
    Critical = 4,
}

public enum RoomMaintenanceStatus
{
    Open = 1,
    Assigned = 2,
    InProgress = 3,
    Completed = 4,
    Cancelled = 5,
}

public enum MaintenanceCategory
{
    Reactive = 1,
    Preventive = 2,
}

/// <summary>
/// Lookup type for a maintenance job (e.g. "Aircon Repair", "Plumbing Fix").
/// </summary>
public class RoomMaintenanceType : FullAuditedEntity<Guid>
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
}

/// <summary>
/// Join between a work-order and one or more maintenance types.
/// </summary>
public class RoomMaintenanceRequestType
{
    public Guid RequestId { get; set; }
    public Guid TypeId { get; set; }
    public virtual RoomMaintenanceRequest Request { get; set; }
    public virtual RoomMaintenanceType Type { get; set; }
}

public class RoomMaintenanceRequest : FullAuditedEntity<Guid>
{
    public Guid RoomId { get; set; }
    public Guid? AssignedStaffId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public RoomMaintenancePriority Priority { get; set; } = RoomMaintenancePriority.Medium;
    public RoomMaintenanceStatus Status { get; set; } = RoomMaintenanceStatus.Open;
    public MaintenanceCategory Category { get; set; } = MaintenanceCategory.Reactive;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public DateTime OpenedAt { get; set; } = Clock.Now;
    public DateTime? AssignedAt { get; set; }
    public DateTime? StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public DateTime? CancelledAt { get; set; }
    public string CancellationReason { get; set; } = string.Empty;

    public virtual Room Room { get; set; }
    public virtual Staff AssignedStaff { get; set; }
    public virtual ICollection<RoomMaintenanceRequestType> MaintenanceTypes { get; set; } = new List<RoomMaintenanceRequestType>();

    public void Assign(Guid staffId)
    {
        if (Status == RoomMaintenanceStatus.Completed || Status == RoomMaintenanceStatus.Cancelled)
            throw new UserFriendlyException($"Cannot assign a maintenance request in '{Status}' status.");

        AssignedStaffId = staffId;
        AssignedAt = Clock.Now;

        if (Status == RoomMaintenanceStatus.Open)
            Status = RoomMaintenanceStatus.Assigned;
    }

    public void Start()
    {
        if (Status == RoomMaintenanceStatus.Completed || Status == RoomMaintenanceStatus.Cancelled)
            throw new UserFriendlyException($"Cannot start a maintenance request in '{Status}' status.");

        if (!AssignedStaffId.HasValue)
            throw new UserFriendlyException("Maintenance request must be assigned before it can be started.");

        Status = RoomMaintenanceStatus.InProgress;
        StartedAt = Clock.Now;
    }

    public void Complete()
    {
        if (Status == RoomMaintenanceStatus.Completed)
            return;

        if (Status == RoomMaintenanceStatus.Cancelled)
            throw new UserFriendlyException("Cancelled maintenance request cannot be completed.");

        if (Status != RoomMaintenanceStatus.Assigned && Status != RoomMaintenanceStatus.InProgress)
            throw new UserFriendlyException("Only assigned or in-progress maintenance requests can be completed.");

        Status = RoomMaintenanceStatus.Completed;
        CompletedAt = Clock.Now;
    }

    public void Cancel(string reason)
    {
        if (Status == RoomMaintenanceStatus.Completed)
            throw new UserFriendlyException("Completed maintenance request cannot be cancelled.");

        Status = RoomMaintenanceStatus.Cancelled;
        CancelledAt = Clock.Now;
        CancellationReason = (reason ?? string.Empty).Trim();
    }
}
