using PMS.App;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace PMS.EntityFrameworkCore.Configurations;

internal class QuotationConfiguration : IEntityTypeConfiguration<Quotation>
{
    public void Configure(EntityTypeBuilder<Quotation> entity)
    {
        entity.ToTable("Quotation");

        entity.Property(e => e.QuotationNo).HasMaxLength(32).IsUnicode(false).IsRequired();
        entity.Property(e => e.GuestName).HasMaxLength(256);
        entity.Property(e => e.FirstName).HasMaxLength(128);
        entity.Property(e => e.LastName).HasMaxLength(128);
        entity.Property(e => e.Phone).HasMaxLength(64).IsUnicode(false);
        entity.Property(e => e.Email).HasMaxLength(256);
        entity.Property(e => e.Notes).HasMaxLength(1024);
        entity.Property(e => e.SpecialRequests).HasMaxLength(2048);
        entity.Property(e => e.TotalAmount).HasPrecision(18, 4);

        entity.HasIndex(e => e.QuotationNo).IsUnique();
        entity.HasIndex(e => e.Status);
        entity.HasIndex(e => e.ExpiresAt);

        entity.HasOne(e => e.Guest)
            .WithMany()
            .HasForeignKey(e => e.GuestId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

internal class QuotationRoomConfiguration : IEntityTypeConfiguration<QuotationRoom>
{
    public void Configure(EntityTypeBuilder<QuotationRoom> entity)
    {
        entity.ToTable("QuotationRoom");

        entity.Property(e => e.RoomTypeName).HasMaxLength(128);
        entity.Property(e => e.RoomNumber).HasMaxLength(16).IsUnicode(false);
        entity.Property(e => e.RatePerNight).HasPrecision(18, 4);
        entity.Property(e => e.Amount).HasPrecision(18, 4);
        entity.Property(e => e.SeniorCitizenDiscountAmount).HasPrecision(18, 4);
        entity.Property(e => e.NetAmount).HasPrecision(18, 4);

        entity.HasOne(e => e.Quotation)
            .WithMany(q => q.Rooms)
            .HasForeignKey(e => e.QuotationId)
            .OnDelete(DeleteBehavior.Cascade);

        entity.HasOne(e => e.RoomType)
            .WithMany()
            .HasForeignKey(e => e.RoomTypeId)
            .OnDelete(DeleteBehavior.Restrict);

        entity.HasOne(e => e.Room)
            .WithMany()
            .HasForeignKey(e => e.RoomId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

internal class QuotationExtraBedConfiguration : IEntityTypeConfiguration<QuotationExtraBed>
{
    public void Configure(EntityTypeBuilder<QuotationExtraBed> entity)
    {
        entity.ToTable("QuotationExtraBed");

        entity.Property(e => e.ExtraBedTypeName).HasMaxLength(128);
        entity.Property(e => e.Quantity).HasDefaultValue(1);
        entity.Property(e => e.RatePerNight).HasPrecision(18, 4);
        entity.Property(e => e.Amount).HasPrecision(18, 4);

        entity.HasOne(e => e.Quotation)
            .WithMany(q => q.ExtraBeds)
            .HasForeignKey(e => e.QuotationId)
            .OnDelete(DeleteBehavior.Cascade);

        entity.HasOne(e => e.ExtraBedType)
            .WithMany()
            .HasForeignKey(e => e.ExtraBedTypeId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
