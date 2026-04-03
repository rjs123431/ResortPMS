using Abp.UI;
using PMS.App;
using Shouldly;
using System;
using Xunit;

namespace PMS.Tests.Domain;

public class ConferenceBookingGuardTests
{
    private static ConferenceBooking MakeBooking(ConferenceBookingStatus status = ConferenceBookingStatus.Inquiry) =>
        new()
        {
            BookingNo = "CNF-TEST",
            VenueId = Guid.NewGuid(),
            EventName = "Board Meeting",
            OrganizerName = "Jane Doe",
            StartDateTime = new DateTime(2026, 4, 10, 9, 0, 0),
            EndDateTime = new DateTime(2026, 4, 10, 12, 0, 0),
            Status = status,
        };

    [Fact]
    public void SetTentative_FromInquiry_Succeeds()
    {
        var booking = MakeBooking(ConferenceBookingStatus.Inquiry);

        booking.SetTentative();

        booking.Status.ShouldBe(ConferenceBookingStatus.Tentative);
    }

    [Theory]
    [InlineData(ConferenceBookingStatus.Cancelled)]
    [InlineData(ConferenceBookingStatus.Completed)]
    public void SetTentative_FromFinalStatus_Throws(ConferenceBookingStatus status)
    {
        var booking = MakeBooking(status);

        Should.Throw<UserFriendlyException>(() => booking.SetTentative());
    }

    [Theory]
    [InlineData(ConferenceBookingStatus.Inquiry)]
    [InlineData(ConferenceBookingStatus.Tentative)]
    [InlineData(ConferenceBookingStatus.Confirmed)]
    public void Confirm_FromAllowedStatus_Succeeds(ConferenceBookingStatus status)
    {
        var booking = MakeBooking(status);

        booking.Confirm();

        booking.Status.ShouldBe(ConferenceBookingStatus.Confirmed);
    }

    [Theory]
    [InlineData(ConferenceBookingStatus.Cancelled)]
    [InlineData(ConferenceBookingStatus.Completed)]
    public void Confirm_FromFinalStatus_Throws(ConferenceBookingStatus status)
    {
        var booking = MakeBooking(status);

        Should.Throw<UserFriendlyException>(() => booking.Confirm());
    }

    [Fact]
    public void StartEvent_FromConfirmed_Succeeds()
    {
        var booking = MakeBooking(ConferenceBookingStatus.Confirmed);

        booking.StartEvent();

        booking.Status.ShouldBe(ConferenceBookingStatus.InProgress);
    }

    [Theory]
    [InlineData(ConferenceBookingStatus.Inquiry)]
    [InlineData(ConferenceBookingStatus.Tentative)]
    [InlineData(ConferenceBookingStatus.Cancelled)]
    public void StartEvent_FromNonConfirmed_Throws(ConferenceBookingStatus status)
    {
        var booking = MakeBooking(status);

        Should.Throw<UserFriendlyException>(() => booking.StartEvent());
    }

    [Theory]
    [InlineData(ConferenceBookingStatus.Confirmed)]
    [InlineData(ConferenceBookingStatus.InProgress)]
    public void Complete_FromAllowedStatus_Succeeds(ConferenceBookingStatus status)
    {
        var booking = MakeBooking(status);

        booking.Complete();

        booking.Status.ShouldBe(ConferenceBookingStatus.Completed);
    }

    [Theory]
    [InlineData(ConferenceBookingStatus.Inquiry)]
    [InlineData(ConferenceBookingStatus.Tentative)]
    [InlineData(ConferenceBookingStatus.Cancelled)]
    public void Complete_FromInvalidStatus_Throws(ConferenceBookingStatus status)
    {
        var booking = MakeBooking(status);

        Should.Throw<UserFriendlyException>(() => booking.Complete());
    }

    [Fact]
    public void Cancel_FromConfirmed_SucceedsAndAppendsReason()
    {
        var booking = MakeBooking(ConferenceBookingStatus.Confirmed);

        booking.Cancel("Client request");

        booking.Status.ShouldBe(ConferenceBookingStatus.Cancelled);
        booking.Notes.ShouldContain("Client request");
    }

    [Fact]
    public void Cancel_FromCompleted_Throws()
    {
        var booking = MakeBooking(ConferenceBookingStatus.Completed);

        Should.Throw<UserFriendlyException>(() => booking.Cancel("Too late"));
    }
}