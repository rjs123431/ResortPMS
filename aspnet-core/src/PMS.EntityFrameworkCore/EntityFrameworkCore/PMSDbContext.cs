using Abp.Zero.EntityFrameworkCore;
using PMS.App;
using PMS.Auditing;
using PMS.Authorization.Roles;
using PMS.Authorization.Users;
using PMS.EntityFrameworkCore.Configurations;
using PMS.MultiTenancy;
using PMS.Notifications;
using PMS.Storage;
using Microsoft.EntityFrameworkCore;

namespace PMS.EntityFrameworkCore;

public class PMSDbContext : AbpZeroDbContext<Tenant, Role, User, PMSDbContext>
{
    /* Define a DbSet for each entity of the application */
    public virtual DbSet<BinaryObject> BinaryObjects { get; set; }
    public virtual DbSet<GlobalNotification> GlobalNotifications { get; set; }

    public DbSet<DocumentSequence> DocumentSequences { get; set; }

    // Full mutation + financial audit (separate from ABP default audit)
    public DbSet<MutationAuditLog> MutationAuditLogs { get; set; }
    public DbSet<FinancialAuditLog> FinancialAuditLogs { get; set; }

    // Guest Management
    public DbSet<Guest> Guests { get; set; }
    public DbSet<GuestIdentification> GuestIdentifications { get; set; }

    // Room Management
    public DbSet<RoomType> RoomTypes { get; set; }
    public DbSet<Room> Rooms { get; set; }
    public DbSet<RoomStatusLog> RoomStatusLogs { get; set; }
    public DbSet<HousekeepingTask> HousekeepingTasks { get; set; }
    public DbSet<RoomMaintenanceRequest> RoomMaintenanceRequests { get; set; }
    public DbSet<RoomMaintenanceType> RoomMaintenanceTypes { get; set; }
    public DbSet<RoomMaintenanceRequestType> RoomMaintenanceRequestTypes { get; set; }
    public DbSet<RoomDailyInventory> RoomDailyInventories { get; set; }
    public DbSet<RoomRatePlanGroup> RoomRatePlanGroups { get; set; }
    public DbSet<RoomRatePlanGroupChannel> RoomRatePlanGroupChannels { get; set; }
    public DbSet<RoomRatePlan> RoomRatePlans { get; set; }
    public DbSet<RoomRatePlanDay> RoomRatePlanDays { get; set; }
    public DbSet<RatePlanDateOverride> RatePlanDateOverrides { get; set; }

    // Day Use
    public DbSet<DayUseOffer> DayUseOffers { get; set; }
    public DbSet<DayUseVisit> DayUseVisits { get; set; }
    public DbSet<DayUseVisitLine> DayUseVisitLines { get; set; }
    public DbSet<DayUsePayment> DayUsePayments { get; set; }

    // Lookup tables
    public DbSet<ChargeType> ChargeTypes { get; set; }
    public DbSet<PaymentMethod> PaymentMethods { get; set; }
    public DbSet<Channel> Channels { get; set; }
    public DbSet<Agency> Agencies { get; set; }
    public DbSet<ExtraBedType> ExtraBedTypes { get; set; }
    public DbSet<ExtraBedPrice> ExtraBedPrices { get; set; }

    // Reservation
    public DbSet<Reservation> Reservations { get; set; }
    public DbSet<ReservationRoom> ReservationRooms { get; set; }
    public DbSet<ReservationExtraBed> ReservationExtraBeds { get; set; }
    public DbSet<ReservationGuest> ReservationGuests { get; set; }
    public DbSet<ReservationDailyRate> ReservationDailyRates { get; set; }
    public DbSet<ReservationDeposit> ReservationDeposits { get; set; }

    // Quotation
    public DbSet<Quotation> Quotations { get; set; }
    public DbSet<QuotationRoom> QuotationRooms { get; set; }
    public DbSet<QuotationExtraBed> QuotationExtraBeds { get; set; }

    // PreCheckIn
    public DbSet<PreCheckIn> PreCheckIns { get; set; }
    public DbSet<PreCheckInRoom> PreCheckInRooms { get; set; }
    public DbSet<PreCheckInExtraBed> PreCheckInExtraBeds { get; set; }

    // Stay
    public DbSet<Stay> Stays { get; set; }
    public DbSet<StayGuest> StayGuests { get; set; }
    public DbSet<StayRoom> StayRooms { get; set; }
    public DbSet<StayRoomTransfer> StayRoomTransfers { get; set; }
    public DbSet<RoomTransfer> RoomTransfers { get; set; }
    public DbSet<StayExtension> StayExtensions { get; set; }
    public DbSet<RoomChangeRequest> RoomChangeRequests { get; set; }

