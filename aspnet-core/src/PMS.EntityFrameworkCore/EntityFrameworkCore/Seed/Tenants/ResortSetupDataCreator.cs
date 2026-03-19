using Abp.Timing;
using PMS.App;
using System;
using System.Collections.Generic;
using System.Linq;

namespace PMS.EntityFrameworkCore.Seed.Tenants;

public class ResortSetupDataCreator
{
    private readonly PMSDbContext _context;
    private readonly int _tenantId;

    public ResortSetupDataCreator(PMSDbContext context, int tenantId)
    {
        _context = context;
        _tenantId = tenantId;
    }

    public void Create()
    {
        if (!HasExistingSeedData())
        {
            var roomTypes = EnsureRoomTypes();
            EnsureRooms(roomTypes);
            EnsureChargeTypes();
            EnsureExtraBedTypes();
            EnsurePaymentMethods();
            EnsureStaff();
            EnsureGuests();
            EnsureDocumentSequences();
            EnsureRoomRatePlans(roomTypes);
        }

        // Always ensure newly introduced lookup data for existing tenants
        EnsureChannels();
        EnsureAgencies();

        // Always ensure POS data and POS_ORDER sequence for existing tenants (e.g. after migration)
        EnsurePosData();
        EnsurePosDocumentSequence();
    }

    private bool HasExistingSeedData()
    {
        return _context.RoomTypes.Any()
               || _context.Rooms.Any()
               || _context.ChargeTypes.Any()
               || _context.ExtraBedTypes.Any()
               || _context.PaymentMethods.Any()
               || _context.Channels.Any()
               || _context.Agencies.Any()
               || _context.Staffs.Any()
               || _context.Guests.Any()
               || _context.DocumentSequences.Any(x => x.TenantId == _tenantId);
    }

    private Dictionary<string, Guid> EnsureRoomTypes()
    {
        var definitions = new[]
        {
            new { Name = "Native Room", Description = "Native Room", MaxAdults = 2, MaxChildren = 0 },
            new { Name = "Garden View (Easy Access)", Description = "Garden View (Easy Access)", MaxAdults = 2, MaxChildren = 0 },
            new { Name = "Sea View (Ground Floor)", Description = "Sea View (Ground Floor)", MaxAdults = 2, MaxChildren = 0 },
            new { Name = "Saint Room", Description = "Saint Room", MaxAdults = 2, MaxChildren = 0 },
            new { Name = "Sea View (Upper Floor)", Description = "Sea View (Upper Floor)", MaxAdults = 3, MaxChildren = 0 },
            new { Name = "Seaside View", Description = "Seaside View", MaxAdults = 4, MaxChildren = 0 },
            new { Name = "Garden View (6 pax)", Description = "Garden View", MaxAdults = 6, MaxChildren = 0 },
            new { Name = "Garden View (8 pax)", Description = "Garden View", MaxAdults = 8, MaxChildren = 0 },
            new { Name = "Barkada Room", Description = "Barkada Room", MaxAdults = 18, MaxChildren = 0 },
            new { Name = "Villa", Description = "Villa (Breakfast & Kayaking not included)", MaxAdults = 3, MaxChildren = 0 },
        };

        foreach (var def in definitions)
        {
            _context.RoomTypes.Add(new RoomType
            {
                Name = def.Name,
                Description = def.Description,
                MaxAdults = def.MaxAdults,
                MaxChildren = def.MaxChildren,
                IsActive = true,
            });
        }

        _context.SaveChanges();

        var targetNames = definitions.Select(d => d.Name).ToArray();
        return _context.RoomTypes
            .Where(x => targetNames.Contains(x.Name))
            .ToDictionary(x => x.Name, x => x.Id);
    }

