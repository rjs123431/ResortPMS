using Abp.Application.Services.Dto;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace PMS.App.Pos.Dto;

// Outlets & Tables
public class PosOutletListDto : EntityDto<Guid>
{
    public string Name { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public bool HasKitchen { get; set; }
}

public class PosTableListDto : EntityDto<Guid>
{
    public Guid OutletId { get; set; }
    public string OutletName { get; set; } = string.Empty;
    public string TableNumber { get; set; } = string.Empty;
    public int Capacity { get; set; }
    public int Status { get; set; } // PosTableStatus
}

/// <summary>Table with optional active (non-closed) order summary for floor view.</summary>
public class PosTableWithOrderDto : EntityDto<Guid>
{
    public Guid OutletId { get; set; }
    public string OutletName { get; set; } = string.Empty;
    public string TableNumber { get; set; } = string.Empty;
    public int Capacity { get; set; }
    public int Status { get; set; } // PosTableStatus
    public PosTableActiveOrderDto? ActiveOrder { get; set; }
}

public class PosTableActiveOrderDto
{
    public Guid OrderId { get; set; }
    public string OrderNumber { get; set; } = string.Empty;
    public int Status { get; set; } // PosOrderStatus
    public int ItemsCount { get; set; }
    public decimal OrderTotal { get; set; }
    public DateTime OpenedAt { get; set; }
    public string? GuestName { get; set; }
}

// Menu
public class MenuCategoryListDto : EntityDto<Guid>
{
    public string Name { get; set; } = string.Empty;
    public int DisplayOrder { get; set; }
}

// Option groups (global, assigned to menu items via junction)
public class OptionDto : EntityDto<Guid>
{
    public string Name { get; set; } = string.Empty;
    /// <summary>Default from the option group. When in menu-item context, use this as the base.</summary>
    public decimal BasePriceAdjustment { get; set; }
    /// <summary>Effective price adjustment for this context (menu item override or base).</summary>
    public decimal PriceAdjustment { get; set; }
    public int DisplayOrder { get; set; }
    /// <summary>True when this option is the (effective) default for its group. At most one per group.</summary>
    public bool IsDefault { get; set; }
}

public class OptionPriceOverrideDto
{
    public Guid OptionId { get; set; }
    public decimal PriceAdjustment { get; set; }
}

/// <summary>Override which option is default for a given option group on this menu item. Null DefaultOptionId = use group default.</summary>
public class DefaultOptionOverrideDto
{
    public Guid OptionGroupId { get; set; }
    public Guid? DefaultOptionId { get; set; }
}

public class OptionGroupDto : EntityDto<Guid>
{
    public string Name { get; set; } = string.Empty;
    public int DisplayOrder { get; set; }
    public int MinSelections { get; set; }
    public int MaxSelections { get; set; }
    public List<OptionDto> Options { get; set; } = [];
    /// <summary>When in menu-item context: override which option is default for this group. Null = use option group default.</summary>
    public Guid? DefaultOptionIdOverride { get; set; }
}

public class OptionGroupListDto : EntityDto<Guid>
{
    public string Name { get; set; } = string.Empty;
    public int DisplayOrder { get; set; }
    public int MinSelections { get; set; }
    public int MaxSelections { get; set; }
    public int OptionCount { get; set; }
}

public class OptionInputDto
{
    [Required] [StringLength(128)] public string Name { get; set; } = string.Empty;
    public decimal PriceAdjustment { get; set; }
    public int DisplayOrder { get; set; }
    public bool IsDefault { get; set; }
}

public class CreateOptionGroupDto
{
    [Required] [StringLength(128)] public string Name { get; set; } = string.Empty;
    public int DisplayOrder { get; set; }
    public int MinSelections { get; set; }
    public int MaxSelections { get; set; }
    public List<OptionInputDto> Options { get; set; } = [];
}

public class UpdateOptionGroupDto
{
    [Required] [StringLength(128)] public string Name { get; set; } = string.Empty;
    public int DisplayOrder { get; set; }
    public int MinSelections { get; set; }
    public int MaxSelections { get; set; }
    public List<OptionInputDto> Options { get; set; } = [];
}

public class MenuItemListDto : EntityDto<Guid>
{
    public Guid CategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    /// <summary>Base or adjusted price (no promo). From menu item or latest price adjustment effective on the date.</summary>
    public decimal OriginalPrice { get; set; }
    /// <summary>Best price (promo price when a promo applies, otherwise same as OriginalPrice).</summary>
    public decimal Price { get; set; }
    public bool IsAvailable { get; set; }
    /// <summary>Assigned option groups with their options (for POS and settings get).</summary>
    public List<OptionGroupDto> OptionGroups { get; set; } = [];
}

// Order list item for retrieve/search
public class PosOrderListDto : EntityDto<Guid>
{
    public string OrderNumber { get; set; } = string.Empty;
    public string OutletName { get; set; } = string.Empty;
    public string TableNumber { get; set; } = string.Empty;
    public string GuestName { get; set; } = string.Empty;
    public int OrderType { get; set; }
    public int Status { get; set; }
    public decimal ItemsTotal { get; set; }
    public DateTime OpenedAt { get; set; }
    public string Notes { get; set; } = string.Empty;
    public Guid? ServerStaffId { get; set; }
    public string ServerStaffName { get; set; } = string.Empty;
}

public class GetPosOrdersInput
{
    public int? Status { get; set; } // PosOrderStatus, null = all
    public int MaxResultCount { get; set; } = 50;
}

// Order
public class PosOrderDto : EntityDto<Guid>
{
    public Guid OutletId { get; set; }
    public string OutletName { get; set; } = string.Empty;
    public bool OutletHasKitchen { get; set; }
    public Guid? TableId { get; set; }
    public string TableNumber { get; set; } = string.Empty;
    public Guid? StayId { get; set; }
    public string GuestName { get; set; } = string.Empty;
    public string OrderNumber { get; set; } = string.Empty;
    public int OrderType { get; set; }
    public int Status { get; set; }
    public string Notes { get; set; } = string.Empty;
    public Guid? ServerStaffId { get; set; }
    public string ServerStaffName { get; set; } = string.Empty;
    public decimal DiscountPercent { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal SeniorCitizenDiscount { get; set; }
    public DateTime OpenedAt { get; set; }
    public DateTime? ClosedAt { get; set; }
    public List<OrderItemDto> Items { get; set; } = [];
    public List<OrderPaymentDto> Payments { get; set; } = [];
    public decimal ItemsTotal { get; set; }
    public decimal PaymentsTotal { get; set; }
    /// <summary>Items total after discount percent, discount amount, and senior citizen discount.</summary>
    public decimal TotalAfterDiscount { get; set; }
    /// <summary>General service charge amount (from outlet settings).</summary>
    public decimal ServiceChargeAmount { get; set; }
    /// <summary>Room service charge amount (from outlet; only when order type is Room Service).</summary>
    public decimal RoomServiceChargeAmount { get; set; }
    /// <summary>Total after discounts + service charge + room service charge.</summary>
    public decimal OrderTotal { get; set; }
    public decimal BalanceDue { get; set; }
}

public class UpdateOrderDiscountsDto
{
    [Range(0, 100)] public decimal DiscountPercent { get; set; }
    [Range(0, double.MaxValue)] public decimal DiscountAmount { get; set; }
    [Range(0, double.MaxValue)] public decimal SeniorCitizenDiscount { get; set; }
}

public class SelectedOptionDto
{
    public string GroupName { get; set; } = string.Empty;
    public string OptionName { get; set; } = string.Empty;
}

public class OrderItemDto : EntityDto<Guid>
{
    public Guid OrderId { get; set; }
    public Guid MenuItemId { get; set; }
    public string MenuItemName { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal Price { get; set; }
    /// <summary>Base/adjusted price at time of order (before promo).</summary>
    public decimal OriginalPrice { get; set; }
    /// <summary>Quantity × Price (line total).</summary>
    public decimal Amount { get; set; }
    public decimal LineTotal { get; set; }
    public int Status { get; set; }
    public string Notes { get; set; } = string.Empty;
    public List<SelectedOptionDto> SelectedOptions { get; set; } = [];
}

public class OrderPaymentDto : EntityDto<Guid>
{
    public Guid OrderId { get; set; }
    public Guid PaymentMethodId { get; set; }
    public string PaymentMethodName { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public DateTime PaidAt { get; set; }
    public string ReferenceNo { get; set; } = string.Empty;
}

// Input DTOs
public class CreatePosOrderDto
{
    [Required] public Guid OutletId { get; set; }
    public Guid? PosTerminalId { get; set; }
    public Guid? TableId { get; set; }
    [Required] public int OrderType { get; set; } // PosOrderType
    [StringLength(256)] public string GuestName { get; set; } = string.Empty;
    [StringLength(512)] public string Notes { get; set; } = string.Empty;
    public Guid? ServerStaffId { get; set; }
}

public class CreatePosOrderLineDto
{
    [Required] public Guid MenuItemId { get; set; }
    [Range(1, 999)] public int Quantity { get; set; } = 1;
    [Required] public decimal Price { get; set; }
    [StringLength(512)] public string Notes { get; set; } = string.Empty;
    /// <summary>Option IDs selected for this line (must belong to groups assigned to the menu item).</summary>
    public List<Guid>? SelectedOptionIds { get; set; }
}

public class CreatePosOrderWithItemsDto
{
    [Required] public Guid OutletId { get; set; }
    public Guid? PosTerminalId { get; set; }
    public Guid? TableId { get; set; }
    [Required] public int OrderType { get; set; } // PosOrderType
    [StringLength(256)] public string GuestName { get; set; } = string.Empty;
    [StringLength(512)] public string Notes { get; set; } = string.Empty;
    public Guid? ServerStaffId { get; set; }
    public List<CreatePosOrderLineDto> Items { get; set; } = [];
}

public class AddOrderItemDto
{
    [Required] public Guid OrderId { get; set; }
    [Required] public Guid MenuItemId { get; set; }
    [Range(1, 999)] public int Quantity { get; set; } = 1;
    [Required] public decimal Price { get; set; }
    [StringLength(512)] public string Notes { get; set; } = string.Empty;
    public List<Guid>? SelectedOptionIds { get; set; }
}

public class AddOrderItemsDto
{
    [Required] public Guid OrderId { get; set; }
    public List<CreatePosOrderLineDto> Items { get; set; } = [];
}

public class UpdateOrderItemDto
{
    [Required] public Guid OrderItemId { get; set; }
    [Range(0, 999)] public int Quantity { get; set; }
    [StringLength(512)] public string Notes { get; set; } = string.Empty;
}

public class CancelOrderItemDto
{
    [Required] public Guid OrderItemId { get; set; }
    public int ReasonType { get; set; } // OrderItemCancelReasonType
    [StringLength(512)] public string Reason { get; set; } = string.Empty;
}

public class AddOrderPaymentDto
{
    [Required] public Guid OrderId { get; set; }
    [Required] public Guid PaymentMethodId { get; set; }
    [Range(0.01, double.MaxValue)] public decimal Amount { get; set; }
    [StringLength(64)] public string ReferenceNo { get; set; } = string.Empty;
}

public class SendToKitchenDto
{
    [Required] public Guid OrderId { get; set; }
    /// <summary>When set, only these order item IDs are marked SentToKitchen (e.g. for follow-up sends). When null or empty, all pending items are sent and order must be Open.</summary>
    public List<Guid>? OrderItemIds { get; set; }
}

public class CancelOrderDto
{
    [Required] public Guid OrderId { get; set; }
    public int ReasonType { get; set; } // OrderCancelReasonType
    [StringLength(512)] public string Reason { get; set; } = string.Empty;
}

public class ChargeToRoomDto
{
    [Required] public Guid OrderId { get; set; }
    [Required] public string RoomNumber { get; set; } = string.Empty;
}

public class VerifyStayForRoomChargeDto
{
    public Guid StayId { get; set; }
    public string StayNo { get; set; } = string.Empty;
    public string GuestName { get; set; } = string.Empty;
    public string RoomNumber { get; set; } = string.Empty;
    public bool IsValid { get; set; }
}

// POS Session
public class PosSessionListDto : EntityDto<Guid>
{
    public Guid OutletId { get; set; }
    public string OutletName { get; set; } = string.Empty;
    public string TerminalId { get; set; } = string.Empty;
    public string TerminalName { get; set; } = string.Empty;
    public long UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public DateTime OpenedAt { get; set; }
    public DateTime? ClosedAt { get; set; }
    public decimal OpeningCash { get; set; }
    public decimal? ClosingCash { get; set; }
    public decimal? ExpectedCash { get; set; }
    public decimal? CashDifference { get; set; }
    public int Status { get; set; } // PosSessionStatus
}

public class OpenPosSessionInput
{
    [Required] public Guid OutletId { get; set; }
    [Required] [StringLength(32)] public string TerminalId { get; set; } = string.Empty;
    [Range(0, double.MaxValue)] public decimal OpeningCash { get; set; }
}

public class ClosePosSessionInput
{
    /// <summary>Session to close. If null, closes the current user's open session.</summary>
    public Guid? SessionId { get; set; }
    [Range(0, double.MaxValue)] public decimal ClosingCash { get; set; }
}

// ── POS Settings (CRUD for outlets, tables, menu) ───────────────────────────

public class PosOutletDto : EntityDto<Guid>
{
    public string Name { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public bool HasKitchen { get; set; }
    public Guid? ChargeTypeId { get; set; }
    public int RoomServiceChargeType { get; set; } // RoomServiceChargeType enum
    public decimal RoomServiceChargePercent { get; set; }
    public decimal RoomServiceChargeAmount { get; set; }
    public int ServiceChargeType { get; set; } // ServiceChargeType enum
    public decimal ServiceChargePercent { get; set; }
    public decimal ServiceChargeFixedAmount { get; set; }
}

public class CreatePosOutletDto
{
    [Required] [StringLength(128)] public string Name { get; set; } = string.Empty;
    [StringLength(256)] public string Location { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public bool HasKitchen { get; set; }
    public Guid? ChargeTypeId { get; set; }
    public int RoomServiceChargeType { get; set; }
    [Range(0, 100)] public decimal RoomServiceChargePercent { get; set; }
    [Range(0, double.MaxValue)] public decimal RoomServiceChargeAmount { get; set; }
    public int ServiceChargeType { get; set; }
    [Range(0, 100)] public decimal ServiceChargePercent { get; set; }
    [Range(0, double.MaxValue)] public decimal ServiceChargeFixedAmount { get; set; }
}

public class UpdatePosOutletDto
{
    [Required] [StringLength(128)] public string Name { get; set; } = string.Empty;
    [StringLength(256)] public string Location { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public bool HasKitchen { get; set; }
    public Guid? ChargeTypeId { get; set; }
    public int RoomServiceChargeType { get; set; }
    [Range(0, 100)] public decimal RoomServiceChargePercent { get; set; }
    [Range(0, double.MaxValue)] public decimal RoomServiceChargeAmount { get; set; }
    public int ServiceChargeType { get; set; }
    [Range(0, 100)] public decimal ServiceChargePercent { get; set; }
    [Range(0, double.MaxValue)] public decimal ServiceChargeFixedAmount { get; set; }
}

public class CreatePosTableDto
{
    [Required] public Guid OutletId { get; set; }
    [Required] [StringLength(32)] public string TableNumber { get; set; } = string.Empty;
    [Range(1, 99)] public int Capacity { get; set; } = 2;
}

public class UpdatePosTableDto
{
    [Required] [StringLength(32)] public string TableNumber { get; set; } = string.Empty;
    [Range(1, 99)] public int Capacity { get; set; }
}

public class PosTerminalListDto : EntityDto<Guid>
{
    public Guid OutletId { get; set; }
    public string OutletName { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public bool IsActive { get; set; }
}

public class CreatePosTerminalDto
{
    [Required] public Guid OutletId { get; set; }
    [Required] [StringLength(32)] public string Code { get; set; } = string.Empty;
    [Required] [StringLength(128)] public string Name { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
}

public class UpdatePosTerminalDto
{
    [Required] [StringLength(32)] public string Code { get; set; } = string.Empty;
    [Required] [StringLength(128)] public string Name { get; set; } = string.Empty;
    public bool IsActive { get; set; }
}

public class CreateMenuCategoryDto
{
    [Required] [StringLength(128)] public string Name { get; set; } = string.Empty;
    public int DisplayOrder { get; set; }
}

public class UpdateMenuCategoryDto
{
    [Required] [StringLength(128)] public string Name { get; set; } = string.Empty;
    public int DisplayOrder { get; set; }
}

public class CreateMenuItemDto
{
    [Required] public Guid CategoryId { get; set; }
    [Required] [StringLength(256)] public string Name { get; set; } = string.Empty;
    [Range(0, double.MaxValue)] public decimal Price { get; set; }
    public bool IsAvailable { get; set; } = true;
    public List<Guid>? AssignedOptionGroupIds { get; set; }
    /// <summary>Per-option price overrides for this menu item. Omit or same as base = use option default.</summary>
    public List<OptionPriceOverrideDto>? OptionPriceOverrides { get; set; }
    /// <summary>Per-group default option override. Null DefaultOptionId = use option group default.</summary>
    public List<DefaultOptionOverrideDto>? DefaultOptionOverrides { get; set; }
}

public class UpdateMenuItemDto
{
    [Required] public Guid CategoryId { get; set; }
    [Required] [StringLength(256)] public string Name { get; set; } = string.Empty;
    [Range(0, double.MaxValue)] public decimal Price { get; set; }
    public bool IsAvailable { get; set; }
    public List<Guid>? AssignedOptionGroupIds { get; set; }
    public List<OptionPriceOverrideDto>? OptionPriceOverrides { get; set; }
    public List<DefaultOptionOverrideDto>? DefaultOptionOverrides { get; set; }
}

// ── Price adjustments (effective date) ─────────────────────────────────────

public class MenuItemPriceAdjustmentListDto : EntityDto<Guid>
{
    public Guid MenuItemId { get; set; }
    public string MenuItemName { get; set; } = string.Empty;
    public string CategoryName { get; set; } = string.Empty;
    public decimal NewPrice { get; set; }
    public DateTime EffectiveDate { get; set; }
}

public class MenuItemPriceAdjustmentDto : EntityDto<Guid>
{
    public Guid MenuItemId { get; set; }
    public string MenuItemName { get; set; } = string.Empty;
    public decimal NewPrice { get; set; }
    public DateTime EffectiveDate { get; set; }
}

public class CreateMenuItemPriceAdjustmentDto
{
    [Required] public Guid MenuItemId { get; set; }
    [Range(0, double.MaxValue)] public decimal NewPrice { get; set; }
    [Required] public DateTime EffectiveDate { get; set; }
}

public class UpdateMenuItemPriceAdjustmentDto
{
    [Range(0, double.MaxValue)] public decimal NewPrice { get; set; }
    [Required] public DateTime EffectiveDate { get; set; }
}

// ── Promos (date range + percentage discount + items) ──────────────────────

public class MenuItemPromoListDto : EntityDto<Guid>
{
    public string PromoName { get; set; } = string.Empty;
    public DateTime DateFrom { get; set; }
    public DateTime DateTo { get; set; }
    public decimal PercentageDiscount { get; set; }
    public int MenuItemCount { get; set; }
}

public class MenuItemPromoDto : EntityDto<Guid>
{
    public string PromoName { get; set; } = string.Empty;
    public DateTime DateFrom { get; set; }
    public DateTime DateTo { get; set; }
    public decimal PercentageDiscount { get; set; }
    public List<Guid> MenuItemIds { get; set; } = [];
}

public class CreateMenuItemPromoDto
{
    [Required] [StringLength(128)] public string PromoName { get; set; } = string.Empty;
    [Required] public DateTime DateFrom { get; set; }
    [Required] public DateTime DateTo { get; set; }
    [Range(0, 100)] public decimal PercentageDiscount { get; set; }
    public List<Guid> MenuItemIds { get; set; } = [];
}

public class UpdateMenuItemPromoDto
{
    [Required] [StringLength(128)] public string PromoName { get; set; } = string.Empty;
    [Required] public DateTime DateFrom { get; set; }
    [Required] public DateTime DateTo { get; set; }
    [Range(0, 100)] public decimal PercentageDiscount { get; set; }
    public List<Guid> MenuItemIds { get; set; } = [];
}
