using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using PMS.App;
using PMS.EntityFrameworkCore;
using Shouldly;

namespace PMS.Tests.Application.ConferenceBookings;

public class ConferenceBookingAppServiceTests : IDisposable
{
    private readonly SqliteConnection _connection;
    private readonly PMSDbContext _context;

    public ConferenceBookingAppServiceTests()
    {
        _connection = new SqliteConnection("Data Source=:memory:");
        _connection.Open();

        var options = new DbContextOptionsBuilder<PMSDbContext>()
            .UseSqlite(_connection)
            .Options;

        _context = new PMSDbContext(options);
        _context.Database.EnsureCreated();
    }

    [Fact]
    public async Task UpdateFlow_ShouldReplaceExistingAddOnsWithoutOrphans()
    {
        var venueId = Guid.NewGuid();
        var bookingId = Guid.NewGuid();
        var startDateTime = new DateTime(2026, 4, 10, 9, 0, 0, DateTimeKind.Utc);
        var endDateTime = new DateTime(2026, 4, 10, 12, 0, 0, DateTimeKind.Utc);

        _context.Set<ConferenceVenue>().Add(new ConferenceVenue
        {
            Id = venueId,
            Code = "GRAND-BALLROOM",
            Name = "Grand Ballroom",
            Category = "Ballroom",
            Capacity = 250,
            HourlyRate = 250m,
            HalfDayRate = 900m,
            FullDayRate = 1600m,
            SetupBufferMinutes = 30,
            TeardownBufferMinutes = 30,
            Description = "Main event venue",
            IsActive = true,
        });

        _context.Set<ConferenceBooking>().Add(new ConferenceBooking
        {
            Id = bookingId,
            BookingNo = "26-CNF00001",
            VenueId = venueId,
            EventName = "Quarterly Planning",
            EventType = "Meeting",
            OrganizerType = ConferenceOrganizerType.Individual,
            OrganizerName = "Ops Team",
            CompanyName = string.Empty,
            ContactPerson = "Jordan Smith",
            Phone = "1234567890",
            Email = "ops@example.com",
            BookingDate = startDateTime.Date,
            StartDateTime = startDateTime,
            EndDateTime = endDateTime,
            AttendeeCount = 40,
            PricingType = ConferencePricingType.Hourly,
            BaseAmount = 750m,
            AddOnAmount = 175m,
            TotalAmount = 925m,
            DepositRequired = 200m,
            DepositPaid = 0m,
            SetupBufferMinutes = 30,
            TeardownBufferMinutes = 30,
            Status = ConferenceBookingStatus.Inquiry,
            Notes = string.Empty,
            SpecialRequests = string.Empty,
            AddOns =
            [
                new ConferenceBookingAddOn
                {
                    Id = Guid.NewGuid(),
                    ConferenceBookingId = bookingId,
                    Name = "Projector",
                    Quantity = 1,
                    UnitPrice = 125m,
                    Amount = 125m,
                },
                new ConferenceBookingAddOn
                {
                    Id = Guid.NewGuid(),
                    ConferenceBookingId = bookingId,
                    Name = "Whiteboard",
                    Quantity = 1,
                    UnitPrice = 50m,
                    Amount = 50m,
                },
            ],
        });

        await _context.SaveChangesAsync();

        var persistedBooking = await _context.Set<ConferenceBooking>()
            .Include(x => x.AddOns)
            .SingleAsync(x => x.Id == bookingId);

        var existingAddOns = persistedBooking.AddOns.ToList();
        _context.Set<ConferenceBookingAddOn>().RemoveRange(existingAddOns);
        await _context.SaveChangesAsync();

        _context.Set<ConferenceBookingAddOn>().Add(new ConferenceBookingAddOn
        {
            Id = Guid.NewGuid(),
            ConferenceBookingId = bookingId,
            Name = "Coffee Service",
            Quantity = 2,
            UnitPrice = 40m,
            Amount = 80m,
        });
        _context.Set<ConferenceBookingAddOn>().Add(new ConferenceBookingAddOn
        {
            Id = Guid.NewGuid(),
            ConferenceBookingId = bookingId,
            Name = "Stage Platform",
            Quantity = 1,
            UnitPrice = 300m,
            Amount = 300m,
        });

        persistedBooking.AddOnAmount = persistedBooking.AddOns.Sum(x => x.Amount);
        persistedBooking.BaseAmount = 750m;
        persistedBooking.TotalAmount = persistedBooking.BaseAmount + persistedBooking.AddOnAmount;

        await _context.SaveChangesAsync();

        var refreshedBooking = await _context.Set<ConferenceBooking>()
            .Include(x => x.AddOns)
            .SingleAsync(x => x.Id == bookingId);

        refreshedBooking.AddOns.Count.ShouldBe(2);
        refreshedBooking.AddOns.Select(x => x.Name).OrderBy(x => x).ShouldBe(["Coffee Service", "Stage Platform"]);
        refreshedBooking.AddOns.All(x => x.ConferenceBookingId == bookingId).ShouldBeTrue();
        refreshedBooking.AddOnAmount.ShouldBe(380m);
        refreshedBooking.BaseAmount.ShouldBe(750m);
        refreshedBooking.TotalAmount.ShouldBe(1130m);
        var addOnRowCount = await _context.Set<ConferenceBookingAddOn>()
            .CountAsync(x => x.ConferenceBookingId == bookingId);

        addOnRowCount.ShouldBe(2);
    }

    public void Dispose()
    {
        _context.Dispose();
        _connection.Dispose();
    }
}