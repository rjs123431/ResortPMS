using Abp.Application.Services;
using Abp.Application.Services.Dto;
using Abp.Authorization;
using Abp.Domain.Repositories;
using Abp.Linq.Extensions;
using Abp.UI;
using Microsoft.EntityFrameworkCore;
using PMS.App;
using PMS.App.RoomRatePlans.Dto;
using PMS.Authorization;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Dynamic.Core;
using System.Threading.Tasks;

namespace PMS.App.RoomRatePlans;

public interface IRoomRatePlanAppService : IApplicationService
{
    Task<RoomRatePlanDto> GetAsync(Guid id);
    Task<PagedResultDto<RoomRatePlanListDto>> GetAllAsync(GetRoomRatePlansInput input);
    Task<Guid> CreateAsync(CreateRoomRatePlanDto input);
    Task UpdateAsync(UpdateRoomRatePlanDto input);
    Task DeleteAsync(Guid id);
    /// <summary>Average rate per night for the stay; uses rate plan when applicable, else room type base rate.</summary>
    Task<decimal> GetEffectiveRatePerNightForStayAsync(Guid roomTypeId, DateTime arrivalDate, DateTime departureDate);
}

public class RoomRatePlanAppService(
    IRepository<RoomRatePlan, Guid> ratePlanRepository,
    IRepository<RoomRatePlanDay, Guid> dayRepository,
    IRepository<RatePlanDateOverride, Guid> overrideRepository,
    IRepository<RoomType, Guid> roomTypeRepository
) : PMSAppServiceBase, IRoomRatePlanAppService
{
    [AbpAuthorize(PermissionNames.Pages_RoomRatePlans)]
    public async Task<RoomRatePlanDto> GetAsync(Guid id)
    {
        var plan = await ratePlanRepository.GetAll()
            .Include(rp => rp.RoomType)
            .Include(rp => rp.DayRates)
            .Include(rp => rp.DateOverrides)
            .FirstOrDefaultAsync(rp => rp.Id == id);
        if (plan == null)
            throw new UserFriendlyException(L("RecordNotFound"));

        var dto = ObjectMapper.Map<RoomRatePlanDto>(plan);
        dto.RoomTypeName = plan.RoomType?.Name ?? string.Empty;
        return dto;
    }

    [AbpAuthorize(PermissionNames.Pages_RoomRatePlans)]
    public async Task<PagedResultDto<RoomRatePlanListDto>> GetAllAsync(GetRoomRatePlansInput input)
    {
        var query = ratePlanRepository.GetAll()
            .Include(rp => rp.RoomType)
            .WhereIf(input.RoomTypeId.HasValue, rp => rp.RoomTypeId == input.RoomTypeId.Value)
            .WhereIf(input.IsActive.HasValue, rp => rp.IsActive == input.IsActive.Value);

        var total = await query.CountAsync();
        var items = await query.OrderBy(input.Sorting ?? "Priority asc, Name asc").PageBy(input).ToListAsync();
        var dtos = ObjectMapper.Map<List<RoomRatePlanListDto>>(items);
        foreach (var d in dtos)
        {
            var plan = items.First(p => p.Id == d.Id);
            d.RoomTypeName = plan.RoomType?.Name ?? string.Empty;
        }
        return new PagedResultDto<RoomRatePlanListDto>(total, dtos);
    }

    [AbpAuthorize(PermissionNames.Pages_RoomRatePlans_Create)]
    public async Task<Guid> CreateAsync(CreateRoomRatePlanDto input)
    {
        var roomType = await roomTypeRepository.FirstOrDefaultAsync(input.RoomTypeId);
        if (roomType == null)
            throw new UserFriendlyException(L("RoomTypeNotFound"));

        var exists = await ratePlanRepository.GetAll()
            .AnyAsync(rp => rp.RoomTypeId == input.RoomTypeId && rp.Code == input.Code.Trim());
        if (exists)
            throw new UserFriendlyException(L("RatePlanCodeAlreadyExistsForRoomType"));

        if (input.IsDefault)
            await ClearDefaultForRoomTypeAsync(input.RoomTypeId);

        var plan = new RoomRatePlan
        {
            RoomTypeId = input.RoomTypeId,
            Code = input.Code.Trim(),
            Name = input.Name.Trim(),
            StartDate = input.StartDate.Date,
            EndDate = input.EndDate?.Date,
            Priority = input.Priority,
            IsDefault = input.IsDefault,
            IsActive = input.IsActive,
            CheckInTime = input.CheckInTime,
            CheckOutTime = input.CheckOutTime,
        };
        await ratePlanRepository.InsertAsync(plan);
        await CurrentUnitOfWork.SaveChangesAsync();

        await SaveDayRatesAsync(plan.Id, input.DayRates);
        await SaveDateOverridesAsync(plan.Id, input.DateOverrides);
        await CurrentUnitOfWork.SaveChangesAsync();

        return plan.Id;
    }

    [AbpAuthorize(PermissionNames.Pages_RoomRatePlans_Edit)]
    public async Task UpdateAsync(UpdateRoomRatePlanDto input)
    {
        var plan = await ratePlanRepository.GetAll()
            .Include(rp => rp.DayRates)
            .Include(rp => rp.DateOverrides)
            .FirstOrDefaultAsync(rp => rp.Id == input.Id);
        if (plan == null)
            throw new UserFriendlyException(L("RecordNotFound"));

        var exists = await ratePlanRepository.GetAll()
            .AnyAsync(rp => rp.RoomTypeId == plan.RoomTypeId && rp.Code == input.Code.Trim() && rp.Id != input.Id);
        if (exists)
            throw new UserFriendlyException(L("RatePlanCodeAlreadyExistsForRoomType"));

        if (input.IsDefault && !plan.IsDefault)
            await ClearDefaultForRoomTypeAsync(plan.RoomTypeId);

        plan.Code = input.Code.Trim();
        plan.Name = input.Name.Trim();
        plan.StartDate = input.StartDate.Date;
        plan.EndDate = input.EndDate?.Date;
        plan.Priority = input.Priority;
        plan.IsDefault = input.IsDefault;
        plan.IsActive = input.IsActive;
        plan.CheckInTime = input.CheckInTime;
        plan.CheckOutTime = input.CheckOutTime;
        await ratePlanRepository.UpdateAsync(plan);

        await SaveDayRatesAsync(plan.Id, input.DayRates);
        await SaveDateOverridesAsync(plan.Id, input.DateOverrides);
        await CurrentUnitOfWork.SaveChangesAsync();
    }

    [AbpAuthorize(PermissionNames.Pages_RoomRatePlans_Edit)]
    public async Task DeleteAsync(Guid id)
    {
        var plan = await ratePlanRepository.FirstOrDefaultAsync(id);
        if (plan == null)
            throw new UserFriendlyException(L("RecordNotFound"));
        await ratePlanRepository.DeleteAsync(plan);
    }

    /// <inheritdoc />
    public async Task<decimal> GetEffectiveRatePerNightForStayAsync(Guid roomTypeId, DateTime arrivalDate, DateTime departureDate)
    {
        var arrival = arrivalDate.Date;
        var departure = departureDate.Date;
        if (arrival >= departure)
            return 0;

        var roomType = await roomTypeRepository.FirstOrDefaultAsync(roomTypeId);
        var fallbackRate = roomType?.BaseRate ?? 0;

        var plans = await ratePlanRepository.GetAll()
            .Where(rp => rp.RoomTypeId == roomTypeId && rp.IsActive)
            .Where(rp => rp.StartDate <= departure && (rp.EndDate == null || rp.EndDate >= arrival))
            .OrderByDescending(rp => rp.Priority)
            .ThenByDescending(rp => rp.IsDefault)
            .Include(rp => rp.DayRates)
            .Include(rp => rp.DateOverrides)
            .ToListAsync();

        if (plans.Count == 0)
            return fallbackRate;

        var plan = plans[0];
        decimal total = 0;
        int nights = 0;
        for (var d = arrival; d < departure; d = d.AddDays(1), nights++)
        {
            var rate = GetRateForDate(plan, d, fallbackRate);
            total += rate;
        }
        return nights > 0 ? Math.Round(total / nights, 4) : fallbackRate;
    }

    private static decimal GetRateForDate(RoomRatePlan plan, DateTime date, decimal fallback)
    {
        var overrideEntry = plan.DateOverrides?.FirstOrDefault(o => o.RateDate.Date == date);
        if (overrideEntry != null)
            return overrideEntry.OverridePrice;

        var dayOfWeek = date.DayOfWeek;
        var dayRate = plan.DayRates?.FirstOrDefault(d => d.DayOfWeek == dayOfWeek);
        if (dayRate != null)
            return dayRate.BasePrice;

        return fallback;
    }

    private async Task ClearDefaultForRoomTypeAsync(Guid roomTypeId)
    {
        var defaults = await ratePlanRepository.GetAll()
            .Where(rp => rp.RoomTypeId == roomTypeId && rp.IsDefault)
            .ToListAsync();
        foreach (var rp in defaults)
        {
            rp.IsDefault = false;
            await ratePlanRepository.UpdateAsync(rp);
        }
    }

    private async Task SaveDayRatesAsync(Guid planId, List<RoomRatePlanDayDto> dayRates)
    {
        var existing = await dayRepository.GetAll().Where(d => d.RoomRatePlanId == planId).ToListAsync();
        foreach (var e in existing)
            await dayRepository.DeleteAsync(e);

        if (dayRates == null) return;
        foreach (var d in dayRates)
        {
            await dayRepository.InsertAsync(new RoomRatePlanDay
            {
                RoomRatePlanId = planId,
                DayOfWeek = d.DayOfWeek,
                BasePrice = d.BasePrice,
            });
        }
    }

    private async Task SaveDateOverridesAsync(Guid planId, List<RatePlanDateOverrideDto> overrides)
    {
        var existing = await overrideRepository.GetAll().Where(o => o.RoomRatePlanId == planId).ToListAsync();
        foreach (var e in existing)
            await overrideRepository.DeleteAsync(e);

        if (overrides == null) return;
        foreach (var o in overrides)
        {
            await overrideRepository.InsertAsync(new RatePlanDateOverride
            {
                RoomRatePlanId = planId,
                RateDate = o.RateDate.Date,
                OverridePrice = o.OverridePrice,
                Description = o.Description ?? string.Empty,
            });
        }
    }
}
