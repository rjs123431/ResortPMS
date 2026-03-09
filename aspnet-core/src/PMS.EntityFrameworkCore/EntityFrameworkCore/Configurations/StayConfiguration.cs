using PMS.App;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace PMS.EntityFrameworkCore.Configurations;

internal class StayConfiguration : IEntityTypeConfiguration<Stay>
{
    public void Configure(EntityTypeBuilder<Stay> entity)
    {
        entity.ToTable("Stay");

        entity.Property(e => e.StayNo).HasMaxLength(32).IsUnicode(false).IsRequired();
        entity.Property(e => e.GuestName).HasMaxLength(256);
        entity.Property(e => e.RoomNumber).HasMaxLength(16).IsUnicode(false);

        entity.HasIndex(e => e.StayNo).IsUnique();
        entity.HasIndex(e => e.Status);
        entity.HasIndex(e => e.AssignedRoomId);

        entity.HasOne(e => e.Guest)
            .WithMany()
            .HasForeignKey(e => e.GuestId)
            .OnDelete(DeleteBehavior.Restrict);

        entity.HasOne(e => e.Reservation)
            .WithMany()
            .HasForeignKey(e => e.ReservationId)
            .OnDelete(DeleteBehavior.Restrict);

        entity.HasOne(e => e.AssignedRoom)
            .WithMany()
            .HasForeignKey(e => e.AssignedRoomId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

internal class StayGuestConfiguration : IEntityTypeConfiguration<StayGuest>
{
    public void Configure(EntityTypeBuilder<StayGuest> entity)
    {
        entity.ToTable("StayGuest");

        entity.HasOne(e => e.Stay)
            .WithMany(s => s.Guests)
            .HasForeignKey(e => e.StayId)
            .OnDelete(DeleteBehavior.Restrict);

        entity.HasOne(e => e.Guest)
            .WithMany()
            .HasForeignKey(e => e.GuestId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

internal class StayRoomConfiguration : IEntityTypeConfiguration<StayRoom>
{
    public void Configure(EntityTypeBuilder<StayRoom> entity)
    {
        entity.ToTable("StayRoom");

        entity.HasOne(e => e.Stay)
            .WithMany(s => s.Rooms)
            .HasForeignKey(e => e.StayId)
            .OnDelete(DeleteBehavior.Restrict);

        entity.HasOne(e => e.Room)
            .WithMany()
            .HasForeignKey(e => e.RoomId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

internal class RoomTransferConfiguration : IEntityTypeConfiguration<RoomTransfer>
{
    public void Configure(EntityTypeBuilder<RoomTransfer> entity)
    {
        entity.ToTable("RoomTransfer");

        entity.Property(e => e.Reason).HasMaxLength(512);

        entity.HasOne(e => e.Stay)
            .WithMany(s => s.RoomTransfers)
            .HasForeignKey(e => e.StayId)
            .OnDelete(DeleteBehavior.Restrict);

        entity.HasOne(e => e.FromRoom)
            .WithMany()
            .HasForeignKey(e => e.FromRoomId)
            .OnDelete(DeleteBehavior.Restrict);

        entity.HasOne(e => e.ToRoom)
            .WithMany()
            .HasForeignKey(e => e.ToRoomId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

internal class StayExtensionConfiguration : IEntityTypeConfiguration<StayExtension>
{
    public void Configure(EntityTypeBuilder<StayExtension> entity)
    {
        entity.ToTable("StayExtension");

        entity.Property(e => e.ApprovedBy).HasMaxLength(128);
        entity.Property(e => e.Reason).HasMaxLength(512);

        entity.HasOne(e => e.Stay)
            .WithMany(s => s.Extensions)
            .HasForeignKey(e => e.StayId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
