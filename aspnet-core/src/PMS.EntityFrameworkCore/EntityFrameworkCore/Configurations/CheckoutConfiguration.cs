using PMS.App;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace PMS.EntityFrameworkCore.Configurations;

internal class CheckOutRecordConfiguration : IEntityTypeConfiguration<CheckOutRecord>
{
    public void Configure(EntityTypeBuilder<CheckOutRecord> entity)
    {
        entity.ToTable("CheckOutRecord");

        entity.Property(e => e.TotalCharges).HasPrecision(18, 4);
        entity.Property(e => e.TotalPayments).HasPrecision(18, 4);
        entity.Property(e => e.TotalDiscounts).HasPrecision(18, 4);
        entity.Property(e => e.BalanceDue).HasPrecision(18, 4);
        entity.Property(e => e.SettledAmount).HasPrecision(18, 4);

        entity.HasIndex(e => e.StayId).IsUnique();

        entity.HasOne(e => e.Stay)
            .WithMany()
            .HasForeignKey(e => e.StayId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

internal class ReceiptConfiguration : IEntityTypeConfiguration<Receipt>
{
    public void Configure(EntityTypeBuilder<Receipt> entity)
    {
        entity.ToTable("Receipt");

        entity.Property(e => e.ReceiptNo).HasMaxLength(32).IsUnicode(false).IsRequired();
        entity.Property(e => e.Amount).HasPrecision(18, 4);

        entity.HasIndex(e => e.ReceiptNo).IsUnique();

        entity.HasOne(e => e.Stay)
            .WithMany()
            .HasForeignKey(e => e.StayId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

internal class ReceiptPaymentConfiguration : IEntityTypeConfiguration<ReceiptPayment>
{
    public void Configure(EntityTypeBuilder<ReceiptPayment> entity)
    {
        entity.ToTable("ReceiptPayment");

        entity.Property(e => e.Amount).HasPrecision(18, 4);

        entity.HasOne(e => e.Receipt)
            .WithMany(r => r.Payments)
            .HasForeignKey(e => e.ReceiptId)
            .OnDelete(DeleteBehavior.Restrict);

        entity.HasOne(e => e.PaymentMethod)
            .WithMany()
            .HasForeignKey(e => e.PaymentMethodId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

internal class GuestRequestConfiguration : IEntityTypeConfiguration<GuestRequest>
{
    public void Configure(EntityTypeBuilder<GuestRequest> entity)
    {
        entity.ToTable("GuestRequest");

        entity.Property(e => e.RequestType).HasMaxLength(64).IsUnicode(false).IsRequired();
        entity.Property(e => e.Description).HasMaxLength(1024);
        entity.Property(e => e.Status).HasMaxLength(32).IsUnicode(false);

        entity.HasOne(e => e.Stay)
            .WithMany(s => s.GuestRequests)
            .HasForeignKey(e => e.StayId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

internal class IncidentConfiguration : IEntityTypeConfiguration<Incident>
{
    public void Configure(EntityTypeBuilder<Incident> entity)
    {
        entity.ToTable("Incident");

        entity.Property(e => e.Description).HasMaxLength(2048).IsRequired();
        entity.Property(e => e.Resolution).HasMaxLength(2048);

        entity.HasOne(e => e.Stay)
            .WithMany(s => s.Incidents)
            .HasForeignKey(e => e.StayId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

internal class HousekeepingLogConfiguration : IEntityTypeConfiguration<HousekeepingLog>
{
    public void Configure(EntityTypeBuilder<HousekeepingLog> entity)
    {
        entity.ToTable("HousekeepingLog");

        entity.Property(e => e.OldStatus).HasConversion<int>();
        entity.Property(e => e.NewStatus).HasConversion<int>();
        entity.Property(e => e.Remarks).HasMaxLength(512);

        entity.HasIndex(e => new { e.RoomId, e.CreationTime });

        entity.HasOne(e => e.Room)
            .WithMany()
            .HasForeignKey(e => e.RoomId)
            .OnDelete(DeleteBehavior.Restrict);

        entity.HasOne(e => e.Staff)
            .WithMany()
            .HasForeignKey(e => e.StaffId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

internal class StaffConfiguration : IEntityTypeConfiguration<Staff>
{
    public void Configure(EntityTypeBuilder<Staff> entity)
    {
        entity.ToTable("Staff");

        entity.Property(e => e.StaffCode).HasMaxLength(64).IsUnicode(false).IsRequired();
        entity.Property(e => e.FullName).HasMaxLength(128).IsRequired();
        entity.Property(e => e.Department).HasMaxLength(64);
        entity.Property(e => e.Position).HasMaxLength(64);
        entity.Property(e => e.PhoneNumber).HasMaxLength(32).IsUnicode(false);

        entity.HasIndex(e => e.StaffCode).IsUnique();
        entity.HasIndex(e => e.FullName);
    }
}
