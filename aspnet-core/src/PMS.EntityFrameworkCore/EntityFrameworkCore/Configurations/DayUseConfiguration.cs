using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PMS.App;

namespace PMS.EntityFrameworkCore.Configurations;

internal class DayUseOfferConfiguration : IEntityTypeConfiguration<DayUseOffer>
{
    public void Configure(EntityTypeBuilder<DayUseOffer> entity)
    {
        entity.ToTable("DayUseOffer");

        entity.Property(e => e.Code).HasMaxLength(64).IsRequired();
        entity.Property(e => e.Name).HasMaxLength(128).IsRequired();
        entity.Property(e => e.VariantName).HasMaxLength(128);
        entity.Property(e => e.Description).HasMaxLength(512);
        entity.Property(e => e.Amount).HasPrecision(18, 4);

        entity.HasIndex(e => e.Code).IsUnique();
        entity.HasIndex(e => new { e.GuestContext, e.OfferType, e.SortOrder });

        entity.HasOne(e => e.ChargeType)
            .WithMany()
            .HasForeignKey(e => e.ChargeTypeId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

internal class DayUseVisitConfiguration : IEntityTypeConfiguration<DayUseVisit>
{
    public void Configure(EntityTypeBuilder<DayUseVisit> entity)
    {
        entity.ToTable("DayUseVisit");

        entity.Property(e => e.VisitNo).HasMaxLength(32).IsUnicode(false).IsRequired();
        entity.Property(e => e.VisitDate).HasColumnType("date");
        entity.Property(e => e.GuestName).HasMaxLength(256).IsRequired();
        entity.Property(e => e.Remarks).HasMaxLength(512);
        entity.Property(e => e.TotalAmount).HasPrecision(18, 4);
        entity.Property(e => e.PaidAmount).HasPrecision(18, 4);
        entity.Property(e => e.BalanceAmount).HasPrecision(18, 4);

        entity.HasIndex(e => e.VisitNo).IsUnique();
        entity.HasIndex(e => new { e.VisitDate, e.GuestContext });

        entity.HasOne(e => e.Guest)
            .WithMany()
            .HasForeignKey(e => e.GuestId)
            .OnDelete(DeleteBehavior.Restrict);

        entity.HasOne(e => e.Stay)
            .WithMany()
            .HasForeignKey(e => e.StayId)
            .OnDelete(DeleteBehavior.Restrict);

        entity.HasOne(e => e.Room)
            .WithMany()
            .HasForeignKey(e => e.RoomId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

internal class DayUseVisitLineConfiguration : IEntityTypeConfiguration<DayUseVisitLine>
{
    public void Configure(EntityTypeBuilder<DayUseVisitLine> entity)
    {
        entity.ToTable("DayUseVisitLine");

        entity.Property(e => e.OfferCode).HasMaxLength(64).IsRequired();
        entity.Property(e => e.OfferName).HasMaxLength(128).IsRequired();
        entity.Property(e => e.VariantName).HasMaxLength(128);
        entity.Property(e => e.Description).HasMaxLength(512);
        entity.Property(e => e.Quantity).HasPrecision(18, 4);
        entity.Property(e => e.UnitPrice).HasPrecision(18, 4);
        entity.Property(e => e.Amount).HasPrecision(18, 4);

        entity.HasIndex(e => e.DayUseVisitId);

        entity.HasOne(e => e.DayUseVisit)
            .WithMany(v => v.Lines)
            .HasForeignKey(e => e.DayUseVisitId)
            .OnDelete(DeleteBehavior.Restrict);

        entity.HasOne(e => e.DayUseOffer)
            .WithMany()
            .HasForeignKey(e => e.DayUseOfferId)
            .OnDelete(DeleteBehavior.Restrict);

        entity.HasOne(e => e.ChargeType)
            .WithMany()
            .HasForeignKey(e => e.ChargeTypeId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

internal class DayUsePaymentConfiguration : IEntityTypeConfiguration<DayUsePayment>
{
    public void Configure(EntityTypeBuilder<DayUsePayment> entity)
    {
        entity.ToTable("DayUsePayment");

        entity.Property(e => e.Amount).HasPrecision(18, 4);
        entity.Property(e => e.ReferenceNo).HasMaxLength(64).IsUnicode(false);
        entity.Property(e => e.Notes).HasMaxLength(512);

        entity.HasIndex(e => new { e.DayUseVisitId, e.PaidAt });

        entity.HasOne(e => e.DayUseVisit)
            .WithMany(v => v.Payments)
            .HasForeignKey(e => e.DayUseVisitId)
            .OnDelete(DeleteBehavior.Restrict);

        entity.HasOne(e => e.PaymentMethod)
            .WithMany()
            .HasForeignKey(e => e.PaymentMethodId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}