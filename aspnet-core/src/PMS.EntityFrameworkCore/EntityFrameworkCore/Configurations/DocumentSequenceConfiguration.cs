using PMS.App;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace PMS.EntityFrameworkCore.Configurations;

internal class DocumentSequenceConfiguration : IEntityTypeConfiguration<DocumentSequence>
{
    public void Configure(EntityTypeBuilder<DocumentSequence> entity)
    {
        entity.ToTable("DocumentSequence");

        entity.Property(e => e.DocumentType)
            .HasMaxLength(50)
            .IsUnicode(false)
            .IsRequired();

        entity.Property(e => e.Prefix)
            .HasMaxLength(10)
            .IsUnicode(false)
            .IsRequired();

        entity.Property(e => e.CurrentNumber)
            .IsRequired();

        entity.Property(e => e.Year)
            .IsRequired();

        // Create unique index on DocumentType + Year + TenantId to prevent duplicates
        // This allows sequences to reset each year
        entity.HasIndex(e => new { e.DocumentType, e.Year, e.TenantId })
              .IsUnique()
              .HasDatabaseName("IX_DocumentSequence_DocumentType_Year_TenantId");
    }
}