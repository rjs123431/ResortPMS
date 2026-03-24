using Abp.UI;
using PMS.App;
using Shouldly;
using System;
using Xunit;

namespace PMS.Tests.Domain;

public class RoomMaintenanceGuardTests
{
    private static RoomMaintenanceRequest MakeRequest(RoomMaintenanceStatus status = RoomMaintenanceStatus.Open)
        => new()
        {
            RoomId = Guid.NewGuid(),
            Title = "Fix AC",
            Description = "Room AC not cooling",
            Priority = RoomMaintenancePriority.Medium,
            Status = status,
            StartDate = DateTime.Today.AddDays(1),
            EndDate = DateTime.Today.AddDays(2),
        };

    [Fact]
    public void Assign_FromOpen_SetsAssignedStatus()
    {
        var request = MakeRequest(RoomMaintenanceStatus.Open);
        var staffId = Guid.NewGuid();

        request.Assign(staffId);

        request.AssignedStaffId.ShouldBe(staffId);
        request.Status.ShouldBe(RoomMaintenanceStatus.Assigned);
        request.AssignedAt.ShouldNotBeNull();
    }

    [Fact]
    public void Start_WithoutAssignment_Throws()
    {
        var request = MakeRequest(RoomMaintenanceStatus.Open);

        Should.Throw<UserFriendlyException>(() => request.Start());
    }

    [Fact]
    public void Start_FromAssigned_Succeeds()
    {
        var request = MakeRequest(RoomMaintenanceStatus.Assigned);
        request.AssignedStaffId = Guid.NewGuid();

        request.Start();

        request.Status.ShouldBe(RoomMaintenanceStatus.InProgress);
        request.StartedAt.ShouldNotBeNull();
    }

    [Fact]
    public void Complete_FromInProgress_Succeeds()
    {
        var request = MakeRequest(RoomMaintenanceStatus.InProgress);
        request.AssignedStaffId = Guid.NewGuid();

        request.Complete();

        request.Status.ShouldBe(RoomMaintenanceStatus.Completed);
        request.CompletedAt.ShouldNotBeNull();
    }

    [Fact]
    public void Complete_FromOpen_Throws()
    {
        var request = MakeRequest(RoomMaintenanceStatus.Open);

        Should.Throw<UserFriendlyException>(() => request.Complete());
    }

    [Fact]
    public void Cancel_Completed_Throws()
    {
        var request = MakeRequest(RoomMaintenanceStatus.Completed);

        Should.Throw<UserFriendlyException>(() => request.Cancel("late"));
    }
}
