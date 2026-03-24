using Abp.Application.Services;
using System;
using Abp.Application.Services.Dto;
using Abp.Authorization;
using Abp.Domain.Repositories;
using Abp.Linq.Extensions;
using Abp.UI;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using PMS.App.Lookups.Dto;
using PMS.Authorization;
using System.Linq;
using System.Linq.Dynamic.Core;
using System.Threading.Tasks;

namespace PMS.App.Lookups;

internal static class LookupCacheKeys
{
    public const string ChargeTypesActive = "lookup:charge-types:active";
    public const string PaymentMethodsActive = "lookup:payment-methods:active";
    public const string ChannelsActive = "lookup:channels:active";
    public const string AgenciesActive = "lookup:agencies:active";
    public const string ExtraBedTypesActive = "lookup:extra-bed-types:active";
    public const string StaffActive = "lookup:staff:active";
}

public interface IChargeTypeAppService : IApplicationService
{
    Task<ChargeTypeDto> GetAsync(Guid id);
    Task<PagedResultDto<ChargeTypeListDto>> GetAllAsync(GetChargeTypesInput input);
    Task<System.Collections.Generic.List<ChargeTypeListDto>> GetAllActiveAsync();
    Task<Guid> CreateAsync(CreateChargeTypeDto input);
    Task UpdateAsync(ChargeTypeDto input);
}

public interface IPaymentMethodAppService : IApplicationService
{
    Task<PaymentMethodDto> GetAsync(Guid id);
    Task<PagedResultDto<PaymentMethodListDto>> GetAllAsync(GetPaymentMethodsInput input);
    Task<System.Collections.Generic.List<PaymentMethodListDto>> GetAllActiveAsync();
    Task<Guid> CreateAsync(CreatePaymentMethodDto input);
    Task UpdateAsync(PaymentMethodDto input);
}

public interface IChannelAppService : IApplicationService
{
    Task<ChannelDto> GetAsync(Guid id);
    Task<PagedResultDto<ChannelListDto>> GetAllAsync(GetChannelsInput input);
    Task<System.Collections.Generic.List<ChannelListDto>> GetAllActiveAsync();
    Task<Guid> CreateAsync(CreateChannelDto input);
    Task UpdateAsync(ChannelDto input);
}

public interface IAgencyAppService : IApplicationService
{
    Task<AgencyDto> GetAsync(Guid id);
    Task<PagedResultDto<AgencyListDto>> GetAllAsync(GetAgenciesInput input);
    Task<System.Collections.Generic.List<AgencyListDto>> GetAllActiveAsync();
    Task<Guid> CreateAsync(CreateAgencyDto input);
    Task UpdateAsync(AgencyDto input);
}

public interface IExtraBedTypeAppService : IApplicationService
{
    Task<ExtraBedTypeDto> GetAsync(Guid id);
    Task<PagedResultDto<ExtraBedTypeListDto>> GetAllAsync(GetExtraBedTypesInput input);
    Task<System.Collections.Generic.List<ExtraBedTypeListDto>> GetAllActiveAsync();
    Task<Guid> CreateAsync(CreateExtraBedTypeDto input);
    Task UpdateAsync(ExtraBedTypeDto input);
}

public interface IStaffAppService : IApplicationService
{
    Task<StaffDto> GetAsync(Guid id);
    Task<PagedResultDto<StaffListDto>> GetAllAsync(GetStaffInput input);
    Task<System.Collections.Generic.List<StaffListDto>> GetAllActiveAsync();
    Task<Guid> CreateAsync(CreateStaffDto input);
    Task UpdateAsync(StaffDto input);
}