    private void EnsureRooms(Dictionary<string, Guid> roomTypes)
    {
        var rooms = new List<(string Number, string Type, string Floor)>
        {
            ("101", "Native Room", "1"), ("102", "Native Room", "1"), ("103", "Native Room", "1"), ("104", "Native Room", "1"), ("105", "Native Room", "1"),
            ("106", "Garden View (Easy Access)", "1"), ("107", "Garden View (Easy Access)", "1"), ("108", "Garden View (Easy Access)", "1"), ("109", "Garden View (Easy Access)", "1"), ("110", "Garden View (Easy Access)", "1"),
            ("201", "Sea View (Ground Floor)", "2"), ("202", "Sea View (Ground Floor)", "2"), ("203", "Sea View (Ground Floor)", "2"), ("204", "Sea View (Ground Floor)", "2"), ("205", "Sea View (Ground Floor)", "2"),
            ("206", "Saint Room", "2"), ("207", "Saint Room", "2"),
            ("208", "Sea View (Upper Floor)", "2"), ("209", "Sea View (Upper Floor)", "2"),
            ("210", "Seaside View", "2"), ("211", "Seaside View", "2"),
            ("212", "Garden View (6 pax)", "2"), ("213", "Garden View (6 pax)", "2"),
            ("214", "Garden View (8 pax)", "2"), ("215", "Garden View (8 pax)", "2"),
            ("216", "Barkada Room", "2"),
            ("217", "Villa", "2"),
        };

        foreach (var room in rooms)
        {
            var existing = _context.Rooms.FirstOrDefault(x => x.RoomNumber == room.Number);
            if (existing == null)
            {
                _context.Rooms.Add(new Room
                {
                    RoomNumber = room.Number,
                    RoomTypeId = roomTypes[room.Type],
                    Floor = room.Floor,
                    HousekeepingStatus = HousekeepingStatus.Clean,
                    IsActive = true,
                });
                continue;
            }

            existing.RoomTypeId = roomTypes[room.Type];
            existing.Floor = room.Floor;
            existing.IsActive = true;
        }

        _context.SaveChanges();
    }

    private void EnsureChargeTypes()
    {
        var definitions = new[]
        {
            new ChargeType { Name = "Room Charge", Category = "Room", IsRoomCharge = true, RoomChargeType = RoomChargeType.Room, Sort = 0, IsActive = true },
            new ChargeType { Name = "Extra Bed", Category = "Room", IsRoomCharge = true, RoomChargeType = RoomChargeType.ExtraBed, Sort = 1, IsActive = true },
            new ChargeType { Name = "Mini Bar", Category = "Food", IsRoomCharge = false, RoomChargeType = RoomChargeType.None, Sort = 2, IsActive = true },
            new ChargeType { Name = "Restaurant", Category = "Food", IsRoomCharge = false, RoomChargeType = RoomChargeType.None, Sort = 2, IsActive = true },
            new ChargeType { Name = "Laundry", Category = "Service", IsRoomCharge = false, RoomChargeType = RoomChargeType.None, Sort = 2, IsActive = true },
            new ChargeType { Name = "Spa", Category = "Service", IsRoomCharge = false, RoomChargeType = RoomChargeType.None, Sort = 2, IsActive = true },
            new ChargeType { Name = "Airport Transfer", Category = "Transport", IsRoomCharge = false, RoomChargeType = RoomChargeType.None, Sort = 2, IsActive = true },
        };

        _context.ChargeTypes.AddRange(definitions);

        _context.SaveChanges();
    }

    private void EnsurePaymentMethods()
    {
        var names = new[] { "Cash", "Credit Card", "Debit Card", "GCash", "Maya", "Bank Transfer" };

        foreach (var name in names)
        {
            _context.PaymentMethods.Add(new PaymentMethod { Name = name, IsActive = true });
        }

        _context.SaveChanges();
    }

    private void EnsureChannels()
    {
        var names = new[] { "FB", "Instagram", "Email", "Booking.com", "Agoda", "Agency" };

        foreach (var name in names)
        {
            var exists = _context.Channels.Any(x => x.Name == name);
            if (exists)
            {
                continue;
            }

            _context.Channels.Add(new Channel
            {
                Name = name,
                IsActive = true,
            });
        }

        _context.SaveChanges();
    }

    private void EnsureAgencies()
    {
        var names = new[] { "Walk-in Partner", "Corporate Partner", "Travel Agency" };

        foreach (var name in names)
        {
            var exists = _context.Agencies.Any(x => x.Name == name);
            if (exists)
            {
                continue;
            }

            _context.Agencies.Add(new Agency
            {
                Name = name,
                IsActive = true,
            });
        }

        _context.SaveChanges();
    }

