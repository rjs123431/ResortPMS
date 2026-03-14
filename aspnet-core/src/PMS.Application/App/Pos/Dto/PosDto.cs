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
}

public class PosTableListDto : EntityDto<Guid>
{
    public Guid OutletId { get; set; }
    public string OutletName { get; set; } = string.Empty;
    public string TableNumber { get; set; } = string.Empty;
    public int Capacity { get; set; }
    public int Status { get; set; } // PosTableStatus
}

// Menu
public class MenuCategoryListDto : EntityDto<Guid>
{
    public string Name { get; set; } = string.Empty;
    public int DisplayOrder { get; set; }
}

public class MenuItemListDto : EntityDto<Guid>
{
    public Guid CategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public bool IsAvailable { get; set; }
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
    public decimal BalanceDue { get; set; }
}

public class OrderItemDto : EntityDto<Guid>
{
    public Guid OrderId { get; set; }
    public Guid MenuItemId { get; set; }
    public string MenuItemName { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal Price { get; set; }
    public decimal LineTotal { get; set; }
    public int Status { get; set; }
    public string Notes { get; set; } = string.Empty;
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
}

public class CreatePosOrderWithItemsDto
{
    [Required] public Guid OutletId { get; set; }
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
