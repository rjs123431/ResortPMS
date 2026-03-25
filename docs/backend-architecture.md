# PMS – Backend Architecture Deep Reference

> **For AI agents**: This document covers patterns, conventions, and implementation details for the .NET backend. Read `Agents.MD` first for the project overview — this file goes deeper on backend specifics.

---

## 1. Project Layout

```
aspnet-core/src/
├── PMS.Core/                          ← Domain layer
│   ├── App/                           ← All domain entities (flat, by aggregate)
│   │   ├── Reservation.cs             ← Reservation, ReservationRoom, ReservationDailyRate, etc.
│   │   ├── Stay.cs                    ← Stay, StayGuest, StayRoom, RoomTransfer, etc.
│   │   ├── Room.cs                    ← Room, RoomType, RoomStatusLog, RoomDailyInventory
│   │   ├── Guest.cs                   ← Guest, GuestIdentification
│   │   ├── Folio.cs                   ← Folio, FolioTransaction, FolioPayment, FolioAdjustment
│   │   ├── Checkout.cs                ← CheckOutRecord, Receipt, ReceiptPayment
│   │   ├── Maintenance.cs             ← RoomMaintenanceRequest, RoomMaintenanceType
│   │   ├── Pos.cs + Pos/              ← All POS entities
│   │   ├── ReservationStatus.cs       ← Enums
│   │   └── Repositories/              ← IRepository interfaces (custom)
│   └── Authorization/
│       └── AppAuthorizationProvider.cs ← ALL permission definitions
├── PMS.Application/                   ← Application layer
│   ├── App/                           ← One folder per domain
│   │   ├── Reservations/              ← ReservationAppService, DTOs, IReservationAppService
│   │   ├── Stays/                     ← StayAppService, DTOs, etc.
│   │   ├── CheckIn/                   ← CheckInAppService
│   │   ├── Checkout/                  ← CheckOutAppService
│   │   ├── Rooms/                     ← RoomAppService, RoomTypeAppService
│   │   ├── RoomRatePlans/             ← RoomRatePlanAppService
│   │   ├── Guests/                    ← GuestAppService
│   │   ├── Housekeeping/              ← HousekeepingAppService
│   │   ├── Maintenance/               ← RoomMaintenanceAppService
│   │   ├── PreCheckIns/               ← PreCheckInAppService
│   │   ├── Quotations/                ← QuotationAppService
│   │   ├── FrontDesk/                 ← FrontDeskDashboardAppService
│   │   ├── RoomRack/                  ← RoomRackAppService
│   │   ├── Pos/                       ← All POS AppServices
│   │   ├── Lookups/                   ← ChargeType, PaymentMethod, Channel, Agency, etc.
│   │   └── Incidents/                 ← IncidentAppService
│   ├── CustomDtoMapper.cs             ← AutoMapper mappings (all domains)
│   └── PMSApplicationModule.cs        ← Module registration
├── PMS.EntityFrameworkCore/           ← Data access layer
│   └── EntityFrameworkCore/
│       ├── PMSDbContext.cs            ← All DbSets (100+ entities)
│       ├── Configurations/            ← IEntityTypeConfiguration per aggregate
│       │   ├── ReservationConfiguration.cs
│       │   ├── StayConfiguration.cs
│       │   └── ...
│       └── Seed/                      ← Data seeding
└── PMS.Web.Host/                      ← API host
    ├── Startup.cs                     ← DI registration, middleware
    └── appsettings.json               ← Connection strings, JWT config
```

---

## 2. Entity Base Classes

| Base Class | Soft Delete | Auditing | When to use |
|---|---|---|---|
| `FullAuditedEntity<T>` | Yes (`IsDeleted`) | Created + Modified + Who | Transactional docs: Reservation, Stay, Folio, etc. |
| `AuditedEntity<T>` | No | Created + Modified + Who | Master data: RoomType, Guest, Staff |
| `CreationAuditedEntity<T>` | No | Created + Who only | Logs: HousekeepingLog, FolioTransaction |
| `Entity<T>` | No | None | Child aggregates: RoomRatePlanDay, ReservationRoom |

### Custom Interfaces
- `IPassivable` — adds `bool IsActive` (soft deactivation)
- `ISyncable` — adds `DateTime? LastSyncTime` (offline sync)
- `IMayHaveTenant` — adds `int? TenantId` (used on DocumentSequence)

### ID Types
- Use `int` for most entities (auto-increment)
- Use `long` for high-volume entities (FolioTransaction, logs)
- Use `string` for document-number-keyed entities

