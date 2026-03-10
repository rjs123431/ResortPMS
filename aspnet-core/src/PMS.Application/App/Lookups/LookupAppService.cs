using Abp.Application.Services;
using System;
using Abp.Application.Services.Dto;
using Abp.Authorization;
using Abp.Domain.Repositories;
using Abp.Linq.Extensions;
using Abp.UI;
using Microsoft.EntityFrameworkCore;
using PMS.App.Lookups.Dto;
using PMS.Authorization;
using System.Linq;
using System.Linq.Dynamic.Core;
using System.Threading.Tasks;

namespace PMS.App.Lookups;

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

public interface IExtraBedTypeAppService : IApplicationService
{
    Task<ExtraBedTypeDto> GetAsync(Guid id);
    Task<PagedResultDto<ExtraBedTypeListDto>> GetAllAsync(GetExtraBedTypesInput input);
    Task<System.Collections.Generic.List<ExtraBedTypeListDto>> GetAllActiveAsync();
    Task<Guid> CreateAsync(CreateExtraBedTypeDto input);
    Task UpdateAsync(ExtraBedTypeDto input);
}

[AbpAuthorize(PermissionNames.Pages_ChargeTypes)]
public class ChargeTypeAppService(
    IRepository<ChargeType, Guid> chargeTypeRepository
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
        var items = await chargeTypeRepository.GetAll().Where(x => x.IsActive).OrderBy(x => x.Sort).ThenBy(x => x.Name).ToListAsync();
        return ObjectMapper.Map<System.Collections.Generic.List<ChargeTypeListDto>>(items);
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

        return await chargeTypeRepository.InsertAndGetIdAsync(entity);
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
    }
}

[AbpAuthorize(PermissionNames.Pages_PaymentMethods)]
public class PaymentMethodAppService(
    IRepository<PaymentMethod, Guid> paymentMethodRepository
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
        var items = await paymentMethodRepository.GetAll().Where(x => x.IsActive).OrderBy(x => x.Name).ToListAsync();
        return ObjectMapper.Map<System.Collections.Generic.List<PaymentMethodListDto>>(items);
    }

    [AbpAuthorize(PermissionNames.Pages_PaymentMethods_Create)]
    public async Task<Guid> CreateAsync(CreatePaymentMethodDto input)
    {
        var exists = await paymentMethodRepository.GetAll().AnyAsync(x => x.Name == input.Name.Trim());
        if (exists) throw new UserFriendlyException(L("PaymentMethodNameAlreadyExists"));

        var entity = ObjectMapper.Map<PaymentMethod>(input);
        entity.Name = input.Name.Trim();
        entity.IsActive = true;

        return await paymentMethodRepository.InsertAndGetIdAsync(entity);
    }

    [AbpAuthorize(PermissionNames.Pages_PaymentMethods_Edit)]
    public async Task UpdateAsync(PaymentMethodDto input)
    {
        var entity = await paymentMethodRepository.GetAsync(input.Id);
        ObjectMapper.Map(input, entity);
        entity.Name = input.Name.Trim();
        await paymentMethodRepository.UpdateAsync(entity);
    }
}

[AbpAuthorize(PermissionNames.Pages_ExtraBedTypes)]
public class ExtraBedTypeAppService(
    IRepository<ExtraBedType, Guid> extraBedTypeRepository
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
        var items = await extraBedTypeRepository.GetAll().Where(x => x.IsActive).OrderBy(x => x.Name).ToListAsync();
        return ObjectMapper.Map<System.Collections.Generic.List<ExtraBedTypeListDto>>(items);
    }

    [AbpAuthorize(PermissionNames.Pages_ExtraBedTypes_Create)]
    public async Task<Guid> CreateAsync(CreateExtraBedTypeDto input)
    {
        var exists = await extraBedTypeRepository.GetAll().AnyAsync(x => x.Name == input.Name.Trim());
        if (exists) throw new UserFriendlyException(L("ExtraBedTypeNameAlreadyExists"));

        var entity = ObjectMapper.Map<ExtraBedType>(input);
        entity.Name = input.Name.Trim();
        entity.IsActive = true;

        return await extraBedTypeRepository.InsertAndGetIdAsync(entity);
    }

    [AbpAuthorize(PermissionNames.Pages_ExtraBedTypes_Edit)]
    public async Task UpdateAsync(ExtraBedTypeDto input)
    {
        var entity = await extraBedTypeRepository.GetAsync(input.Id);
        ObjectMapper.Map(input, entity);
        entity.Name = input.Name.Trim();
        await extraBedTypeRepository.UpdateAsync(entity);
    }
}
