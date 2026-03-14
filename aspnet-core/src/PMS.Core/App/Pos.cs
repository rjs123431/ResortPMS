using Abp.Domain.Entities;
using Abp.Domain.Entities.Auditing;
using Abp.Timing;
using System;
using System.Collections.Generic;

namespace PMS.App;

// ── Outlets & Tables ───────────────────────────────────────────────────────

/// <summary>How room service charge is applied (only when order type is Room Service).</summary>
public enum RoomServiceChargeType
{
    None = 0,
    Percent = 1,
    FixedAmount = 2,
}

/// <summary>How general service charge is applied to orders from this outlet.</summary>
public enum ServiceChargeType
{
    None = 0,
    Percent = 1,
    FixedAmount = 2,
}

public class PosOutlet : AuditedEntity<Guid>, IPassivable
{
    public string Name { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    /// <summary>When true, orders from this outlet can use Send to Kitchen.</summary>
    public bool HasKitchen { get; set; } = false;
    /// <summary>Optional charge type used for Charge to Room transactions from this outlet.</summary>
    public Guid? ChargeTypeId { get; set; }

    /// <summary>Room service charge: applied only when order type is Room Service.</summary>
    public RoomServiceChargeType RoomServiceChargeType { get; set; } = RoomServiceChargeType.None;
    public decimal RoomServiceChargePercent { get; set; }
    public decimal RoomServiceChargeAmount { get; set; }

    /// <summary>General service charge applied to orders from this outlet.</summary>
    public ServiceChargeType ServiceChargeType { get; set; } = ServiceChargeType.None;
    public decimal ServiceChargePercent { get; set; }
    public decimal ServiceChargeFixedAmount { get; set; }

    public virtual ICollection<PosTable> Tables { get; set; } = [];
    public virtual ICollection<PosOutletTerminal> Terminals { get; set; } = [];
    public virtual ChargeType ChargeType { get; set; }
}

/// <summary>
/// Terminal (device/station) within an outlet. An outlet can have one or more terminals.
/// </summary>
public class PosOutletTerminal : AuditedEntity<Guid>, IPassivable
{
    public Guid OutletId { get; set; }
    /// <summary>Unique code within the outlet, e.g. "POS-01".</summary>
    public string Code { get; set; } = string.Empty;
    /// <summary>Display name for the terminal.</summary>
    public string Name { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;

    public virtual PosOutlet Outlet { get; set; }
}

public enum PosTableStatus
{
    Available = 0,
    Occupied = 1,
    Reserved = 2,
    Cleaning = 3,
}

public class PosTable : AuditedEntity<Guid>
{
    public Guid OutletId { get; set; }
    public string TableNumber { get; set; } = string.Empty;
    public int Capacity { get; set; }
    public PosTableStatus Status { get; set; } = PosTableStatus.Available;

    public virtual PosOutlet Outlet { get; set; }
}

// ── Menu ───────────────────────────────────────────────────────────────────

public class MenuCategory : AuditedEntity<Guid>
{
    public string Name { get; set; } = string.Empty;
    public int DisplayOrder { get; set; }

    public virtual ICollection<MenuItem> Items { get; set; } = [];
}

/// <summary>Global option group (e.g. Sugar, Pearls, Rice options). Defined once and assigned to menu items via MenuItemOptionGroup.</summary>
public class OptionGroup : AuditedEntity<Guid>
{
    public string Name { get; set; } = string.Empty;
    public int DisplayOrder { get; set; }
    public int MinSelections { get; set; }
    public int MaxSelections { get; set; }

    public virtual ICollection<Option> Options { get; set; } = [];
    public virtual ICollection<MenuItemOptionGroup> MenuItemOptionGroups { get; set; } = [];
}

/// <summary>Choice within an option group (e.g. 25%, Fried +10). Only one option per group should have IsDefault true.</summary>
public class Option : AuditedEntity<Guid>
{
    public Guid OptionGroupId { get; set; }
    public string Name { get; set; } = string.Empty;
    public decimal PriceAdjustment { get; set; }
    public int DisplayOrder { get; set; }
    /// <summary>When true, this option is selected by default. At most one option per group should be default.</summary>
    public bool IsDefault { get; set; }