    private void EnsureExtraBedTypes()
    {
        var definitions = new[]
        {
            new ExtraBedType { Name = "Kid", BasePrice = 650m, IsActive = true },
            new ExtraBedType { Name = "Adult", BasePrice = 965m, IsActive = true },
        };
        _context.ExtraBedTypes.AddRange(definitions);
        _context.SaveChanges();
    }

    // Seed RoomRatePlans for Weekdays Promo and Rack Rate (Weekend/Regular)
    private void EnsureRoomRatePlans(Dictionary<string, Guid> roomTypes)
    {
        var weekdayRates = new Dictionary<string, decimal>
        {
            { "Native Room", 2155m },
            { "Garden View (Easy Access)", 3215m },
            { "Sea View (Ground Floor)", 3435m },
            { "Saint Room", 3435m },
            { "Sea View (Upper Floor)", 4480m },
            { "Seaside View", 5660m },
            { "Garden View (6 pax)", 6815m },
            { "Garden View (8 pax)", 8460m },
            { "Barkada Room", 18925m },
            { "Villa", 2099m },
        };
        var weekendRates = new Dictionary<string, decimal>
        {
            { "Native Room", 2695m },
            { "Garden View (Easy Access)", 4019m },
            { "Sea View (Ground Floor)", 4294m },
            { "Saint Room", 4294m },
            { "Sea View (Upper Floor)", 5600m },
            { "Seaside View", 7075m },
            { "Garden View (6 pax)", 8519m },
            { "Garden View (8 pax)", 10575m },
            { "Barkada Room", 23656m },
            { "Villa", 2624m },
        };
        foreach (var rtName in roomTypes.Keys)
        {
            var roomTypeId = roomTypes[rtName];
            var weekdayRate = weekdayRates.TryGetValue(rtName, out var wd) ? wd : 2155m;
            var weekendRate = weekendRates.TryGetValue(rtName, out var we) ? we : 2695m;
            // Weekdays Promo
            var promoPlan = new RoomRatePlan
            {
                RoomTypeId = roomTypeId,
                Code = "WEEKDAY_PROMO",
                Name = "Weekdays Promo",
                StartDate = DateTime.Today,
                EndDate = null,
                Priority = 1,
                IsDefault = false,
                IsActive = true,
                CheckInTime = new TimeSpan(14, 0, 0),
                CheckOutTime = new TimeSpan(12, 0, 0),
            };
            _context.RoomRatePlans.Add(promoPlan);
            _context.SaveChanges();
            foreach (DayOfWeek day in Enum.GetValues(typeof(DayOfWeek)))
            {
                if (day == DayOfWeek.Saturday || day == DayOfWeek.Sunday) continue;
                _context.RoomRatePlanDays.Add(new RoomRatePlanDay
                {
                    RoomRatePlanId = promoPlan.Id,
                    DayOfWeek = day,
                    BasePrice = weekdayRate,
                });
            }
            _context.SaveChanges();
            // Weekend/Rack Rate
            var rackPlan = new RoomRatePlan
            {
                RoomTypeId = roomTypeId,
                Code = "RACK_RATE",
                Name = "Rack Rate (Weekend/Regular)",
                StartDate = DateTime.Today,
                EndDate = null,
                Priority = 2,
                IsDefault = true,
                IsActive = true,
                CheckInTime = new TimeSpan(14, 0, 0),
                CheckOutTime = new TimeSpan(12, 0, 0),
            };
            _context.RoomRatePlans.Add(rackPlan);
            _context.SaveChanges();
            foreach (DayOfWeek day in new[] { DayOfWeek.Saturday, DayOfWeek.Sunday })
            {
                _context.RoomRatePlanDays.Add(new RoomRatePlanDay
                {
                    RoomRatePlanId = rackPlan.Id,
                    DayOfWeek = day,
                    BasePrice = weekendRate,
                });
            }
            _context.SaveChanges();
        }
    }