    // Billing
    public DbSet<Folio> Folios { get; set; }
    public DbSet<FolioTransaction> FolioTransactions { get; set; }
    public DbSet<FolioPayment> FolioPayments { get; set; }
    public DbSet<FolioAdjustment> FolioAdjustments { get; set; }

    // Checkout
    public DbSet<CheckOutRecord> CheckOutRecords { get; set; }
    public DbSet<Receipt> Receipts { get; set; }
    public DbSet<ReceiptPayment> ReceiptPayments { get; set; }

    // Operational
    public DbSet<GuestRequest> GuestRequests { get; set; }
    public DbSet<Incident> Incidents { get; set; }
    public DbSet<HousekeepingLog> HousekeepingLogs { get; set; }
    public DbSet<Staff> Staffs { get; set; }

    // POS
    public DbSet<PosOutlet> PosOutlets { get; set; }
    public DbSet<PosOutletTerminal> PosOutletTerminals { get; set; }
    public DbSet<PosTable> PosTables { get; set; }
    public DbSet<MenuCategory> MenuCategories { get; set; }
    public DbSet<OptionGroup> OptionGroups { get; set; }
    public DbSet<Option> Options { get; set; }
    public DbSet<MenuItem> MenuItems { get; set; }
    public DbSet<MenuItemOptionGroup> MenuItemOptionGroups { get; set; }
    public DbSet<MenuItemOptionPriceOverride> MenuItemOptionPriceOverrides { get; set; }
    public DbSet<MenuItemPriceAdjustment> MenuItemPriceAdjustments { get; set; }
    public DbSet<MenuItemPromo> MenuItemPromos { get; set; }
    public DbSet<MenuItemPromoItem> MenuItemPromoItems { get; set; }
    public DbSet<MenuModifier> MenuModifiers { get; set; }
    public DbSet<PosOrder> PosOrders { get; set; }
    public DbSet<PosOrderItem> PosOrderItems { get; set; }
    public DbSet<PosOrderItemOption> PosOrderItemOptions { get; set; }
    public DbSet<PosOrderPayment> PosOrderPayments { get; set; }
    public DbSet<PosSession> PosSessions { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ChangeAbpTablePrefix<Tenant, Role, User>("Zzz");

        modelBuilder.Entity<BinaryObject>(b =>
        {
            b.HasIndex(e => new { e.TenantId });
        });

        modelBuilder.ApplyConfiguration(new DocumentSequenceConfiguration());

        // Guest Management
        modelBuilder.ApplyConfiguration(new GuestConfiguration());
        modelBuilder.ApplyConfiguration(new GuestIdentificationConfiguration());

        // Room Management
        modelBuilder.ApplyConfiguration(new RoomTypeConfiguration());
        modelBuilder.ApplyConfiguration(new RoomConfiguration());
        modelBuilder.ApplyConfiguration(new RoomStatusLogConfiguration());
        modelBuilder.ApplyConfiguration(new HousekeepingTaskConfiguration());
        modelBuilder.ApplyConfiguration(new RoomMaintenanceTypeConfiguration());
        modelBuilder.ApplyConfiguration(new RoomMaintenanceRequestTypeConfiguration());
        modelBuilder.ApplyConfiguration(new RoomMaintenanceRequestConfiguration());
        modelBuilder.ApplyConfiguration(new RoomDailyInventoryConfiguration());
        modelBuilder.ApplyConfiguration(new RoomRatePlanGroupConfiguration());
        modelBuilder.ApplyConfiguration(new RoomRatePlanGroupChannelConfiguration());
        modelBuilder.ApplyConfiguration(new RoomRatePlanConfiguration());
        modelBuilder.ApplyConfiguration(new RoomRatePlanDayConfiguration());
        modelBuilder.ApplyConfiguration(new RatePlanDateOverrideConfiguration());

        // Day Use
        modelBuilder.ApplyConfiguration(new DayUseOfferConfiguration());
        modelBuilder.ApplyConfiguration(new DayUseVisitConfiguration());
        modelBuilder.ApplyConfiguration(new DayUseVisitLineConfiguration());
        modelBuilder.ApplyConfiguration(new DayUsePaymentConfiguration());

        // Lookups
        modelBuilder.ApplyConfiguration(new ChargeTypeConfiguration());
        modelBuilder.ApplyConfiguration(new PaymentMethodConfiguration());
        modelBuilder.ApplyConfiguration(new ChannelConfiguration());
        modelBuilder.ApplyConfiguration(new AgencyConfiguration());
        modelBuilder.ApplyConfiguration(new ExtraBedTypeConfiguration());
        modelBuilder.ApplyConfiguration(new ExtraBedPriceConfiguration());

        // Reservation
        modelBuilder.ApplyConfiguration(new ReservationConfiguration());
        modelBuilder.ApplyConfiguration(new ReservationRoomConfiguration());
        modelBuilder.ApplyConfiguration(new ReservationExtraBedConfiguration());
        modelBuilder.ApplyConfiguration(new ReservationGuestConfiguration());
        modelBuilder.ApplyConfiguration(new ReservationDailyRateConfiguration());
        modelBuilder.ApplyConfiguration(new ReservationDepositConfiguration());

        // Quotation
        modelBuilder.ApplyConfiguration(new QuotationConfiguration());
        modelBuilder.ApplyConfiguration(new QuotationRoomConfiguration());
        modelBuilder.ApplyConfiguration(new QuotationExtraBedConfiguration());

        // PreCheckIn
        modelBuilder.ApplyConfiguration(new PreCheckInConfiguration());
        modelBuilder.ApplyConfiguration(new PreCheckInRoomConfiguration());
        modelBuilder.ApplyConfiguration(new PreCheckInExtraBedConfiguration());

        // Stay
        modelBuilder.ApplyConfiguration(new StayConfiguration());
        modelBuilder.ApplyConfiguration(new StayGuestConfiguration());
        modelBuilder.ApplyConfiguration(new StayRoomConfiguration());
        modelBuilder.ApplyConfiguration(new StayRoomTransferConfiguration());
        modelBuilder.ApplyConfiguration(new RoomTransferConfiguration());
        modelBuilder.ApplyConfiguration(new StayExtensionConfiguration());
        modelBuilder.ApplyConfiguration(new RoomChangeRequestConfiguration());

        // Billing
        modelBuilder.ApplyConfiguration(new FolioConfiguration());
        modelBuilder.ApplyConfiguration(new FolioTransactionConfiguration());
        modelBuilder.ApplyConfiguration(new FolioPaymentConfiguration());
        modelBuilder.ApplyConfiguration(new FolioAdjustmentConfiguration());

        // Checkout
        modelBuilder.ApplyConfiguration(new CheckOutRecordConfiguration());
        modelBuilder.ApplyConfiguration(new ReceiptConfiguration());
        modelBuilder.ApplyConfiguration(new ReceiptPaymentConfiguration());

        // Operational
        modelBuilder.ApplyConfiguration(new GuestRequestConfiguration());
        modelBuilder.ApplyConfiguration(new IncidentConfiguration());
        modelBuilder.ApplyConfiguration(new HousekeepingLogConfiguration());
        modelBuilder.ApplyConfiguration(new StaffConfiguration());

        // POS
        modelBuilder.ApplyConfiguration(new PosOutletConfiguration());
        modelBuilder.ApplyConfiguration(new PosOutletTerminalConfiguration());
        modelBuilder.ApplyConfiguration(new PosTableConfiguration());
        modelBuilder.ApplyConfiguration(new MenuCategoryConfiguration());
        modelBuilder.ApplyConfiguration(new OptionGroupConfiguration());
        modelBuilder.ApplyConfiguration(new OptionConfiguration());
        modelBuilder.ApplyConfiguration(new MenuItemOptionGroupConfiguration());
        modelBuilder.ApplyConfiguration(new MenuItemOptionPriceOverrideConfiguration());
        modelBuilder.ApplyConfiguration(new MenuItemConfiguration());
        modelBuilder.ApplyConfiguration(new MenuItemPriceAdjustmentConfiguration());
        modelBuilder.ApplyConfiguration(new MenuItemPromoConfiguration());
        modelBuilder.ApplyConfiguration(new MenuItemPromoItemConfiguration());
        modelBuilder.ApplyConfiguration(new MenuModifierConfiguration());
        modelBuilder.ApplyConfiguration(new PosOrderConfiguration());
        modelBuilder.ApplyConfiguration(new PosOrderItemConfiguration());
        modelBuilder.ApplyConfiguration(new PosOrderItemOptionConfiguration());
        modelBuilder.ApplyConfiguration(new PosOrderPaymentConfiguration());
        modelBuilder.ApplyConfiguration(new PosSessionConfiguration());

        // Audit (mutation + financial trail)
        modelBuilder.ApplyConfiguration(new MutationAuditLogConfiguration());
        modelBuilder.ApplyConfiguration(new FinancialAuditLogConfiguration());
    }

    public PMSDbContext(DbContextOptions<PMSDbContext> options)
        : base(options)
    {
    }
}