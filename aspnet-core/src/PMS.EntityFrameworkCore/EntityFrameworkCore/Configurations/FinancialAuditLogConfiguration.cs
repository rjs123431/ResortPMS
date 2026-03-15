using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PMS.Auditing;

namespace PMS.EntityFrameworkCore.Configurations;

internal class FinancialAuditLogConfiguration : IEntityTypeConfiguration<FinancialAuditLog>
{
    public void Configure(EntityTypeBuilder<FinancialAuditLog> entity)
    {
        entity.ToTable("FinancialAuditLog");

        entity.Property(e => e.EventType).HasMaxLength(64).IsUnicode(false).IsRequired();
        entity.Property(e => e.ReferenceType).HasMaxLength(64).IsUnicode(false).IsRequired();
        entity.Property(e => e.Description).HasMaxLength(512).IsRequired();
        entity.Property(e => e.Amount).HasPrecision(18, 4);
        entity.Property(e => e.Currency).HasMaxLength(8).IsUnicode(false);
        entity.Property(e => e.DetailsJson).IsUnicode(true);
        entity.Property(e => e.CorrelationId).HasMaxLength(64).IsUnicode(false);

        entity.HasIndex(e => new { e.TenantId, e.ExecutionTime });
        entity.HasIndex(e => new { e.TenantId, e.FolioId });
        entity.HasIndex(e => new { e.ReferenceType, e.ReferenceId });
    }
}
