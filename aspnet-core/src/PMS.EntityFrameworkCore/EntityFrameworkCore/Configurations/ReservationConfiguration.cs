using PMS.App;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace PMS.EntityFrameworkCore.Configurations;

internal class ReservationConfiguration : IEntityTypeConfiguration<Reservation>
{
    public void Configure(EntityTypeBuilder<Reservation> entity)
    {
        entity.ToTable("Reservation");

        entity.Property(e => e.ReservationNo).HasMaxLength(32).IsUnicode(false).IsRequired();
        entity.Property(e => e.GuestName).HasMaxLength(256);
        entity.Property(e => e.FirstName).HasMaxLength(128);
        entity.Property(e => e.LastName).HasMaxLength(128);
        entity.Property(e => e.Phone).HasMaxLength(64).IsUnicode(false);
        entity.Property(e => e.Email).HasMaxLength(256);
        entity.Property(e => e.Notes).HasMaxLength(1024);
        entity.Property(e => e.ReservationConditions).HasMaxLength(2048);
        entity.Property(e => e.SpecialRequests).HasMaxLength(2048);
        entity.Property(e => e.TotalAmount).HasPrecision(18, 4);
        entity.Property(e => e.DepositPercentage).HasPrecision(5, 2);
        entity.Property(e => e.DepositRequired).HasPrecision(18, 4);
        entity.Property(e => e.DepositPaid).HasPrecision(18, 4);

        entity.HasIndex(e => e.ReservationNo).IsUnique();
        entity.HasIndex(e => new { e.GuestId, e.ArrivalDate });
        entity.HasIndex(e => e.Status);
        entity.HasIndex(e => e.ChannelId);
        entity.HasIndex(e => e.AgencyId);

        entity.HasOne(e => e.Channel)
            .WithMany()
            .HasForeignKey(e => e.ChannelId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.Restrict);

        entity.HasOne(e => e.Agency)
            .WithMany()
            .HasForeignKey(e => e.AgencyId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.Restrict);

        entity.HasOne(e => e.Guest)
            .WithMany()
            .HasForeignKey(e => e.GuestId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

internal class ReservationRoomConfiguration : IEntityTypeConfiguration<ReservationRoom>
{
    public void Configure(EntityTypeBuilder<ReservationRoom> entity)
    {
        entity.ToTable("ReservationRoom");

        entity.Property(e => e.RoomTypeName).HasMaxLength(128);
        entity.Property(e => e.RoomNumber).HasMaxLength(16).IsUnicode(false);
        entity.Property(e => e.RatePerNight).HasPrecision(18, 4);
        entity.Property(e => e.Amount).HasPrecision(18, 4);
        entity.Property(e => e.DiscountPercent).HasPrecision(18, 4);
        entity.Property(e => e.DiscountAmount).HasPrecision(18, 4);
        entity.Property(e => e.SeniorCitizenPercent).HasPrecision(5, 2).HasDefaultValue(20m);
        entity.Property(e => e.SeniorCitizenDiscountAmount).HasPrecision(18, 4);
        entity.Property(e => e.NetAmount).HasPrecision(18, 4);

        entity.HasOne(e => e.Reservation)
            .WithMany(r => r.Rooms)
            .HasForeignKey(e => e.ReservationId)
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

internal class ReservationExtraBedConfiguration : IEntityTypeConfiguration<ReservationExtraBed>
{
    public void Configure(EntityTypeBuilder<ReservationExtraBed> entity)
    {
        entity.ToTable("ReservationExtraBed");

        entity.Property(e => e.Quantity).HasDefaultValue(1);
        entity.Property(e => e.RatePerNight).HasPrecision(18, 4);
        entity.Property(e => e.Amount).HasPrecision(18, 4);
        entity.Property(e => e.DiscountPercent).HasPrecision(18, 4);
        entity.Property(e => e.DiscountAmount).HasPrecision(18, 4);
        entity.Property(e => e.SeniorCitizenPercent).HasPrecision(5, 2).HasDefaultValue(20m);
        entity.Property(e => e.SeniorCitizenDiscountAmount).HasPrecision(18, 4);
        entity.Property(e => e.NetAmount).HasPrecision(18, 4);

        entity.HasOne(e => e.Reservation)
            .WithMany(r => r.ExtraBeds)
            .HasForeignKey(e => e.ReservationId)
            .OnDelete(DeleteBehavior.Restrict);

        entity.HasOne(e => e.ExtraBedType)
            .WithMany()
            .HasForeignKey(e => e.ExtraBedTypeId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

internal class ReservationGuestConfiguration : IEntityTypeConfiguration<ReservationGuest>
{
    public void Configure(EntityTypeBuilder<ReservationGuest> entity)
    {
        entity.ToTable("ReservationGuest");
        entity.Property(e => e.Age).HasDefaultValue(0);

        entity.HasOne(e => e.Reservation)
            .WithMany(r => r.Guests)
            .HasForeignKey(e => e.ReservationId)
            .OnDelete(DeleteBehavior.Restrict);

        entity.HasOne(e => e.Guest)
            .WithMany()
            .HasForeignKey(e => e.GuestId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

internal class ReservationDailyRateConfiguration : IEntityTypeConfiguration<ReservationDailyRate>
{
    public void Configure(EntityTypeBuilder<ReservationDailyRate> entity)
    {
        entity.ToTable("ReservationDailyRate");

        entity.Property(e => e.Rate).HasPrecision(18, 4);
        entity.Property(e => e.Tax).HasPrecision(18, 4);
        entity.Property(e => e.Discount).HasPrecision(18, 4);

        entity.HasOne(e => e.ReservationRoom)
            .WithMany(r => r.DailyRates)
            .HasForeignKey(e => e.ReservationRoomId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

internal class ReservationDepositConfiguration : IEntityTypeConfiguration<ReservationDeposit>
{
    public void Configure(EntityTypeBuilder<ReservationDeposit> entity)
    {
        entity.ToTable("ReservationDeposit");

        entity.Property(e => e.Amount).HasPrecision(18, 4);
        entity.Property(e => e.ReferenceNo).HasMaxLength(64).IsUnicode(false);

        entity.HasOne(e => e.Reservation)
            .WithMany(r => r.Deposits)
            .HasForeignKey(e => e.ReservationId)
            .OnDelete(DeleteBehavior.Restrict);

        entity.HasOne(e => e.PaymentMethod)
            .WithMany()
            .HasForeignKey(e => e.PaymentMethodId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
