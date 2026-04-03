using Abp.Application.Services;
using Abp.Application.Services.Dto;
using Abp.Authorization;
using Abp.Domain.Repositories;
using Abp.Domain.Uow;
using Abp.Linq.Extensions;
using Microsoft.EntityFrameworkCore;
using PMS.App.ConferenceVenues.Dto;
using PMS.Authorization;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Dynamic.Core;
using System.Threading.Tasks;

namespace PMS.App.ConferenceVenues;

public interface IConferenceVenueAppService : IApplicationService
{
    Task<ConferenceVenueDto> GetAsync(Guid id);
    Task<PagedResultDto<ConferenceVenueListDto>> GetAllAsync(GetConferenceVenuesInput input);
    Task<ListResultDto<ConferenceVenueListDto>> GetAllActiveAsync();
    Task<ListResultDto<ConferenceVenueAvailabilityDto>> GetAvailableAsync(GetAvailableConferenceVenuesInput input);
    Task<Guid> CreateAsync(CreateConferenceVenueDto input);
    Task UpdateAsync(UpdateConferenceVenueDto input);
}

[AbpAuthorize]
public class ConferenceVenueAppService(
    IRepository<ConferenceVenue, Guid> conferenceVenueRepository,
    IRepository<ConferenceBooking, Guid> conferenceBookingRepository,
    IRepository<ConferenceVenueBlackout, Guid> conferenceVenueBlackoutRepository) : PMSAppServiceBase, IConferenceVenueAppService
{
    public async Task<ConferenceVenueDto> GetAsync(Guid id)
    {
        var venue = await conferenceVenueRepository.GetAsync(id);
        return ObjectMapper.Map<ConferenceVenueDto>(venue);
    }

    public async Task<PagedResultDto<ConferenceVenueListDto>> GetAllAsync(GetConferenceVenuesInput input)
    {
        var query = conferenceVenueRepository.GetAll()
            .WhereIf(!string.IsNullOrWhiteSpace(input.Filter), x =>
                x.Name.Contains(input.Filter) ||
                x.Code.Contains(input.Filter) ||
                x.Category.Contains(input.Filter));

        var totalCount = await query.CountAsync();
        var items = await query
            .OrderBy(input.Sorting ?? "Name asc")
            .PageBy(input)
            .ToListAsync();

        return new PagedResultDto<ConferenceVenueListDto>(
            totalCount,
            ObjectMapper.Map<List<ConferenceVenueListDto>>(items));
    }

    public async Task<ListResultDto<ConferenceVenueListDto>> GetAllActiveAsync()
    {
        var items = await conferenceVenueRepository.GetAll()
            .Where(x => x.IsActive)
            .OrderBy(x => x.Name)
            .ToListAsync();

        return new ListResultDto<ConferenceVenueListDto>(ObjectMapper.Map<List<ConferenceVenueListDto>>(items));
    }

    public async Task<ListResultDto<ConferenceVenueAvailabilityDto>> GetAvailableAsync(GetAvailableConferenceVenuesInput input)
    {
        var venues = await conferenceVenueRepository.GetAll()
            .Where(x => x.IsActive)
            .WhereIf(input.AttendeeCount.HasValue, x => x.Capacity >= input.AttendeeCount.Value)
            .OrderBy(x => x.Name)
            .ToListAsync();

        var items = new List<ConferenceVenueAvailabilityDto>(venues.Count);

        foreach (var venue in venues)
        {
            var availability = await CheckVenueAvailabilityAsync(venue, input.StartDateTime, input.EndDateTime, input.ExcludeBookingId);
            items.Add(new ConferenceVenueAvailabilityDto
            {
                Id = venue.Id,
                Code = venue.Code,
                Name = venue.Name,
                Category = venue.Category,
                Capacity = venue.Capacity,
                HourlyRate = venue.HourlyRate,
                HalfDayRate = venue.HalfDayRate,
                FullDayRate = venue.FullDayRate,
                IsAvailable = availability.IsAvailable,
                ConflictingBookingId = availability.ConflictingBookingId,
                ConflictingBookingNo = availability.ConflictingBookingNo,
                Message = availability.Message,
            });
        }

        return new ListResultDto<ConferenceVenueAvailabilityDto>(items);
    }

    [UnitOfWork]
    public async Task<Guid> CreateAsync(CreateConferenceVenueDto input)
    {
        var code = (input.Code ?? string.Empty).Trim().ToUpperInvariant();
        if (await conferenceVenueRepository.GetAll().AnyAsync(x => x.Code == code))
            throw new Abp.UI.UserFriendlyException("Venue code already exists.");

        var venue = new ConferenceVenue
        {
            Id = Guid.NewGuid(),
            Code = code,
            Name = (input.Name ?? string.Empty).Trim(),
            Category = (input.Category ?? string.Empty).Trim(),
            Capacity = input.Capacity,
            HourlyRate = input.HourlyRate,
            HalfDayRate = input.HalfDayRate,
            FullDayRate = input.FullDayRate,
            SetupBufferMinutes = input.SetupBufferMinutes,
            TeardownBufferMinutes = input.TeardownBufferMinutes,
            Description = input.Description ?? string.Empty,
            IsActive = input.IsActive,
        };

        await conferenceVenueRepository.InsertAsync(venue);
        await CurrentUnitOfWork.SaveChangesAsync();
        return venue.Id;
    }

    [UnitOfWork]
    public async Task UpdateAsync(UpdateConferenceVenueDto input)
    {
        var venue = await conferenceVenueRepository.GetAsync(input.Id);
        var code = (input.Code ?? string.Empty).Trim().ToUpperInvariant();

        if (await conferenceVenueRepository.GetAll().AnyAsync(x => x.Id != input.Id && x.Code == code))
            throw new Abp.UI.UserFriendlyException("Venue code already exists.");

        venue.Code = code;
        venue.Name = (input.Name ?? string.Empty).Trim();
        venue.Category = (input.Category ?? string.Empty).Trim();
        venue.Capacity = input.Capacity;
        venue.HourlyRate = input.HourlyRate;
        venue.HalfDayRate = input.HalfDayRate;
        venue.FullDayRate = input.FullDayRate;
        venue.SetupBufferMinutes = input.SetupBufferMinutes;
        venue.TeardownBufferMinutes = input.TeardownBufferMinutes;
        venue.Description = input.Description ?? string.Empty;
        venue.IsActive = input.IsActive;

        await CurrentUnitOfWork.SaveChangesAsync();
    }

    private async Task<ConferenceVenueAvailabilityDto> CheckVenueAvailabilityAsync(
        ConferenceVenue venue,
        DateTime startDateTime,
        DateTime endDateTime,
        Guid? excludeBookingId)
    {
        var requestedStart = startDateTime.AddMinutes(-venue.SetupBufferMinutes);
        var requestedEnd = endDateTime.AddMinutes(venue.TeardownBufferMinutes);

        var conflictingBooking = await conferenceBookingRepository.GetAll()
            .Where(x => x.VenueId == venue.Id)
            .Where(x => !excludeBookingId.HasValue || x.Id != excludeBookingId.Value)
            .Where(x => x.Status == ConferenceBookingStatus.Tentative || x.Status == ConferenceBookingStatus.Confirmed || x.Status == ConferenceBookingStatus.InProgress)
            .OrderBy(x => x.StartDateTime)
            .FirstOrDefaultAsync(x =>
                x.StartDateTime.AddMinutes(-x.SetupBufferMinutes) < requestedEnd &&
                x.EndDateTime.AddMinutes(x.TeardownBufferMinutes) > requestedStart);

        var blackout = await conferenceVenueBlackoutRepository.GetAll()
            .Where(x => x.VenueId == venue.Id)
            .OrderBy(x => x.StartDateTime)
            .FirstOrDefaultAsync(x => x.StartDateTime < requestedEnd && x.EndDateTime > requestedStart);

        if (blackout != null)
        {
            return new ConferenceVenueAvailabilityDto
            {
                Id = venue.Id,
                IsAvailable = false,
                Message = $"Venue is blocked for blackout period '{blackout.Title}'.",
            };
        }

        if (conflictingBooking == null)
        {
            return new ConferenceVenueAvailabilityDto
            {
                Id = venue.Id,
                IsAvailable = true,
                Message = "Venue is available.",
            };
        }

        return new ConferenceVenueAvailabilityDto
        {
            Id = venue.Id,
            IsAvailable = false,
            ConflictingBookingId = conflictingBooking.Id,
            ConflictingBookingNo = conflictingBooking.BookingNo,
            Message = $"Venue is already allocated to booking {conflictingBooking.BookingNo} for an overlapping time range.",
        };
    }
}