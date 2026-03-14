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

public interface IPosSettingsAppService : IApplicationService
{
    Task<List<PosOutletListDto>> GetOutletsAsync();
    Task<PosOutletDto> GetOutletAsync(Guid id);
    Task<Guid> CreateOutletAsync(CreatePosOutletDto input);
    Task UpdateOutletAsync(Guid id, UpdatePosOutletDto input);

    Task<List<PosTerminalListDto>> GetTerminalsAsync(Guid outletId);
    Task<Guid> CreateTerminalAsync(CreatePosTerminalDto input);
    Task UpdateTerminalAsync(Guid id, UpdatePosTerminalDto input);

    Task<List<PosTableListDto>> GetTablesAsync(Guid outletId);
    Task<Guid> CreateTableAsync(CreatePosTableDto input);
    Task UpdateTableAsync(Guid id, UpdatePosTableDto input);

    Task<List<MenuCategoryListDto>> GetMenuCategoriesAsync();
    Task<MenuCategoryListDto> GetMenuCategoryAsync(Guid id);
    Task<Guid> CreateMenuCategoryAsync(CreateMenuCategoryDto input);
    Task UpdateMenuCategoryAsync(Guid id, UpdateMenuCategoryDto input);

    Task<List<OptionGroupListDto>> GetOptionGroupsAsync();
    Task<OptionGroupDto> GetOptionGroupAsync(Guid id);
    Task<Guid> CreateOptionGroupAsync(CreateOptionGroupDto input);
    Task UpdateOptionGroupAsync(Guid id, UpdateOptionGroupDto input);
    Task DeleteOptionGroupAsync(Guid id);
}

