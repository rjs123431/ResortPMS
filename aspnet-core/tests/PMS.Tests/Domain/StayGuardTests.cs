using Abp.Timing;
using Abp.UI;
using PMS.App;
using Shouldly;
using System;
using Xunit;

namespace PMS.Tests.Domain;

public class StayGuardTests
{
    private static Stay MakeStay(StayStatus status = StayStatus.CheckedIn) =>
        new()
        {
            StayNo = "STAY-TEST",
            CheckInDateTime = Clock.Now,
            ExpectedCheckOutDateTime = Clock.Now.AddDays(2),
            Status = status
        };

    [Fact]
    public void CompleteCheckOut_FromCheckedIn_Succeeds()
    {
        var stay = MakeStay(StayStatus.CheckedIn);
        stay.CompleteCheckOut();
        stay.Status.ShouldBe(StayStatus.CheckedOut);
        stay.ActualCheckOutDateTime.ShouldNotBeNull();
    }

    [Fact]
    public void CompleteCheckOut_FromInHouse_Succeeds()
    {
        var stay = MakeStay(StayStatus.InHouse);
        var checkOut = DateTime.UtcNow;
        stay.CompleteCheckOut(checkOut);
        stay.Status.ShouldBe(StayStatus.CheckedOut);
        stay.ActualCheckOutDateTime.ShouldBe(checkOut);
    }

    [Fact]
    public void CompleteCheckOut_AlreadyCheckedOut_IsIdempotent()
    {
        var stay = MakeStay(StayStatus.CheckedOut);
        stay.CompleteCheckOut(); // should not throw
        stay.Status.ShouldBe(StayStatus.CheckedOut);
    }

    [Fact]
    public void CompleteCheckOut_FromCancelled_Throws()
    {
        var stay = MakeStay(StayStatus.Cancelled);
        Should.Throw<UserFriendlyException>(() => stay.CompleteCheckOut());
    }

    [Fact]
    public void CompleteCheckOut_RecordsSuppliedTime()
    {
        var stay = MakeStay(StayStatus.CheckedIn);
        var specificTime = new DateTime(2025, 6, 1, 11, 30, 0);
        stay.CompleteCheckOut(specificTime);
        stay.ActualCheckOutDateTime.ShouldBe(specificTime);
    }
}
