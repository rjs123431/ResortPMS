using Abp.Application.Services;
using Abp.Application.Services.Dto;
using Abp.Authorization;
using Abp.Domain.Repositories;
using Abp.Domain.Uow;
using Abp.Linq.Extensions;
using Microsoft.EntityFrameworkCore;
using PMS.App.ConferenceExtras.Dto;
using PMS.Authorization;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Dynamic.Core;
using System.Threading.Tasks;

namespace PMS.App.ConferenceExtras;

public interface IConferenceExtraAppService : IApplicationService
{
    Task<ConferenceExtraDto> GetAsync(Guid id);
    Task<PagedResultDto<ConferenceExtraListDto>> GetAllAsync(GetConferenceExtrasInput input);
    Task<ListResultDto<ConferenceExtraDto>> GetAllActiveAsync();
    Task<Guid> CreateAsync(CreateConferenceExtraDto input);
    Task UpdateAsync(UpdateConferenceExtraDto input);
}

[AbpAuthorize]
public class ConferenceExtraAppService(IRepository<ConferenceExtra, Guid> conferenceExtraRepository) : PMSAppServiceBase, IConferenceExtraAppService
{
    public async Task<ConferenceExtraDto> GetAsync(Guid id)
    {
        var item = await conferenceExtraRepository.GetAsync(id);
        return ObjectMapper.Map<ConferenceExtraDto>(item);
    }

    public async Task<PagedResultDto<ConferenceExtraListDto>> GetAllAsync(GetConferenceExtrasInput input)
    {
        var query = conferenceExtraRepository.GetAll()
            .WhereIf(!string.IsNullOrWhiteSpace(input.Filter), x =>
                x.Code.Contains(input.Filter) ||
                x.Name.Contains(input.Filter) ||
                x.Category.Contains(input.Filter) ||
                x.UnitLabel.Contains(input.Filter));

        var totalCount = await query.CountAsync();
        var items = await query
            .OrderBy(input.Sorting)
            .PageBy(input)
            .ToListAsync();

        return new PagedResultDto<ConferenceExtraListDto>(
            totalCount,
            ObjectMapper.Map<List<ConferenceExtraListDto>>(items));
    }

    public async Task<ListResultDto<ConferenceExtraDto>> GetAllActiveAsync()
    {
        var items = await conferenceExtraRepository.GetAll()
            .Where(x => x.IsActive)
            .OrderBy(x => x.Category)
            .ThenBy(x => x.SortOrder)
            .ThenBy(x => x.Name)
            .ToListAsync();

        return new ListResultDto<ConferenceExtraDto>(ObjectMapper.Map<List<ConferenceExtraDto>>(items));
    }

    [UnitOfWork]
    public async Task<Guid> CreateAsync(CreateConferenceExtraDto input)
    {
        var normalizedCode = NormalizeCode(input.Code);
        if (await conferenceExtraRepository.GetAll().AnyAsync(x => x.Code == normalizedCode))
            throw new Abp.UI.UserFriendlyException("Add-on service code already exists.");

        var extra = ObjectMapper.Map<ConferenceExtra>(input);
        extra.Id = Guid.NewGuid();
        ApplyNormalizedValues(extra, normalizedCode, input.Name, input.Category, input.UnitLabel);

        await conferenceExtraRepository.InsertAsync(extra);
        await CurrentUnitOfWork.SaveChangesAsync();
        return extra.Id;
    }

    [UnitOfWork]
    public async Task UpdateAsync(UpdateConferenceExtraDto input)
    {
        var extra = await conferenceExtraRepository.GetAsync(input.Id);
        var normalizedCode = NormalizeCode(input.Code);

        if (await conferenceExtraRepository.GetAll().AnyAsync(x => x.Id != input.Id && x.Code == normalizedCode))
            throw new Abp.UI.UserFriendlyException("Add-on service code already exists.");

        ObjectMapper.Map(input, extra);
        ApplyNormalizedValues(extra, normalizedCode, input.Name, input.Category, input.UnitLabel);
        await CurrentUnitOfWork.SaveChangesAsync();
    }

    private static string NormalizeCode(string value)
    {
        return (value ?? string.Empty).Trim().ToUpperInvariant();
    }

    private static void ApplyNormalizedValues(ConferenceExtra extra, string code, string name, string category, string unitLabel)
    {
        extra.Code = code;
        extra.Name = (name ?? string.Empty).Trim();
        extra.Category = (category ?? string.Empty).Trim();
        extra.UnitLabel = (unitLabel ?? string.Empty).Trim();
    }
}