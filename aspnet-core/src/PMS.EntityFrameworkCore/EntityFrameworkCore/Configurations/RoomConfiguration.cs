using PMS.App;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace PMS.EntityFrameworkCore.Configurations;

internal class RoomTypeConfiguration : IEntityTypeConfiguration<RoomType>
{
    public void Configure(EntityTypeBuilder<RoomType> entity)
    {
        entity.ToTable("RoomType");

        entity.Property(e => e.Name).HasMaxLength(128).IsRequired();
        entity.Property(e => e.Description).HasMaxLength(512);
        entity.Property(e => e.BaseRate).HasPrecision(18, 4);

        entity.HasIndex(e => e.Name).IsUnique();
    }
}

internal class RoomConfiguration : IEntityTypeConfiguration<Room>
{
    public void Configure(EntityTypeBuilder<Room> entity)
    {
        entity.ToTable("Room");

        entity.Property(e => e.RoomNumber).HasMaxLength(16).IsUnicode(false).IsRequired();
        entity.Property(e => e.Floor).HasMaxLength(32).IsUnicode(false);

        entity.HasIndex(e => e.RoomNumber).IsUnique();

        entity.HasOne(e => e.RoomType)
            .WithMany(rt => rt.Rooms)
            .HasForeignKey(e => e.RoomTypeId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

internal class RoomStatusLogConfiguration : IEntityTypeConfiguration<RoomStatusLog>
{
    public void Configure(EntityTypeBuilder<RoomStatusLog> entity)
    {
        entity.ToTable("RoomStatusLog");

        entity.Property(e => e.Remarks).HasMaxLength(256);

        entity.HasIndex(e => new { e.RoomId, e.ChangedAt });

        entity.HasOne(e => e.Room)
            .WithMany(r => r.StatusLogs)
            .HasForeignKey(e => e.RoomId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
