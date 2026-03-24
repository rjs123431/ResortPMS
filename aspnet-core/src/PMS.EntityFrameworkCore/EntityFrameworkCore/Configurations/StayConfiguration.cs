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
        entity.Property(e => e.FirstName).HasMaxLength(128);
        entity.Property(e => e.LastName).HasMaxLength(128);
        entity.Property(e => e.Phone).HasMaxLength(64).IsUnicode(false);
        entity.Property(e => e.Email).HasMaxLength(256);

        entity.HasIndex(e => e.StayNo).IsUnique();
        entity.HasIndex(e => e.Status);
        entity.HasIndex(e => e.ChannelId);
        entity.HasIndex("AssignedRoomId");

        entity.HasOne(e => e.Channel)
            .WithMany()
            .HasForeignKey(e => e.ChannelId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.Restrict);

        entity.HasOne(e => e.Guest)
            .WithMany()
            .HasForeignKey(e => e.GuestId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.Restrict);

        entity.HasOne(e => e.Reservation)
            .WithMany()
            .HasForeignKey(e => e.ReservationId)
            .OnDelete(DeleteBehavior.Restrict);

        entity.HasOne(e => e.AssignedRoom)
            .WithMany()
            .HasForeignKey("AssignedRoomId")
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

        entity.HasOne(e => e.RoomType)
            .WithMany()
            .HasForeignKey(e => e.RoomTypeId)
            .OnDelete(DeleteBehavior.Restrict);

        entity.HasOne(e => e.Room)
            .WithMany()
            .HasForeignKey(e => e.RoomId)
            .OnDelete(DeleteBehavior.Restrict);

        entity.HasOne(e => e.OriginalRoomType)
            .WithMany()
            .HasForeignKey(e => e.OriginalRoomTypeId)
            .OnDelete(DeleteBehavior.Restrict);

        entity.HasOne(e => e.OriginalRoom)
            .WithMany()
            .HasForeignKey(e => e.OriginalRoomId)
            .OnDelete(DeleteBehavior.Restrict);

        entity.HasOne(e => e.ClearedByStaff)
            .WithMany()
            .HasForeignKey(e => e.ClearedByStaffId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

internal class StayRoomTransferConfiguration : IEntityTypeConfiguration<StayRoomTransfer>
{
    public void Configure(EntityTypeBuilder<StayRoomTransfer> entity)
    {
        entity.ToTable("StayRoomTransfer");

        entity.Property(e => e.Reason).HasMaxLength(512);

        entity.HasOne(e => e.StayRoom)
            .WithMany(sr => sr.Transfers)
            .HasForeignKey(e => e.StayRoomId)
            .OnDelete(DeleteBehavior.Restrict);

        entity.HasOne(e => e.FromRoomType)
            .WithMany()
            .HasForeignKey(e => e.FromRoomTypeId)
            .OnDelete(DeleteBehavior.Restrict);

        entity.HasOne(e => e.FromRoom)
            .WithMany()
            .HasForeignKey(e => e.FromRoomId)
            .OnDelete(DeleteBehavior.Restrict);

        entity.HasOne(e => e.ToRoomType)
            .WithMany()
            .HasForeignKey(e => e.ToRoomTypeId)
            .OnDelete(DeleteBehavior.Restrict);

        entity.HasOne(e => e.ToRoom)
            .WithMany()
            .HasForeignKey(e => e.ToRoomId)
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

internal class RoomChangeRequestConfiguration : IEntityTypeConfiguration<RoomChangeRequest>
{
    public void Configure(EntityTypeBuilder<RoomChangeRequest> entity)
    {
        entity.ToTable("RoomChangeRequest");

        entity.Property(e => e.ReasonDetails).HasMaxLength(1024);
        entity.Property(e => e.RequestedBy).HasMaxLength(128);
        entity.Property(e => e.ApprovedBy).HasMaxLength(128);
        entity.Property(e => e.CompletedBy).HasMaxLength(128);
        entity.Property(e => e.CancellationReason).HasMaxLength(512);

        entity.HasIndex(e => e.Status);
        entity.HasIndex(e => e.RequestedAt);

        entity.HasOne(e => e.Stay)
            .WithMany(s => s.RoomChangeRequests)
            .HasForeignKey(e => e.StayId)
            .OnDelete(DeleteBehavior.Restrict);

        entity.HasOne(e => e.StayRoom)
            .WithMany()
            .HasForeignKey(e => e.StayRoomId)
            .OnDelete(DeleteBehavior.Restrict);

        entity.HasOne(e => e.FromRoomType)
            .WithMany()
            .HasForeignKey(e => e.FromRoomTypeId)
            .OnDelete(DeleteBehavior.Restrict);

        entity.HasOne(e => e.FromRoom)
            .WithMany()
            .HasForeignKey(e => e.FromRoomId)
            .OnDelete(DeleteBehavior.Restrict);

        entity.HasOne(e => e.PreferredRoomType)
            .WithMany()
            .HasForeignKey(e => e.PreferredRoomTypeId)
            .OnDelete(DeleteBehavior.Restrict);

        entity.HasOne(e => e.ToRoomType)
            .WithMany()
            .HasForeignKey(e => e.ToRoomTypeId)
            .OnDelete(DeleteBehavior.Restrict);

        entity.HasOne(e => e.ToRoom)
            .WithMany()
            .HasForeignKey(e => e.ToRoomId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
