using PMS.App;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace PMS.EntityFrameworkCore.Configurations;

internal class FolioConfiguration : IEntityTypeConfiguration<Folio>
{
    public void Configure(EntityTypeBuilder<Folio> entity)
    {
        entity.ToTable("Folio");

        entity.Property(e => e.FolioNo).HasMaxLength(32).IsUnicode(false).IsRequired();
        entity.Property(e => e.Balance).HasPrecision(18, 4);

        entity.HasIndex(e => e.FolioNo).IsUnique();
        entity.HasIndex(e => e.StayId);

        entity.HasOne(e => e.Stay)
            .WithMany()
            .HasForeignKey(e => e.StayId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

internal class FolioTransactionConfiguration : IEntityTypeConfiguration<FolioTransaction>
{
    public void Configure(EntityTypeBuilder<FolioTransaction> entity)
    {
        entity.ToTable("FolioTransaction");

        entity.Property(e => e.Description).HasMaxLength(512).IsRequired();
        entity.Property(e => e.Quantity).HasPrecision(18, 4);
        entity.Property(e => e.UnitPrice).HasPrecision(18, 4);
        entity.Property(e => e.Amount).HasPrecision(18, 4);
        entity.Property(e => e.TaxAmount).HasPrecision(18, 4);
        entity.Property(e => e.DiscountAmount).HasPrecision(18, 4);
        entity.Property(e => e.NetAmount).HasPrecision(18, 4);
        entity.Property(e => e.VoidReason).HasMaxLength(512);
        entity.Property(e => e.IsVoided).HasDefaultValue(false);

        entity.HasIndex(e => new { e.FolioId, e.TransactionDate });

        entity.HasOne(e => e.Folio)
            .WithMany(f => f.Transactions)
            .HasForeignKey(e => e.FolioId)
            .OnDelete(DeleteBehavior.Restrict);

        entity.HasOne(e => e.ChargeType)
            .WithMany()
            .HasForeignKey(e => e.ChargeTypeId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

internal class FolioPaymentConfiguration : IEntityTypeConfiguration<FolioPayment>
{
    public void Configure(EntityTypeBuilder<FolioPayment> entity)
    {
        entity.ToTable("FolioPayment");

        entity.Property(e => e.Amount).HasPrecision(18, 4);
        entity.Property(e => e.ReferenceNo).HasMaxLength(64).IsUnicode(false);
        entity.Property(e => e.Notes).HasMaxLength(512);
        entity.Property(e => e.VoidReason).HasMaxLength(512);
        entity.Property(e => e.IsVoided).HasDefaultValue(false);

        entity.HasIndex(e => new { e.FolioId, e.PaidDate });

        entity.HasOne(e => e.Folio)
            .WithMany(f => f.Payments)
            .HasForeignKey(e => e.FolioId)
            .OnDelete(DeleteBehavior.Restrict);

        entity.HasOne(e => e.PaymentMethod)
            .WithMany()
            .HasForeignKey(e => e.PaymentMethodId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

internal class FolioAdjustmentConfiguration : IEntityTypeConfiguration<FolioAdjustment>
{
    public void Configure(EntityTypeBuilder<FolioAdjustment> entity)
    {
        entity.ToTable("FolioAdjustment");

        entity.Property(e => e.AdjustmentType).HasMaxLength(64).IsUnicode(false).IsRequired();
        entity.Property(e => e.Amount).HasPrecision(18, 4);
        entity.Property(e => e.Reason).HasMaxLength(512).IsRequired();

        entity.HasOne(e => e.Folio)
            .WithMany()
            .HasForeignKey(e => e.FolioId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
