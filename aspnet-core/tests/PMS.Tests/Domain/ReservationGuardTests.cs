using Abp.UI;
using PMS.App;
using Shouldly;
using System;
using Xunit;

namespace PMS.Tests.Domain;

public class ReservationGuardTests
{
    private static Reservation MakeReservation(ReservationStatus status = ReservationStatus.Draft) =>
        new()
        {
            ReservationNo = "RES-TEST",
            ArrivalDate = DateTime.Today.AddDays(1),
            DepartureDate = DateTime.Today.AddDays(3),
            Status = status
        };

    [Fact]
    public void Confirm_FromDraft_Succeeds()
    {
        var r = MakeReservation(ReservationStatus.Draft);
        r.Confirm();
        r.Status.ShouldBe(ReservationStatus.Confirmed);
    }

    [Fact]
    public void Confirm_FromPending_Succeeds()
    {
        var r = MakeReservation(ReservationStatus.Pending);
        r.Confirm();
        r.Status.ShouldBe(ReservationStatus.Confirmed);
    }

    [Fact]
    public void Confirm_AlreadyConfirmed_IsIdempotent()
    {
        var r = MakeReservation(ReservationStatus.Confirmed);
        r.Confirm(); // should not throw
        r.Status.ShouldBe(ReservationStatus.Confirmed);
    }

    [Theory]
    [InlineData(ReservationStatus.Cancelled)]
    [InlineData(ReservationStatus.CheckedIn)]
    [InlineData(ReservationStatus.Completed)]
    [InlineData(ReservationStatus.NoShow)]
    public void Confirm_FromInvalidStatus_Throws(ReservationStatus invalidStatus)
    {
        var r = MakeReservation(invalidStatus);
        Should.Throw<UserFriendlyException>(() => r.Confirm());
    }

    [Fact]
    public void Cancel_FromConfirmed_Succeeds()
    {
        var r = MakeReservation(ReservationStatus.Confirmed);
        r.Cancel();
        r.Status.ShouldBe(ReservationStatus.Cancelled);
    }

    [Fact]
    public void Cancel_AlreadyCancelled_IsIdempotent()
    {
        var r = MakeReservation(ReservationStatus.Cancelled);
        r.Cancel(); // should not throw
        r.Status.ShouldBe(ReservationStatus.Cancelled);
    }

    [Theory]
    [InlineData(ReservationStatus.CheckedIn)]
    [InlineData(ReservationStatus.Completed)]
    public void Cancel_FromFinalStatus_Throws(ReservationStatus finalStatus)
    {
        var r = MakeReservation(finalStatus);
        Should.Throw<UserFriendlyException>(() => r.Cancel());
    }

    [Fact]
    public void SetPending_FromDraft_Succeeds()
    {
        var r = MakeReservation(ReservationStatus.Draft);
        r.SetPending();
        r.Status.ShouldBe(ReservationStatus.Pending);
    }

    [Fact]
    public void SetPending_FromConfirmed_Throws()
    {
        var r = MakeReservation(ReservationStatus.Confirmed);
        Should.Throw<UserFriendlyException>(() => r.SetPending());
    }

    [Fact]
    public void MarkNoShow_FromConfirmed_Succeeds()
    {
        var r = MakeReservation(ReservationStatus.Confirmed);
        r.MarkNoShow();
        r.Status.ShouldBe(ReservationStatus.NoShow);
    }

    [Fact]
    public void MarkNoShow_FromNonConfirmed_Throws()
    {
        var r = MakeReservation(ReservationStatus.Draft);
        Should.Throw<UserFriendlyException>(() => r.MarkNoShow());
    }

    [Fact]
    public void MarkCheckedIn_FromConfirmed_Succeeds()
    {
        var r = MakeReservation(ReservationStatus.Confirmed);
        r.MarkCheckedIn();
        r.Status.ShouldBe(ReservationStatus.CheckedIn);
    }

    [Fact]
    public void MarkCheckedIn_FromDraft_Throws()
    {
        var r = MakeReservation(ReservationStatus.Draft);
        Should.Throw<UserFriendlyException>(() => r.MarkCheckedIn());
    }

    [Fact]
    public void MarkCompleted_FromCheckedIn_Succeeds()
    {
        var r = MakeReservation(ReservationStatus.CheckedIn);
        r.MarkCompleted();
        r.Status.ShouldBe(ReservationStatus.Completed);
    }

    [Fact]
    public void MarkCompleted_FromConfirmed_Throws()
    {
        var r = MakeReservation(ReservationStatus.Confirmed);
        Should.Throw<UserFriendlyException>(() => r.MarkCompleted());
    }
}
