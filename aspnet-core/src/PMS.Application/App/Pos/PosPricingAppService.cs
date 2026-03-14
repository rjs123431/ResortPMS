using Abp.Application.Services;
using Abp.Authorization;
using Abp.Domain.Repositories;
using Abp.UI;
using Microsoft.EntityFrameworkCore;
using PMS.App;
using PMS.App.Pos.Dto;
using PMS.Authorization;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace PMS.App.Pos;

public interface IPosPricingAppService : IApplicationService
{
    Task<List<MenuItemPriceAdjustmentListDto>> GetPriceAdjustmentsAsync(Guid? menuItemId = null);
    Task<MenuItemPriceAdjustmentDto> GetPriceAdjustmentAsync(Guid id);
    Task<Guid> CreatePriceAdjustmentAsync(CreateMenuItemPriceAdjustmentDto input);
    Task UpdatePriceAdjustmentAsync(Guid id, UpdateMenuItemPriceAdjustmentDto input);
    Task DeletePriceAdjustmentAsync(Guid id);

    Task<List<MenuItemPromoListDto>> GetPromosAsync();
    Task<MenuItemPromoDto> GetPromoAsync(Guid id);
    Task<Guid> CreatePromoAsync(CreateMenuItemPromoDto input);
    Task UpdatePromoAsync(Guid id, UpdateMenuItemPromoDto input);
    Task DeletePromoAsync(Guid id);
}

[AbpAuthorize(PermissionNames.Pages_POS)]
public class PosPricingAppService(
    IRepository<MenuItemPriceAdjustment, Guid> adjustmentRepository,
    IRepository<MenuItemPromo, Guid> promoRepository,
    IRepository<MenuItemPromoItem, Guid> promoItemRepository,
    IRepository<MenuItem, Guid> menuItemRepository
) : PMSAppServiceBase, IPosPricingAppService
{
    public async Task<List<MenuItemPriceAdjustmentListDto>> GetPriceAdjustmentsAsync(Guid? menuItemId = null)
    {
        var query = adjustmentRepository.GetAll()
            .Include(a => a.MenuItem)
            .ThenInclude(m => m.Category)
            .AsQueryable();
        if (menuItemId.HasValue && menuItemId.Value != Guid.Empty)
            query = query.Where(a => a.MenuItemId == menuItemId.Value);
        var list = await query
            .OrderBy(a => a.MenuItem.Name)
            .ThenByDescending(a => a.EffectiveDate)
            .Select(a => new MenuItemPriceAdjustmentListDto
            {
                Id = a.Id,
                MenuItemId = a.MenuItemId,
                MenuItemName = a.MenuItem.Name,
                CategoryName = a.MenuItem.Category.Name,
                NewPrice = a.NewPrice,
                EffectiveDate = a.EffectiveDate
            })
            .ToListAsync();
        return list;
    }

    public async Task<MenuItemPriceAdjustmentDto> GetPriceAdjustmentAsync(Guid id)
    {
        var a = await adjustmentRepository.GetAll()
            .Include(x => x.MenuItem)
            .FirstOrDefaultAsync(x => x.Id == id);
        if (a == null)
            throw new UserFriendlyException(L("EntityNotFound"));
        return new MenuItemPriceAdjustmentDto
        {
            Id = a.Id,
            MenuItemId = a.MenuItemId,
            MenuItemName = a.MenuItem.Name,
            NewPrice = a.NewPrice,
            EffectiveDate = a.EffectiveDate
        };
    }

    public async Task<Guid> CreatePriceAdjustmentAsync(CreateMenuItemPriceAdjustmentDto input)
    {
        await menuItemRepository.GetAsync(input.MenuItemId);
        var entity = new MenuItemPriceAdjustment
        {
            MenuItemId = input.MenuItemId,
            NewPrice = input.NewPrice,
            EffectiveDate = input.EffectiveDate.Date
        };
        await adjustmentRepository.InsertAsync(entity);
        return entity.Id;
    }

    public async Task UpdatePriceAdjustmentAsync(Guid id, UpdateMenuItemPriceAdjustmentDto input)
    {
        var entity = await adjustmentRepository.GetAsync(id);
        entity.NewPrice = input.NewPrice;
        entity.EffectiveDate = input.EffectiveDate.Date;
        await adjustmentRepository.UpdateAsync(entity);
    }

    public async Task DeletePriceAdjustmentAsync(Guid id)
    {
        await adjustmentRepository.DeleteAsync(id);
    }

    public async Task<List<MenuItemPromoListDto>> GetPromosAsync()
    {
        var list = await promoRepository.GetAll()
            .OrderBy(p => p.DateFrom)
            .ThenBy(p => p.PromoName)
            .Select(p => new MenuItemPromoListDto
            {
                Id = p.Id,
                PromoName = p.PromoName,
                DateFrom = p.DateFrom,
                DateTo = p.DateTo,
                PercentageDiscount = p.PercentageDiscount,
                MenuItemCount = p.Items.Count
            })
            .ToListAsync();
        return list;
    }

    public async Task<MenuItemPromoDto> GetPromoAsync(Guid id)
    {
        var p = await promoRepository.GetAll()
            .Include(x => x.Items)
            .FirstOrDefaultAsync(x => x.Id == id);
        if (p == null)
            throw new UserFriendlyException(L("EntityNotFound"));
        return new MenuItemPromoDto
        {
            Id = p.Id,
            PromoName = p.PromoName,
            DateFrom = p.DateFrom,
            DateTo = p.DateTo,
            PercentageDiscount = p.PercentageDiscount,
            MenuItemIds = p.Items.Select(i => i.MenuItemId).ToList()
        };
    }

    public async Task<Guid> CreatePromoAsync(CreateMenuItemPromoDto input)
    {
        if (input.DateTo < input.DateFrom)
            throw new UserFriendlyException(L("DateTo must be on or after DateFrom."));
        var entity = new MenuItemPromo
        {
            PromoName = input.PromoName.Trim(),
            DateFrom = input.DateFrom.Date,
            DateTo = input.DateTo.Date,
            PercentageDiscount = input.PercentageDiscount
        };
        await promoRepository.InsertAsync(entity);
        foreach (var menuItemId in input.MenuItemIds ?? [])
        {
            await menuItemRepository.GetAsync(menuItemId);
            await promoItemRepository.InsertAsync(new MenuItemPromoItem
            {
                MenuItemPromoId = entity.Id,
                MenuItemId = menuItemId
            });
        }
        return entity.Id;
    }

    public async Task UpdatePromoAsync(Guid id, UpdateMenuItemPromoDto input)
    {
        if (input.DateTo < input.DateFrom)
            throw new UserFriendlyException(L("DateTo must be on or after DateFrom."));
        var entity = await promoRepository.GetAsync(id);
        entity.PromoName = input.PromoName.Trim();
        entity.DateFrom = input.DateFrom.Date;
        entity.DateTo = input.DateTo.Date;
        entity.PercentageDiscount = input.PercentageDiscount;
        await promoRepository.UpdateAsync(entity);
        var existing = await promoItemRepository.GetAll().Where(pi => pi.MenuItemPromoId == id).ToListAsync();
        foreach (var pi in existing)
            await promoItemRepository.DeleteAsync(pi);
        foreach (var menuItemId in input.MenuItemIds ?? [])
        {
            await menuItemRepository.GetAsync(menuItemId);
            await promoItemRepository.InsertAsync(new MenuItemPromoItem
            {
                MenuItemPromoId = id,
                MenuItemId = menuItemId
            });
        }
    }

    public async Task DeletePromoAsync(Guid id)
    {
        await promoRepository.DeleteAsync(id);
    }
}