---

## 3. Adding a New Domain Entity

### Step 1: Create the entity in `PMS.Core/App/`
```csharp
// PMS.Core/App/Operational.cs (or a new file)
using Abp.Domain.Entities.Auditing;

namespace PMS.Core.App
{
    public class GuestFeedback : FullAuditedEntity<int>, IPassivable
    {
        public const int MaxCommentLength = 2000;

        public int StayId { get; set; }
        public virtual Stay Stay { get; set; }

        public int Rating { get; set; }                          // 1–5
        public string Comment { get; set; }
        public FeedbackStatus Status { get; set; }
        public bool IsActive { get; set; } = true;
    }

    public enum FeedbackStatus
    {
        Pending = 0,
        Reviewed = 1,
        Actioned = 2
    }
}
```

### Step 2: Add EF Core configuration in `PMS.EntityFrameworkCore/EntityFrameworkCore/Configurations/`
```csharp
// OperationalConfiguration.cs (or add to relevant file)
public class GuestFeedbackConfiguration : IEntityTypeConfiguration<GuestFeedback>
{
    public void Configure(EntityTypeBuilder<GuestFeedback> builder)
    {
        builder.ToTable("GuestFeedbacks");
        builder.Property(e => e.Comment).HasMaxLength(GuestFeedback.MaxCommentLength).IsUnicode(true);
        builder.HasOne(e => e.Stay).WithMany().HasForeignKey(e => e.StayId)
               .OnDelete(DeleteBehavior.Restrict);
    }
}
```

### Step 3: Register in `PMSDbContext.cs`
```csharp
public DbSet<GuestFeedback> GuestFeedbacks { get; set; }
```
And in `OnModelCreating`:
```csharp
modelBuilder.ApplyConfiguration(new GuestFeedbackConfiguration());
```

### Step 4: Run migrations
```bash
./app migration add "AddGuestFeedback"
./app db update
```

---

## 4. Adding a New AppService

### Step 1: Create DTOs in `PMS.Application/App/<Module>/`
```csharp
// GuestFeedbackDto.cs
public class GuestFeedbackDto : EntityDto<int>
{
    public int StayId { get; set; }
    public string GuestName { get; set; }
    public int Rating { get; set; }
    public string Comment { get; set; }
    public FeedbackStatus Status { get; set; }
    public DateTime CreationTime { get; set; }
}

public class CreateGuestFeedbackDto
{
    [Required] public int StayId { get; set; }
    [Range(1, 5)] public int Rating { get; set; }
    [MaxLength(GuestFeedback.MaxCommentLength)] public string Comment { get; set; }
}

public class GetGuestFeedbacksInput : PagedResultFilterRequestDto, IShouldNormalize
{
    public int? StayId { get; set; }
    public void Normalize() { Sorting ??= "CreationTime DESC"; }
}
```

### Step 2: Create the interface
```csharp
// IGuestFeedbackAppService.cs
public interface IGuestFeedbackAppService : IApplicationService
{
    Task<PagedResultDto<GuestFeedbackDto>> GetAllAsync(GetGuestFeedbacksInput input);
    Task<GuestFeedbackDto> CreateAsync(CreateGuestFeedbackDto input);
}
```

### Step 3: Implement the AppService
```csharp
[AbpAuthorize]
public class GuestFeedbackAppService : PMSAppServiceBase, IGuestFeedbackAppService
{
    private readonly IRepository<GuestFeedback, int> _feedbackRepository;

    public GuestFeedbackAppService(IRepository<GuestFeedback, int> feedbackRepository)
    {
        _feedbackRepository = feedbackRepository;
    }

    public async Task<PagedResultDto<GuestFeedbackDto>> GetAllAsync(GetGuestFeedbacksInput input)
    {
        var query = _feedbackRepository.GetAll()
            .WhereIf(!string.IsNullOrEmpty(input.Filter),
                f => f.Comment.Contains(input.Filter))
            .WhereIf(input.StayId.HasValue, f => f.StayId == input.StayId.Value);

        var total = await query.CountAsync();
        var items = await query
            .OrderBy(input.Sorting)
            .Skip(input.SkipCount)
            .Take(input.MaxResultCount)
            .ToListAsync();

        return new PagedResultDto<GuestFeedbackDto>(total, ObjectMapper.Map<List<GuestFeedbackDto>>(items));
    }

    [UnitOfWork]
    [AbpAuthorize(PermissionNames.Pages_Stays)]
    public async Task<GuestFeedbackDto> CreateAsync(CreateGuestFeedbackDto input)
    {
        var feedback = ObjectMapper.Map<GuestFeedback>(input);
        var id = await _feedbackRepository.InsertAndGetIdAsync(feedback);
        await CurrentUnitOfWork.SaveChangesAsync();
        return ObjectMapper.Map<GuestFeedbackDto>(await _feedbackRepository.GetAsync(id));
    }
}
```

