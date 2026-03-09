using PMS.App;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace PMS.EntityFrameworkCore.Configurations;

internal class GuestConfiguration : IEntityTypeConfiguration<Guest>
{
    public void Configure(EntityTypeBuilder<Guest> entity)
    {
        entity.ToTable("Guest");

        entity.Property(e => e.GuestCode).HasMaxLength(32).IsUnicode(false).IsRequired();
        entity.Property(e => e.FirstName).HasMaxLength(128).IsRequired();
        entity.Property(e => e.LastName).HasMaxLength(128).IsRequired();
        entity.Property(e => e.MiddleName).HasMaxLength(128);
        entity.Property(e => e.Gender).HasMaxLength(16).IsUnicode(false);
        entity.Property(e => e.Email).HasMaxLength(256).IsUnicode(false);
        entity.Property(e => e.Phone).HasMaxLength(32).IsUnicode(false);
        entity.Property(e => e.Nationality).HasMaxLength(64);
        entity.Property(e => e.Notes).HasMaxLength(1024);

        entity.HasIndex(e => e.GuestCode).IsUnique();
    }
}

internal class GuestIdentificationConfiguration : IEntityTypeConfiguration<GuestIdentification>
{
    public void Configure(EntityTypeBuilder<GuestIdentification> entity)
    {
        entity.ToTable("GuestIdentification");

        entity.Property(e => e.IdentificationType).HasMaxLength(64).IsRequired();
        entity.Property(e => e.IdentificationNumber).HasMaxLength(64).IsUnicode(false).IsRequired();

        entity.HasOne(e => e.Guest)
            .WithMany(g => g.Identifications)
            .HasForeignKey(e => e.GuestId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
