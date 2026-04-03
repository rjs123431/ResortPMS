using Abp.Application.Services;
using Abp.Application.Services.Dto;
using Abp.Authorization;
using Abp.Domain.Repositories;
using Abp.Domain.Uow;
using Abp.Linq.Extensions;
using Microsoft.EntityFrameworkCore;
using PMS.App.ConferenceCompanies.Dto;
using PMS.Authorization;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Dynamic.Core;
using System.Threading.Tasks;

namespace PMS.App.ConferenceCompanies;

public interface IConferenceCompanyAppService : IApplicationService
{
    Task<ConferenceCompanyDto> GetAsync(Guid id);
    Task<PagedResultDto<ConferenceCompanyListDto>> GetAllAsync(GetConferenceCompaniesInput input);
    Task<ListResultDto<ConferenceCompanyListDto>> GetAllActiveAsync();
    Task<Guid> CreateAsync(CreateConferenceCompanyDto input);
    Task UpdateAsync(UpdateConferenceCompanyDto input);
}

[AbpAuthorize(PermissionNames.Pages_ConferenceCompanies)]
public class ConferenceCompanyAppService(IRepository<ConferenceCompany, Guid> conferenceCompanyRepository) : PMSAppServiceBase, IConferenceCompanyAppService
{
    public async Task<ConferenceCompanyDto> GetAsync(Guid id)
    {
        var company = await conferenceCompanyRepository.GetAsync(id);
        return ObjectMapper.Map<ConferenceCompanyDto>(company);
    }

    public async Task<PagedResultDto<ConferenceCompanyListDto>> GetAllAsync(GetConferenceCompaniesInput input)
    {
        var query = conferenceCompanyRepository.GetAll()
            .WhereIf(!string.IsNullOrWhiteSpace(input.Filter), x =>
                x.Name.Contains(input.Filter) ||
                x.ContactPerson.Contains(input.Filter) ||
                x.Phone.Contains(input.Filter) ||
                x.Email.Contains(input.Filter));

        var totalCount = await query.CountAsync();
        var items = await query.OrderBy(input.Sorting).PageBy(input).ToListAsync();

        return new PagedResultDto<ConferenceCompanyListDto>(
            totalCount,
            ObjectMapper.Map<List<ConferenceCompanyListDto>>(items));
    }

    public async Task<ListResultDto<ConferenceCompanyListDto>> GetAllActiveAsync()
    {
        var items = await conferenceCompanyRepository.GetAll()
            .Where(x => x.IsActive)
            .OrderBy(x => x.Name)
            .ToListAsync();

        return new ListResultDto<ConferenceCompanyListDto>(ObjectMapper.Map<List<ConferenceCompanyListDto>>(items));
    }

    [AbpAuthorize(PermissionNames.Pages_ConferenceCompanies_Create)]
    [UnitOfWork]
    public async Task<Guid> CreateAsync(CreateConferenceCompanyDto input)
    {
        var company = ObjectMapper.Map<ConferenceCompany>(input);
        company.Id = Guid.NewGuid();
        company.Name = (input.Name ?? string.Empty).Trim();
        company.ContactPerson = (input.ContactPerson ?? string.Empty).Trim();
        company.Phone = (input.Phone ?? string.Empty).Trim();
        company.Email = (input.Email ?? string.Empty).Trim();
        company.Notes = input.Notes ?? string.Empty;

        await conferenceCompanyRepository.InsertAsync(company);
        await CurrentUnitOfWork.SaveChangesAsync();
        return company.Id;
    }

    [AbpAuthorize(PermissionNames.Pages_ConferenceCompanies_Edit)]
    [UnitOfWork]
    public async Task UpdateAsync(UpdateConferenceCompanyDto input)
    {
        var company = await conferenceCompanyRepository.GetAsync(input.Id);
        company.Name = (input.Name ?? string.Empty).Trim();
        company.ContactPerson = (input.ContactPerson ?? string.Empty).Trim();
        company.Phone = (input.Phone ?? string.Empty).Trim();
        company.Email = (input.Email ?? string.Empty).Trim();
        company.Notes = input.Notes ?? string.Empty;
        company.IsActive = input.IsActive;

        await CurrentUnitOfWork.SaveChangesAsync();
    }
}