    public virtual OptionGroup OptionGroup { get; set; }
}

/// <summary>Junction: which option groups apply to which menu item (many-to-many).</summary>
public class MenuItemOptionGroup : AuditedEntity<Guid>
{
    public Guid MenuItemId { get; set; }
    public Guid OptionGroupId { get; set; }
    public int DisplayOrder { get; set; }
    /// <summary>Override which option is default for this menu item in this group. Null = use option group default.</summary>
    public Guid? DefaultOptionId { get; set; }

    public virtual MenuItem MenuItem { get; set; }
    public virtual OptionGroup OptionGroup { get; set; }
    public virtual Option DefaultOption { get; set; }
}

/// <summary>Per-menu-item price override for an option. When set, used instead of Option.PriceAdjustment when computing order line price.</summary>
public class MenuItemOptionPriceOverride : AuditedEntity<Guid>
{
    public Guid MenuItemId { get; set; }
    public Guid OptionId { get; set; }
    public decimal PriceAdjustment { get; set; }

    public virtual MenuItem MenuItem { get; set; }
    public virtual Option Option { get; set; }
}

public class MenuItem : AuditedEntity<Guid>
{
    public Guid CategoryId { get; set; }
    public string Name { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public bool IsAvailable { get; set; } = true;

    public virtual MenuCategory Category { get; set; }
    public virtual ICollection<MenuModifier> Modifiers { get; set; } = [];
    public virtual ICollection<MenuItemOptionGroup> MenuItemOptionGroups { get; set; } = [];
    public virtual ICollection<MenuItemOptionPriceOverride> OptionPriceOverrides { get; set; } = [];
    public virtual ICollection<MenuItemPriceAdjustment> PriceAdjustments { get; set; } = [];
}

/// <summary>Price change effective on a specific date and moving forward. The new price applies on EffectiveDate and all later dates.</summary>
public class MenuItemPriceAdjustment : AuditedEntity<Guid>
{
    public Guid MenuItemId { get; set; }
    /// <summary>New price effective on this date (and forward).</summary>
    public decimal NewPrice { get; set; }
    /// <summary>First date this price applies (date only, no time).</summary>
    public DateTime EffectiveDate { get; set; }

    public virtual MenuItem MenuItem { get; set; }
}

/// <summary>Promotional pricing: percentage discount for selected menu items within a date range.</summary>
public class MenuItemPromo : AuditedEntity<Guid>
{
    public string PromoName { get; set; } = string.Empty;
    /// <summary>First date the promo is active (inclusive).</summary>
    public DateTime DateFrom { get; set; }
    /// <summary>Last date the promo is active (inclusive).</summary>
    public DateTime DateTo { get; set; }
    /// <summary>Discount as percentage (e.g. 10 = 10% off).</summary>
    public decimal PercentageDiscount { get; set; }

    public virtual ICollection<MenuItemPromoItem> Items { get; set; } = [];
}

/// <summary>Junction: which menu items are included in a promo.</summary>
public class MenuItemPromoItem : AuditedEntity<Guid>
{
    public Guid MenuItemPromoId { get; set; }
    public Guid MenuItemId { get; set; }

    public virtual MenuItemPromo MenuItemPromo { get; set; }
    public virtual MenuItem MenuItem { get; set; }
}

public class MenuModifier : AuditedEntity<Guid>
{
    public Guid MenuItemId { get; set; }
    public string Name { get; set; } = string.Empty;
    public decimal PriceAdjustment { get; set; }

