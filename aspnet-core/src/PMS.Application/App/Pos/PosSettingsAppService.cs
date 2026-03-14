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

    Task<List<MenuItemListDto>> GetMenuItemsAsync(Guid? categoryId = null);
    Task<MenuItemListDto> GetMenuItemAsync(Guid id);
    Task<Guid> CreateMenuItemAsync(CreateMenuItemDto input);
    Task UpdateMenuItemAsync(Guid id, UpdateMenuItemDto input);
}

[AbpAuthorize(PermissionNames.Pages_POS)]
public class PosSettingsAppService(
    IRepository<PosOutlet, Guid> outletRepository,
    IRepository<PosOutletTerminal, Guid> terminalRepository,
    IRepository<PosTable, Guid> tableRepository,
    IRepository<MenuCategory, Guid> menuCategoryRepository,
    IRepository<MenuItem, Guid> menuItemRepository
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
            ChargeTypeId = entity.ChargeTypeId
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
            ChargeTypeId = input.ChargeTypeId
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
            .FirstOrDefaultAsync(m => m.Id == id);
        if (entity == null)
            throw new UserFriendlyException(L("MenuItem not found."));
        return new MenuItemListDto
        {
            Id = entity.Id,
            CategoryId = entity.CategoryId,
            CategoryName = entity.Category.Name,
            Name = entity.Name,
            Price = entity.Price,
            IsAvailable = entity.IsAvailable
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
    }
}
