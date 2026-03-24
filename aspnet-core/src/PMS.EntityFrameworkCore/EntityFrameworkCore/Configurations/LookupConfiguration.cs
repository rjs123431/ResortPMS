using PMS.App;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace PMS.EntityFrameworkCore.Configurations;

internal class ChargeTypeConfiguration : IEntityTypeConfiguration<ChargeType>
{
    public void Configure(EntityTypeBuilder<ChargeType> entity)
    {
        entity.ToTable("ChargeType");

        entity.Property(e => e.Name).HasMaxLength(128).IsRequired();
        entity.Property(e => e.Category).HasMaxLength(64).IsUnicode(false);

        entity.HasIndex(e => e.Name).IsUnique();
    }
}

internal class PaymentMethodConfiguration : IEntityTypeConfiguration<PaymentMethod>
{
    public void Configure(EntityTypeBuilder<PaymentMethod> entity)
    {
        entity.ToTable("PaymentMethod");

        entity.Property(e => e.Name).HasMaxLength(64).IsRequired();

        entity.HasIndex(e => e.Name).IsUnique();
    }
}

internal class ChannelConfiguration : IEntityTypeConfiguration<Channel>
{
    public void Configure(EntityTypeBuilder<Channel> entity)
    {
        entity.ToTable("Channel");

        entity.Property(e => e.Name).HasMaxLength(64).IsRequired();
        entity.Property(e => e.Icon).HasMaxLength(256).IsRequired(false);
        entity.Property(e => e.Sort).HasDefaultValue(0);

        entity.HasIndex(e => e.Name).IsUnique();
    }
}

internal class AgencyConfiguration : IEntityTypeConfiguration<Agency>
{
    public void Configure(EntityTypeBuilder<Agency> entity)
    {
        entity.ToTable("Agency");

        entity.Property(e => e.Name).HasMaxLength(128).IsRequired();

        entity.HasIndex(e => e.Name).IsUnique();
    }
}

internal class ExtraBedTypeConfiguration : IEntityTypeConfiguration<ExtraBedType>
{
    public void Configure(EntityTypeBuilder<ExtraBedType> entity)
    {
        entity.ToTable("ExtraBedType");

        entity.Property(e => e.Name).HasMaxLength(128).IsRequired();

        entity.HasIndex(e => e.Name).IsUnique();
    }
}

internal class ExtraBedPriceConfiguration : IEntityTypeConfiguration<ExtraBedPrice>
{
    public void Configure(EntityTypeBuilder<ExtraBedPrice> entity)
    {
        entity.ToTable("ExtraBedPrice");

        entity.Property(e => e.RatePerNight).HasPrecision(18, 2).IsRequired();
        entity.Property(e => e.EffectiveFrom).IsRequired();
        entity.Property(e => e.EffectiveTo).IsRequired(false);

        entity.HasOne(e => e.ExtraBedType)
              .WithMany()
              .HasForeignKey(e => e.ExtraBedTypeId)
              .OnDelete(DeleteBehavior.Cascade);

        entity.HasIndex(e => new { e.ExtraBedTypeId, e.EffectiveFrom });
    }
}