[AbpAuthorize(PermissionNames.Pages_ChargeTypes)]
public class ChargeTypeAppService(
    IRepository<ChargeType, Guid> chargeTypeRepository,
    IMemoryCache memoryCache
) : PMSAppServiceBase, IChargeTypeAppService
{
    public async Task<ChargeTypeDto> GetAsync(Guid id)
    {
        var entity = await chargeTypeRepository.GetAsync(id);
        return ObjectMapper.Map<ChargeTypeDto>(entity);
    }

    public async Task<PagedResultDto<ChargeTypeListDto>> GetAllAsync(GetChargeTypesInput input)
    {
        var query = chargeTypeRepository.GetAll()
            .WhereIf(!string.IsNullOrWhiteSpace(input.Filter), x => x.Name.Contains(input.Filter))
            .WhereIf(input.IsActive.HasValue, x => x.IsActive == input.IsActive);

        var total = await query.CountAsync();
        var items = await query.OrderBy(input.Sorting ?? "Sort asc, Name asc").PageBy(input).ToListAsync();
        return new PagedResultDto<ChargeTypeListDto>(total, ObjectMapper.Map<System.Collections.Generic.List<ChargeTypeListDto>>(items));
    }

    public async Task<System.Collections.Generic.List<ChargeTypeListDto>> GetAllActiveAsync()
    {
        return await memoryCache.GetOrCreateAsync(LookupCacheKeys.ChargeTypesActive, async entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(5);
            var items = await chargeTypeRepository.GetAll().Where(x => x.IsActive).OrderBy(x => x.Sort).ThenBy(x => x.Name).ToListAsync();
            return ObjectMapper.Map<System.Collections.Generic.List<ChargeTypeListDto>>(items);
        });
    }

    [AbpAuthorize(PermissionNames.Pages_ChargeTypes_Create)]
    public async Task<Guid> CreateAsync(CreateChargeTypeDto input)
    {
        var name = input.Name?.Trim() ?? string.Empty;
        var category = input.Category?.Trim() ?? string.Empty;

        if (string.IsNullOrWhiteSpace(name))
        {
            throw new UserFriendlyException("Charge type name is required.");
        }

        if (string.IsNullOrWhiteSpace(category))
        {
            throw new UserFriendlyException("Category is required.");
        }

        var exists = await chargeTypeRepository.GetAll().AnyAsync(x => x.Name == name);
        if (exists) throw new UserFriendlyException(L("ChargeTypeNameAlreadyExists"));

        if (input.RoomChargeType != RoomChargeType.None)
        {
            var duplicateRoomChargeType = await chargeTypeRepository.GetAll()
                .AnyAsync(x => x.RoomChargeType == input.RoomChargeType);

            if (duplicateRoomChargeType)
            {
                throw new UserFriendlyException("Only one charge type can use the selected RoomChargeType.");
            }
        }

        var entity = ObjectMapper.Map<ChargeType>(input);
        entity.Name = name;
        entity.Category = category;
        entity.IsActive = true;

        var id = await chargeTypeRepository.InsertAndGetIdAsync(entity);
        memoryCache.Remove(LookupCacheKeys.ChargeTypesActive);
        return id;
    }

    [AbpAuthorize(PermissionNames.Pages_ChargeTypes_Edit)]
    public async Task UpdateAsync(ChargeTypeDto input)
    {
        var entity = await chargeTypeRepository.GetAsync(input.Id);
        var name = input.Name?.Trim() ?? string.Empty;
        var category = input.Category?.Trim() ?? string.Empty;

        if (string.IsNullOrWhiteSpace(name))
        {
            throw new UserFriendlyException("Charge type name is required.");
        }

        if (string.IsNullOrWhiteSpace(category))
        {
            throw new UserFriendlyException("Category is required.");
        }

        if (input.RoomChargeType != RoomChargeType.None)
        {
            var duplicateRoomChargeType = await chargeTypeRepository.GetAll()
                .AnyAsync(x => x.Id != input.Id && x.RoomChargeType == input.RoomChargeType);

            if (duplicateRoomChargeType)
            {
                throw new UserFriendlyException("Only one charge type can use the selected RoomChargeType.");
            }
        }

        ObjectMapper.Map(input, entity);
        entity.Name = name;
        entity.Category = category;
        await chargeTypeRepository.UpdateAsync(entity);
        memoryCache.Remove(LookupCacheKeys.ChargeTypesActive);
    }
}

