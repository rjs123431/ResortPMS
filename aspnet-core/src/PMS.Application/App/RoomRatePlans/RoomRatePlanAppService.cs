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
    IRepository<RoomRatePlanGroup, Guid> ratePlanGroupRepository,
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
            .Include(rp => rp.RoomRatePlanGroup)
            .Include(rp => rp.DayRates)
            .Include(rp => rp.DateOverrides)
            .FirstOrDefaultAsync(rp => rp.Id == id);
        if (plan == null)
            throw new UserFriendlyException(L("RecordNotFound"));

        var dto = MapToDto(plan);
        return dto;
    }

    [AbpAuthorize(PermissionNames.Pages_RoomRatePlans)]
    public async Task<PagedResultDto<RoomRatePlanListDto>> GetAllAsync(GetRoomRatePlansInput input)
    {
        var query = ratePlanRepository.GetAll()
            .Include(rp => rp.RoomType)
            .Include(rp => rp.RoomRatePlanGroup)
            .WhereIf(input.RoomTypeId.HasValue, rp => rp.RoomTypeId == input.RoomTypeId.Value)
            .WhereIf(input.IsActive.HasValue, rp => rp.RoomRatePlanGroup.IsActive == input.IsActive.Value);

        var total = await query.CountAsync();
        var sorting = NormalizeSorting(input.Sorting);
        var items = await query.OrderBy(sorting).PageBy(input).ToListAsync();
        var dtos = items.Select(MapToListDto).ToList();
        return new PagedResultDto<RoomRatePlanListDto>(total, dtos);
    }

    [AbpAuthorize(PermissionNames.Pages_RoomRatePlans_Create)]
    public async Task<Guid> CreateAsync(CreateRoomRatePlanDto input)
    {
        var roomType = await roomTypeRepository.FirstOrDefaultAsync(input.RoomTypeId);
        if (roomType == null)
            throw new UserFriendlyException(L("RoomTypeNotFound"));

        var groupCode = input.Code.Trim();
        var groupName = input.Name.Trim();
        var group = await ratePlanGroupRepository.GetAll()
            .FirstOrDefaultAsync(g => g.Code == groupCode);

        if (group == null)
        {
            group = new RoomRatePlanGroup
            {
                Code = groupCode,
                Name = groupName,
                StartDate = input.StartDate.Date,
                EndDate = input.EndDate?.Date,
                Priority = input.Priority,
                IsDefault = input.IsDefault,
                IsActive = input.IsActive,
            };
            await ratePlanGroupRepository.InsertAsync(group);
            await CurrentUnitOfWork.SaveChangesAsync();
        }

        var exists = await ratePlanRepository.GetAll()
            .AnyAsync(rp => rp.RoomTypeId == input.RoomTypeId && rp.RoomRatePlanGroupId == group.Id);
        if (exists)
            throw new UserFriendlyException(L("RatePlanCodeAlreadyExistsForRoomType"));

        if (input.IsDefault && !group.IsDefault)
            await ClearDefaultGroupsAsync();

        group.Name = groupName;
        group.StartDate = input.StartDate.Date;
        group.EndDate = input.EndDate?.Date;
        group.Priority = input.Priority;
        group.IsDefault = input.IsDefault;
        group.IsActive = input.IsActive;
        await ratePlanGroupRepository.UpdateAsync(group);

        var plan = new RoomRatePlan
        {
            RoomTypeId = input.RoomTypeId,
            RoomRatePlanGroupId = group.Id,
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
            .Include(rp => rp.RoomRatePlanGroup)
            .Include(rp => rp.DayRates)
            .Include(rp => rp.DateOverrides)
            .FirstOrDefaultAsync(rp => rp.Id == input.Id);
        if (plan == null)
            throw new UserFriendlyException(L("RecordNotFound"));

        var groupCode = input.Code.Trim();
        var groupName = input.Name.Trim();

        var group = plan.RoomRatePlanGroup;
        if (!string.Equals(group.Code, groupCode, StringComparison.Ordinal))
        {
            var matchedGroup = await ratePlanGroupRepository.GetAll().FirstOrDefaultAsync(g => g.Code == groupCode);
            if (matchedGroup != null)
            {
                group = matchedGroup;
            }
            else
            {
                group = new RoomRatePlanGroup
                {
                    Code = groupCode,
                    Name = groupName,
                    StartDate = input.StartDate.Date,
                    EndDate = input.EndDate?.Date,
                    Priority = input.Priority,
                    IsDefault = input.IsDefault,
                    IsActive = input.IsActive,
                };
                await ratePlanGroupRepository.InsertAsync(group);
                await CurrentUnitOfWork.SaveChangesAsync();
            }
        }

        var exists = await ratePlanRepository.GetAll()
            .AnyAsync(rp => rp.RoomTypeId == plan.RoomTypeId && rp.RoomRatePlanGroupId == group.Id && rp.Id != input.Id);
        if (exists)
            throw new UserFriendlyException(L("RatePlanCodeAlreadyExistsForRoomType"));

        if (input.IsDefault && !group.IsDefault)
            await ClearDefaultGroupsAsync();

        group.Code = groupCode;
        group.Name = groupName;
        group.StartDate = input.StartDate.Date;
        group.EndDate = input.EndDate?.Date;
        group.Priority = input.Priority;
        group.IsDefault = input.IsDefault;
        group.IsActive = input.IsActive;
        await ratePlanGroupRepository.UpdateAsync(group);

        plan.RoomRatePlanGroupId = group.Id;
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

        var groupId = plan.RoomRatePlanGroupId;
        await ratePlanRepository.DeleteAsync(plan);

        var hasRemainingPlans = await ratePlanRepository.GetAll().AnyAsync(rp => rp.RoomRatePlanGroupId == groupId && rp.Id != id);
        if (!hasRemainingPlans)
        {
            var orphanGroup = await ratePlanGroupRepository.FirstOrDefaultAsync(groupId);
            if (orphanGroup != null)
                await ratePlanGroupRepository.DeleteAsync(orphanGroup);
        }
    }

    /// <inheritdoc />
    public async Task<decimal> GetEffectiveRatePerNightForStayAsync(Guid roomTypeId, DateTime arrivalDate, DateTime departureDate)
    {
        var arrival = arrivalDate.Date;
        var departure = departureDate.Date;
        if (arrival >= departure)
            throw new UserFriendlyException("Invalid arrival or departure date");

        var plans = await ratePlanRepository.GetAll()
            .Include(rp => rp.RoomRatePlanGroup)
            .Where(rp => rp.RoomTypeId == roomTypeId)
            .Where(rp => rp.RoomRatePlanGroup.IsActive)
            .Where(rp => rp.RoomRatePlanGroup.StartDate <= departure && (rp.RoomRatePlanGroup.EndDate == null || rp.RoomRatePlanGroup.EndDate >= arrival))
            .OrderBy(rp => rp.RoomRatePlanGroup.Priority)
            .ThenByDescending(rp => rp.RoomRatePlanGroup.IsDefault)
            .Include(rp => rp.DayRates)
            .Include(rp => rp.DateOverrides)
            .ToListAsync();

        if (plans.Count == 0)
            throw new UserFriendlyException("No active rate plan found for the specified dates. A rate plan is required to sell this room type.");

        decimal total = 0;
        int nights = 0;
        for (var d = arrival; d < departure; d = d.AddDays(1), nights++)
        {
            var rate = GetRateForDate(plans, d);
            total += rate;
        }
        return nights > 0 ? Math.Round(total / nights, 4) : 0;
    }

    private static decimal GetRateForDate(IReadOnlyList<RoomRatePlan> plans, DateTime date)
    {
        foreach (var plan in plans)
        {
            if (plan.RoomRatePlanGroup.StartDate.Date > date || (plan.RoomRatePlanGroup.EndDate.HasValue && plan.RoomRatePlanGroup.EndDate.Value.Date < date))
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

    private async Task ClearDefaultGroupsAsync()
    {
        var defaults = await ratePlanGroupRepository.GetAll()
            .Where(g => g.IsDefault)
            .ToListAsync();
        foreach (var group in defaults)
        {
            group.IsDefault = false;
            await ratePlanGroupRepository.UpdateAsync(group);
        }
    }

    private static string NormalizeSorting(string sorting)
    {
        if (string.IsNullOrWhiteSpace(sorting))
            return "RoomRatePlanGroup.Priority asc, RoomRatePlanGroup.Name asc";

        var fieldMap = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["Priority"] = "RoomRatePlanGroup.Priority",
            ["Name"] = "RoomRatePlanGroup.Name",
            ["Code"] = "RoomRatePlanGroup.Code",
            ["StartDate"] = "RoomRatePlanGroup.StartDate",
            ["EndDate"] = "RoomRatePlanGroup.EndDate",
            ["IsDefault"] = "RoomRatePlanGroup.IsDefault",
            ["IsActive"] = "RoomRatePlanGroup.IsActive",
        };

        var mapped = sorting
            .Split(',', StringSplitOptions.RemoveEmptyEntries)
            .Select(clause =>
            {
                var trimmed = clause.Trim();
                if (trimmed.Length == 0)
                    return trimmed;

                var parts = trimmed.Split(' ', StringSplitOptions.RemoveEmptyEntries);
                var field = parts[0];
                var direction = parts.Length > 1 ? $" {parts[1]}" : string.Empty;

                if (field.Contains('.', StringComparison.Ordinal))
                    return $"{field}{direction}";

                return fieldMap.TryGetValue(field, out var mappedField)
                    ? $"{mappedField}{direction}"
                    : $"RoomRatePlanGroup.{field}{direction}";
            });

        return string.Join(", ", mapped);
    }

    private static RoomRatePlanDto MapToDto(RoomRatePlan plan)
    {
        var group = plan.RoomRatePlanGroup;
        return new RoomRatePlanDto
        {
            Id = plan.Id,
            RoomTypeId = plan.RoomTypeId,
            RoomTypeName = plan.RoomType?.Name ?? string.Empty,
            Code = group?.Code ?? string.Empty,
            Name = group?.Name ?? string.Empty,
            StartDate = group?.StartDate ?? DateTime.MinValue,
            EndDate = group?.EndDate,
            Priority = group?.Priority ?? 0,
            IsDefault = group?.IsDefault ?? false,
            IsActive = group?.IsActive ?? false,
            CheckInTime = plan.CheckInTime,
            CheckOutTime = plan.CheckOutTime,
            DayRates = plan.DayRates?.Select(d => new RoomRatePlanDayDto
            {
                Id = d.Id,
                RoomRatePlanId = d.RoomRatePlanId,
                DayOfWeek = d.DayOfWeek,
                BasePrice = d.BasePrice,
            }).ToList() ?? new List<RoomRatePlanDayDto>(),
            DateOverrides = plan.DateOverrides?.Select(o => new RatePlanDateOverrideDto
            {
                Id = o.Id,
                RoomRatePlanId = o.RoomRatePlanId,
                RateDate = o.RateDate,
                OverridePrice = o.OverridePrice,
                Description = o.Description,
            }).ToList() ?? new List<RatePlanDateOverrideDto>(),
        };
    }

    private static RoomRatePlanListDto MapToListDto(RoomRatePlan plan)
    {
        var group = plan.RoomRatePlanGroup;
        return new RoomRatePlanListDto
        {
            Id = plan.Id,
            RoomTypeId = plan.RoomTypeId,
            RoomTypeName = plan.RoomType?.Name ?? string.Empty,
            Code = group?.Code ?? string.Empty,
            Name = group?.Name ?? string.Empty,
            StartDate = group?.StartDate ?? DateTime.MinValue,
            EndDate = group?.EndDate,
            Priority = group?.Priority ?? 0,
            IsDefault = group?.IsDefault ?? false,
            IsActive = group?.IsActive ?? false,
            CheckInTime = plan.CheckInTime,
            CheckOutTime = plan.CheckOutTime,
        };
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