    // Map initial room rates
    private readonly Dictionary<string, decimal> RoomTypeBaseRates = new()
    {
        { "Native Room", 2155m },
        { "Garden View (Easy Access)", 3215m },
        { "Sea View (Ground Floor)", 3435m },
        { "Saint Room", 3435m },
        { "Sea View (Upper Floor)", 4480m },
        { "Seaside View", 5660m },
        { "Garden View (6 pax)", 6815m },
        { "Garden View (8 pax)", 8460m },
        { "Barkada Room", 18925m },
        { "Villa", 2099m },
    };

    private void EnsureStaff()
    {
        if (_context.Staffs.Any())
        {
            return;
        }

        var definitions = new[]
        {
            new Staff { StaffCode = "HK-001", FullName = "Maria Santos", Department = "Housekeeping", Position = "Room Attendant", PhoneNumber = "09170000001", IsActive = true },
            new Staff { StaffCode = "HK-002", FullName = "Ana Reyes", Department = "Housekeeping", Position = "Room Attendant", PhoneNumber = "09170000002", IsActive = true },
            new Staff { StaffCode = "HK-003", FullName = "Lea Cruz", Department = "Housekeeping", Position = "Inspector", PhoneNumber = "09170000003", IsActive = true },
            new Staff { StaffCode = "HK-004", FullName = "Paolo Garcia", Department = "Housekeeping", Position = "Supervisor", PhoneNumber = "09170000004", IsActive = true },
            new Staff { StaffCode = "OPS-001", FullName = "Mark Dela Cruz", Department = "Operations", Position = "Duty Manager", PhoneNumber = "09170000005", IsActive = true },
        };

        _context.Staffs.AddRange(definitions);
        _context.SaveChanges();
    }

    private void EnsureGuests()
    {
        const int targetCount = 30;
        var existingCodes = new HashSet<string>();

        var firstNames = new[]
        {
            "Juan", "Maria", "Jose", "Ana", "Mark", "Paolo", "Carlo", "Liza", "Grace", "Nina",
            "John", "Jane", "Peter", "Paul", "Sarah", "Lea", "Daniel", "Miguel", "Ramon", "Ella",
            "Noah", "Liam", "Lucas", "Emma", "Olivia", "Sophia", "Mia", "Ava", "Chloe", "Zoe"
        };

        var lastNames = new[]
        {
            "Dela Cruz", "Santos", "Reyes", "Garcia", "Mendoza", "Ramos", "Castro", "Flores", "Torres", "Aquino",
            "Rivera", "Navarro", "Valdez", "Perez", "Gonzales", "Lim", "Chua", "Tan", "Morales", "Diaz",
            "Lopez", "Fernandez", "Bautista", "Villanueva", "Domingo", "Sarmiento", "Padilla", "Ocampo", "Rosales", "Manalo"
        };

        var nationalities = new[] { "Filipino", "American", "Japanese", "Korean", "Singaporean", "Australian" };

        for (var i = 1; i <= targetCount; i++)
        {
            var code = $"GST{i:0000}";
            var firstName = firstNames[(i - 1) % firstNames.Length];
            var lastName = lastNames[(i - 1) % lastNames.Length];

            _context.Guests.Add(new Guest
            {
                GuestCode = code,
                FirstName = firstName,
                LastName = lastName,
                MiddleName = string.Empty,
                Gender = i % 2 == 0 ? "Female" : "Male",
                DateOfBirth = DateTime.Today.AddYears(-(22 + (i % 25))),
                Email = $"guest{i:000}@example.com",
                Phone = $"09{(100000000 + i):D9}",
                Nationality = nationalities[(i - 1) % nationalities.Length],
                Notes = "Seeded guest record",
                IsActive = true,
            });

            existingCodes.Add(code);
        }

        _context.SaveChanges();
    }

    private void EnsureDocumentSequences()
    {
        var year = Clock.Now.Year;
        var definitions = new[]
        {
            (Type: "RESERVATION", Prefix: "RES-"),
            (Type: "STAY", Prefix: "STY-"),
            (Type: "FOLIO", Prefix: "FOL-"),
            (Type: "RECEIPT", Prefix: "RCT-"),
            (Type: "POS_ORDER", Prefix: "ORD"),
        };

        foreach (var def in definitions)
        {
            _context.DocumentSequences.Add(new DocumentSequence
            {
                DocumentType = def.Type,
                Prefix = def.Prefix,
                CurrentNumber = 0,
                Year = year,
                TenantId = _tenantId,
            });
        }

        _context.SaveChanges();
    }

