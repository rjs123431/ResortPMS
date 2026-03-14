using Abp.Application.Services;
using Abp.Authorization;
using Abp.Domain.Repositories;
using Abp.Domain.Uow;
using Abp.Timing;
using Abp.UI;
using Microsoft.EntityFrameworkCore;
using PMS.App;
using PMS.App.Pos.Dto;
using PMS.Application.App.Services;
using PMS.Authorization;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace PMS.App.Pos;

public interface IPosOrderAppService : IApplicationService
{
    Task<List<PosOutletListDto>> GetOutletsAsync();
    Task<List<PosTableListDto>> GetTablesAsync(Guid outletId);
    Task<List<MenuCategoryListDto>> GetMenuCategoriesAsync();
    Task<List<MenuItemListDto>> GetMenuItemsAsync(Guid? categoryId = null);
    Task<PosOrderDto> GetOrderAsync(Guid orderId);
    Task<PosOrderDto> GetOrderByOrderNumberAsync(string orderNumber);
    Task<List<PosOrderListDto>> GetOrdersAsync(GetPosOrdersInput input);
    Task<Guid> CreateOrderAsync(CreatePosOrderDto input);
    Task<Guid> CreateOrderWithItemsAsync(CreatePosOrderWithItemsDto input);
    Task AddItemAsync(AddOrderItemDto input);
    Task AddItemsAsync(AddOrderItemsDto input);
    Task AddItemsAndSendToKitchenAsync(AddOrderItemsDto input);
    Task UpdateItemAsync(UpdateOrderItemDto input);
    Task CancelItemAsync(CancelOrderItemDto input);
    Task SendToKitchenAsync(SendToKitchenDto input);
    Task CloseOrderAsync(Guid orderId);
    Task CancelOrderAsync(CancelOrderDto input);
    Task AddPaymentAsync(AddOrderPaymentDto input);
    Task<VerifyStayForRoomChargeDto> VerifyStayByRoomNumberAsync(string roomNumber);
    Task ChargeToRoomAsync(ChargeToRoomDto input);
}

