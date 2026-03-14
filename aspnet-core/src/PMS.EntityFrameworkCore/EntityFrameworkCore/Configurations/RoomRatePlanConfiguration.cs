using PMS.App;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace PMS.EntityFrameworkCore.Configurations;

internal class RoomRatePlanConfiguration : IEntityTypeConfiguration<RoomRatePlan>
{
    public void Configure(EntityTypeBuilder<RoomRatePlan> entity)
    {
        entity.ToTable("RoomRatePlan");

        entity.Property(e => e.Code).HasMaxLength(32).IsRequired();
        entity.Property(e => e.Name).HasMaxLength(128).IsRequired();
        entity.Property(e => e.StartDate).HasColumnType("date");
        entity.Property(e => e.EndDate).HasColumnType("date");

        entity.HasIndex(e => new { e.RoomTypeId, e.Code }).IsUnique();

        entity.HasOne(e => e.RoomType)
            .WithMany(rt => rt.RatePlans)
            .HasForeignKey(e => e.RoomTypeId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

internal class RoomRatePlanDayConfiguration : IEntityTypeConfiguration<RoomRatePlanDay>
{
    public void Configure(EntityTypeBuilder<RoomRatePlanDay> entity)
    {
        entity.ToTable("RoomRatePlanDay");

        entity.Property(e => e.DayOfWeek).HasConversion<int>();
        entity.Property(e => e.BasePrice).HasPrecision(18, 4);

        entity.HasIndex(e => new { e.RoomRatePlanId, e.DayOfWeek }).IsUnique();

        entity.HasOne(e => e.RoomRatePlan)
            .WithMany(rp => rp.DayRates)
            .HasForeignKey(e => e.RoomRatePlanId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

internal class RatePlanDateOverrideConfiguration : IEntityTypeConfiguration<RatePlanDateOverride>
{
    public void Configure(EntityTypeBuilder<RatePlanDateOverride> entity)
    {
        entity.ToTable("RatePlanDateOverride");

        entity.Property(e => e.RateDate).HasColumnType("date");
        entity.Property(e => e.OverridePrice).HasPrecision(18, 4);
        entity.Property(e => e.Description).HasMaxLength(256);

        entity.HasIndex(e => new { e.RoomRatePlanId, e.RateDate }).IsUnique();

        entity.HasOne(e => e.RoomRatePlan)
            .WithMany(rp => rp.DateOverrides)
            .HasForeignKey(e => e.RoomRatePlanId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
