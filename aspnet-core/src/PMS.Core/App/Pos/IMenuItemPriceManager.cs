using System;
using System.Threading.Tasks;

namespace PMS.App;

/// <summary>
/// Resolves the best (lowest) price for a menu item on a given date,
/// considering base/effective-date adjustments and active promos.
/// </summary>
public interface IMenuItemPriceManager
{
    /// <summary>
    /// Gets the base price for the menu item on the given date (no promo).
    /// Returns the menu item's price or the latest price adjustment effective on or before asOfDate.
    /// </summary>
    Task<decimal> GetBasePriceAsync(Guid menuItemId, DateTime asOfDate);

    /// <summary>
    /// Gets the best price for the menu item on the given date.
    /// Uses the effective price (base or latest adjustment with EffectiveDate &lt;= asOfDate),
    /// then applies any active promo (date in range, item in promo) and returns the minimum of base and promo prices.
    /// </summary>
    /// <param name="menuItemId">Menu item id.</param>
    /// <param name="asOfDate">Date to evaluate (date part only; time is ignored).</param>
    /// <returns>Best price (lowest) for that item on that date.</returns>
    Task<decimal> GetBestPriceAsync(Guid menuItemId, DateTime asOfDate);
}