[AbpAuthorize(PermissionNames.Pages_PaymentMethods)]
public class PaymentMethodAppService(
    IRepository<PaymentMethod, Guid> paymentMethodRepository,
    IMemoryCache memoryCache
) : PMSAppServiceBase, IPaymentMethodAppService
{
    public async Task<PaymentMethodDto> GetAsync(Guid id)
    {
        var entity = await paymentMethodRepository.GetAsync(id);
        return ObjectMapper.Map<PaymentMethodDto>(entity);
    }

    public async Task<PagedResultDto<PaymentMethodListDto>> GetAllAsync(GetPaymentMethodsInput input)
    {
        var query = paymentMethodRepository.GetAll()
            .WhereIf(!string.IsNullOrWhiteSpace(input.Filter), x => x.Name.Contains(input.Filter))
            .WhereIf(input.IsActive.HasValue, x => x.IsActive == input.IsActive);

        var total = await query.CountAsync();
        var items = await query.OrderBy(input.Sorting ?? "Name").PageBy(input).ToListAsync();
        return new PagedResultDto<PaymentMethodListDto>(total, ObjectMapper.Map<System.Collections.Generic.List<PaymentMethodListDto>>(items));
    }

    public async Task<System.Collections.Generic.List<PaymentMethodListDto>> GetAllActiveAsync()
    {
        return await memoryCache.GetOrCreateAsync(LookupCacheKeys.PaymentMethodsActive, async entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(5);
            var items = await paymentMethodRepository.GetAll().Where(x => x.IsActive).OrderBy(x => x.Name).ToListAsync();
            return ObjectMapper.Map<System.Collections.Generic.List<PaymentMethodListDto>>(items);
        });
    }

    [AbpAuthorize(PermissionNames.Pages_PaymentMethods_Create)]
    public async Task<Guid> CreateAsync(CreatePaymentMethodDto input)
    {
        var exists = await paymentMethodRepository.GetAll().AnyAsync(x => x.Name == input.Name.Trim());
        if (exists) throw new UserFriendlyException(L("PaymentMethodNameAlreadyExists"));

        var entity = ObjectMapper.Map<PaymentMethod>(input);
        entity.Name = input.Name.Trim();
        entity.IsActive = true;

        var id = await paymentMethodRepository.InsertAndGetIdAsync(entity);
        memoryCache.Remove(LookupCacheKeys.PaymentMethodsActive);
        return id;
    }

    [AbpAuthorize(PermissionNames.Pages_PaymentMethods_Edit)]
    public async Task UpdateAsync(PaymentMethodDto input)
    {
        var entity = await paymentMethodRepository.GetAsync(input.Id);
        ObjectMapper.Map(input, entity);
        entity.Name = input.Name.Trim();
        await paymentMethodRepository.UpdateAsync(entity);
        memoryCache.Remove(LookupCacheKeys.PaymentMethodsActive);
    }
}

