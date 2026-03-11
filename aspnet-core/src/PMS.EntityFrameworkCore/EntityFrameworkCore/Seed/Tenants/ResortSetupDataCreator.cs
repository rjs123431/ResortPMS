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
        if (HasExistingSeedData())
        {
            return;
        }

        var roomTypes = EnsureRoomTypes();
        EnsureRooms(roomTypes);
        EnsureChargeTypes();
        EnsureExtraBedTypes();
        EnsurePaymentMethods();
        EnsureGuests();
        EnsureDocumentSequences();
    }

    private bool HasExistingSeedData()
    {
        return _context.RoomTypes.Any()
               || _context.Rooms.Any()
               || _context.ChargeTypes.Any()
               || _context.ExtraBedTypes.Any()
               || _context.PaymentMethods.Any()
               || _context.Guests.Any()
               || _context.DocumentSequences.Any(x => x.TenantId == _tenantId);
    }

    private Dictionary<string, Guid> EnsureRoomTypes()
    {
        var definitions = new[]
        {
            new
            {
                Name = "Superior Twin Room",
                Description = "2 twin beds; 40 m2; Balcony; Sea view; Air conditioning; Attached bathroom; Free toiletries",
                MaxAdults = 2,
                MaxChildren = 2,
                BaseRate = 3215m,
                LegacyNames = new[] { "Standard" }
            },
            new
            {
                Name = "Superior King",
                Description = "1 king bed; 40 m2; Balcony; City view; Air conditioning; Attached bathroom; Tea or coffee maker",
                MaxAdults = 2,
                MaxChildren = 1,
                BaseRate = 4073m,
                LegacyNames = new[] { "Deluxe" }
            },
            new
            {
                Name = "Family Loft",
                Description = "2 queen beds; 55 m2; Family seating area; Pantry; Air conditioning; Smart TV",
                MaxAdults = 4,
                MaxChildren = 2,
                BaseRate = 5890m,
                LegacyNames = new[] { "Family" }
            },
            new
            {
                Name = "One Bedroom Suite",
                Description = "1 king bed; living room; 65 m2; Premium view; Late check-in; Flexible reschedule",
                MaxAdults = 3,
                MaxChildren = 2,
                BaseRate = 8292m,
                LegacyNames = new[] { "Suite" }
            },
        };

        foreach (var def in definitions)
        {
            _context.RoomTypes.Add(new RoomType
            {
                Name = def.Name,
                Description = def.Description,
                MaxAdults = def.MaxAdults,
                MaxChildren = def.MaxChildren,
                BaseRate = def.BaseRate,
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
            ("101", "Superior Twin Room", "1"), ("102", "Superior Twin Room", "1"), ("103", "Superior Twin Room", "1"), ("104", "Superior Twin Room", "1"), ("105", "Superior Twin Room", "1"),
            ("106", "Superior King", "1"), ("107", "Superior King", "1"), ("108", "Superior King", "1"), ("109", "Superior King", "1"), ("110", "Superior King", "1"),
            ("201", "Family Loft", "2"), ("202", "Family Loft", "2"), ("203", "Family Loft", "2"), ("204", "Family Loft", "2"), ("205", "Family Loft", "2"),
            ("301", "One Bedroom Suite", "3"), ("302", "One Bedroom Suite", "3"), ("303", "One Bedroom Suite", "3"), ("304", "One Bedroom Suite", "3"), ("305", "One Bedroom Suite", "3"),
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
                    OperationalStatus = RoomOperationalStatus.Vacant,
                    HousekeepingStatus = HousekeepingStatus.Clean,
                    IsActive = true,
                });
                continue;
            }

            existing.RoomTypeId = roomTypes[room.Type];
            existing.Floor = room.Floor;
            existing.IsActive = true;
            if (existing.OperationalStatus is RoomOperationalStatus.OutOfOrder or RoomOperationalStatus.OutOfService)
            {
                existing.OperationalStatus = RoomOperationalStatus.Vacant;
                existing.HousekeepingStatus = HousekeepingStatus.Clean;
            }
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

    private void EnsureExtraBedTypes()
    {
        var definitions = new[]
        {
            new ExtraBedType { Name = "Kid", BasePrice = 600m, IsActive = true },
            new ExtraBedType { Name = "Adult", BasePrice = 1000m, IsActive = true },
        };

        _context.ExtraBedTypes.AddRange(definitions);

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
}