[AbpAuthorize(PermissionNames.Pages_POS_Orders)]
public class PosOrderAppService(
    IRepository<PosOrder, Guid> orderRepository,
    IRepository<PosOrderItem, Guid> posOrderItemRepository,
    IRepository<PosOrderPayment, Guid> posOrderPaymentRepository,
    IRepository<PosOutlet, Guid> outletRepository,
    IRepository<PosTable, Guid> tableRepository,
    IRepository<MenuCategory, Guid> menuCategoryRepository,
    IRepository<MenuItem, Guid> menuItemRepository,
    IRepository<Folio, Guid> folioRepository,
    IRepository<FolioTransaction, Guid> folioTransactionRepository,
    IRepository<Stay, Guid> stayRepository,
    IRepository<ChargeType, Guid> chargeTypeRepository,
    IDocumentNumberService documentNumberService
) : PMSAppServiceBase, IPosOrderAppService
{
    private const string RestaurantChargeTypeName = "Restaurant";

    public async Task<List<PosOutletListDto>> GetOutletsAsync()
    {
        var list = await outletRepository.GetAll()
            .Where(o => o.IsActive)
            .OrderBy(o => o.Name)
            .Select(o => new PosOutletListDto
            {
                Id = o.Id,
                Name = o.Name,
                Location = o.Location,
                IsActive = o.IsActive,
                HasKitchen = o.HasKitchen
            })
            .ToListAsync();
        return list;
    }

    public async Task<List<PosTableListDto>> GetTablesAsync(Guid outletId)
    {
        var list = await tableRepository.GetAll()
            .Where(t => t.OutletId == outletId)
            .Include(t => t.Outlet)
            .OrderBy(t => t.TableNumber)
            .Select(t => new PosTableListDto
            {
                Id = t.Id,
                OutletId = t.OutletId,
                OutletName = t.Outlet.Name,
                TableNumber = t.TableNumber,
                Capacity = t.Capacity,
                Status = (int)t.Status
            })
            .ToListAsync();
        return list;
    }

    public async Task<List<MenuCategoryListDto>> GetMenuCategoriesAsync()
    {
        var list = await menuCategoryRepository.GetAll()
            .OrderBy(c => c.DisplayOrder).ThenBy(c => c.Name)
            .Select(c => new MenuCategoryListDto
            {
                Id = c.Id,
                Name = c.Name,
                DisplayOrder = c.DisplayOrder
            })
            .ToListAsync();
        return list;
    }

    public async Task<List<MenuItemListDto>> GetMenuItemsAsync(Guid? categoryId = null)
    {
        var query = menuItemRepository.GetAll()
            .Include(m => m.Category)
            .Where(m => m.IsAvailable);
        if (categoryId.HasValue && categoryId.Value != Guid.Empty)
            query = query.Where(m => m.CategoryId == categoryId.Value);
        var list = await query
            .OrderBy(m => m.Category.DisplayOrder).ThenBy(m => m.Name)
            .Select(m => new MenuItemListDto
            {
                Id = m.Id,
                CategoryId = m.CategoryId,
                CategoryName = m.Category.Name,
                Name = m.Name,
                Price = m.Price,
                IsAvailable = m.IsAvailable
            })
            .ToListAsync();
        return list;
    }

    public async Task<PosOrderDto> GetOrderAsync(Guid orderId)
    {
        var order = await orderRepository.GetAll()
            .Include(o => o.Outlet)
            .Include(o => o.Table)
            .Include(o => o.ServerStaff)
            .Include(o => o.Items).ThenInclude(i => i.MenuItem)
            .Include(o => o.Payments).ThenInclude(p => p.PaymentMethod)
            .FirstOrDefaultAsync(o => o.Id == orderId);
        if (order == null) throw new UserFriendlyException(L("EntityNotFound"));
        return MapToOrderDto(order);
    }

    public async Task<PosOrderDto> GetOrderByOrderNumberAsync(string orderNumber)
    {
        if (string.IsNullOrWhiteSpace(orderNumber))
            throw new UserFriendlyException("Order number is required.");
        var order = await orderRepository.GetAll()
            .Include(o => o.Outlet)
            .Include(o => o.Table)
            .Include(o => o.ServerStaff)
            .Include(o => o.Items).ThenInclude(i => i.MenuItem)
            .Include(o => o.Payments).ThenInclude(p => p.PaymentMethod)
            .FirstOrDefaultAsync(o => o.OrderNumber == orderNumber.Trim());
        if (order == null) throw new UserFriendlyException("Order not found.");
        return MapToOrderDto(order);
    }

    public async Task<List<PosOrderListDto>> GetOrdersAsync(GetPosOrdersInput input)
    {
        var query = orderRepository.GetAll()
            .Include(o => o.Outlet)
            .Include(o => o.Table)
            .Include(o => o.ServerStaff)
            .Include(o => o.Items)
            .Where(o => !input.Status.HasValue || o.Status == (PosOrderStatus)input.Status.Value)
            .OrderByDescending(o => o.OpenedAt)
            .Take(Math.Min(input.MaxResultCount, 100));
        var orders = await query.ToListAsync();
        return orders.Select(o => new PosOrderListDto
        {
            Id = o.Id,
            OrderNumber = o.OrderNumber,
            OutletName = o.Outlet?.Name ?? "",
            TableNumber = o.Table?.TableNumber ?? "",
            GuestName = o.GuestName ?? "",
            OrderType = (int)o.OrderType,
            Status = (int)o.Status,
            ItemsTotal = o.Items.Where(i => i.Status != OrderItemStatus.Cancelled).Sum(i => i.Quantity * i.Price),
            OpenedAt = o.OpenedAt,
            Notes = o.Notes ?? "",
            ServerStaffId = o.ServerStaffId,
            ServerStaffName = o.ServerStaff?.FullName ?? ""
        }).ToList();
    }

    [UnitOfWork]
    public async Task<Guid> CreateOrderAsync(CreatePosOrderDto input)
    {
        var outlet = await outletRepository.GetAsync(input.OutletId);
        var orderNumber = await documentNumberService.GenerateNextDocumentNumberAsync("POS_ORDER", "ORD", "");
        var order = new PosOrder
        {
            OutletId = input.OutletId,
            TableId = input.TableId,
            StayId = null,
            GuestName = input.GuestName ?? "",
            OrderNumber = orderNumber,
            OrderType = (PosOrderType)input.OrderType,
            Status = PosOrderStatus.Open,
            Notes = input.Notes ?? "",
            ServerStaffId = input.ServerStaffId,
            OpenedAt = Clock.Now
        };
        var id = await orderRepository.InsertAndGetIdAsync(order);
        if (input.TableId.HasValue)
        {
            var table = await tableRepository.GetAsync(input.TableId.Value);
            table.Status = PosTableStatus.Occupied;
            await tableRepository.UpdateAsync(table);
        }
        return id;
    }

    [UnitOfWork]
    public async Task<Guid> CreateOrderWithItemsAsync(CreatePosOrderWithItemsDto input)
    {
        var outlet = await outletRepository.GetAsync(input.OutletId);
        var orderNumber = await documentNumberService.GenerateNextDocumentNumberAsync("POS_ORDER", "ORD", "");
        var order = new PosOrder
        {
            OutletId = input.OutletId,
            TableId = input.TableId,
            StayId = null,
            GuestName = input.GuestName ?? "",
            OrderNumber = orderNumber,
            OrderType = (PosOrderType)input.OrderType,
            Status = PosOrderStatus.Open,
            Notes = input.Notes ?? "",
            ServerStaffId = input.ServerStaffId,
            OpenedAt = Clock.Now
        };
        var orderId = await orderRepository.InsertAndGetIdAsync(order);
        if (input.TableId.HasValue)
        {
            var table = await tableRepository.GetAsync(input.TableId.Value);
            table.Status = PosTableStatus.Occupied;
            await tableRepository.UpdateAsync(table);
        }
        foreach (var line in input.Items ?? [])
        {
            await posOrderItemRepository.InsertAsync(new PosOrderItem
            {
                PosOrderId = orderId,
                MenuItemId = line.MenuItemId,
                Quantity = line.Quantity,
                Price = line.Price,
                Status = OrderItemStatus.Pending,
                Notes = line.Notes ?? ""
            });
        }
        return orderId;
    }

    [UnitOfWork]
    public async Task AddItemAsync(AddOrderItemDto input)
    {
        var order = await orderRepository.GetAsync(input.OrderId);
        if (order.Status != PosOrderStatus.Open && order.Status != PosOrderStatus.SentToKitchen && order.Status != PosOrderStatus.Preparing)
            throw new UserFriendlyException("Cannot add items to this order.");
        var menuItem = await menuItemRepository.GetAsync(input.MenuItemId);
        await posOrderItemRepository.InsertAsync(new PosOrderItem
        {
            PosOrderId = input.OrderId,
            MenuItemId = input.MenuItemId,
            Quantity = input.Quantity,
            Price = input.Price,
            Status = OrderItemStatus.Pending,
            Notes = input.Notes ?? ""
        });
    }

    [UnitOfWork]
    public async Task AddItemsAsync(AddOrderItemsDto input)
    {
        if (input.Items == null || input.Items.Count == 0)
            return;
        var order = await orderRepository.GetAsync(input.OrderId);
        if (order.Status != PosOrderStatus.Open && order.Status != PosOrderStatus.SentToKitchen && order.Status != PosOrderStatus.Preparing)
            throw new UserFriendlyException("Cannot add items to this order.");
        foreach (var line in input.Items)
        {
            await menuItemRepository.GetAsync(line.MenuItemId);
            await posOrderItemRepository.InsertAsync(new PosOrderItem
            {
                PosOrderId = input.OrderId,
                MenuItemId = line.MenuItemId,
                Quantity = line.Quantity,
                Price = line.Price,
                Status = OrderItemStatus.Pending,
                Notes = line.Notes ?? ""
            });
        }
    }

    [UnitOfWork]
    public async Task AddItemsAndSendToKitchenAsync(AddOrderItemsDto input)
    {
        if (input.Items == null || input.Items.Count == 0)
            return;
        var order = await orderRepository.GetAll()
            .Include(o => o.Outlet)
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == input.OrderId);
        if (order == null) throw new UserFriendlyException("Order not found.");
        if (order.Outlet?.HasKitchen != true)
            throw new UserFriendlyException("This outlet does not have a kitchen. Send to Kitchen is not available.");
        if (order.Status != PosOrderStatus.Open && order.Status != PosOrderStatus.SentToKitchen && order.Status != PosOrderStatus.Preparing)
            throw new UserFriendlyException("Cannot add items to this order.");
        if (order.Status == PosOrderStatus.Closed || order.Status == PosOrderStatus.Cancelled)
            throw new UserFriendlyException("Cannot send closed or cancelled order to kitchen.");

        var newItemIds = new List<Guid>();
        foreach (var line in input.Items)
        {
            await menuItemRepository.GetAsync(line.MenuItemId);
            var entity = new PosOrderItem
            {
                PosOrderId = input.OrderId,
                MenuItemId = line.MenuItemId,
                Quantity = line.Quantity,
                Price = line.Price,
                Status = OrderItemStatus.SentToKitchen,
                Notes = line.Notes ?? ""
            };
            await posOrderItemRepository.InsertAsync(entity);
            newItemIds.Add(entity.Id);
        }
        if (order.Status == PosOrderStatus.Open)
            order.Status = PosOrderStatus.SentToKitchen;
        await orderRepository.UpdateAsync(order);
    }

    [UnitOfWork]
    public async Task UpdateItemAsync(UpdateOrderItemDto input)
    {
        var item = await posOrderItemRepository.GetAll()
            .Include(i => i.Order)
            .FirstOrDefaultAsync(i => i.Id == input.OrderItemId);
        if (item == null) throw new UserFriendlyException("Order item not found.");
        if (item.Order.Status == PosOrderStatus.Closed || item.Order.Status == PosOrderStatus.Cancelled)
            throw new UserFriendlyException("Cannot modify closed order.");
        if (item.Status == OrderItemStatus.Cancelled)
            throw new UserFriendlyException("Item is already cancelled.");
        item.Quantity = input.Quantity;
        item.Notes = input.Notes ?? "";
        await posOrderItemRepository.UpdateAsync(item);
    }

    [UnitOfWork]
    public async Task CancelItemAsync(CancelOrderItemDto input)
    {
        var item = await posOrderItemRepository.GetAll()
            .Include(i => i.Order)
            .FirstOrDefaultAsync(i => i.Id == input.OrderItemId);
        if (item == null) throw new UserFriendlyException("Order item not found.");
        if (item.Order.Status == PosOrderStatus.Closed || item.Order.Status == PosOrderStatus.Cancelled)
            throw new UserFriendlyException("Cannot modify closed order.");
        item.Status = OrderItemStatus.Cancelled;
        item.CancelReasonType = (OrderItemCancelReasonType)input.ReasonType;
        item.CancelReason = input.Reason ?? string.Empty;
        await posOrderItemRepository.UpdateAsync(item);
    }

    [UnitOfWork]
    public async Task SendToKitchenAsync(SendToKitchenDto input)
    {
        var order = await orderRepository.GetAll()
            .Include(o => o.Outlet)
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == input.OrderId);
        if (order == null) throw new UserFriendlyException("Order not found.");
        if (order.Outlet?.HasKitchen != true)
            throw new UserFriendlyException("This outlet does not have a kitchen. Send to Kitchen is not available.");
        if (order.Status == PosOrderStatus.Closed || order.Status == PosOrderStatus.Cancelled)
            throw new UserFriendlyException("Cannot send closed or cancelled order to kitchen.");

        var ids = input.OrderItemIds?.Where(id => id != Guid.Empty).Distinct().ToList();
        if (ids is { Count: > 0 })
        {
            // Send specific items only (e.g. order already sent, now sending new pending items)
            var itemsToSend = order.Items.Where(i => ids.Contains(i.Id) && i.Status == OrderItemStatus.Pending).ToList();
            if (itemsToSend.Count == 0)
                throw new UserFriendlyException("No pending items to send among the selected items.");
            foreach (var item in itemsToSend)
                item.Status = OrderItemStatus.SentToKitchen;
            if (order.Status == PosOrderStatus.Open)
                order.Status = PosOrderStatus.SentToKitchen;
            await orderRepository.UpdateAsync(order);
            return;
        }

        // Send all pending items (legacy behavior: order must be Open)
        if (order.Status != PosOrderStatus.Open)
            throw new UserFriendlyException("Order already sent to kitchen. Send specific items instead.");
        if (!order.Items.Any(i => i.Status == OrderItemStatus.Pending))
            throw new UserFriendlyException("No pending items to send.");
        order.Status = PosOrderStatus.SentToKitchen;
        foreach (var item in order.Items.Where(i => i.Status == OrderItemStatus.Pending))
            item.Status = OrderItemStatus.SentToKitchen;
        await orderRepository.UpdateAsync(order);
    }

    [UnitOfWork]
    public async Task CloseOrderAsync(Guid orderId)
    {
        var order = await orderRepository.GetAll()
            .Include(o => o.Table)
            .Include(o => o.Items)
            .Include(o => o.Payments)
            .FirstOrDefaultAsync(o => o.Id == orderId);
        if (order == null) throw new UserFriendlyException("Order not found.");
        if (order.Status == PosOrderStatus.Closed) throw new UserFriendlyException("Order is already closed.");
        var itemsTotal = order.Items.Where(i => i.Status != OrderItemStatus.Cancelled).Sum(i => i.Quantity * i.Price);
        var paymentsTotal = order.Payments.Sum(p => p.Amount);
        if (itemsTotal > 0 && paymentsTotal < itemsTotal)
            throw new UserFriendlyException("Cannot close order with unpaid balance. Add payment or charge to room.");
        order.Status = PosOrderStatus.Closed;
        order.ClosedAt = Clock.Now;
        await orderRepository.UpdateAsync(order);
        if (order.TableId.HasValue && order.Table != null)
        {
            order.Table.Status = PosTableStatus.Available;
            await tableRepository.UpdateAsync(order.Table);
        }
    }

    [UnitOfWork]
    public async Task CancelOrderAsync(CancelOrderDto input)
    {
        var order = await orderRepository.GetAll()
            .Include(o => o.Table)
            .FirstOrDefaultAsync(o => o.Id == input.OrderId);
        if (order == null) throw new UserFriendlyException("Order not found.");
        if (order.Status == PosOrderStatus.Closed) throw new UserFriendlyException("Order is already closed.");
        if (order.Status == PosOrderStatus.Cancelled) throw new UserFriendlyException("Order is already cancelled.");
        order.Status = PosOrderStatus.Cancelled;
        order.ClosedAt = Clock.Now;
        order.CancelReasonType = (OrderCancelReasonType)input.ReasonType;
        order.CancelReason = input.Reason ?? string.Empty;
        await orderRepository.UpdateAsync(order);
        if (order.TableId.HasValue && order.Table != null)
        {
            order.Table.Status = PosTableStatus.Available;
            await tableRepository.UpdateAsync(order.Table);
        }
    }

    [UnitOfWork]
    public async Task AddPaymentAsync(AddOrderPaymentDto input)
    {
        var order = await orderRepository.GetAsync(input.OrderId);
        if (order.Status == PosOrderStatus.Closed || order.Status == PosOrderStatus.Cancelled)
            throw new UserFriendlyException("Cannot add payment to closed order.");
        await posOrderPaymentRepository.InsertAsync(new PosOrderPayment
        {
            PosOrderId = input.OrderId,
            PaymentMethodId = input.PaymentMethodId,
            Amount = input.Amount,
            PaidAt = Clock.Now,
            ReferenceNo = input.ReferenceNo ?? ""
        });
    }

    public async Task<VerifyStayForRoomChargeDto> VerifyStayByRoomNumberAsync(string roomNumber)
    {
        if (string.IsNullOrWhiteSpace(roomNumber))
            return new VerifyStayForRoomChargeDto { IsValid = false };
        var stay = await stayRepository.GetAll()
            .Where(s => (s.Status == StayStatus.InHouse || s.Status == StayStatus.CheckedIn) && s.RoomNumber == roomNumber.Trim())
            .Select(s => new { s.Id, s.StayNo, s.GuestName, s.RoomNumber })
            .FirstOrDefaultAsync();
        if (stay == null)
            return new VerifyStayForRoomChargeDto { IsValid = false };
        var folio = await folioRepository.GetAll()
            .AnyAsync(f => f.StayId == stay.Id && f.Status != FolioStatus.Settled && f.Status != FolioStatus.Voided);
        return new VerifyStayForRoomChargeDto
        {
            StayId = stay.Id,
            StayNo = stay.StayNo,
            GuestName = stay.GuestName,
            RoomNumber = stay.RoomNumber,
            IsValid = folio
        };
    }

    [AbpAuthorize(PermissionNames.Pages_POS_RoomCharge)]
    [UnitOfWork]
    public async Task ChargeToRoomAsync(ChargeToRoomDto input)
    {
        var order = await orderRepository.GetAll()
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == input.OrderId);
        if (order == null) throw new UserFriendlyException("Order not found.");
        if (order.Status == PosOrderStatus.Closed) throw new UserFriendlyException("Order is already closed.");
        var total = order.Items.Where(i => i.Status != OrderItemStatus.Cancelled).Sum(i => i.Quantity * i.Price);
        if (total <= 0) throw new UserFriendlyException("Order has no chargeable amount.");
        var stay = await stayRepository.GetAll()
            .FirstOrDefaultAsync(s => (s.Status == StayStatus.InHouse || s.Status == StayStatus.CheckedIn) && s.RoomNumber == input.RoomNumber.Trim());
        if (stay == null) throw new UserFriendlyException("No in-house stay found for room " + input.RoomNumber);
        var folio = await folioRepository.GetAll()
            .FirstOrDefaultAsync(f => f.StayId == stay.Id);
        if (folio == null) throw new UserFriendlyException("Folio not found for stay.");
        if (folio.Status == FolioStatus.Settled || folio.Status == FolioStatus.Voided)
            throw new UserFriendlyException("Folio is closed. Cannot post room charge.");
        var chargeType = await chargeTypeRepository.GetAll()
            .FirstOrDefaultAsync(c => c.IsActive && (c.Name == RestaurantChargeTypeName || c.Category == "F&B"));
        if (chargeType == null)
            throw new UserFriendlyException("Please create a Charge Type named 'Restaurant' (or category 'F&B') in Setup for room charge posting.");
        var description = $"Restaurant Bill #{order.OrderNumber}";
        var transaction = new FolioTransaction
        {
            FolioId = folio.Id,
            TransactionDate = Clock.Now,
            TransactionType = FolioTransactionType.Charge,
            ChargeTypeId = chargeType.Id,
            Description = description,
            Quantity = 1,
            UnitPrice = total,
            Amount = total,
            TaxAmount = 0,
            DiscountAmount = 0,
            NetAmount = total
        };
        await folioTransactionRepository.InsertAsync(transaction);
        folio.Balance += total;
        UpdateFolioStatus(folio);
        await folioRepository.UpdateAsync(folio);
        order.StayId = stay.Id;
        order.GuestName = stay.GuestName;
        order.Status = PosOrderStatus.Closed;
        order.ClosedAt = Clock.Now;
        await orderRepository.UpdateAsync(order);
        if (order.TableId.HasValue)
        {
            var table = await tableRepository.GetAsync(order.TableId.Value);
            table.Status = PosTableStatus.Available;
            await tableRepository.UpdateAsync(table);
        }
    }

    private static void UpdateFolioStatus(Folio folio)
    {
        if (folio.Status == FolioStatus.Voided || folio.Status == FolioStatus.WrittenOff || folio.Status == FolioStatus.Settled) return;
        folio.Status = folio.Balance <= 0 ? FolioStatus.Open : FolioStatus.PartiallyPaid;
    }

    private static PosOrderDto MapToOrderDto(PosOrder order)
    {
        var items = order.Items.Select(i => new OrderItemDto
        {
            Id = i.Id,
            OrderId = i.PosOrderId,
            MenuItemId = i.MenuItemId,
            MenuItemName = i.MenuItem?.Name ?? "",
            Quantity = i.Quantity,
            Price = i.Price,
            LineTotal = i.Quantity * i.Price,
            Status = (int)i.Status,
            Notes = i.Notes ?? ""
        }).ToList();
        var payments = order.Payments.Select(p => new OrderPaymentDto
        {
            Id = p.Id,
            OrderId = p.PosOrderId,
            PaymentMethodId = p.PaymentMethodId,
            PaymentMethodName = p.PaymentMethod?.Name ?? "",
            Amount = p.Amount,
            PaidAt = p.PaidAt,
            ReferenceNo = p.ReferenceNo ?? ""
        }).ToList();
        var itemsTotal = items.Where(i => i.Status != (int)OrderItemStatus.Cancelled).Sum(i => i.LineTotal);
        var paymentsTotal = payments.Sum(p => p.Amount);
        return new PosOrderDto
        {
            Id = order.Id,
            OutletId = order.OutletId,
            OutletName = order.Outlet?.Name ?? "",
            OutletHasKitchen = order.Outlet?.HasKitchen ?? false,
            TableId = order.TableId,
            TableNumber = order.Table?.TableNumber ?? "",
            StayId = order.StayId,
            GuestName = order.GuestName ?? "",
            OrderNumber = order.OrderNumber,
            OrderType = (int)order.OrderType,
            Status = (int)order.Status,
            Notes = order.Notes ?? "",
            ServerStaffId = order.ServerStaffId,
            ServerStaffName = order.ServerStaff?.FullName ?? "",
            DiscountPercent = order.DiscountPercent,
            DiscountAmount = order.DiscountAmount,
            SeniorCitizenDiscount = order.SeniorCitizenDiscount,
            OpenedAt = order.OpenedAt,
            ClosedAt = order.ClosedAt,
            Items = items,
            Payments = payments,
            ItemsTotal = itemsTotal,
            PaymentsTotal = paymentsTotal,
            BalanceDue = itemsTotal - paymentsTotal
        };
    }
}
