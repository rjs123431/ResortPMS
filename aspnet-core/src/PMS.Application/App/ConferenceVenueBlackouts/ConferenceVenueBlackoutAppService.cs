using Abp.Application.Services;
using Abp.Application.Services.Dto;
using Abp.Authorization;
using Abp.Domain.Repositories;
using Abp.Domain.Uow;
using Abp.Linq.Extensions;
using Abp.UI;
using Microsoft.EntityFrameworkCore;
using PMS.App.ConferenceVenueBlackouts.Dto;
using PMS.Authorization;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Dynamic.Core;
using System.Threading.Tasks;

namespace PMS.App.ConferenceVenueBlackouts;

public interface IConferenceVenueBlackoutAppService : IApplicationService
{
    Task<ConferenceVenueBlackoutDto> GetAsync(Guid id);
    Task<PagedResultDto<ConferenceVenueBlackoutListDto>> GetAllAsync(GetConferenceVenueBlackoutsInput input);
    Task<Guid> CreateAsync(CreateConferenceVenueBlackoutDto input);
    Task UpdateAsync(UpdateConferenceVenueBlackoutDto input);
    Task DeleteAsync(Guid id);
}

[AbpAuthorize(PermissionNames.Pages_ConferenceVenues)]
public class ConferenceVenueBlackoutAppService(
    IRepository<ConferenceVenueBlackout, Guid> conferenceVenueBlackoutRepository,
    IRepository<ConferenceVenue, Guid> conferenceVenueRepository) : PMSAppServiceBase, IConferenceVenueBlackoutAppService
{
    public async Task<ConferenceVenueBlackoutDto> GetAsync(Guid id)
    {
        var blackout = await conferenceVenueBlackoutRepository.GetAll()
            .Include(x => x.Venue)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (blackout == null)
            throw new UserFriendlyException("Conference venue blackout not found.");

        return MapBlackout(blackout);
    }

    public async Task<PagedResultDto<ConferenceVenueBlackoutListDto>> GetAllAsync(GetConferenceVenueBlackoutsInput input)
    {
        var query = conferenceVenueBlackoutRepository.GetAll()
            .Include(x => x.Venue)
            .WhereIf(input.VenueId.HasValue, x => x.VenueId == input.VenueId.Value)
            .WhereIf(input.StartFrom.HasValue, x => x.EndDateTime > input.StartFrom.Value)
            .WhereIf(input.EndTo.HasValue, x => x.StartDateTime < input.EndTo.Value)
            .WhereIf(!string.IsNullOrWhiteSpace(input.Filter), x =>
                x.Title.Contains(input.Filter) ||
                x.Notes.Contains(input.Filter) ||
                x.Venue.Name.Contains(input.Filter));

        var totalCount = await query.CountAsync();
        var items = await query.OrderBy(input.Sorting).PageBy(input).ToListAsync();

        return new PagedResultDto<ConferenceVenueBlackoutListDto>(
            totalCount,
            items.Select(MapBlackoutList).ToList());
    }

    [AbpAuthorize(PermissionNames.Pages_ConferenceVenues_Edit)]
    [UnitOfWork]
    public async Task<Guid> CreateAsync(CreateConferenceVenueBlackoutDto input)
    {
        var venueExists = await conferenceVenueRepository.GetAll().AnyAsync(x => x.Id == input.VenueId);
        if (!venueExists)
            throw new UserFriendlyException("Conference venue not found.");

        var blackout = new ConferenceVenueBlackout
        {
            Id = Guid.NewGuid(),
            VenueId = input.VenueId,
            Title = (input.Title ?? string.Empty).Trim(),
            StartDateTime = input.StartDateTime,
            EndDateTime = input.EndDateTime,
            Notes = input.Notes ?? string.Empty,
        };

        await conferenceVenueBlackoutRepository.InsertAsync(blackout);
        await CurrentUnitOfWork.SaveChangesAsync();
        return blackout.Id;
    }

    [AbpAuthorize(PermissionNames.Pages_ConferenceVenues_Edit)]
    [UnitOfWork]
    public async Task UpdateAsync(UpdateConferenceVenueBlackoutDto input)
    {
        var blackout = await conferenceVenueBlackoutRepository.GetAsync(input.Id);
        blackout.VenueId = input.VenueId;
        blackout.Title = (input.Title ?? string.Empty).Trim();
        blackout.StartDateTime = input.StartDateTime;
        blackout.EndDateTime = input.EndDateTime;
        blackout.Notes = input.Notes ?? string.Empty;

        await CurrentUnitOfWork.SaveChangesAsync();
    }

    [AbpAuthorize(PermissionNames.Pages_ConferenceVenues_Edit)]
    [UnitOfWork]
    public async Task DeleteAsync(Guid id)
    {
        await conferenceVenueBlackoutRepository.DeleteAsync(id);
    }

    private static ConferenceVenueBlackoutDto MapBlackout(ConferenceVenueBlackout blackout)
    {
        return new ConferenceVenueBlackoutDto
        {
            Id = blackout.Id,
            VenueId = blackout.VenueId,
            VenueName = blackout.Venue?.Name ?? string.Empty,
            Title = blackout.Title,
            StartDateTime = blackout.StartDateTime,
            EndDateTime = blackout.EndDateTime,
            Notes = blackout.Notes,
        };
    }

    private static ConferenceVenueBlackoutListDto MapBlackoutList(ConferenceVenueBlackout blackout)
    {
        return new ConferenceVenueBlackoutListDto
        {
            Id = blackout.Id,
            VenueId = blackout.VenueId,
            VenueName = blackout.Venue?.Name ?? string.Empty,
            Title = blackout.Title,
            StartDateTime = blackout.StartDateTime,
            EndDateTime = blackout.EndDateTime,
            Notes = blackout.Notes,
        };
    }
}