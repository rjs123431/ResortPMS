using Abp.Domain.Entities;
using Abp.Domain.Entities.Auditing;
using Abp.Timing;
using System;
using System.Collections.Generic;

namespace PMS.App;

// ── Outlets & Tables ───────────────────────────────────────────────────────

public class PosOutlet : AuditedEntity<Guid>, IPassivable
{
    public string Name { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;

    public virtual ICollection<PosTable> Tables { get; set; } = [];
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

public class MenuItem : AuditedEntity<Guid>
{
    public Guid CategoryId { get; set; }
    public string Name { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public bool IsAvailable { get; set; } = true;

    public virtual MenuCategory Category { get; set; }
    public virtual ICollection<MenuModifier> Modifiers { get; set; } = [];
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

    public virtual PosOutlet Outlet { get; set; }
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
    public OrderItemStatus Status { get; set; } = OrderItemStatus.Pending;
    public string Notes { get; set; } = string.Empty;
    public OrderItemCancelReasonType? CancelReasonType { get; set; }
    public string CancelReason { get; set; } = string.Empty;

    public virtual PosOrder Order { get; set; }
    public virtual MenuItem MenuItem { get; set; }
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
