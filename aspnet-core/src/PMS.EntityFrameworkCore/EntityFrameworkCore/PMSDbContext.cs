using Abp.Zero.EntityFrameworkCore;
using PMS.App;
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

    // Guest Management
    public DbSet<Guest> Guests { get; set; }
    public DbSet<GuestIdentification> GuestIdentifications { get; set; }

    // Room Management
    public DbSet<RoomType> RoomTypes { get; set; }
    public DbSet<Room> Rooms { get; set; }
    public DbSet<RoomStatusLog> RoomStatusLogs { get; set; }

    // Lookup tables
    public DbSet<ChargeType> ChargeTypes { get; set; }
    public DbSet<PaymentMethod> PaymentMethods { get; set; }
    public DbSet<ExtraBedType> ExtraBedTypes { get; set; }

    // Reservation
    public DbSet<Reservation> Reservations { get; set; }
    public DbSet<ReservationRoom> ReservationRooms { get; set; }
    public DbSet<ReservationExtraBed> ReservationExtraBeds { get; set; }
    public DbSet<ReservationGuest> ReservationGuests { get; set; }
    public DbSet<ReservationDailyRate> ReservationDailyRates { get; set; }
    public DbSet<ReservationDeposit> ReservationDeposits { get; set; }

    // Stay
    public DbSet<Stay> Stays { get; set; }
    public DbSet<StayGuest> StayGuests { get; set; }
    public DbSet<StayRoom> StayRooms { get; set; }
    public DbSet<RoomTransfer> RoomTransfers { get; set; }
    public DbSet<StayExtension> StayExtensions { get; set; }

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

        // Lookups
        modelBuilder.ApplyConfiguration(new ChargeTypeConfiguration());
        modelBuilder.ApplyConfiguration(new PaymentMethodConfiguration());
        modelBuilder.ApplyConfiguration(new ExtraBedTypeConfiguration());

        // Reservation
        modelBuilder.ApplyConfiguration(new ReservationConfiguration());
        modelBuilder.ApplyConfiguration(new ReservationRoomConfiguration());
        modelBuilder.ApplyConfiguration(new ReservationExtraBedConfiguration());
        modelBuilder.ApplyConfiguration(new ReservationGuestConfiguration());
        modelBuilder.ApplyConfiguration(new ReservationDailyRateConfiguration());
        modelBuilder.ApplyConfiguration(new ReservationDepositConfiguration());

        // Stay
        modelBuilder.ApplyConfiguration(new StayConfiguration());
        modelBuilder.ApplyConfiguration(new StayGuestConfiguration());
        modelBuilder.ApplyConfiguration(new StayRoomConfiguration());
        modelBuilder.ApplyConfiguration(new RoomTransferConfiguration());
        modelBuilder.ApplyConfiguration(new StayExtensionConfiguration());

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

    }

    public PMSDbContext(DbContextOptions<PMSDbContext> options)
        : base(options)
    {
    }
}