    private void EnsurePosDocumentSequence()
    {
        var year = Clock.Now.Year;
        if (_context.DocumentSequences.Any(x => x.DocumentType == "POS_ORDER" && x.Year == year && x.TenantId == _tenantId))
            return;
        _context.DocumentSequences.Add(new DocumentSequence
        {
            DocumentType = "POS_ORDER",
            Prefix = "ORD",
            CurrentNumber = 0,
            Year = year,
            TenantId = _tenantId,
        });
        _context.SaveChanges();
    }

    private void EnsurePosData()
    {
        if (_context.PosOutlets.Any()) return;

        var restaurantChargeType = _context.ChargeTypes.FirstOrDefault(x => x.Name == "Restaurant");
        var spaChargeType = _context.ChargeTypes.FirstOrDefault(x => x.Name == "Spa");

        var mainOutlet = new PosOutlet
        {
            Name = "Main Restaurant",
            Location = "Lobby Level",
            IsActive = true,
            HasKitchen = true,
            ChargeTypeId = restaurantChargeType?.Id,
        };
        _context.PosOutlets.Add(mainOutlet);

        var spaOutlet = new PosOutlet
        {
            Name = "Spa Services",
            Location = "Wellness Wing",
            IsActive = true,
            HasKitchen = false,
            ChargeTypeId = spaChargeType?.Id,
        };
        _context.PosOutlets.Add(spaOutlet);
        _context.SaveChanges();

        _context.PosOutletTerminals.Add(new PosOutletTerminal
        {
            OutletId = mainOutlet.Id,
            Code = "POS-01",
            Name = "Terminal 1",
            IsActive = true,
        });
        _context.PosOutletTerminals.Add(new PosOutletTerminal
        {
            OutletId = spaOutlet.Id,
            Code = "POS-01",
            Name = "Terminal 1",
            IsActive = true,
        });
        _context.SaveChanges();

        for (var i = 1; i <= 8; i++)
        {
            _context.PosTables.Add(new PosTable
            {
                OutletId = mainOutlet.Id,
                TableNumber = i.ToString(),
                Capacity = 4,
                Status = PosTableStatus.Available,
            });
        }
        _context.SaveChanges();

        var categories = new[]
        {
            new MenuCategory { Name = "Beverages", DisplayOrder = 0 },
            new MenuCategory { Name = "Main Course", DisplayOrder = 1 },
            new MenuCategory { Name = "Desserts", DisplayOrder = 2 },
        };
        _context.MenuCategories.AddRange(categories);
        _context.SaveChanges();

        var beverages = categories[0];
        var mainCourse = categories[1];
        var desserts = categories[2];
        var menuItems = new List<MenuItem>
        {
            new() { CategoryId = beverages.Id, Name = "Coffee", Price = 120m, IsAvailable = true },
            new() { CategoryId = beverages.Id, Name = "Iced Tea", Price = 95m, IsAvailable = true },
            new() { CategoryId = beverages.Id, Name = "Beer", Price = 180m, IsAvailable = true },
            new() { CategoryId = beverages.Id, Name = "Fresh Juice", Price = 150m, IsAvailable = true },
            new() { CategoryId = mainCourse.Id, Name = "Grilled Salmon", Price = 450m, IsAvailable = true },
            new() { CategoryId = mainCourse.Id, Name = "Steak", Price = 550m, IsAvailable = true },
            new() { CategoryId = mainCourse.Id, Name = "Pasta", Price = 320m, IsAvailable = true },
            new() { CategoryId = mainCourse.Id, Name = "Caesar Salad", Price = 280m, IsAvailable = true },
            new() { CategoryId = desserts.Id, Name = "Ice Cream", Price = 150m, IsAvailable = true },
            new() { CategoryId = desserts.Id, Name = "Chocolate Cake", Price = 200m, IsAvailable = true },
        };
        _context.MenuItems.AddRange(menuItems);
        _context.SaveChanges();
    }
}
