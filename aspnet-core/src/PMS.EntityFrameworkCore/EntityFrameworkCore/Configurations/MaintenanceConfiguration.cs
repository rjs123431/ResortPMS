using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PMS.App;

namespace PMS.EntityFrameworkCore.Configurations;

internal class RoomMaintenanceTypeConfiguration : IEntityTypeConfiguration<RoomMaintenanceType>
{
    public void Configure(EntityTypeBuilder<RoomMaintenanceType> entity)
    {
        entity.ToTable("RoomMaintenanceType");
        entity.Property(e => e.Name).HasMaxLength(128).IsRequired();
        entity.Property(e => e.Description).HasMaxLength(512);
        entity.HasIndex(e => e.Name).IsUnique();
    }
}

internal class RoomMaintenanceRequestTypeConfiguration : IEntityTypeConfiguration<RoomMaintenanceRequestType>
{
    public void Configure(EntityTypeBuilder<RoomMaintenanceRequestType> entity)
    {
        entity.ToTable("RoomMaintenanceRequestType");
        entity.HasKey(e => new { e.RequestId, e.TypeId });

        entity.HasOne(e => e.Request)
            .WithMany(r => r.MaintenanceTypes)
            .HasForeignKey(e => e.RequestId)
            .OnDelete(DeleteBehavior.Cascade);

        entity.HasOne(e => e.Type)
            .WithMany()
            .HasForeignKey(e => e.TypeId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

internal class RoomMaintenanceRequestConfiguration : IEntityTypeConfiguration<RoomMaintenanceRequest>
{
    public void Configure(EntityTypeBuilder<RoomMaintenanceRequest> entity)
    {
        entity.ToTable("RoomMaintenanceRequest");

        entity.Property(e => e.Title).HasMaxLength(256).IsRequired();
        entity.Property(e => e.Description).HasMaxLength(2048);
        entity.Property(e => e.CancellationReason).HasMaxLength(512);
        entity.Property(e => e.Priority).HasConversion<int>();
        entity.Property(e => e.Status).HasConversion<int>();
        entity.Property(e => e.Category).HasConversion<int>();
        entity.Property(e => e.StartDate).HasColumnType("date");
        entity.Property(e => e.EndDate).HasColumnType("date");

        entity.HasIndex(e => new { e.RoomId, e.Status });
        entity.HasIndex(e => new { e.Status, e.CreationTime });
        entity.HasIndex(e => e.AssignedStaffId);
        entity.HasIndex(e => e.Category);

        entity.HasOne(e => e.Room)
            .WithMany()
            .HasForeignKey(e => e.RoomId)
            .OnDelete(DeleteBehavior.Restrict);

        entity.HasOne(e => e.AssignedStaff)
            .WithMany()
            .HasForeignKey(e => e.AssignedStaffId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
