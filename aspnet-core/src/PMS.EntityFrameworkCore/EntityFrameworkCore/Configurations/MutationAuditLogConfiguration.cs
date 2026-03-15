using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PMS.Auditing;

namespace PMS.EntityFrameworkCore.Configurations;

internal class MutationAuditLogConfiguration : IEntityTypeConfiguration<MutationAuditLog>
{
    public void Configure(EntityTypeBuilder<MutationAuditLog> entity)
    {
        entity.ToTable("MutationAuditLog");

        entity.Property(e => e.EntityType).HasMaxLength(128).IsRequired();
        entity.Property(e => e.EntityId).HasMaxLength(64).IsUnicode(false).IsRequired();
        entity.Property(e => e.Action).HasMaxLength(32).IsUnicode(false).IsRequired();
        entity.Property(e => e.OldValueJson).IsUnicode(true);
        entity.Property(e => e.NewValueJson).IsUnicode(true);
        entity.Property(e => e.CorrelationId).HasMaxLength(64).IsUnicode(false);
        entity.Property(e => e.MethodName).HasMaxLength(256).IsUnicode(false);
        entity.Property(e => e.Extra).HasMaxLength(512).IsUnicode(true);

        entity.HasIndex(e => new { e.TenantId, e.EntityType, e.EntityId });
        entity.HasIndex(e => new { e.TenantId, e.ExecutionTime });
    }
}