[AbpAuthorize(PermissionNames.Pages_Channels)]
public class ChannelAppService(
    IRepository<Channel, Guid> channelRepository,
    IMemoryCache memoryCache
) : PMSAppServiceBase, IChannelAppService
{
    public async Task<ChannelDto> GetAsync(Guid id)
    {
        var entity = await channelRepository.GetAsync(id);
        return ObjectMapper.Map<ChannelDto>(entity);
    }

    public async Task<PagedResultDto<ChannelListDto>> GetAllAsync(GetChannelsInput input)
    {
        var query = channelRepository.GetAll()
            .WhereIf(!string.IsNullOrWhiteSpace(input.Filter), x => x.Name.Contains(input.Filter))
            .WhereIf(input.IsActive.HasValue, x => x.IsActive == input.IsActive);

        var total = await query.CountAsync();
        var items = await query.OrderBy(input.Sorting ?? "Sort asc, Name asc").PageBy(input).ToListAsync();
        return new PagedResultDto<ChannelListDto>(total, ObjectMapper.Map<System.Collections.Generic.List<ChannelListDto>>(items));
    }

    public async Task<System.Collections.Generic.List<ChannelListDto>> GetAllActiveAsync()
    {
        return await memoryCache.GetOrCreateAsync(LookupCacheKeys.ChannelsActive, async entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(5);
            var items = await channelRepository.GetAll().Where(x => x.IsActive).OrderBy(x => x.Sort).ThenBy(x => x.Name).ToListAsync();
            return ObjectMapper.Map<System.Collections.Generic.List<ChannelListDto>>(items);
        });
    }

    [AbpAuthorize(PermissionNames.Pages_Channels_Create)]
    public async Task<Guid> CreateAsync(CreateChannelDto input)
    {
        var name = input.Name?.Trim() ?? string.Empty;
        var icon = input.Icon?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(name)) throw new UserFriendlyException("Channel name is required.");

        var exists = await channelRepository.GetAll().AnyAsync(x => x.Name == name);
        if (exists) throw new UserFriendlyException("Channel name already exists.");

        var entity = ObjectMapper.Map<Channel>(input);
        entity.Name = name;
        entity.Icon = icon;
        entity.Sort = input.Sort;
        entity.IsActive = true;

        var id = await channelRepository.InsertAndGetIdAsync(entity);
        memoryCache.Remove(LookupCacheKeys.ChannelsActive);
        return id;
    }

    [AbpAuthorize(PermissionNames.Pages_Channels_Edit)]
    public async Task UpdateAsync(ChannelDto input)
    {
        var entity = await channelRepository.GetAsync(input.Id);
        var name = input.Name?.Trim() ?? string.Empty;
        var icon = input.Icon?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(name)) throw new UserFriendlyException("Channel name is required.");

        var duplicate = await channelRepository.GetAll().AnyAsync(x => x.Id != input.Id && x.Name == name);
        if (duplicate) throw new UserFriendlyException("Channel name already exists.");

        ObjectMapper.Map(input, entity);
        entity.Name = name;
        entity.Icon = icon;
        entity.Sort = input.Sort;
        await channelRepository.UpdateAsync(entity);
        memoryCache.Remove(LookupCacheKeys.ChannelsActive);
    }
}

[AbpAuthorize(PermissionNames.Pages_Agencies)]
public class AgencyAppService(
    IRepository<Agency, Guid> agencyRepository,
    IMemoryCache memoryCache
) : PMSAppServiceBase, IAgencyAppService
{
    public async Task<AgencyDto> GetAsync(Guid id)
    {
        var entity = await agencyRepository.GetAsync(id);
        return ObjectMapper.Map<AgencyDto>(entity);
    }

    public async Task<PagedResultDto<AgencyListDto>> GetAllAsync(GetAgenciesInput input)
    {
        var query = agencyRepository.GetAll()
            .WhereIf(!string.IsNullOrWhiteSpace(input.Filter), x => x.Name.Contains(input.Filter))
            .WhereIf(input.IsActive.HasValue, x => x.IsActive == input.IsActive);

        var total = await query.CountAsync();
        var items = await query.OrderBy(input.Sorting ?? "Name").PageBy(input).ToListAsync();
        return new PagedResultDto<AgencyListDto>(total, ObjectMapper.Map<System.Collections.Generic.List<AgencyListDto>>(items));
    }

    public async Task<System.Collections.Generic.List<AgencyListDto>> GetAllActiveAsync()
    {
        return await memoryCache.GetOrCreateAsync(LookupCacheKeys.AgenciesActive, async entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(5);
            var items = await agencyRepository.GetAll().Where(x => x.IsActive).OrderBy(x => x.Name).ToListAsync();
            return ObjectMapper.Map<System.Collections.Generic.List<AgencyListDto>>(items);
        });
    }

    [AbpAuthorize(PermissionNames.Pages_Agencies_Create)]
    public async Task<Guid> CreateAsync(CreateAgencyDto input)
    {
        var name = input.Name?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(name)) throw new UserFriendlyException("Agency name is required.");

        var exists = await agencyRepository.GetAll().AnyAsync(x => x.Name == name);
        if (exists) throw new UserFriendlyException("Agency name already exists.");

        var entity = ObjectMapper.Map<Agency>(input);
        entity.Name = name;
        entity.IsActive = true;

        var id = await agencyRepository.InsertAndGetIdAsync(entity);
        memoryCache.Remove(LookupCacheKeys.AgenciesActive);
        return id;
    }

    [AbpAuthorize(PermissionNames.Pages_Agencies_Edit)]
    public async Task UpdateAsync(AgencyDto input)
    {
        var entity = await agencyRepository.GetAsync(input.Id);
        var name = input.Name?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(name)) throw new UserFriendlyException("Agency name is required.");

        var duplicate = await agencyRepository.GetAll().AnyAsync(x => x.Id != input.Id && x.Name == name);
        if (duplicate) throw new UserFriendlyException("Agency name already exists.");

        ObjectMapper.Map(input, entity);
        entity.Name = name;
        await agencyRepository.UpdateAsync(entity);
        memoryCache.Remove(LookupCacheKeys.AgenciesActive);
    }
}

