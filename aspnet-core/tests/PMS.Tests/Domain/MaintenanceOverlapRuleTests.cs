using Shouldly;
using System;
using Xunit;

namespace PMS.Tests.Domain;

public class MaintenanceOverlapRuleTests
{
    [Theory]
    [InlineData("2026-03-10", "2026-03-12", "2026-03-12", "2026-03-14", false)]
    [InlineData("2026-03-10", "2026-03-12", "2026-03-11", "2026-03-13", true)]
    [InlineData("2026-03-10", "2026-03-12", "2026-03-09", "2026-03-10", false)]
    [InlineData("2026-03-10", "2026-03-12", "2026-03-09", "2026-03-11", true)]
    [InlineData("2026-03-10", "2026-03-12", "2026-03-10", "2026-03-12", true)]
    public void ReservationOrStayOverlapRule_MatchesAvailabilitySemantics(
        string existingStart,
        string existingEnd,
        string maintenanceStart,
        string maintenanceEnd,
        bool expectedOverlap)
    {
        var existingArrival = DateTime.Parse(existingStart).Date;
        var existingDeparture = DateTime.Parse(existingEnd).Date;
        var maintenanceArrival = DateTime.Parse(maintenanceStart).Date;
        var maintenanceDeparture = DateTime.Parse(maintenanceEnd).Date;

        var overlaps = existingArrival < maintenanceDeparture && existingDeparture > maintenanceArrival;

        overlaps.ShouldBe(expectedOverlap);
    }

    [Fact]
    public void DateRange_WithStartEqualEnd_IsNotABookableNightRange()
    {
        var start = new DateTime(2026, 3, 10);
        var end = new DateTime(2026, 3, 10);

        var nights = (end.Date - start.Date).TotalDays;

        nights.ShouldBe(0);
    }
}