[AbpAuthorize(PermissionNames.Pages_POS)]
public class PosSettingsAppService(
    IRepository<PosOutlet, Guid> outletRepository,
    IRepository<PosOutletTerminal, Guid> terminalRepository,
    IRepository<PosTable, Guid> tableRepository,
    IRepository<MenuCategory, Guid> menuCategoryRepository,
    IRepository<OptionGroup, Guid> optionGroupRepository,
    IRepository<Option, Guid> optionRepository,
    IRepository<MenuItemOptionGroup, Guid> menuItemOptionGroupRepository
) : PMSAppServiceBase, IPosSettingsAppService
{
    public async Task<List<PosOutletListDto>> GetOutletsAsync()
    {
        var list = await outletRepository.GetAll()
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

    public async Task<PosOutletDto> GetOutletAsync(Guid id)
    {
        var entity = await outletRepository.GetAsync(id);
        return new PosOutletDto
        {
            Id = entity.Id,
            Name = entity.Name,
            Location = entity.Location,
            IsActive = entity.IsActive,
            HasKitchen = entity.HasKitchen,
            ChargeTypeId = entity.ChargeTypeId,
            RoomServiceChargeType = (int)entity.RoomServiceChargeType,
            RoomServiceChargePercent = entity.RoomServiceChargePercent,
            RoomServiceChargeAmount = entity.RoomServiceChargeAmount,
            ServiceChargeType = (int)entity.ServiceChargeType,
            ServiceChargePercent = entity.ServiceChargePercent,
            ServiceChargeFixedAmount = entity.ServiceChargeFixedAmount
        };
    }

    public async Task<Guid> CreateOutletAsync(CreatePosOutletDto input)
    {
        var entity = new PosOutlet
        {
            Name = input.Name.Trim(),
            Location = input.Location?.Trim() ?? string.Empty,
            IsActive = input.IsActive,
            HasKitchen = input.HasKitchen,
            ChargeTypeId = input.ChargeTypeId,
            RoomServiceChargeType = (RoomServiceChargeType)input.RoomServiceChargeType,
            RoomServiceChargePercent = input.RoomServiceChargePercent,
            RoomServiceChargeAmount = input.RoomServiceChargeAmount,
            ServiceChargeType = (ServiceChargeType)input.ServiceChargeType,
            ServiceChargePercent = input.ServiceChargePercent,
            ServiceChargeFixedAmount = input.ServiceChargeFixedAmount
        };
        await outletRepository.InsertAsync(entity);
        return entity.Id;
    }

    public async Task UpdateOutletAsync(Guid id, UpdatePosOutletDto input)
    {
        var entity = await outletRepository.GetAsync(id);
        entity.Name = input.Name.Trim();
        entity.Location = input.Location?.Trim() ?? string.Empty;
        entity.IsActive = input.IsActive;
        entity.HasKitchen = input.HasKitchen;
        entity.ChargeTypeId = input.ChargeTypeId;
        entity.RoomServiceChargeType = (RoomServiceChargeType)input.RoomServiceChargeType;
        entity.RoomServiceChargePercent = input.RoomServiceChargePercent;
        entity.RoomServiceChargeAmount = input.RoomServiceChargeAmount;
        entity.ServiceChargeType = (ServiceChargeType)input.ServiceChargeType;
        entity.ServiceChargePercent = input.ServiceChargePercent;
        entity.ServiceChargeFixedAmount = input.ServiceChargeFixedAmount;
        await outletRepository.UpdateAsync(entity);
    }

    public async Task<List<PosTerminalListDto>> GetTerminalsAsync(Guid outletId)
    {
        var list = await terminalRepository.GetAll()
            .Where(t => t.OutletId == outletId)
            .Include(t => t.Outlet)
            .OrderBy(t => t.Code)
            .Select(t => new PosTerminalListDto
            {
                Id = t.Id,
                OutletId = t.OutletId,
                OutletName = t.Outlet.Name,
                Code = t.Code,
                Name = t.Name,
                IsActive = t.IsActive
            })
            .ToListAsync();
        return list;
    }

    public async Task<Guid> CreateTerminalAsync(CreatePosTerminalDto input)
    {
        await outletRepository.GetAsync(input.OutletId);
        var existing = await terminalRepository.GetAll()
            .AnyAsync(t => t.OutletId == input.OutletId && t.Code == input.Code.Trim());
        if (existing)
            throw new UserFriendlyException(L("Terminal code \"{0}\" already exists in this outlet.", input.Code));

        var entity = new PosOutletTerminal
        {
            OutletId = input.OutletId,
            Code = input.Code.Trim(),
            Name = input.Name.Trim(),
            IsActive = input.IsActive
        };
        await terminalRepository.InsertAsync(entity);
        return entity.Id;
    }

    public async Task UpdateTerminalAsync(Guid id, UpdatePosTerminalDto input)
    {
        var entity = await terminalRepository.GetAsync(id);
        var existing = await terminalRepository.GetAll()
            .AnyAsync(t => t.OutletId == entity.OutletId && t.Code == input.Code.Trim() && t.Id != id);
        if (existing)
            throw new UserFriendlyException(L("Terminal code \"{0}\" already exists in this outlet.", input.Code));

        entity.Code = input.Code.Trim();
        entity.Name = input.Name.Trim();
        entity.IsActive = input.IsActive;
        await terminalRepository.UpdateAsync(entity);
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

    public async Task<Guid> CreateTableAsync(CreatePosTableDto input)
    {
        var outlet = await outletRepository.GetAsync(input.OutletId);
        var existing = await tableRepository.GetAll()
            .AnyAsync(t => t.OutletId == input.OutletId && t.TableNumber == input.TableNumber.Trim());
        if (existing)
            throw new UserFriendlyException(L("Table number \"{0}\" already exists in this outlet.", input.TableNumber));

        var entity = new PosTable
        {
            OutletId = input.OutletId,
            TableNumber = input.TableNumber.Trim(),
            Capacity = input.Capacity
        };
        await tableRepository.InsertAsync(entity);
        return entity.Id;
    }

    public async Task UpdateTableAsync(Guid id, UpdatePosTableDto input)
    {
        var entity = await tableRepository.GetAsync(id);
        var existing = await tableRepository.GetAll()
            .AnyAsync(t => t.OutletId == entity.OutletId && t.TableNumber == input.TableNumber.Trim() && t.Id != id);
        if (existing)
            throw new UserFriendlyException(L("Table number \"{0}\" already exists in this outlet.", input.TableNumber));

        entity.TableNumber = input.TableNumber.Trim();
        entity.Capacity = input.Capacity;
        await tableRepository.UpdateAsync(entity);
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

    public async Task<MenuCategoryListDto> GetMenuCategoryAsync(Guid id)
    {
        var entity = await menuCategoryRepository.GetAsync(id);
        return new MenuCategoryListDto
        {
            Id = entity.Id,
            Name = entity.Name,
            DisplayOrder = entity.DisplayOrder
        };
    }

    public async Task<Guid> CreateMenuCategoryAsync(CreateMenuCategoryDto input)
    {
        var entity = new MenuCategory
        {
            Name = input.Name.Trim(),
            DisplayOrder = input.DisplayOrder
        };
        await menuCategoryRepository.InsertAsync(entity);
        return entity.Id;
    }

    public async Task UpdateMenuCategoryAsync(Guid id, UpdateMenuCategoryDto input)
    {
        var entity = await menuCategoryRepository.GetAsync(id);
        entity.Name = input.Name.Trim();
        entity.DisplayOrder = input.DisplayOrder;
        await menuCategoryRepository.UpdateAsync(entity);
    }

    public async Task<List<OptionGroupListDto>> GetOptionGroupsAsync()
    {
        var list = await optionGroupRepository.GetAll()
            .OrderBy(g => g.DisplayOrder).ThenBy(g => g.Name)
            .Select(g => new OptionGroupListDto
            {
                Id = g.Id,
                Name = g.Name,
                DisplayOrder = g.DisplayOrder,
                MinSelections = g.MinSelections,
                MaxSelections = g.MaxSelections,
                OptionCount = g.Options.Count
            })
            .ToListAsync();
        return list;
    }

    public async Task<OptionGroupDto> GetOptionGroupAsync(Guid id)
    {
        var entity = await optionGroupRepository.GetAll()
            .Include(g => g.Options.OrderBy(o => o.DisplayOrder).ThenBy(o => o.Name))
            .FirstOrDefaultAsync(g => g.Id == id);
        if (entity == null)
            throw new UserFriendlyException(L("Option group not found."));
        return new OptionGroupDto
        {
            Id = entity.Id,
            Name = entity.Name,
            DisplayOrder = entity.DisplayOrder,
            MinSelections = entity.MinSelections,
            MaxSelections = entity.MaxSelections,
            Options = entity.Options.Select(o => new OptionDto
            {
                Id = o.Id,
                Name = o.Name,
                BasePriceAdjustment = o.PriceAdjustment,
                PriceAdjustment = o.PriceAdjustment,
                DisplayOrder = o.DisplayOrder,
                IsDefault = o.IsDefault
            }).ToList()
        };
    }

    public async Task<Guid> CreateOptionGroupAsync(CreateOptionGroupDto input)
    {
        var entity = new OptionGroup
        {
            Name = input.Name.Trim(),
            DisplayOrder = input.DisplayOrder,
            MinSelections = input.MinSelections,
            MaxSelections = input.MaxSelections
        };
        await optionGroupRepository.InsertAsync(entity);
        var optionsList = input.Options ?? [];
        NormalizeDefaultOption(optionsList);
        foreach (var opt in optionsList)
        {
            await optionRepository.InsertAsync(new Option
            {
                OptionGroupId = entity.Id,
                Name = opt.Name.Trim(),
                PriceAdjustment = opt.PriceAdjustment,
                DisplayOrder = opt.DisplayOrder,
                IsDefault = opt.IsDefault
            });
        }
        return entity.Id;
    }

    public async Task UpdateOptionGroupAsync(Guid id, UpdateOptionGroupDto input)
    {
        var entity = await optionGroupRepository.GetAll()
            .Include(g => g.Options)
            .FirstOrDefaultAsync(g => g.Id == id);
        if (entity == null)
            throw new UserFriendlyException(L("Option group not found."));
        entity.Name = input.Name.Trim();
        entity.DisplayOrder = input.DisplayOrder;
        entity.MinSelections = input.MinSelections;
        entity.MaxSelections = input.MaxSelections;
        await optionGroupRepository.UpdateAsync(entity);
        foreach (var existingOpt in entity.Options)
            await optionRepository.DeleteAsync(existingOpt);
        var optionsList = input.Options ?? [];
        NormalizeDefaultOption(optionsList);
        foreach (var opt in optionsList)
        {
            await optionRepository.InsertAsync(new Option
            {
                OptionGroupId = entity.Id,
                Name = opt.Name.Trim(),
                PriceAdjustment = opt.PriceAdjustment,
                DisplayOrder = opt.DisplayOrder,
                IsDefault = opt.IsDefault
            });
        }
    }

    /// <summary>Ensure at most one option per group has IsDefault true. First one wins.</summary>
    private static void NormalizeDefaultOption(List<OptionInputDto> options)
    {
        var firstDefaultIndex = options.FindIndex(o => o.IsDefault);
        for (var i = 0; i < options.Count; i++)
            options[i].IsDefault = i == (firstDefaultIndex >= 0 ? firstDefaultIndex : 0);
    }

    public async Task DeleteOptionGroupAsync(Guid id)
    {
        var entity = await optionGroupRepository.GetAll()
            .Include(g => g.Options)
            .Include(g => g.MenuItemOptionGroups)
            .FirstOrDefaultAsync(g => g.Id == id);
        if (entity == null)
            throw new UserFriendlyException(L("Option group not found."));
        var assignedCount = await menuItemOptionGroupRepository.CountAsync(m => m.OptionGroupId == id);
        if (assignedCount > 0)
            throw new UserFriendlyException(L("Cannot delete option group that is assigned to one or more menu items. Remove the assignment first."));
        foreach (var opt in entity.Options)
            await optionRepository.DeleteAsync(opt);
        await optionGroupRepository.DeleteAsync(entity);
    }
}
