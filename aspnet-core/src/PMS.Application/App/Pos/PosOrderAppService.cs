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
using PMS.Application.Hubs;
using PMS.Auditing;
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
    Task<List<PosTableWithOrderDto>> GetTablesWithOrdersAsync(Guid outletId);
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
    Task UpdateOrderDiscountsAsync(Guid orderId, UpdateOrderDiscountsDto input);
    Task AddPaymentAsync(AddOrderPaymentDto input);
    Task<VerifyStayForRoomChargeDto> VerifyStayByRoomNumberAsync(string roomNumber);
    Task ChargeToRoomAsync(ChargeToRoomDto input);
}

[AbpAuthorize(PermissionNames.Pages_POS_Orders)]
public class PosOrderAppService(
    IRepository<PosOrder, Guid> orderRepository,
    IRepository<PosOrderItem, Guid> posOrderItemRepository,
    IRepository<PosOrderItemOption, Guid> posOrderItemOptionRepository,
    IRepository<PosOrderPayment, Guid> posOrderPaymentRepository,
    IRepository<PosOutlet, Guid> outletRepository,
    IRepository<PosTable, Guid> tableRepository,
    IRepository<MenuCategory, Guid> menuCategoryRepository,
    IRepository<MenuItem, Guid> menuItemRepository,
    IRepository<MenuItemOptionGroup, Guid> menuItemOptionGroupRepository,
    IRepository<MenuItemOptionPriceOverride, Guid> menuItemOptionPriceOverrideRepository,
    IRepository<OptionGroup, Guid> optionGroupRepository,
    IRepository<Option, Guid> optionRepository,
    IRepository<Folio, Guid> folioRepository,
    IRepository<FolioTransaction, Guid> folioTransactionRepository,
    IRepository<Stay, Guid> stayRepository,
    IRepository<ChargeType, Guid> chargeTypeRepository,
    IDocumentNumberService documentNumberService,
    IMenuItemPriceManager menuItemPriceManager,
    IFinancialAuditService financialAuditService,
    IPosHubBroadcaster posHubBroadcaster
) : PMSAppServiceBase, IPosOrderAppService
{
    private const string RestaurantChargeTypeName = "Restaurant";

    private Task NotifyPosOrderChangedAsync(Guid? orderId, Guid? outletId, Guid? tableId, string eventType)
    {
        return posHubBroadcaster.NotifyOrderChangedAsync(orderId, outletId, tableId, eventType);
    }

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

    public async Task<List<PosTableWithOrderDto>> GetTablesWithOrdersAsync(Guid outletId)
    {
        var tables = await tableRepository.GetAll()
            .Where(t => t.OutletId == outletId)
            .Include(t => t.Outlet)
            .OrderBy(t => t.TableNumber)
            .ToListAsync();
        var tableIds = tables.Select(t => t.Id).ToList();
        var activeOrders = await orderRepository.GetAll()
            .Where(o => o.TableId.HasValue && tableIds.Contains(o.TableId.Value))
            .Where(o => o.Status != PosOrderStatus.Closed && o.Status != PosOrderStatus.Cancelled)
            .Include(o => o.Items)
            .OrderByDescending(o => o.OpenedAt)
            .ToListAsync();
        var orderByTable = activeOrders
            .GroupBy(o => o.TableId!.Value)
            .ToDictionary(g => g.Key, g => g.First());
        var result = new List<PosTableWithOrderDto>();
        foreach (var t in tables)
        {
            var dto = new PosTableWithOrderDto
            {
                Id = t.Id,
                OutletId = t.OutletId,
                OutletName = t.Outlet?.Name ?? string.Empty,
                TableNumber = t.TableNumber,
                Capacity = t.Capacity,
                Status = (int)t.Status,
            };
            if (orderByTable.TryGetValue(t.Id, out var order))
            {
                var itemsTotal = order.Items.Where(i => i.Status != OrderItemStatus.Cancelled).Sum(i => i.Quantity * i.Price);
                var discountFromPercent = itemsTotal * order.DiscountPercent / 100m;
                var totalAfterDiscount = itemsTotal - discountFromPercent - order.DiscountAmount - order.SeniorCitizenDiscount;
                if (totalAfterDiscount < 0) totalAfterDiscount = 0;
                var (serviceChargeAmount, roomServiceChargeAmount) = ComputeServiceChargesFromOrder(order, totalAfterDiscount);
                var orderTotal = totalAfterDiscount + serviceChargeAmount + roomServiceChargeAmount;
                var itemsCount = order.Items.Where(i => i.Status != OrderItemStatus.Cancelled).Sum(i => i.Quantity);
                dto.ActiveOrder = new PosTableActiveOrderDto
                {
                    OrderId = order.Id,
                    OrderNumber = order.OrderNumber,
                    Status = (int)order.Status,
                    ItemsCount = itemsCount,
                    OrderTotal = orderTotal,
                    OpenedAt = order.OpenedAt,
                    GuestName = order.GuestName,
                };
            }
            result.Add(dto);
        }
        return result;
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
            .Include(m => m.MenuItemOptionGroups)
            .Where(m => m.IsAvailable);
        if (categoryId.HasValue && categoryId.Value != Guid.Empty)
            query = query.Where(m => m.CategoryId == categoryId.Value);
        var items = await query
            .OrderBy(m => m.Category.DisplayOrder).ThenBy(m => m.Name)
            .ToListAsync();
        var itemIds = items.Select(m => m.Id).ToList();
        var groupIds = items.SelectMany(m => m.MenuItemOptionGroups.Select(j => j.OptionGroupId)).Distinct().ToList();
        if (groupIds.Count == 0)
        {
            var list = items.Select(m => new MenuItemListDto
            {
                Id = m.Id,
                CategoryId = m.CategoryId,
                CategoryName = m.Category.Name,
                Name = m.Name,
                OriginalPrice = m.Price,
                Price = m.Price,
                IsAvailable = m.IsAvailable,
                OptionGroups = []
            }).ToList();
            var today = Clock.Now;
            foreach (var dto in list)
            {
                dto.OriginalPrice = await menuItemPriceManager.GetBasePriceAsync(dto.Id, today);
                dto.Price = await menuItemPriceManager.GetBestPriceAsync(dto.Id, today);
            }
            return list;
        }
        var groups = await optionGroupRepository.GetAll()
            .Where(g => groupIds.Contains(g.Id))
            .Include(g => g.Options)
            .ToListAsync();
        var allOverrides = await menuItemOptionPriceOverrideRepository.GetAll()
            .Where(x => itemIds.Contains(x.MenuItemId))
            .ToListAsync();
        var overrideByItemAndOption = allOverrides.GroupBy(x => x.MenuItemId).ToDictionary(g => g.Key, g => g.ToDictionary(x => x.OptionId, x => x.PriceAdjustment));
        var junctionByItem = items.ToDictionary(m => m.Id, m => m.MenuItemOptionGroups.OrderBy(j => j.DisplayOrder).ThenBy(j => j.OptionGroupId).Select(j => j.OptionGroupId).ToList());
        var defaultByItemAndGroup = items.SelectMany(m => m.MenuItemOptionGroups.Select(j => (m.Id, j.OptionGroupId, j.DefaultOptionId)))
            .GroupBy(x => x.Id)
            .ToDictionary(g => g.Key, g => g.ToDictionary(x => x.OptionGroupId, x => x.DefaultOptionId));
        var menuItemDtos = items.Select(m =>
        {
            var itemOverrides = overrideByItemAndOption.GetValueOrDefault(m.Id, new Dictionary<Guid, decimal>());
            var itemDefaultByGroup = defaultByItemAndGroup.GetValueOrDefault(m.Id, new Dictionary<Guid, Guid?>());
            var ogIds = junctionByItem.GetValueOrDefault(m.Id, []);
            var optionGroups = ogIds
                .Select(ogId => groups.FirstOrDefault(g => g.Id == ogId))
                .Where(g => g != null)
                .Select(g =>
                {
                    var effectiveDefaultId = itemDefaultByGroup.TryGetValue(g!.Id, out var over) && over.HasValue
                        ? over.Value
                        : g.Options.FirstOrDefault(o => o.IsDefault)?.Id;
                    return new OptionGroupDto
                    {
                        Id = g.Id,
                        Name = g.Name,
                        DisplayOrder = 0,
                        MinSelections = g.MinSelections,
                        MaxSelections = g.MaxSelections,
                        Options = g.Options.OrderBy(o => o.DisplayOrder).ThenBy(o => o.Name).Select(o => new OptionDto
                        {
                            Id = o.Id,
                            Name = o.Name,
                            BasePriceAdjustment = o.PriceAdjustment,
                            PriceAdjustment = itemOverrides.TryGetValue(o.Id, out var ov) ? ov : o.PriceAdjustment,
                            DisplayOrder = o.DisplayOrder,
                            IsDefault = o.Id == effectiveDefaultId
                        }).ToList()
                    };
                }).ToList();
            return new MenuItemListDto
            {
                Id = m.Id,
                CategoryId = m.CategoryId,
                CategoryName = m.Category.Name,
                Name = m.Name,
                OriginalPrice = m.Price,
                Price = m.Price,
                IsAvailable = m.IsAvailable,
                OptionGroups = optionGroups
            };
        }).ToList();
        var asOfDate = Clock.Now;
        foreach (var dto in menuItemDtos)
        {
            dto.OriginalPrice = await menuItemPriceManager.GetBasePriceAsync(dto.Id, asOfDate);
            dto.Price = await menuItemPriceManager.GetBestPriceAsync(dto.Id, asOfDate);
        }
        return menuItemDtos;
    }

    public async Task<PosOrderDto> GetOrderAsync(Guid orderId)
    {
        var order = await orderRepository.GetAll()
            .Include(o => o.Outlet)
            .Include(o => o.Table)
            .Include(o => o.ServerStaff)
            .Include(o => o.Items).ThenInclude(i => i.MenuItem)
            .Include(o => o.Items).ThenInclude(i => i.SelectedOptions).ThenInclude(s => s.Option).ThenInclude(o => o.OptionGroup)
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
            .Include(o => o.Items).ThenInclude(i => i.SelectedOptions).ThenInclude(s => s.Option).ThenInclude(o => o.OptionGroup)
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
        CopyChargeSettingsFromOutlet(order, outlet);
        var id = await orderRepository.InsertAndGetIdAsync(order);
        if (input.TableId.HasValue)
        {
            var table = await tableRepository.GetAsync(input.TableId.Value);
            table.Status = PosTableStatus.Occupied;
            await tableRepository.UpdateAsync(table);
        }
        await NotifyPosOrderChangedAsync(id, input.OutletId, input.TableId, "OrderCreated");
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
        CopyChargeSettingsFromOutlet(order, outlet);
        var orderId = await orderRepository.InsertAndGetIdAsync(order);
        if (input.TableId.HasValue)
        {
            var table = await tableRepository.GetAsync(input.TableId.Value);
            table.Status = PosTableStatus.Occupied;
            await tableRepository.UpdateAsync(table);
        }
        foreach (var line in input.Items ?? [])
        {
            var (price, _) = await ValidateAndComputePriceAsync(line.MenuItemId, line.SelectedOptionIds, order.OpenedAt);
            var originalPrice = await menuItemPriceManager.GetBasePriceAsync(line.MenuItemId, order.OpenedAt);
            var item = new PosOrderItem
            {
                PosOrderId = orderId,
                MenuItemId = line.MenuItemId,
                Quantity = line.Quantity,
                Price = price,
                OriginalPrice = originalPrice,
                Status = OrderItemStatus.Pending,
                Notes = line.Notes ?? ""
            };
            await posOrderItemRepository.InsertAsync(item);
            await InsertSelectedOptionsAsync(item.Id, line.SelectedOptionIds);
        }
        await NotifyPosOrderChangedAsync(orderId, input.OutletId, input.TableId, "OrderCreated");
        return orderId;
    }

    [UnitOfWork]
    public async Task AddItemAsync(AddOrderItemDto input)
    {
        var order = await orderRepository.GetAsync(input.OrderId);
        if (order.Status != PosOrderStatus.Open && order.Status != PosOrderStatus.SentToKitchen && order.Status != PosOrderStatus.Preparing)
            throw new UserFriendlyException("Cannot add items to this order.");
        var (price, _) = await ValidateAndComputePriceAsync(input.MenuItemId, input.SelectedOptionIds, order.OpenedAt);
        var originalPrice = await menuItemPriceManager.GetBasePriceAsync(input.MenuItemId, order.OpenedAt);
        var item = new PosOrderItem
        {
            PosOrderId = input.OrderId,
            MenuItemId = input.MenuItemId,
            Quantity = input.Quantity,
            Price = price,
            OriginalPrice = originalPrice,
            Status = OrderItemStatus.Pending,
            Notes = input.Notes ?? ""
        };
        await posOrderItemRepository.InsertAsync(item);
        await InsertSelectedOptionsAsync(item.Id, input.SelectedOptionIds);
        await RefreshOrderChargeSettingsAsync(order);
        await NotifyPosOrderChangedAsync(order.Id, order.OutletId, order.TableId, "ItemAdded");
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
            var (price, _) = await ValidateAndComputePriceAsync(line.MenuItemId, line.SelectedOptionIds, order.OpenedAt);
            var originalPrice = await menuItemPriceManager.GetBasePriceAsync(line.MenuItemId, order.OpenedAt);
            var item = new PosOrderItem
            {
                PosOrderId = input.OrderId,
                MenuItemId = line.MenuItemId,
                Quantity = line.Quantity,
                Price = price,
                OriginalPrice = originalPrice,
                Status = OrderItemStatus.Pending,
                Notes = line.Notes ?? ""
            };
            await posOrderItemRepository.InsertAsync(item);
            await InsertSelectedOptionsAsync(item.Id, line.SelectedOptionIds);
        }
        await RefreshOrderChargeSettingsAsync(order);
        await NotifyPosOrderChangedAsync(order.Id, order.OutletId, order.TableId, "ItemAdded");
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

        foreach (var line in input.Items)
        {
            var (price, _) = await ValidateAndComputePriceAsync(line.MenuItemId, line.SelectedOptionIds, order.OpenedAt);
            var originalPrice = await menuItemPriceManager.GetBasePriceAsync(line.MenuItemId, order.OpenedAt);
            var item = new PosOrderItem
            {
                PosOrderId = input.OrderId,
                MenuItemId = line.MenuItemId,
                Quantity = line.Quantity,
                Price = price,
                OriginalPrice = originalPrice,
                Status = OrderItemStatus.SentToKitchen,
                Notes = line.Notes ?? ""
            };
            await posOrderItemRepository.InsertAsync(item);
            await InsertSelectedOptionsAsync(item.Id, line.SelectedOptionIds);
        }
        if (order.Status == PosOrderStatus.Open)
            order.Status = PosOrderStatus.SentToKitchen;
        CopyChargeSettingsFromOutlet(order, order.Outlet);
        await orderRepository.UpdateAsync(order);
        await NotifyPosOrderChangedAsync(order.Id, order.OutletId, order.TableId, "SentToKitchen");
    }

    private async Task<(decimal Price, List<Guid> ValidOptionIds)> ValidateAndComputePriceAsync(Guid menuItemId, List<Guid>? selectedOptionIds, DateTime asOfDate)
    {
        var menuItem = await menuItemRepository.GetAsync(menuItemId);
        var basePrice = await menuItemPriceManager.GetBestPriceAsync(menuItemId, asOfDate);
        var assignedJunctions = await menuItemOptionGroupRepository.GetAll()
            .Where(j => j.MenuItemId == menuItemId)
            .ToListAsync();
        var assignedGroupIds = assignedJunctions.Select(j => j.OptionGroupId).ToHashSet();
        if (assignedGroupIds.Count == 0)
        {
            if (selectedOptionIds is { Count: > 0 })
                throw new UserFriendlyException("This menu item has no option groups. Do not send selected options.");
            return (basePrice, []);
        }
        var optionIds = (selectedOptionIds ?? []).Where(id => id != Guid.Empty).Distinct().ToList();
        if (optionIds.Count == 0)
        {
            foreach (var j in assignedJunctions)
            {
                var grp = await optionGroupRepository.GetAll().Include(g => g.Options).FirstOrDefaultAsync(g => g.Id == j.OptionGroupId);
                if (grp != null && grp.MinSelections > 0)
                    throw new UserFriendlyException($"Option group \"{grp.Name}\" requires at least {grp.MinSelections} selection(s).");
            }
            return (basePrice, []);
        }
        var options = await optionRepository.GetAll()
            .Include(o => o.OptionGroup)
            .Where(o => optionIds.Contains(o.Id))
            .ToListAsync();
        var optionIdsSet = options.Select(o => o.Id).ToHashSet();
        foreach (var id in optionIds)
        {
            if (!optionIdsSet.Contains(id))
                throw new UserFriendlyException("One or more selected option IDs are invalid.");
        }
        var byGroup = options.GroupBy(o => o.OptionGroupId).ToDictionary(g => g.Key, g => g.ToList());
        foreach (var grpId in assignedGroupIds)
        {
            var grp = await optionGroupRepository.GetAsync(grpId);
            var selectedInGroup = byGroup.GetValueOrDefault(grpId, []);
            if (selectedInGroup.Count < grp.MinSelections)
                throw new UserFriendlyException($"Option group \"{grp.Name}\" requires at least {grp.MinSelections} selection(s).");
            if (selectedInGroup.Count > grp.MaxSelections)
                throw new UserFriendlyException($"Option group \"{grp.Name}\" allows at most {grp.MaxSelections} selection(s).");
        }
        foreach (var opt in options)
        {
            if (!assignedGroupIds.Contains(opt.OptionGroupId))
                throw new UserFriendlyException($"Option \"{opt.Name}\" does not belong to an option group assigned to this menu item.");
        }
        var overrides = await menuItemOptionPriceOverrideRepository.GetAll()
            .Where(x => x.MenuItemId == menuItemId && optionIds.Contains(x.OptionId))
            .ToListAsync();
        var overrideByOption = overrides.ToDictionary(x => x.OptionId, x => x.PriceAdjustment);
        var totalAdjustment = options.Sum(o => overrideByOption.TryGetValue(o.Id, out var ov) ? ov : o.PriceAdjustment);
        return (basePrice + totalAdjustment, optionIds);
    }

    private async Task InsertSelectedOptionsAsync(Guid posOrderItemId, List<Guid>? selectedOptionIds)
    {
        if (selectedOptionIds == null) return;
        foreach (var optionId in selectedOptionIds.Where(id => id != Guid.Empty).Distinct())
        {
            await posOrderItemOptionRepository.InsertAsync(new PosOrderItemOption
            {
                PosOrderItemId = posOrderItemId,
                OptionId = optionId
            });
        }
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
        await RefreshOrderChargeSettingsAsync(item.Order);
        await NotifyPosOrderChangedAsync(item.Order.Id, item.Order.OutletId, item.Order.TableId, "ItemUpdated");
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
        await RefreshOrderChargeSettingsAsync(item.Order);
        await NotifyPosOrderChangedAsync(item.Order.Id, item.Order.OutletId, item.Order.TableId, "ItemCancelled");
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
            await NotifyPosOrderChangedAsync(order.Id, order.OutletId, order.TableId, "SentToKitchen");
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
        await NotifyPosOrderChangedAsync(order.Id, order.OutletId, order.TableId, "SentToKitchen");
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
        var discountFromPercent = itemsTotal * order.DiscountPercent / 100m;
        var totalAfterDiscount = itemsTotal - discountFromPercent - order.DiscountAmount - order.SeniorCitizenDiscount;
        if (totalAfterDiscount < 0) totalAfterDiscount = 0;
        var (serviceChargeAmount, roomServiceChargeAmount) = ComputeServiceChargesFromOrder(order, totalAfterDiscount);
        var orderTotal = totalAfterDiscount + serviceChargeAmount + roomServiceChargeAmount;
        var paymentsTotal = order.Payments.Sum(p => p.Amount);
        if (orderTotal > 0 && paymentsTotal < orderTotal)
            throw new UserFriendlyException("Cannot close order with unpaid balance. Add payment or charge to room.");
        order.Status = PosOrderStatus.Closed;
        order.ClosedAt = Clock.Now;
        await orderRepository.UpdateAsync(order);
        if (order.TableId.HasValue && order.Table != null)
        {
            order.Table.Status = PosTableStatus.Available;
            await tableRepository.UpdateAsync(order.Table);
        }
        await NotifyPosOrderChangedAsync(order.Id, order.OutletId, order.TableId, "OrderClosed");
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
        await NotifyPosOrderChangedAsync(order.Id, order.OutletId, order.TableId, "OrderCancelled");
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
        await NotifyPosOrderChangedAsync(order.Id, order.OutletId, order.TableId, "PaymentAdded");
    }

    public async Task<VerifyStayForRoomChargeDto> VerifyStayByRoomNumberAsync(string roomNumber)
    {
        if (string.IsNullOrWhiteSpace(roomNumber))
            return new VerifyStayForRoomChargeDto { IsValid = false };
        var stay = await stayRepository.GetAll()
            .Include(s => s.Rooms).ThenInclude(sr => sr.Room)
            .Where(s => (s.Status == StayStatus.InHouse || s.Status == StayStatus.CheckedIn)
                && s.Rooms.Any(sr => sr.ReleasedAt == null && sr.Room.RoomNumber == roomNumber.Trim()))
            .FirstOrDefaultAsync();
        if (stay == null)
            return new VerifyStayForRoomChargeDto { IsValid = false };
        var roomNumberDisplay = stay.Rooms != null && stay.Rooms.Count > 0
            ? string.Join(", ", stay.Rooms.Where(sr => sr.Room != null).Select(sr => sr.Room.RoomNumber).Where(n => !string.IsNullOrEmpty(n)))
            : string.Empty;
        var folio = await folioRepository.GetAll()
            .AnyAsync(f => f.StayId == stay.Id && f.Status != FolioStatus.Settled && f.Status != FolioStatus.Voided);
        return new VerifyStayForRoomChargeDto
        {
            StayId = stay.Id,
            StayNo = stay.StayNo,
            GuestName = stay.GuestName,
            RoomNumber = roomNumberDisplay,
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
        var itemsTotal = order.Items.Where(i => i.Status != OrderItemStatus.Cancelled).Sum(i => i.Quantity * i.Price);
        var discountFromPercent = itemsTotal * order.DiscountPercent / 100m;
        var totalAfterDiscount = itemsTotal - discountFromPercent - order.DiscountAmount - order.SeniorCitizenDiscount;
        if (totalAfterDiscount < 0) totalAfterDiscount = 0;
        var (serviceChargeAmount, roomServiceChargeAmount) = ComputeServiceChargesFromOrder(order, totalAfterDiscount);
        var total = totalAfterDiscount + serviceChargeAmount + roomServiceChargeAmount;
        if (total <= 0) throw new UserFriendlyException("Order has no chargeable amount.");
        var stay = await stayRepository.GetAll()
            .FirstOrDefaultAsync(s => (s.Status == StayStatus.InHouse || s.Status == StayStatus.CheckedIn)
                && s.Rooms.Any(sr => sr.ReleasedAt == null && sr.Room.RoomNumber == input.RoomNumber.Trim()));
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
        var roomChargeTxId = await folioTransactionRepository.InsertAndGetIdAsync(transaction);
        await financialAuditService.RecordTransactionCreatedAsync(
            roomChargeTxId, folio.Id, folio.StayId, total, description, new { OrderId = order.Id, OrderNumber = order.OrderNumber });
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
        await NotifyPosOrderChangedAsync(order.Id, order.OutletId, order.TableId, "ChargeToRoom");
    }

    private static void UpdateFolioStatus(Folio folio)
    {
        if (folio.Status == FolioStatus.Voided || folio.Status == FolioStatus.WrittenOff || folio.Status == FolioStatus.Settled) return;
        folio.Status = folio.Balance <= 0 ? FolioStatus.Open : FolioStatus.PartiallyPaid;
    }

    /// <summary>Compute service charge and room service charge from order's stored config and total-after-discount. Recomputed whenever order content changes.</summary>
    private static (decimal ServiceChargeAmount, decimal RoomServiceChargeAmount) ComputeServiceChargesFromOrder(PosOrder order, decimal totalAfterDiscount)
    {
        decimal serviceCharge = order.ServiceChargeType switch
        {
            ServiceChargeType.Percent => totalAfterDiscount * order.ServiceChargePercent / 100m,
            ServiceChargeType.FixedAmount => order.ServiceChargeAmount,
            _ => 0m
        };
        decimal roomServiceCharge = 0m;
        if (order.OrderType == PosOrderType.RoomService)
            roomServiceCharge = order.RoomServiceChargeType switch
            {
                RoomServiceChargeType.Percent => totalAfterDiscount * order.RoomServiceChargePercent / 100m,
                RoomServiceChargeType.FixedAmount => order.RoomServiceChargeAmount,
                _ => 0m
            };
        return (serviceCharge, roomServiceCharge);
    }

    /// <summary>Copy outlet charge settings onto an order entity (for new orders or when order is updated).</summary>
    private static void CopyChargeSettingsFromOutlet(PosOrder order, PosOutlet outlet)
    {
        order.RoomServiceChargeType = outlet.RoomServiceChargeType;
        order.RoomServiceChargePercent = outlet.RoomServiceChargePercent;
        order.RoomServiceChargeAmount = outlet.RoomServiceChargeAmount;
        order.ServiceChargeType = outlet.ServiceChargeType;
        order.ServiceChargePercent = outlet.ServiceChargePercent;
        order.ServiceChargeAmount = outlet.ServiceChargeFixedAmount;
    }

    /// <summary>Refresh order's charge settings from its outlet and save. Call whenever order content changes so charges are recomputed from current outlet config.</summary>
    private async Task RefreshOrderChargeSettingsAsync(PosOrder order)
    {
        var outlet = await outletRepository.GetAsync(order.OutletId);
        CopyChargeSettingsFromOutlet(order, outlet);
        await orderRepository.UpdateAsync(order);
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
            OriginalPrice = i.OriginalPrice ?? i.Price,
            Amount = i.Quantity * i.Price,
            LineTotal = i.Quantity * i.Price,
            Status = (int)i.Status,
            Notes = i.Notes ?? "",
            SelectedOptions = (i.SelectedOptions ?? [])
                .Select(s => new SelectedOptionDto
                {
                    GroupName = s.Option?.OptionGroup?.Name ?? "",
                    OptionName = s.Option?.Name ?? ""
                })
                .Where(s => !string.IsNullOrEmpty(s.GroupName) || !string.IsNullOrEmpty(s.OptionName))
                .ToList()
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
        var discountFromPercent = itemsTotal * order.DiscountPercent / 100m;
        var totalAfterDiscount = itemsTotal - discountFromPercent - order.DiscountAmount - order.SeniorCitizenDiscount;
        if (totalAfterDiscount < 0) totalAfterDiscount = 0;
        var (serviceChargeAmount, roomServiceChargeAmount) = ComputeServiceChargesFromOrder(order, totalAfterDiscount);
        var orderTotal = totalAfterDiscount + serviceChargeAmount + roomServiceChargeAmount;
        var balanceDue = orderTotal - paymentsTotal;
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
            TotalAfterDiscount = totalAfterDiscount,
            ServiceChargeAmount = serviceChargeAmount,
            RoomServiceChargeAmount = roomServiceChargeAmount,
            OrderTotal = orderTotal,
            BalanceDue = balanceDue
        };
    }

    [UnitOfWork]
    public async Task UpdateOrderDiscountsAsync(Guid orderId, UpdateOrderDiscountsDto input)
    {
        var order = await orderRepository.GetAsync(orderId);
        if (order.Status == PosOrderStatus.Closed || order.Status == PosOrderStatus.Cancelled)
            throw new UserFriendlyException("Cannot update discounts on a closed or cancelled order.");
        order.DiscountPercent = input.DiscountPercent;
        order.DiscountAmount = input.DiscountAmount;
        order.SeniorCitizenDiscount = input.SeniorCitizenDiscount;
        await RefreshOrderChargeSettingsAsync(order);
        await NotifyPosOrderChangedAsync(order.Id, order.OutletId, order.TableId, "DiscountsUpdated");
    }
}
