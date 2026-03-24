using Abp.Dependency;
using Abp.Domain.Repositories;
using Abp.UI;
using Microsoft.EntityFrameworkCore;
using PMS.App.RoomRatePlans.Dto;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace PMS.App.Rooms;

/// <summary>
/// Resolves the best room rate for a given room type, stay period, and optional channel.
/// Mirrors MenuItemPriceManager pattern from POS module.
/// </summary>
public interface IRoomPricingManager
{
    /// <summary>
    /// Returns the effective average rate per night for the best applicable rate plan.
    /// Returns 0 if no rate plan applies.
    /// </summary>
    Task<decimal> GetBestRatePerNightAsync(Guid roomTypeId, DateTime arrivalDate, DateTime departureDate, Guid? channelId = null);

    /// <summary>
    /// Returns all applicable rate plan options for the given room type and stay period,
    /// ordered by priority. Used for reservation rate plan selection.
    /// </summary>
    Task<List<RoomTypeRatePlanOptionDto>> GetRatePlanOptionsAsync(Guid roomTypeId, DateTime arrivalDate, DateTime departureDate, Guid? channelId = null);
}

public class RoomPricingManager(
    IRepository<RoomRatePlan, Guid> ratePlanRepository
) : IRoomPricingManager, ITransientDependency
{
    public async Task<decimal> GetBestRatePerNightAsync(
        Guid roomTypeId, DateTime arrivalDate, DateTime departureDate, Guid? channelId = null)
    {
        var arrival = arrivalDate.Date;
        var departure = departureDate.Date;
        if (arrival >= departure) return 0m;

        var plans = await GetApplicablePlansAsync(roomTypeId, arrival, departure, channelId);
        if (plans.Count == 0) return 0m;

        decimal total = 0;
        var nights = 0;
        for (var d = arrival; d < departure; d = d.AddDays(1), nights++)
        {
            total += GetRateForDate(plans, d);
        }

        return nights > 0 ? Math.Round(total / nights, 4) : 0m;
    }

    public async Task<List<RoomTypeRatePlanOptionDto>> GetRatePlanOptionsAsync(
        Guid roomTypeId, DateTime arrivalDate, DateTime departureDate, Guid? channelId = null)
    {
        var arrival = arrivalDate.Date;
        var departure = departureDate.Date;
        if (arrival >= departure)
            throw new UserFriendlyException("Invalid arrival or departure date");

        var plans = await GetApplicablePlansAsync(roomTypeId, arrival, departure, channelId);

        var options = new List<RoomTypeRatePlanOptionDto>();
        foreach (var plan in plans)
        {
            if (!TryGetAverageRateForStay(plan, arrival, departure, out var pricePerNight))
                continue;

            options.Add(new RoomTypeRatePlanOptionDto
            {
                RoomRatePlanId = plan.Id,
                Code = plan.RoomRatePlanGroup?.Code ?? string.Empty,
                Name = plan.RoomRatePlanGroup?.Name ?? string.Empty,
                PricePerNight = pricePerNight,
                Priority = plan.RoomRatePlanGroup?.Priority ?? int.MaxValue,
            });
        }

        return options;
    }

    private async Task<List<RoomRatePlan>> GetApplicablePlansAsync(
        Guid roomTypeId, DateTime arrival, DateTime departure, Guid? channelId)
    {
        return await ratePlanRepository.GetAll()
            .Include(rp => rp.RoomRatePlanGroup)
                .ThenInclude(group => group.ChannelTargets)
            .Include(rp => rp.DayRates)
            .Include(rp => rp.DateOverrides)
            .Where(rp => rp.RoomTypeId == roomTypeId)
            .Where(rp => rp.RoomRatePlanGroup.IsActive)
            .Where(rp => rp.RoomRatePlanGroup.StartDate <= departure && (rp.RoomRatePlanGroup.EndDate == null || rp.RoomRatePlanGroup.EndDate >= arrival))
            .Where(rp =>
                !rp.RoomRatePlanGroup.ChannelTargets.Any() ||
                (channelId.HasValue && rp.RoomRatePlanGroup.ChannelTargets.Any(target => target.ChannelId == channelId.Value)))
            .OrderBy(rp => rp.RoomRatePlanGroup.Priority)
            .ThenByDescending(rp => channelId.HasValue && rp.RoomRatePlanGroup.ChannelTargets.Any(target => target.ChannelId == channelId.Value))
            .ThenByDescending(rp => rp.RoomRatePlanGroup.IsDefault)
            .ThenBy(rp => rp.RoomRatePlanGroup.Name)
            .ToListAsync();
    }

    private static bool TryGetAverageRateForStay(RoomRatePlan plan, DateTime arrival, DateTime departure, out decimal averageRate)
    {
        decimal total = 0;
        var nights = 0;

        for (var date = arrival; date < departure; date = date.AddDays(1), nights++)
        {
            if (!TryGetRateForDate(plan, date, out var nightlyRate))
            {
                averageRate = 0m;
                return false;
            }
            total += nightlyRate;
        }

        averageRate = nights > 0 ? Math.Round(total / nights, 4) : 0m;
        return true;
    }

    private static decimal GetRateForDate(IReadOnlyList<RoomRatePlan> plans, DateTime date)
    {
        foreach (var plan in plans)
        {
            if (plan.RoomRatePlanGroup.StartDate.Date > date)
                continue;
            if (plan.RoomRatePlanGroup.EndDate.HasValue && plan.RoomRatePlanGroup.EndDate.Value.Date < date)
                continue;

            if (TryGetRateForDate(plan, date, out var rate))
                return rate;
        }

        throw new UserFriendlyException($"No rate found for {date:yyyy-MM-dd}. Please ensure the rate plan has day-of-week rates configured.");
    }

    private static bool TryGetRateForDate(RoomRatePlan plan, DateTime date, out decimal rate)
    {
        var overrideEntry = plan.DateOverrides?.FirstOrDefault(o => o.RateDate.Date == date);
        if (overrideEntry != null)
        {
            rate = overrideEntry.OverridePrice;
            return true;
        }

        var dayOfWeek = date.DayOfWeek;
        var dayRate = plan.DayRates?.FirstOrDefault(d => d.DayOfWeek == dayOfWeek);
        if (dayRate != null)
        {
            rate = dayRate.BasePrice;
            return true;
        }

        rate = 0m;
        return false;
    }
}
