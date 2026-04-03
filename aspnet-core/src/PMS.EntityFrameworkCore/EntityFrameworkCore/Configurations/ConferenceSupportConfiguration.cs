using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PMS.App;

namespace PMS.EntityFrameworkCore.Configurations;

internal class EventTypeConfiguration : IEntityTypeConfiguration<EventType>
{
    public void Configure(EntityTypeBuilder<EventType> entity)
    {
        entity.ToTable("EventType");

        entity.Property(e => e.Code).HasMaxLength(EventType.MaxCodeLength).IsRequired();
        entity.Property(e => e.Name).HasMaxLength(EventType.MaxNameLength).IsRequired();

        entity.HasIndex(e => e.Code).IsUnique();
        entity.HasIndex(e => new { e.SortOrder, e.Name });
    }
}

internal class ConferenceExtraConfiguration : IEntityTypeConfiguration<ConferenceExtra>
{
    public void Configure(EntityTypeBuilder<ConferenceExtra> entity)
    {
        entity.ToTable("ConferenceExtra");

        entity.Property(e => e.Code).HasMaxLength(ConferenceExtra.MaxCodeLength).IsRequired();
        entity.Property(e => e.Name).HasMaxLength(ConferenceExtra.MaxNameLength).IsRequired();
        entity.Property(e => e.Category).HasMaxLength(ConferenceExtra.MaxCategoryLength);
        entity.Property(e => e.UnitLabel).HasMaxLength(ConferenceExtra.MaxUnitLabelLength);
        entity.Property(e => e.DefaultPrice).HasColumnType("decimal(18,2)");

        entity.HasIndex(e => e.Code).IsUnique();
        entity.HasIndex(e => new { e.Category, e.SortOrder });
    }
}

internal class ConferenceCompanyConfiguration : IEntityTypeConfiguration<ConferenceCompany>
{
    public void Configure(EntityTypeBuilder<ConferenceCompany> entity)
    {
        entity.ToTable("ConferenceCompany");

        entity.Property(e => e.Name).HasMaxLength(ConferenceCompany.MaxNameLength).IsRequired();
        entity.Property(e => e.ContactPerson).HasMaxLength(ConferenceCompany.MaxContactPersonLength);
        entity.Property(e => e.Phone).HasMaxLength(ConferenceCompany.MaxPhoneLength).IsUnicode(false);
        entity.Property(e => e.Email).HasMaxLength(ConferenceCompany.MaxEmailLength);
        entity.Property(e => e.Notes).HasMaxLength(ConferenceCompany.MaxNotesLength);

        entity.HasIndex(e => e.Name);
        entity.HasIndex(e => e.IsActive);
    }
}

internal class ConferenceVenueBlackoutConfiguration : IEntityTypeConfiguration<ConferenceVenueBlackout>
{
    public void Configure(EntityTypeBuilder<ConferenceVenueBlackout> entity)
    {
        entity.ToTable("ConferenceVenueBlackout");

        entity.Property(e => e.Title).HasMaxLength(ConferenceVenueBlackout.MaxTitleLength).IsRequired();
        entity.Property(e => e.Notes).HasMaxLength(ConferenceVenueBlackout.MaxNotesLength);

        entity.HasIndex(e => new { e.VenueId, e.StartDateTime });

        entity.HasOne(e => e.Venue)
            .WithMany()
            .HasForeignKey(e => e.VenueId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}