### Step 4: Add AutoMapper in `CustomDtoMapper.cs`
```csharp
cfg.CreateMap<GuestFeedback, GuestFeedbackDto>()
   .ForMember(d => d.GuestName, o => o.MapFrom(s => s.Stay.MainGuest.FullName)); // if needed

cfg.CreateMap<CreateGuestFeedbackDto, GuestFeedback>();
```

### Step 5: Register permissions (if new)
In `AppAuthorizationProvider.cs`:
```csharp
var guestFeedback = hotel.CreateChildPermission(PermissionNames.Pages_GuestFeedback, L("GuestFeedback"));
guestFeedback.CreateChildPermission(PermissionNames.Pages_GuestFeedback_Create, L("Create"));
```

---

## 5. DTO Input Patterns

```csharp
// Paged input base — inherit from this for list endpoints
public class GetItemsInput : PagedResultFilterRequestDto, IShouldNormalize
{
    public DateTime? FromDate { get; set; }
    public bool? IsActive { get; set; }

    public void Normalize() { Sorting ??= "Id DESC"; }
}
// PagedResultFilterRequestDto already has: Filter, MaxResultCount, SkipCount, Sorting
```

---

## 6. Authorization Pattern

```csharp
// Class level — any authenticated user
[AbpAuthorize]
public class MyAppService : PMSAppServiceBase { ... }

// Class level — specific permission
[AbpAuthorize(PermissionNames.Pages_Reservations)]
public class ReservationAppService : PMSAppServiceBase { ... }

// Method level override
[AbpAuthorize(PermissionNames.Pages_Reservations_Create)]
public async Task<ReservationDto> CreateAsync(CreateReservationDto input) { ... }

// Anonymous method inside authorized class
[AbpAllowAnonymous]
public async Task<SomeDto> GetPublicDataAsync() { ... }
```

---

## 7. Repository Patterns

```csharp
// Standard injection
private readonly IRepository<Reservation, int> _reservationRepository;

// Common operations
await _repository.InsertAndGetIdAsync(entity);
await _repository.InsertAsync(entity);
await _repository.UpdateAsync(entity);
await _repository.DeleteAsync(id);
var entity = await _repository.GetAsync(id);
var entity = await _repository.FirstOrDefaultAsync(x => x.Code == code);

// Querying with navigation
var query = _repository.GetAllIncluding(r => r.Rooms, r => r.Guests)
    .Where(r => r.Status == ReservationStatus.Confirmed);

// ABP WhereIf helper
.WhereIf(condition, predicate)   // applies predicate only when condition is true
```

---

## 8. Mapping Reference (CustomDtoMapper.cs)

All mappings are in `PMS.Application/CustomDtoMapper.cs`:
```csharp
public static void CreateMappings(IMapperConfigurationExpression cfg)
{
    // Entity → DTO
    cfg.CreateMap<Reservation, ReservationDto>()
       .ForMember(d => d.GuestName, o => o.MapFrom(s => s.MainGuest != null ? s.MainGuest.FullName : ""));

    // CreateDto → Entity (ignore computed/audit fields)
    cfg.CreateMap<CreateReservationDto, Reservation>()
       .ForMember(d => d.Id, o => o.Ignore())
       .ForMember(d => d.Status, o => o.Ignore());
}
```

---

## 9. Key Domain Logic Locations

| Concern | Location |
|---|---|
| Reservation status transitions | `ReservationAppService` — `ConfirmAsync`, `CancelAsync`, etc. |
| Check-in logic | `CheckInAppService` — validates room, creates Stay + Folio |
| Folio/billing | `StayAppService` — `PostChargeAsync`, `PostPaymentAsync`, `PostRefundAsync` |
| Checkout | `CheckOutAppService` — `ProcessCheckOutAsync`, `WriteOffBalanceAsync` |
| Room availability | `RoomAvailabilityAppService` — `RoomDailyInventory` records |
| Rate calculation | `RoomPricingAppService` — applies rate plan + overrides |
| Document numbering | `DocumentNumberService` — `DocumentSequence` table, per-tenant |

