using System;
using System.Linq;
using System.Threading.Tasks;
using Abp.Dependency;
using Abp.Domain.Repositories;
using Microsoft.EntityFrameworkCore;
using PMS.App;

namespace PMS.App.Pos;

/// <summary>
/// Resolves the best price for a menu item on a given date using
/// effective-date adjustments and active promos (percentage discount).
/// </summary>
public class MenuItemPriceManager(
    IRepository<MenuItem, Guid> menuItemRepository,
    IRepository<MenuItemPriceAdjustment, Guid> adjustmentRepository,
    IRepository<MenuItemPromo, Guid> promoRepository,
    IRepository<MenuItemPromoItem, Guid> promoItemRepository
) : IMenuItemPriceManager, ITransientDependency
{
    public async Task<decimal> GetBasePriceAsync(Guid menuItemId, DateTime asOfDate)
    {
        var date = asOfDate.Date;
        var menuItem = await menuItemRepository.GetAsync(menuItemId);
        var latestAdjustment = await adjustmentRepository.GetAll()
            .Where(a => a.MenuItemId == menuItemId && a.EffectiveDate <= date)
            .OrderByDescending(a => a.EffectiveDate)
            .FirstOrDefaultAsync();
        return latestAdjustment != null ? latestAdjustment.NewPrice : menuItem.Price;
    }

    public async Task<decimal> GetBestPriceAsync(Guid menuItemId, DateTime asOfDate)
    {
        var date = asOfDate.Date;
        var basePrice = await GetBasePriceAsync(menuItemId, asOfDate);

        // Active promos that include this item (date in [DateFrom, DateTo])
        var activePromoIds = await promoRepository.GetAll()
            .Where(p => p.DateFrom <= date && p.DateTo >= date)
            .Select(p => p.Id)
            .ToListAsync();
        if (activePromoIds.Count == 0)
            return basePrice;

        var promosWithThisItem = await promoItemRepository.GetAll()
            .Where(pi => pi.MenuItemId == menuItemId && activePromoIds.Contains(pi.MenuItemPromoId))
            .Select(pi => pi.MenuItemPromoId)
            .ToListAsync();
        if (promosWithThisItem.Count == 0)
            return basePrice;

        var promos = await promoRepository.GetAll()
            .Where(p => promosWithThisItem.Contains(p.Id))
            .Select(p => new { p.Id, p.PercentageDiscount })
            .ToListAsync();
        var bestPromoPrice = basePrice;
        foreach (var p in promos)
        {
            var discounted = basePrice * (100 - p.PercentageDiscount) / 100m;
            if (discounted < bestPromoPrice)
                bestPromoPrice = discounted;
        }

        return bestPromoPrice < basePrice ? bestPromoPrice : basePrice;
    }
}
