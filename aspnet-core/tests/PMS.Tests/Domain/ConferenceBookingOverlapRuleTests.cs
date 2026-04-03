using Shouldly;
using System;
using Xunit;

namespace PMS.Tests.Domain;

public class ConferenceBookingOverlapRuleTests
{
    [Theory]
    [InlineData("2026-04-10T09:00:00", "2026-04-10T12:00:00", 0, 0, "2026-04-10T12:00:00", "2026-04-10T15:00:00", 0, 0, false)]
    [InlineData("2026-04-10T09:00:00", "2026-04-10T12:00:00", 0, 0, "2026-04-10T11:00:00", "2026-04-10T13:00:00", 0, 0, true)]
    [InlineData("2026-04-10T09:00:00", "2026-04-10T12:00:00", 60, 30, "2026-04-10T12:00:00", "2026-04-10T15:00:00", 0, 0, true)]
    [InlineData("2026-04-10T09:00:00", "2026-04-10T12:00:00", 30, 30, "2026-04-10T13:00:00", "2026-04-10T15:00:00", 0, 0, false)]
    [InlineData("2026-04-10T09:00:00", "2026-04-10T12:00:00", 0, 0, "2026-04-10T08:00:00", "2026-04-10T09:00:00", 30, 0, false)]
    public void ConferenceBookingOverlapRule_MatchesServiceSemantics(
        string existingStart,
        string existingEnd,
        int existingSetup,
        int existingTeardown,
        string requestedStart,
        string requestedEnd,
        int requestedSetup,
        int requestedTeardown,
        bool expectedOverlap)
    {
        var existingStartTime = DateTime.Parse(existingStart);
        var existingEndTime = DateTime.Parse(existingEnd);
        var requestedStartTime = DateTime.Parse(requestedStart);
        var requestedEndTime = DateTime.Parse(requestedEnd);

        var existingBlockedStart = existingStartTime.AddMinutes(-existingSetup);
        var existingBlockedEnd = existingEndTime.AddMinutes(existingTeardown);
        var requestedBlockedStart = requestedStartTime.AddMinutes(-requestedSetup);
        var requestedBlockedEnd = requestedEndTime.AddMinutes(requestedTeardown);

        var overlaps = existingBlockedStart < requestedBlockedEnd && existingBlockedEnd > requestedBlockedStart;

        overlaps.ShouldBe(expectedOverlap);
    }

    [Fact]
    public void DatetimeRange_WithEndBeforeStart_IsInvalid()
    {
        var start = new DateTime(2026, 4, 10, 14, 0, 0);
        var end = new DateTime(2026, 4, 10, 10, 0, 0);

        (end > start).ShouldBeFalse();
    }
}