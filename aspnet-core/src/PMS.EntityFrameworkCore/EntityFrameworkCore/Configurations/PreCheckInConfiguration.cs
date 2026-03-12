using PMS.App;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace PMS.EntityFrameworkCore.Configurations;

internal class PreCheckInConfiguration : IEntityTypeConfiguration<PreCheckIn>
{
    public void Configure(EntityTypeBuilder<PreCheckIn> entity)
    {
        entity.ToTable("PreCheckIn");

        entity.Property(e => e.PreCheckInNo).HasMaxLength(32).IsUnicode(false).IsRequired();
        entity.Property(e => e.GuestName).HasMaxLength(256);
        entity.Property(e => e.FirstName).HasMaxLength(128);
        entity.Property(e => e.LastName).HasMaxLength(128);
        entity.Property(e => e.Phone).HasMaxLength(64).IsUnicode(false);
        entity.Property(e => e.Email).HasMaxLength(256);
        entity.Property(e => e.Notes).HasMaxLength(1024);
        entity.Property(e => e.SpecialRequests).HasMaxLength(2048);
        entity.Property(e => e.TotalAmount).HasPrecision(18, 4);

        entity.HasIndex(e => e.PreCheckInNo).IsUnique();
        entity.HasIndex(e => e.Status);
        entity.HasIndex(e => e.ReservationId);
        entity.HasIndex(e => e.ExpiresAt);

        entity.HasOne(e => e.Reservation)
            .WithMany()
            .HasForeignKey(e => e.ReservationId)
            .OnDelete(DeleteBehavior.Restrict);

        entity.HasOne(e => e.Guest)
            .WithMany()
            .HasForeignKey(e => e.GuestId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

internal class PreCheckInRoomConfiguration : IEntityTypeConfiguration<PreCheckInRoom>
{
    public void Configure(EntityTypeBuilder<PreCheckInRoom> entity)
    {
        entity.ToTable("PreCheckInRoom");

        entity.Property(e => e.RoomTypeName).HasMaxLength(128);
        entity.Property(e => e.RoomNumber).HasMaxLength(16).IsUnicode(false);
        entity.Property(e => e.RatePerNight).HasPrecision(18, 4);
        entity.Property(e => e.Amount).HasPrecision(18, 4);
        entity.Property(e => e.SeniorCitizenDiscountAmount).HasPrecision(18, 4);
        entity.Property(e => e.NetAmount).HasPrecision(18, 4);

        entity.HasIndex(e => e.ReservationRoomId);

        entity.HasOne(e => e.PreCheckIn)
            .WithMany(p => p.Rooms)
            .HasForeignKey(e => e.PreCheckInId)
            .OnDelete(DeleteBehavior.Cascade);

        entity.HasOne(e => e.ReservationRoom)
            .WithMany()
            .HasForeignKey(e => e.ReservationRoomId)
            .OnDelete(DeleteBehavior.Restrict);

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

internal class PreCheckInExtraBedConfiguration : IEntityTypeConfiguration<PreCheckInExtraBed>
{
    public void Configure(EntityTypeBuilder<PreCheckInExtraBed> entity)
    {
        entity.ToTable("PreCheckInExtraBed");

        entity.Property(e => e.ExtraBedTypeName).HasMaxLength(128);
        entity.Property(e => e.Quantity).HasDefaultValue(1);
        entity.Property(e => e.RatePerNight).HasPrecision(18, 4);
        entity.Property(e => e.Amount).HasPrecision(18, 4);

        entity.HasOne(e => e.PreCheckIn)
            .WithMany(p => p.ExtraBeds)
            .HasForeignKey(e => e.PreCheckInId)
            .OnDelete(DeleteBehavior.Cascade);

        entity.HasOne(e => e.ExtraBedType)
            .WithMany()
            .HasForeignKey(e => e.ExtraBedTypeId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
