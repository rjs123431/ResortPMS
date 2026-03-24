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
        entity.Property(e => e.HousekeepingStatus).HasConversion<int>();

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
        entity.Property(e => e.OperationalStatus).HasConversion<int?>();
        entity.Property(e => e.HousekeepingStatus).HasConversion<int?>();

        entity.HasIndex(e => new { e.RoomId, e.ChangedAt });

        entity.HasOne(e => e.Room)
            .WithMany(r => r.StatusLogs)
            .HasForeignKey(e => e.RoomId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

internal class HousekeepingTaskConfiguration : IEntityTypeConfiguration<HousekeepingTask>
{
    public void Configure(EntityTypeBuilder<HousekeepingTask> entity)
    {
        entity.ToTable("HousekeepingTask");

        entity.Property(e => e.Remarks).HasMaxLength(512);
        entity.Property(e => e.TaskType).HasConversion<int>();
        entity.Property(e => e.Status).HasConversion<int>();

        entity.HasIndex(e => new { e.RoomId, e.TaskDate });
        entity.HasIndex(e => e.Status);
        entity.HasIndex(e => e.GuestRequestId);

        entity.HasOne(e => e.Room)
            .WithMany(r => r.HousekeepingTasks)
            .HasForeignKey(e => e.RoomId)
            .OnDelete(DeleteBehavior.Restrict);

        entity.HasOne(e => e.AssignedToStaff)
            .WithMany()
            .HasForeignKey(e => e.AssignedToStaffId)
            .OnDelete(DeleteBehavior.Restrict);

        entity.HasOne(e => e.GuestRequest)
            .WithMany()
            .HasForeignKey(e => e.GuestRequestId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}

internal class RoomDailyInventoryConfiguration : IEntityTypeConfiguration<RoomDailyInventory>
{
    public void Configure(EntityTypeBuilder<RoomDailyInventory> entity)
    {
        entity.ToTable("RoomDailyInventory");

        entity.Property(e => e.Status).HasConversion<int>();
        entity.Property(e => e.InventoryDate).HasColumnType("date");
        entity.Property(e => e.RowVersion).IsRowVersion();

        entity.HasIndex(e => new { e.RoomId, e.InventoryDate });

        entity.HasOne(e => e.Room)
            .WithMany()
            .HasForeignKey(e => e.RoomId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