---

## 10. EF Core Configuration Conventions

```csharp
// In Configurations/<Domain>Configuration.cs
public class ReservationConfiguration : IEntityTypeConfiguration<Reservation>
{
    public void Configure(EntityTypeBuilder<Reservation> builder)
    {
        builder.ToTable("Reservations");

        // String columns
        builder.Property(e => e.ConfirmationNo).HasMaxLength(32).IsUnicode(false);
        builder.Property(e => e.SpecialRequests).HasMaxLength(1000).IsUnicode(true);

        // Decimal precision (always use for financial data)
        builder.Property(e => e.TotalAmount).HasColumnType("decimal(18,4)");

        // Status as int
        builder.Property(e => e.Status).HasConversion<int>();

        // FK with Restrict (most relationships — never cascading delete)
        builder.HasOne(e => e.Guest).WithMany().HasForeignKey(e => e.GuestId)
               .OnDelete(DeleteBehavior.Restrict);

        // Index
        builder.HasIndex(e => new { e.TenantId, e.ArrivalDate }).HasDatabaseName("IX_Reservations_TenantId_ArrivalDate");
    }
}
```

---

## 11. ABP Multi-Tenancy

- All hotel entities are **tenant-scoped** automatically (ABP handles `TenantId` filtering)
- Entities that explicitly need `TenantId` on the model implement `IMayHaveTenant`
- `DocumentSequence` uses `IMayHaveTenant` for per-tenant document numbering
- Current tenant: `AbpSession.TenantId` or `CurrentUnitOfWork.GetTenantId()`

---

## 12. Permissions Reference (AppAuthorizationProvider.cs)

All permissions are registered in `PMS.Core/Authorization/AppAuthorizationProvider.cs`.

```csharp
// Pattern for new feature permissions
var myFeature = hotel.CreateChildPermission(PermissionNames.Pages_MyFeature, L("MyFeature"));
myFeature.CreateChildPermission(PermissionNames.Pages_MyFeature_Create, L("Create"));
myFeature.CreateChildPermission(PermissionNames.Pages_MyFeature_Edit, L("Edit"));
myFeature.CreateChildPermission(PermissionNames.Pages_MyFeature_Delete, L("Delete"));
```

And add to `PMS.Core/Authorization/PermissionNames.cs`:
```csharp
public const string Pages_MyFeature = "Pages.MyFeature";
public const string Pages_MyFeature_Create = "Pages.MyFeature.Create";
public const string Pages_MyFeature_Edit = "Pages.MyFeature.Edit";
```

---

## 13. Domain Events

Published via ABP's `EventBus`:
```csharp
// Publish
await EventBus.TriggerAsync(new ReservationStatusChangedEvent
{
    ReservationId = reservation.Id,
    OldStatus = oldStatus,
    NewStatus = reservation.Status
});

// Subscribe (in another service or handler)
public class ReservationStatusChangedHandler : IAsyncEventHandler<ReservationStatusChangedEvent>
{
    public async Task HandleEventAsync(ReservationStatusChangedEvent eventData)
    {
        // react to status change (e.g., update RoomDailyInventory)
    }
}
```

---

## 14. SignalR Hubs

Located in `PMS.Application/Hubs/`. Used by the frontend via `SignalRContext`.

Key hub methods triggered by backend operations:
- Room status updates → frontend `RoomStatusChanged`
- Reservation changes → frontend `ReservationUpdated`
- Housekeeping task updates → frontend `HousekeepingTaskUpdated`

---

## 15. Build & Test

```bash
# From repo root
cd aspnet-core && dotnet build src/PMS.Web.Host/PMS.Web.Host.csproj

# From PMS.Web.Host folder
dotnet run

# Migrations (from repo root — ALWAYS use ./app script)
./app migration add "DescriptiveName"
./app migration list
./app db update
./app db reset    # Drop + recreate + seed
```

---

## 16. API URL Convention

All AppService methods are auto-exposed as:
```
GET/POST  /api/services/app/{ServiceName}/{MethodName}
```

| HTTP Verb | When |
|---|---|
| `GET` | Methods with no side effects (Get, GetAll, Check) |
| `POST` | Create, process, state-change methods |
| `PUT` | Update methods |
| `DELETE` | Delete methods |

ABP infers the verb from method name prefix by default. Override with `[HttpGet]`, `[HttpPost]` etc. on the service method.
