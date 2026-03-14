using PMS.App;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace PMS.EntityFrameworkCore.Configurations;

internal class PosOutletConfiguration : IEntityTypeConfiguration<PosOutlet>
{
    public void Configure(EntityTypeBuilder<PosOutlet> entity)
    {
        entity.ToTable("PosOutlet");
        entity.Property(e => e.Name).HasMaxLength(128).IsRequired();
        entity.Property(e => e.Location).HasMaxLength(256);
        entity.HasIndex(e => e.Name);
    }
}

internal class PosTableConfiguration : IEntityTypeConfiguration<PosTable>
{
    public void Configure(EntityTypeBuilder<PosTable> entity)
    {
        entity.ToTable("PosTable");
        entity.Property(e => e.TableNumber).HasMaxLength(32).IsRequired();
        entity.Property(e => e.Status).HasConversion<int>();
        entity.HasIndex(e => new { e.OutletId, e.TableNumber }).IsUnique();
        entity.HasOne(e => e.Outlet)
            .WithMany(o => o.Tables)
            .HasForeignKey(e => e.OutletId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

internal class MenuCategoryConfiguration : IEntityTypeConfiguration<MenuCategory>
{
    public void Configure(EntityTypeBuilder<MenuCategory> entity)
    {
        entity.ToTable("MenuCategory");
        entity.Property(e => e.Name).HasMaxLength(128).IsRequired();
        entity.HasIndex(e => e.DisplayOrder);
    }
}

internal class MenuItemConfiguration : IEntityTypeConfiguration<MenuItem>
{
    public void Configure(EntityTypeBuilder<MenuItem> entity)
    {
        entity.ToTable("MenuItem");
        entity.Property(e => e.Name).HasMaxLength(256).IsRequired();
        entity.Property(e => e.Price).HasPrecision(18, 4);
        entity.HasIndex(e => e.CategoryId);
        entity.HasOne(e => e.Category)
            .WithMany(c => c.Items)
            .HasForeignKey(e => e.CategoryId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

internal class MenuModifierConfiguration : IEntityTypeConfiguration<MenuModifier>
{
    public void Configure(EntityTypeBuilder<MenuModifier> entity)
    {
        entity.ToTable("MenuModifier");
        entity.Property(e => e.Name).HasMaxLength(128).IsRequired();
        entity.Property(e => e.PriceAdjustment).HasPrecision(18, 4);
        entity.HasOne(e => e.MenuItem)
            .WithMany(m => m.Modifiers)
            .HasForeignKey(e => e.MenuItemId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

internal class PosOrderConfiguration : IEntityTypeConfiguration<PosOrder>
{
    public void Configure(EntityTypeBuilder<PosOrder> entity)
    {
        entity.ToTable("PosOrder");
        entity.Property(e => e.GuestName).HasMaxLength(256);
        entity.Property(e => e.OrderNumber).HasMaxLength(32).IsRequired();
        entity.Property(e => e.OrderType).HasConversion<int>();
        entity.Property(e => e.Status).HasConversion<int>();
        entity.HasIndex(e => e.OrderNumber).IsUnique();
        entity.HasIndex(e => new { e.OutletId, e.Status });
        entity.HasIndex(e => e.TableId);
        entity.HasIndex(e => e.StayId);

        entity.HasOne(e => e.Outlet)
            .WithMany()
            .HasForeignKey(e => e.OutletId)
            .OnDelete(DeleteBehavior.Restrict);
        entity.HasOne(e => e.Table)
            .WithMany()
            .HasForeignKey(e => e.TableId)
            .OnDelete(DeleteBehavior.Restrict);
        entity.HasOne(e => e.Stay)
            .WithMany()
            .HasForeignKey(e => e.StayId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

internal class OrderItemConfiguration : IEntityTypeConfiguration<OrderItem>
{
    public void Configure(EntityTypeBuilder<OrderItem> entity)
    {
        entity.ToTable("OrderItem");
        entity.Property(e => e.Price).HasPrecision(18, 4);
        entity.Property(e => e.Status).HasConversion<int>();
        entity.Property(e => e.Notes).HasMaxLength(512);
        entity.HasOne(e => e.Order)
            .WithMany(o => o.Items)
            .HasForeignKey(e => e.OrderId)
            .OnDelete(DeleteBehavior.Restrict);
        entity.HasOne(e => e.MenuItem)
            .WithMany()
            .HasForeignKey(e => e.MenuItemId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

internal class OrderPaymentConfiguration : IEntityTypeConfiguration<OrderPayment>
{
    public void Configure(EntityTypeBuilder<OrderPayment> entity)
    {
        entity.ToTable("OrderPayment");
        entity.Property(e => e.Amount).HasPrecision(18, 4);
        entity.Property(e => e.ReferenceNo).HasMaxLength(64);
        entity.HasOne(e => e.Order)
            .WithMany(o => o.Payments)
            .HasForeignKey(e => e.OrderId)
            .OnDelete(DeleteBehavior.Restrict);
        entity.HasOne(e => e.PaymentMethod)
            .WithMany()
            .HasForeignKey(e => e.PaymentMethodId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