[AbpAuthorize(PermissionNames.Pages_ExtraBedTypes)]
public class ExtraBedTypeAppService(
    IRepository<ExtraBedType, Guid> extraBedTypeRepository,
    IMemoryCache memoryCache
) : PMSAppServiceBase, IExtraBedTypeAppService
{
    public async Task<ExtraBedTypeDto> GetAsync(Guid id)
    {
        var entity = await extraBedTypeRepository.GetAsync(id);
        return ObjectMapper.Map<ExtraBedTypeDto>(entity);
    }

    public async Task<PagedResultDto<ExtraBedTypeListDto>> GetAllAsync(GetExtraBedTypesInput input)
    {
        var query = extraBedTypeRepository.GetAll()
            .WhereIf(!string.IsNullOrWhiteSpace(input.Filter), x => x.Name.Contains(input.Filter))
            .WhereIf(input.IsActive.HasValue, x => x.IsActive == input.IsActive);

        var total = await query.CountAsync();
        var items = await query.OrderBy(input.Sorting ?? "Name").PageBy(input).ToListAsync();
        return new PagedResultDto<ExtraBedTypeListDto>(total, ObjectMapper.Map<System.Collections.Generic.List<ExtraBedTypeListDto>>(items));
    }

    public async Task<System.Collections.Generic.List<ExtraBedTypeListDto>> GetAllActiveAsync()
    {
        return await memoryCache.GetOrCreateAsync(LookupCacheKeys.ExtraBedTypesActive, async entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(5);
            var items = await extraBedTypeRepository.GetAll().Where(x => x.IsActive).OrderBy(x => x.Name).ToListAsync();
            return ObjectMapper.Map<System.Collections.Generic.List<ExtraBedTypeListDto>>(items);
        });
    }

    [AbpAuthorize(PermissionNames.Pages_ExtraBedTypes_Create)]
    public async Task<Guid> CreateAsync(CreateExtraBedTypeDto input)
    {
        var exists = await extraBedTypeRepository.GetAll().AnyAsync(x => x.Name == input.Name.Trim());
        if (exists) throw new UserFriendlyException(L("ExtraBedTypeNameAlreadyExists"));

        var entity = ObjectMapper.Map<ExtraBedType>(input);
        entity.Name = input.Name.Trim();
        entity.IsActive = true;

        var id = await extraBedTypeRepository.InsertAndGetIdAsync(entity);
        memoryCache.Remove(LookupCacheKeys.ExtraBedTypesActive);
        return id;
    }

    [AbpAuthorize(PermissionNames.Pages_ExtraBedTypes_Edit)]
    public async Task UpdateAsync(ExtraBedTypeDto input)
    {
        var entity = await extraBedTypeRepository.GetAsync(input.Id);
        ObjectMapper.Map(input, entity);
        entity.Name = input.Name.Trim();
        await extraBedTypeRepository.UpdateAsync(entity);
        memoryCache.Remove(LookupCacheKeys.ExtraBedTypesActive);
    }
}

