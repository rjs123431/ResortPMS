using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PMS.App;

namespace PMS.EntityFrameworkCore.Configurations;

internal class ConferenceVenueConfiguration : IEntityTypeConfiguration<ConferenceVenue>
{
    public void Configure(EntityTypeBuilder<ConferenceVenue> entity)
    {
        entity.ToTable("ConferenceVenue");

        entity.Property(e => e.Code).HasMaxLength(ConferenceVenue.MaxCodeLength).IsUnicode(false).IsRequired();
        entity.Property(e => e.Name).HasMaxLength(ConferenceVenue.MaxNameLength).IsRequired();
        entity.Property(e => e.Category).HasMaxLength(ConferenceVenue.MaxCategoryLength);
        entity.Property(e => e.Description).HasMaxLength(ConferenceVenue.MaxDescriptionLength);
        entity.Property(e => e.HourlyRate).HasPrecision(18, 4);
        entity.Property(e => e.HalfDayRate).HasPrecision(18, 4);
        entity.Property(e => e.FullDayRate).HasPrecision(18, 4);

        entity.HasIndex(e => e.Code).IsUnique();
        entity.HasIndex(e => e.Name);
        entity.HasIndex(e => e.IsActive);
    }
}

internal class ConferenceBookingConfiguration : IEntityTypeConfiguration<ConferenceBooking>
{
    public void Configure(EntityTypeBuilder<ConferenceBooking> entity)
    {
        entity.ToTable("ConferenceBooking");

        entity.Property(e => e.BookingNo).HasMaxLength(ConferenceBooking.MaxBookingNoLength).IsUnicode(false).IsRequired();
        entity.Property(e => e.EventName).HasMaxLength(ConferenceBooking.MaxEventNameLength).IsRequired();
        entity.Property(e => e.EventType).HasMaxLength(ConferenceBooking.MaxEventTypeLength);
        entity.Property(e => e.OrganizerName).HasMaxLength(ConferenceBooking.MaxOrganizerNameLength).IsRequired();
        entity.Property(e => e.CompanyName).HasMaxLength(ConferenceBooking.MaxCompanyNameLength);
        entity.Property(e => e.ContactPerson).HasMaxLength(ConferenceBooking.MaxContactPersonLength);
        entity.Property(e => e.Phone).HasMaxLength(ConferenceBooking.MaxPhoneLength).IsUnicode(false);
        entity.Property(e => e.Email).HasMaxLength(ConferenceBooking.MaxEmailLength);
        entity.Property(e => e.Notes).HasMaxLength(ConferenceBooking.MaxNotesLength);
        entity.Property(e => e.SpecialRequests).HasMaxLength(ConferenceBooking.MaxSpecialRequestsLength);
        entity.Property(e => e.BaseAmount).HasPrecision(18, 4);
        entity.Property(e => e.AddOnAmount).HasPrecision(18, 4);
        entity.Property(e => e.TotalAmount).HasPrecision(18, 4);
        entity.Property(e => e.DepositRequired).HasPrecision(18, 4);
        entity.Property(e => e.DepositPaid).HasPrecision(18, 4);

        entity.HasIndex(e => e.BookingNo).IsUnique();
        entity.HasIndex(e => e.EventTypeId);
        entity.HasIndex(e => e.Status);
        entity.HasIndex(e => new { e.VenueId, e.StartDateTime });

        entity.HasOne(e => e.Venue)
            .WithMany()
            .HasForeignKey(e => e.VenueId)
            .OnDelete(DeleteBehavior.Restrict);

        entity.HasOne(e => e.Guest)
            .WithMany()
            .HasForeignKey(e => e.GuestId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.Restrict);

        entity.HasOne(e => e.ConferenceCompany)
            .WithMany()
            .HasForeignKey(e => e.ConferenceCompanyId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.Restrict);

        entity.HasOne(e => e.EventTypeLookup)
            .WithMany()
            .HasForeignKey(e => e.EventTypeId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

internal class ConferenceBookingAddOnConfiguration : IEntityTypeConfiguration<ConferenceBookingAddOn>
{
    public void Configure(EntityTypeBuilder<ConferenceBookingAddOn> entity)
    {
        entity.ToTable("ConferenceBookingAddOn");

        entity.Property(e => e.Name).HasMaxLength(ConferenceBookingAddOn.MaxNameLength).IsRequired();
        entity.Property(e => e.UnitPrice).HasPrecision(18, 4);
        entity.Property(e => e.Amount).HasPrecision(18, 4);

        entity.HasOne(e => e.ConferenceBooking)
            .WithMany(e => e.AddOns)
            .HasForeignKey(e => e.ConferenceBookingId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

internal class ConferenceBookingPaymentConfiguration : IEntityTypeConfiguration<ConferenceBookingPayment>
{
    public void Configure(EntityTypeBuilder<ConferenceBookingPayment> entity)
    {
        entity.ToTable("ConferenceBookingPayment");

        entity.Property(e => e.Amount).HasPrecision(18, 4);
        entity.Property(e => e.ReferenceNo).HasMaxLength(ConferenceBookingPayment.MaxReferenceNoLength).IsUnicode(false);

        entity.HasOne(e => e.ConferenceBooking)
            .WithMany(e => e.Payments)
            .HasForeignKey(e => e.ConferenceBookingId)
            .OnDelete(DeleteBehavior.Restrict);

        entity.HasOne(e => e.PaymentMethod)
            .WithMany()
            .HasForeignKey(e => e.PaymentMethodId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}