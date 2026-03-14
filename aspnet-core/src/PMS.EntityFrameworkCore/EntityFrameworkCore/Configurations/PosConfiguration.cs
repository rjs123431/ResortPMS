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
        entity.HasIndex(e => e.ChargeTypeId);
        entity.HasOne(e => e.ChargeType)
            .WithMany()
            .HasForeignKey(e => e.ChargeTypeId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}

internal class PosOutletTerminalConfiguration : IEntityTypeConfiguration<PosOutletTerminal>
{
    public void Configure(EntityTypeBuilder<PosOutletTerminal> entity)
    {
        entity.ToTable("PosOutletTerminal");
        entity.Property(e => e.Code).HasMaxLength(32).IsRequired();
        entity.Property(e => e.Name).HasMaxLength(128).IsRequired();
        entity.HasIndex(e => new { e.OutletId, e.Code }).IsUnique();
        entity.HasOne(e => e.Outlet)
            .WithMany(o => o.Terminals)
            .HasForeignKey(e => e.OutletId)
            .OnDelete(DeleteBehavior.Restrict);
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
        entity.Property(e => e.Notes).HasMaxLength(512);
        entity.Property(e => e.DiscountPercent).HasPrecision(18, 4);
        entity.Property(e => e.DiscountAmount).HasPrecision(18, 4);
        entity.Property(e => e.SeniorCitizenDiscount).HasPrecision(18, 4);
        entity.Property(e => e.OrderType).HasConversion<int>();
        entity.Property(e => e.Status).HasConversion<int>();
        entity.Property(e => e.CancelReasonType).HasConversion<int>();
        entity.Property(e => e.CancelReason).HasMaxLength(512);
        entity.HasIndex(e => e.OrderNumber).IsUnique();
        entity.HasIndex(e => new { e.OutletId, e.Status });
        entity.HasIndex(e => e.PosTerminalId);
        entity.HasIndex(e => e.TableId);
        entity.HasIndex(e => e.StayId);
        entity.HasIndex(e => e.ServerStaffId);

        entity.HasOne(e => e.Outlet)
            .WithMany()
            .HasForeignKey(e => e.OutletId)
            .OnDelete(DeleteBehavior.Restrict);
        entity.HasOne(e => e.Terminal)
            .WithMany()
            .HasForeignKey(e => e.PosTerminalId)
            .OnDelete(DeleteBehavior.SetNull);
        entity.HasOne(e => e.Table)
            .WithMany()
            .HasForeignKey(e => e.TableId)
            .OnDelete(DeleteBehavior.Restrict);
        entity.HasOne(e => e.Stay)
            .WithMany()
            .HasForeignKey(e => e.StayId)
            .OnDelete(DeleteBehavior.Restrict);
        entity.HasOne(e => e.ServerStaff)
            .WithMany()
            .HasForeignKey(e => e.ServerStaffId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}

internal class PosOrderItemConfiguration : IEntityTypeConfiguration<PosOrderItem>
{
    public void Configure(EntityTypeBuilder<PosOrderItem> entity)
    {
        entity.ToTable("PosOrderItem");
        entity.Property(e => e.Price).HasPrecision(18, 4);
        entity.Property(e => e.Status).HasConversion<int>();
        entity.Property(e => e.Notes).HasMaxLength(512);
        entity.Property(e => e.CancelReasonType).HasConversion<int>();
        entity.Property(e => e.CancelReason).HasMaxLength(512);
        entity.HasOne(e => e.Order)
            .WithMany(o => o.Items)
            .HasForeignKey(e => e.PosOrderId)
            .OnDelete(DeleteBehavior.Restrict);
        entity.HasOne(e => e.MenuItem)
            .WithMany()
            .HasForeignKey(e => e.MenuItemId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

internal class PosOrderPaymentConfiguration : IEntityTypeConfiguration<PosOrderPayment>
{
    public void Configure(EntityTypeBuilder<PosOrderPayment> entity)
    {
        entity.ToTable("PosOrderPayment");
        entity.Property(e => e.Amount).HasPrecision(18, 4);
        entity.Property(e => e.ReferenceNo).HasMaxLength(64);
        entity.HasOne(e => e.Order)
            .WithMany(o => o.Payments)
            .HasForeignKey(e => e.PosOrderId)
            .OnDelete(DeleteBehavior.Restrict);
        entity.HasOne(e => e.PaymentMethod)
            .WithMany()
            .HasForeignKey(e => e.PaymentMethodId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

internal class PosSessionConfiguration : IEntityTypeConfiguration<PosSession>
{
    public void Configure(EntityTypeBuilder<PosSession> entity)
    {
        entity.ToTable("PosSession");
        entity.Property(e => e.TerminalId).HasMaxLength(32).IsRequired();
        entity.Property(e => e.OpeningCash).HasPrecision(18, 4);
        entity.Property(e => e.ClosingCash).HasPrecision(18, 4);
        entity.Property(e => e.ExpectedCash).HasPrecision(18, 4);
        entity.Property(e => e.CashDifference).HasPrecision(18, 4);
        entity.Property(e => e.Status).HasConversion<int>();
        entity.HasIndex(e => new { e.UserId, e.Status });
        entity.HasIndex(e => e.OutletId);
        entity.HasOne(e => e.Outlet)
            .WithMany()
            .HasForeignKey(e => e.OutletId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