[AbpAuthorize(PermissionNames.Pages_Staff)]
public class StaffAppService(
    IRepository<Staff, Guid> staffRepository,
    IMemoryCache memoryCache
) : PMSAppServiceBase, IStaffAppService
{
    public async Task<StaffDto> GetAsync(Guid id)
    {
        var entity = await staffRepository.GetAsync(id);
        return ObjectMapper.Map<StaffDto>(entity);
    }

    public async Task<PagedResultDto<StaffListDto>> GetAllAsync(GetStaffInput input)
    {
        var query = staffRepository.GetAll()
            .WhereIf(!string.IsNullOrWhiteSpace(input.Filter), x => x.StaffCode.Contains(input.Filter) || x.FullName.Contains(input.Filter))
            .WhereIf(input.IsActive.HasValue, x => x.IsActive == input.IsActive);

        var total = await query.CountAsync();
        var items = await query.OrderBy(input.Sorting ?? "FullName").PageBy(input).ToListAsync();
        return new PagedResultDto<StaffListDto>(total, ObjectMapper.Map<System.Collections.Generic.List<StaffListDto>>(items));
    }

    public async Task<System.Collections.Generic.List<StaffListDto>> GetAllActiveAsync()
    {
        return await memoryCache.GetOrCreateAsync(LookupCacheKeys.StaffActive, async entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(5);
            var items = await staffRepository.GetAll().Where(x => x.IsActive).OrderBy(x => x.FullName).ToListAsync();
            return ObjectMapper.Map<System.Collections.Generic.List<StaffListDto>>(items);
        });
    }

    [AbpAuthorize(PermissionNames.Pages_Staff_Create)]
    public async Task<Guid> CreateAsync(CreateStaffDto input)
    {
        var code = input.StaffCode?.Trim().ToUpper() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(code)) throw new UserFriendlyException("Staff code is required.");

        var exists = await staffRepository.GetAll().AnyAsync(x => x.StaffCode == code);
        if (exists) throw new UserFriendlyException("Staff code already exists.");

        var entity = ObjectMapper.Map<Staff>(input);
        entity.StaffCode = code;
        entity.FullName = input.FullName?.Trim() ?? string.Empty;
        entity.Department = input.Department?.Trim() ?? string.Empty;
        entity.Position = input.Position?.Trim() ?? string.Empty;
        entity.PhoneNumber = input.PhoneNumber?.Trim() ?? string.Empty;
        entity.IsActive = true;

        var id = await staffRepository.InsertAndGetIdAsync(entity);
        memoryCache.Remove(LookupCacheKeys.StaffActive);
        return id;
    }

    [AbpAuthorize(PermissionNames.Pages_Staff_Edit)]
    public async Task UpdateAsync(StaffDto input)
    {
        var entity = await staffRepository.GetAsync(input.Id);
        var code = input.StaffCode?.Trim().ToUpper() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(code)) throw new UserFriendlyException("Staff code is required.");

        var duplicateCode = await staffRepository.GetAll().AnyAsync(x => x.Id != input.Id && x.StaffCode == code);
        if (duplicateCode) throw new UserFriendlyException("Staff code already exists.");

        ObjectMapper.Map(input, entity);
        entity.StaffCode = code;
        entity.FullName = input.FullName?.Trim() ?? string.Empty;
        entity.Department = input.Department?.Trim() ?? string.Empty;
        entity.Position = input.Position?.Trim() ?? string.Empty;
        entity.PhoneNumber = input.PhoneNumber?.Trim() ?? string.Empty;
        await staffRepository.UpdateAsync(entity);
        memoryCache.Remove(LookupCacheKeys.StaffActive);
    }
}