    public virtual MenuItem MenuItem { get; set; }
}

// ── Orders ─────────────────────────────────────────────────────────────────

public enum PosOrderType
{
    DineIn = 0,
    Takeaway = 1,
    RoomCharge = 2,
    PoolService = 3,
    RoomService = 4,
}

public enum PosOrderStatus
{
    Open = 0,
    SentToKitchen = 1,
    Preparing = 2,
    Served = 3,
    Billed = 4,
    Closed = 5,
    Cancelled = 6,
}

public enum OrderCancelReasonType
{
    GuestRequest = 0,
    WrongOrder = 1,
    OutOfStock = 2,
    Duplicate = 3,
    Other = 4,
}

public enum OrderItemStatus
{
    Pending = 0,
    SentToKitchen = 1,
    Served = 2,
    Cancelled = 3,
}

public enum OrderItemCancelReasonType
{
    GuestRequest = 0,
    WrongOrder = 1,
    OutOfStock = 2,
    Duplicate = 3,
    Other = 4,
}

public class PosOrder : FullAuditedEntity<Guid>
{
    public Guid OutletId { get; set; }
    public Guid? PosTerminalId { get; set; }
    public Guid? TableId { get; set; }
    public Guid? StayId { get; set; }
    public string GuestName { get; set; } = string.Empty;
    public string OrderNumber { get; set; } = string.Empty;
    public PosOrderType OrderType { get; set; }
    public PosOrderStatus Status { get; set; } = PosOrderStatus.Open;
    public string Notes { get; set; } = string.Empty;
    public Guid? ServerStaffId { get; set; }
    public decimal DiscountPercent { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal SeniorCitizenDiscount { get; set; }
    public DateTime OpenedAt { get; set; } = Clock.Now;
    public DateTime? ClosedAt { get; set; }
    public OrderCancelReasonType? CancelReasonType { get; set; }
    public string CancelReason { get; set; } = string.Empty;

    /// <summary>Room service charge config (snapshot from outlet at order creation). Applied only when OrderType is RoomService.</summary>
    public RoomServiceChargeType RoomServiceChargeType { get; set; } = RoomServiceChargeType.None;
    public decimal RoomServiceChargePercent { get; set; }
    public decimal RoomServiceChargeAmount { get; set; }
    /// <summary>General service charge config (snapshot from outlet at order creation).</summary>
    public ServiceChargeType ServiceChargeType { get; set; } = ServiceChargeType.None;
    public decimal ServiceChargePercent { get; set; }
    public decimal ServiceChargeAmount { get; set; }

    public virtual PosOutlet Outlet { get; set; }
    public virtual PosOutletTerminal Terminal { get; set; }
    public virtual PosTable Table { get; set; }
    public virtual Stay Stay { get; set; }
    public virtual Staff ServerStaff { get; set; }
    public virtual ICollection<PosOrderItem> Items { get; set; } = [];
    public virtual ICollection<PosOrderPayment> Payments { get; set; } = [];
}

public class PosOrderItem : FullAuditedEntity<Guid>
{
    public Guid PosOrderId { get; set; }
    public Guid MenuItemId { get; set; }
    public int Quantity { get; set; }
    public decimal Price { get; set; }
    /// <summary>Base/adjusted price at time of order (before promo). Null for legacy rows.</summary>
    public decimal? OriginalPrice { get; set; }
    public OrderItemStatus Status { get; set; } = OrderItemStatus.Pending;
    public string Notes { get; set; } = string.Empty;
    public OrderItemCancelReasonType? CancelReasonType { get; set; }
    public string CancelReason { get; set; } = string.Empty;

    public virtual PosOrder Order { get; set; }
    public virtual MenuItem MenuItem { get; set; }
    public virtual ICollection<PosOrderItemOption> SelectedOptions { get; set; } = [];
}

/// <summary>Selected option for an order line (which Option was chosen).</summary>
public class PosOrderItemOption : FullAuditedEntity<Guid>
{
    public Guid PosOrderItemId { get; set; }
    public Guid OptionId { get; set; }

    public virtual PosOrderItem PosOrderItem { get; set; }
    public virtual Option Option { get; set; }
}

public class PosOrderPayment : FullAuditedEntity<Guid>
{
    public Guid PosOrderId { get; set; }
    public Guid PaymentMethodId { get; set; }
    public decimal Amount { get; set; }
    public DateTime PaidAt { get; set; } = Clock.Now;
    public string ReferenceNo { get; set; } = string.Empty;

    public virtual PosOrder Order { get; set; }
    public virtual PaymentMethod PaymentMethod { get; set; }
}

// ── POS Sessions (shift / cash drawer lifecycle) ─────────────────────────────

public enum PosSessionStatus
{
    Open = 0,
    Closed = 1,
    Suspended = 2,
}

public class PosSession : FullAuditedEntity<Guid>
{
    public Guid OutletId { get; set; }
    public string TerminalId { get; set; } = string.Empty;
    public long UserId { get; set; }
    public DateTime OpenedAt { get; set; } = Clock.Now;
    public DateTime? ClosedAt { get; set; }
    public decimal OpeningCash { get; set; }
    public decimal? ClosingCash { get; set; }
    public decimal? ExpectedCash { get; set; }
    public decimal? CashDifference { get; set; }
    public PosSessionStatus Status { get; set; } = PosSessionStatus.Open;

    public virtual PosOutlet Outlet { get; set; }
}
