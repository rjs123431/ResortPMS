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

public interface IPosMenuItemAppService : IApplicationService
{
    Task<List<MenuItemListDto>> GetMenuItemsAsync(Guid? categoryId = null);
    Task<MenuItemListDto> GetMenuItemAsync(Guid id);
    Task<Guid> CreateMenuItemAsync(CreateMenuItemDto input);
    Task UpdateMenuItemAsync(Guid id, UpdateMenuItemDto input);
}

[AbpAuthorize(PermissionNames.Pages_POS)]
public class PosMenuItemAppService(
    IRepository<MenuCategory, Guid> menuCategoryRepository,
    IRepository<MenuItem, Guid> menuItemRepository,
    IRepository<OptionGroup, Guid> optionGroupRepository,
    IRepository<MenuItemOptionGroup, Guid> menuItemOptionGroupRepository,
    IRepository<MenuItemOptionPriceOverride, Guid> menuItemOptionPriceOverrideRepository
) : PMSAppServiceBase, IPosMenuItemAppService
{
    public async Task<List<MenuItemListDto>> GetMenuItemsAsync(Guid? categoryId = null)
    {
        var query = menuItemRepository.GetAll()
            .Include(m => m.Category)
            .AsQueryable();
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
                OriginalPrice = m.Price,
                Price = m.Price,
                IsAvailable = m.IsAvailable
            })
            .ToListAsync();
        return list;
    }

    public async Task<MenuItemListDto> GetMenuItemAsync(Guid id)
    {
        var entity = await menuItemRepository.GetAll()
            .Include(m => m.Category)
            .Include(m => m.MenuItemOptionGroups)
            .FirstOrDefaultAsync(m => m.Id == id);
        if (entity == null)
            throw new UserFriendlyException(L("MenuItem not found."));
        var groupIds = entity.MenuItemOptionGroups.Select(j => j.OptionGroupId).ToList();
        if (groupIds.Count == 0)
        {
            return new MenuItemListDto
            {
                Id = entity.Id,
                CategoryId = entity.CategoryId,
                CategoryName = entity.Category.Name,
                Name = entity.Name,
                OriginalPrice = entity.Price,
                Price = entity.Price,
                IsAvailable = entity.IsAvailable,
                OptionGroups = []
            };
        }
        var assignedGroups = await optionGroupRepository.GetAll()
            .Where(g => groupIds.Contains(g.Id))
            .Include(g => g.Options)
            .ToListAsync();
        var overrides = await menuItemOptionPriceOverrideRepository.GetAll()
            .Where(o => o.MenuItemId == id)
            .ToListAsync();
        var overrideByOption = overrides.ToDictionary(o => o.OptionId, o => o.PriceAdjustment);
        var optionGroups = entity.MenuItemOptionGroups
            .OrderBy(j => j.DisplayOrder)
            .ThenBy(j => j.OptionGroupId)
            .Select(j =>
            {
                var g = assignedGroups.FirstOrDefault(x => x.Id == j.OptionGroupId);
                if (g == null) return null;
                var effectiveDefaultId = j.DefaultOptionId ?? g.Options.FirstOrDefault(o => o.IsDefault)?.Id;
                return new OptionGroupDto
                {
                    Id = g.Id,
                    Name = g.Name,
                    DisplayOrder = j.DisplayOrder,
                    MinSelections = g.MinSelections,
                    MaxSelections = g.MaxSelections,
                    DefaultOptionIdOverride = j.DefaultOptionId,
                    Options = g.Options.OrderBy(o => o.DisplayOrder).ThenBy(o => o.Name).Select(o => new OptionDto
                    {
                        Id = o.Id,
                        Name = o.Name,
                        BasePriceAdjustment = o.PriceAdjustment,
                        PriceAdjustment = overrideByOption.TryGetValue(o.Id, out var ov) ? ov : o.PriceAdjustment,
                        DisplayOrder = o.DisplayOrder,
                        IsDefault = o.Id == effectiveDefaultId
                    }).ToList()
                };
            })
            .Where(x => x != null)
            .Cast<OptionGroupDto>()
            .ToList();
        return new MenuItemListDto
        {
            Id = entity.Id,
            CategoryId = entity.CategoryId,
            CategoryName = entity.Category.Name,
            Name = entity.Name,
            OriginalPrice = entity.Price,
            Price = entity.Price,
            IsAvailable = entity.IsAvailable,
            OptionGroups = optionGroups
        };
    }

    public async Task<Guid> CreateMenuItemAsync(CreateMenuItemDto input)
    {
        await menuCategoryRepository.GetAsync(input.CategoryId);
        var entity = new MenuItem
        {
            CategoryId = input.CategoryId,
            Name = input.Name.Trim(),
            Price = input.Price,
            IsAvailable = input.IsAvailable
        };
        await menuItemRepository.InsertAsync(entity);
        var assignedIds = input.AssignedOptionGroupIds ?? [];
        var defaultByGroup = (input.DefaultOptionOverrides ?? []).ToDictionary(x => x.OptionGroupId, x => x.DefaultOptionId);
        var order = 0;
        foreach (var groupId in assignedIds)
        {
            await optionGroupRepository.GetAsync(groupId);
            await menuItemOptionGroupRepository.InsertAsync(new MenuItemOptionGroup
            {
                MenuItemId = entity.Id,
                OptionGroupId = groupId,
                DisplayOrder = order++,
                DefaultOptionId = defaultByGroup.TryGetValue(groupId, out var defOpt) ? defOpt : null
            });
        }
        await SaveOptionPriceOverridesAsync(entity.Id, assignedIds, input.OptionPriceOverrides ?? []);
        return entity.Id;
    }

    public async Task UpdateMenuItemAsync(Guid id, UpdateMenuItemDto input)
    {
        await menuCategoryRepository.GetAsync(input.CategoryId);
        var entity = await menuItemRepository.GetAsync(id);
        entity.CategoryId = input.CategoryId;
        entity.Name = input.Name.Trim();
        entity.Price = input.Price;
        entity.IsAvailable = input.IsAvailable;
        await menuItemRepository.UpdateAsync(entity);
        var existing = await menuItemOptionGroupRepository.GetAll().Where(j => j.MenuItemId == id).ToListAsync();
        foreach (var j in existing)
            await menuItemOptionGroupRepository.DeleteAsync(j);
        var assignedIds = input.AssignedOptionGroupIds ?? [];
        var defaultByGroup = (input.DefaultOptionOverrides ?? []).ToDictionary(x => x.OptionGroupId, x => x.DefaultOptionId);
        var order = 0;
        foreach (var groupId in assignedIds)
        {
            await optionGroupRepository.GetAsync(groupId);
            await menuItemOptionGroupRepository.InsertAsync(new MenuItemOptionGroup
            {
                MenuItemId = id,
                OptionGroupId = groupId,
                DisplayOrder = order++,
                DefaultOptionId = defaultByGroup.TryGetValue(groupId, out var defOpt) ? defOpt : null
            });
        }
        var existingOverrides = await menuItemOptionPriceOverrideRepository.GetAll().Where(o => o.MenuItemId == id).ToListAsync();
        foreach (var o in existingOverrides)
            await menuItemOptionPriceOverrideRepository.DeleteAsync(o);
        await SaveOptionPriceOverridesAsync(id, input.AssignedOptionGroupIds ?? [], input.OptionPriceOverrides ?? []);
    }

    private async Task SaveOptionPriceOverridesAsync(Guid menuItemId, List<Guid> assignedGroupIds, List<OptionPriceOverrideDto> overrides)
    {
        if (assignedGroupIds.Count == 0) return;
        var options = await optionGroupRepository.GetAll()
            .Where(g => assignedGroupIds.Contains(g.Id))
            .SelectMany(g => g.Options)
            .ToListAsync();
        var baseByOption = options.ToDictionary(o => o.Id, o => o.PriceAdjustment);
        var overrideByOption = (overrides ?? []).Where(x => x.OptionId != Guid.Empty).ToDictionary(x => x.OptionId, x => x.PriceAdjustment);
        foreach (var opt in options)
        {
            if (!overrideByOption.TryGetValue(opt.Id, out var value)) continue;
            if (value == baseByOption[opt.Id]) continue;
            await menuItemOptionPriceOverrideRepository.InsertAsync(new MenuItemOptionPriceOverride
            {
                MenuItemId = menuItemId,
                OptionId = opt.Id,
                PriceAdjustment = value
            });
        }
    }
}
