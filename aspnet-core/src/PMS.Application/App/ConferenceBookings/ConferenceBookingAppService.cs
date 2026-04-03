using Abp.Application.Services;
using Abp.Application.Services.Dto;
using Abp.Authorization;
using Abp.Domain.Repositories;
using Abp.Domain.Uow;
using Abp.Linq.Extensions;
using Abp.Timing;
using Abp.UI;
using Microsoft.EntityFrameworkCore;
using PMS.App.ConferenceBookings.Dto;
using PMS.Application.App.Services;
using PMS.Authorization;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Dynamic.Core;
using System.Threading.Tasks;

namespace PMS.App.ConferenceBookings;

public interface IConferenceBookingAppService : IApplicationService
{
    Task<ConferenceBookingDto> GetAsync(Guid id);
    Task<PagedResultDto<ConferenceBookingListDto>> GetAllAsync(GetConferenceBookingsInput input);
    Task<Guid> CreateAsync(CreateConferenceBookingDto input);
    Task UpdateAsync(UpdateConferenceBookingDto input);
    Task ConfirmAsync(Guid id);
    Task MarkTentativeAsync(Guid id);
    Task StartEventAsync(Guid id);
    Task CompleteAsync(Guid id);
    Task CancelAsync(Guid id, string reason = null);
    Task<Guid> RecordPaymentAsync(RecordConferenceBookingPaymentDto input);
    Task<ConferenceBookingAvailabilityDto> CheckAvailabilityAsync(CheckConferenceBookingAvailabilityInput input);
}

[AbpAuthorize(PermissionNames.Pages_ConferenceBookings)]
public class ConferenceBookingAppService(
    IRepository<ConferenceBooking, Guid> conferenceBookingRepository,
    IRepository<ConferenceBookingAddOn, Guid> conferenceBookingAddOnRepository,
    IRepository<ConferenceBookingPayment, Guid> conferenceBookingPaymentRepository,
    IRepository<ConferenceVenueBlackout, Guid> conferenceVenueBlackoutRepository,
    IRepository<ConferenceCompany, Guid> conferenceCompanyRepository,
    IRepository<EventType, Guid> eventTypeRepository,
    IRepository<ConferenceVenue, Guid> conferenceVenueRepository,
    IRepository<Guest, Guid> guestRepository,
    IRepository<PaymentMethod, Guid> paymentMethodRepository,
    IDocumentNumberService documentNumberService) : PMSAppServiceBase, IConferenceBookingAppService
{
    public async Task<ConferenceBookingDto> GetAsync(Guid id)
    {
        var booking = await conferenceBookingRepository.GetAll()
            .Include(x => x.Venue)
            .Include(x => x.ConferenceCompany)
            .Include(x => x.EventTypeLookup)
            .Include(x => x.AddOns)
            .Include(x => x.Payments)
                .ThenInclude(x => x.PaymentMethod)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (booking == null)
            throw new UserFriendlyException("Event booking not found.");

        return MapBooking(booking);
    }

    public async Task<PagedResultDto<ConferenceBookingListDto>> GetAllAsync(GetConferenceBookingsInput input)
    {
        var query = conferenceBookingRepository.GetAll()
            .Include(x => x.Venue)
            .WhereIf(input.Status.HasValue, x => x.Status == input.Status.Value)
            .WhereIf(input.VenueId.HasValue, x => x.VenueId == input.VenueId.Value)
            .WhereIf(input.ExcludeBookingId.HasValue, x => x.Id != input.ExcludeBookingId.Value)
            .WhereIf(input.StartFrom.HasValue, x => x.EndDateTime > input.StartFrom.Value)
            .WhereIf(input.EndTo.HasValue, x => x.StartDateTime < input.EndTo.Value)
            .WhereIf(!string.IsNullOrWhiteSpace(input.Filter), x =>
                x.BookingNo.Contains(input.Filter) ||
                x.EventName.Contains(input.Filter) ||
                x.EventType.Contains(input.Filter) ||
                x.OrganizerName.Contains(input.Filter) ||
                x.CompanyName.Contains(input.Filter) ||
                x.Venue.Name.Contains(input.Filter));

        var totalCount = await query.CountAsync();
        var items = await query
            .OrderBy(input.Sorting)
            .PageBy(input)
            .ToListAsync();

        return new PagedResultDto<ConferenceBookingListDto>(
            totalCount,
            items.Select(MapBookingList).ToList());
    }

    [AbpAuthorize(PermissionNames.Pages_ConferenceBookings_Create)]
    [UnitOfWork]
    public async Task<Guid> CreateAsync(CreateConferenceBookingDto input)
    {
        var venue = await conferenceVenueRepository.FirstOrDefaultAsync(input.VenueId)
            ?? throw new UserFriendlyException("Conference venue not found.");

        if (!venue.IsActive)
            throw new UserFriendlyException("Inactive venues cannot accept new bookings.");

        if (input.AttendeeCount > venue.Capacity)
            throw new UserFriendlyException("Attendee count exceeds the selected venue capacity.");

        if (input.GuestId.HasValue && input.GuestId.Value != Guid.Empty)
        {
            var guestExists = await guestRepository.GetAll().AnyAsync(x => x.Id == input.GuestId.Value);
            if (!guestExists)
                throw new UserFriendlyException("Guest not found.");
        }

        ConferenceCompany company = null;
        if (input.ConferenceCompanyId.HasValue && input.ConferenceCompanyId.Value != Guid.Empty)
        {
            company = await conferenceCompanyRepository.FirstOrDefaultAsync(input.ConferenceCompanyId.Value)
                ?? throw new UserFriendlyException("Conference company not found.");
        }

        EventType eventType = null;
        if (input.EventTypeId.HasValue && input.EventTypeId.Value != Guid.Empty)
        {
            eventType = await eventTypeRepository.FirstOrDefaultAsync(input.EventTypeId.Value)
                ?? throw new UserFriendlyException("Event type not found.");

            if (!eventType.IsActive)
                throw new UserFriendlyException("Inactive event types cannot be used for booking.");
        }

        var setupBufferMinutes = input.SetupBufferMinutes ?? venue.SetupBufferMinutes;
        var teardownBufferMinutes = input.TeardownBufferMinutes ?? venue.TeardownBufferMinutes;

        var availability = await CheckAvailabilityInternalAsync(
            input.VenueId,
            input.StartDateTime,
            input.EndDateTime,
            setupBufferMinutes,
            teardownBufferMinutes,
            null);

        if (!availability.IsAvailable && input.Status != ConferenceBookingStatus.Inquiry)
            throw new UserFriendlyException(availability.Message ?? "The selected venue is not available for the requested time range.");

        var booking = new ConferenceBooking
        {
            Id = Guid.NewGuid(),
            BookingNo = await documentNumberService.GenerateNextDocumentNumberAsync("CONFERENCE_BOOKING", "CNF-"),
            VenueId = input.VenueId,
            GuestId = input.GuestId,
            ConferenceCompanyId = input.ConferenceCompanyId,
            EventTypeId = input.EventTypeId,
            BookingDate = Clock.Now,
            EventName = (input.EventName ?? string.Empty).Trim(),
            EventType = eventType?.Name ?? (input.EventType ?? string.Empty).Trim(),
            OrganizerType = input.OrganizerType,
            OrganizerName = (input.OrganizerName ?? string.Empty).Trim(),
            CompanyName = !string.IsNullOrWhiteSpace(input.CompanyName) ? input.CompanyName.Trim() : company?.Name ?? string.Empty,
            ContactPerson = !string.IsNullOrWhiteSpace(input.ContactPerson) ? input.ContactPerson.Trim() : company?.ContactPerson ?? string.Empty,
            Phone = !string.IsNullOrWhiteSpace(input.Phone) ? input.Phone.Trim() : company?.Phone ?? string.Empty,
            Email = !string.IsNullOrWhiteSpace(input.Email) ? input.Email.Trim() : company?.Email ?? string.Empty,
            StartDateTime = input.StartDateTime,
            EndDateTime = input.EndDateTime,
            AttendeeCount = input.AttendeeCount,
            PricingType = input.PricingType,
            DepositRequired = input.DepositRequired,
            SetupBufferMinutes = setupBufferMinutes,
            TeardownBufferMinutes = teardownBufferMinutes,
            Status = input.Status,
            Notes = input.Notes ?? string.Empty,
            SpecialRequests = input.SpecialRequests ?? string.Empty,
        };

        var addOns = BuildAddOns(booking.Id, input.AddOns);
        foreach (var addOn in addOns)
        {
            booking.AddOns.Add(addOn);
        }

        ApplyPricing(booking, venue, input.CustomBaseAmount, addOns.Sum(x => x.Amount));

        await conferenceBookingRepository.InsertAsync(booking);
        await CurrentUnitOfWork.SaveChangesAsync();
        return booking.Id;
    }

    [AbpAuthorize(PermissionNames.Pages_ConferenceBookings_Edit)]
    [UnitOfWork]
    public async Task UpdateAsync(UpdateConferenceBookingDto input)
    {
        var booking = await conferenceBookingRepository.GetAll()
            .Include(x => x.AddOns)
            .FirstOrDefaultAsync(x => x.Id == input.Id);

        if (booking == null)
            throw new UserFriendlyException("Event booking not found.");

        if (booking.Status == ConferenceBookingStatus.Completed || booking.Status == ConferenceBookingStatus.Cancelled)
            throw new UserFriendlyException("Completed or cancelled bookings cannot be edited.");

        var venue = await conferenceVenueRepository.FirstOrDefaultAsync(input.VenueId)
            ?? throw new UserFriendlyException("Conference venue not found.");

        ConferenceCompany company = null;
        if (input.ConferenceCompanyId.HasValue && input.ConferenceCompanyId.Value != Guid.Empty)
        {
            company = await conferenceCompanyRepository.FirstOrDefaultAsync(input.ConferenceCompanyId.Value)
                ?? throw new UserFriendlyException("Conference company not found.");
        }

        EventType eventType = null;
        if (input.EventTypeId.HasValue && input.EventTypeId.Value != Guid.Empty)
        {
            eventType = await eventTypeRepository.FirstOrDefaultAsync(input.EventTypeId.Value)
                ?? throw new UserFriendlyException("Event type not found.");

            if (!eventType.IsActive)
                throw new UserFriendlyException("Inactive event types cannot be used for booking.");
        }

        if (input.AttendeeCount > venue.Capacity)
            throw new UserFriendlyException("Attendee count exceeds the selected venue capacity.");

        var setupBufferMinutes = input.SetupBufferMinutes ?? venue.SetupBufferMinutes;
        var teardownBufferMinutes = input.TeardownBufferMinutes ?? venue.TeardownBufferMinutes;
        var availability = await CheckAvailabilityInternalAsync(
            input.VenueId,
            input.StartDateTime,
            input.EndDateTime,
            setupBufferMinutes,
            teardownBufferMinutes,
            booking.Id);

        if (!availability.IsAvailable && input.Status != ConferenceBookingStatus.Inquiry)
            throw new UserFriendlyException(availability.Message ?? "The selected venue is not available for the requested time range.");

        booking.VenueId = input.VenueId;
        booking.GuestId = input.GuestId;
        booking.ConferenceCompanyId = input.ConferenceCompanyId;
        booking.EventTypeId = input.EventTypeId;
        booking.EventName = (input.EventName ?? string.Empty).Trim();
        booking.EventType = eventType?.Name ?? (input.EventType ?? string.Empty).Trim();
        booking.OrganizerType = input.OrganizerType;
        booking.OrganizerName = (input.OrganizerName ?? string.Empty).Trim();
        booking.CompanyName = !string.IsNullOrWhiteSpace(input.CompanyName) ? input.CompanyName.Trim() : company?.Name ?? string.Empty;
        booking.ContactPerson = !string.IsNullOrWhiteSpace(input.ContactPerson) ? input.ContactPerson.Trim() : company?.ContactPerson ?? string.Empty;
        booking.Phone = !string.IsNullOrWhiteSpace(input.Phone) ? input.Phone.Trim() : company?.Phone ?? string.Empty;
        booking.Email = !string.IsNullOrWhiteSpace(input.Email) ? input.Email.Trim() : company?.Email ?? string.Empty;
        booking.StartDateTime = input.StartDateTime;
        booking.EndDateTime = input.EndDateTime;
        booking.AttendeeCount = input.AttendeeCount;
        booking.PricingType = input.PricingType;
        booking.DepositRequired = input.DepositRequired;
        booking.SetupBufferMinutes = setupBufferMinutes;
        booking.TeardownBufferMinutes = teardownBufferMinutes;
        booking.Status = input.Status;
        booking.Notes = input.Notes ?? string.Empty;
        booking.SpecialRequests = input.SpecialRequests ?? string.Empty;

        foreach (var existingAddOn in booking.AddOns.ToList())
        {
            await conferenceBookingAddOnRepository.DeleteAsync(existingAddOn);
        }

        await CurrentUnitOfWork.SaveChangesAsync();

        var replacementAddOns = BuildAddOns(booking.Id, input.AddOns);
        foreach (var addOn in replacementAddOns)
        {
            await conferenceBookingAddOnRepository.InsertAsync(addOn);
        }

        ApplyPricing(booking, venue, input.CustomBaseAmount, replacementAddOns.Sum(x => x.Amount));

        await CurrentUnitOfWork.SaveChangesAsync();
    }

    [AbpAuthorize(PermissionNames.Pages_ConferenceBookings_Edit)]
    [UnitOfWork]
    public async Task ConfirmAsync(Guid id)
    {
        var booking = await conferenceBookingRepository.GetAll()
            .Include(x => x.Venue)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (booking == null)
            throw new UserFriendlyException("Event booking not found.");

        var availability = await CheckAvailabilityInternalAsync(
            booking.VenueId,
            booking.StartDateTime,
            booking.EndDateTime,
            booking.SetupBufferMinutes,
            booking.TeardownBufferMinutes,
            booking.Id);

        if (!availability.IsAvailable)
            throw new UserFriendlyException(availability.Message ?? "The selected venue is not available for the requested time range.");

        booking.Confirm();
        await CurrentUnitOfWork.SaveChangesAsync();
    }

    [AbpAuthorize(PermissionNames.Pages_ConferenceBookings_Edit)]
    [UnitOfWork]
    public async Task MarkTentativeAsync(Guid id)
    {
        var booking = await conferenceBookingRepository.GetAsync(id);
        booking.SetTentative();
        await CurrentUnitOfWork.SaveChangesAsync();
    }

    [AbpAuthorize(PermissionNames.Pages_ConferenceBookings_Edit)]
    [UnitOfWork]
    public async Task StartEventAsync(Guid id)
    {
        var booking = await conferenceBookingRepository.GetAsync(id);
        booking.StartEvent();
        await CurrentUnitOfWork.SaveChangesAsync();
    }

    [AbpAuthorize(PermissionNames.Pages_ConferenceBookings_Edit)]
    [UnitOfWork]
    public async Task CompleteAsync(Guid id)
    {
        var booking = await conferenceBookingRepository.GetAsync(id);
        booking.Complete();
        await CurrentUnitOfWork.SaveChangesAsync();
    }

    [AbpAuthorize(PermissionNames.Pages_ConferenceBookings_Cancel)]
    [UnitOfWork]
    public async Task CancelAsync(Guid id, string reason = null)
    {
        var booking = await conferenceBookingRepository.GetAsync(id);
        booking.Cancel(reason);
        await CurrentUnitOfWork.SaveChangesAsync();
    }

    [AbpAuthorize(PermissionNames.Pages_ConferenceBookings_Deposit)]
    [UnitOfWork]
    public async Task<Guid> RecordPaymentAsync(RecordConferenceBookingPaymentDto input)
    {
        var booking = await conferenceBookingRepository.GetAll()
            .Include(x => x.Payments)
            .FirstOrDefaultAsync(x => x.Id == input.ConferenceBookingId);

        if (booking == null)
            throw new UserFriendlyException("Event booking not found.");

        var paymentMethodExists = await paymentMethodRepository.GetAll().AnyAsync(x => x.Id == input.PaymentMethodId);
        if (!paymentMethodExists)
            throw new UserFriendlyException("Payment method not found.");

        var payment = new ConferenceBookingPayment
        {
            Id = Guid.NewGuid(),
            ConferenceBookingId = booking.Id,
            PaymentMethodId = input.PaymentMethodId,
            Amount = input.Amount,
            PaidDate = input.PaidDate,
            ReferenceNo = input.ReferenceNo ?? string.Empty,
        };

        await conferenceBookingPaymentRepository.InsertAsync(payment);
        booking.DepositPaid += input.Amount;
        await CurrentUnitOfWork.SaveChangesAsync();
        return payment.Id;
    }

    public Task<ConferenceBookingAvailabilityDto> CheckAvailabilityAsync(CheckConferenceBookingAvailabilityInput input)
    {
        return CheckAvailabilityInternalAsync(
            input.VenueId,
            input.StartDateTime,
            input.EndDateTime,
            input.SetupBufferMinutes,
            input.TeardownBufferMinutes,
            input.BookingId);
    }

    private async Task<ConferenceBookingAvailabilityDto> CheckAvailabilityInternalAsync(
        Guid venueId,
        DateTime startDateTime,
        DateTime endDateTime,
        int? setupBufferMinutes,
        int? teardownBufferMinutes,
        Guid? excludeBookingId)
    {
        var venue = await conferenceVenueRepository.FirstOrDefaultAsync(venueId)
            ?? throw new UserFriendlyException("Conference venue not found.");

        var requestedStart = startDateTime.AddMinutes(-(setupBufferMinutes ?? venue.SetupBufferMinutes));
        var requestedEnd = endDateTime.AddMinutes(teardownBufferMinutes ?? venue.TeardownBufferMinutes);

        var conflictingBooking = await conferenceBookingRepository.GetAll()
            .Where(x => x.VenueId == venueId)
            .Where(x => !excludeBookingId.HasValue || x.Id != excludeBookingId.Value)
            .Where(x => x.Status == ConferenceBookingStatus.Tentative || x.Status == ConferenceBookingStatus.Confirmed || x.Status == ConferenceBookingStatus.InProgress)
            .OrderBy(x => x.StartDateTime)
            .FirstOrDefaultAsync(x =>
                x.StartDateTime.AddMinutes(-x.SetupBufferMinutes) < requestedEnd &&
                x.EndDateTime.AddMinutes(x.TeardownBufferMinutes) > requestedStart);

        var blackout = await conferenceVenueBlackoutRepository.GetAll()
            .Where(x => x.VenueId == venueId)
            .OrderBy(x => x.StartDateTime)
            .FirstOrDefaultAsync(x => x.StartDateTime < requestedEnd && x.EndDateTime > requestedStart);

        if (blackout != null)
        {
            return new ConferenceBookingAvailabilityDto
            {
                IsAvailable = false,
                Message = $"Venue is blocked for blackout period '{blackout.Title}'.",
            };
        }

        if (conflictingBooking == null)
        {
            return new ConferenceBookingAvailabilityDto
            {
                IsAvailable = true,
                Message = "Venue is available.",
            };
        }

        return new ConferenceBookingAvailabilityDto
        {
            IsAvailable = false,
            ConflictingBookingId = conflictingBooking.Id,
            ConflictingBookingNo = conflictingBooking.BookingNo,
            Message = $"Venue is already allocated to booking {conflictingBooking.BookingNo} for an overlapping time range.",
        };
    }

    private static List<ConferenceBookingAddOn> BuildAddOns(Guid conferenceBookingId, IReadOnlyCollection<CreateConferenceBookingAddOnDto> addOns)
    {
        var items = new List<ConferenceBookingAddOn>();

        foreach (var addOn in addOns ?? [])
        {
            var quantity = Math.Max(1, addOn.Quantity);
            var unitPrice = Math.Max(0, addOn.UnitPrice);
            items.Add(new ConferenceBookingAddOn
            {
                Id = Guid.NewGuid(),
                ConferenceBookingId = conferenceBookingId,
                Name = (addOn.Name ?? string.Empty).Trim(),
                Quantity = quantity,
                UnitPrice = unitPrice,
                Amount = quantity * unitPrice,
            });
        }

        return items;
    }

    private static void ApplyPricing(ConferenceBooking booking, ConferenceVenue venue, decimal? customBaseAmount, decimal addOnAmount)
    {
        booking.AddOnAmount = addOnAmount;
        booking.BaseAmount = booking.PricingType switch
        {
            ConferencePricingType.Hourly => Math.Round((decimal)Math.Ceiling((booking.EndDateTime - booking.StartDateTime).TotalHours) * venue.HourlyRate, 2),
            ConferencePricingType.HalfDay => venue.HalfDayRate,
            ConferencePricingType.FullDay => venue.FullDayRate,
            ConferencePricingType.Custom => Math.Max(0, customBaseAmount ?? 0),
            _ => venue.HourlyRate,
        };

        booking.TotalAmount = booking.BaseAmount + booking.AddOnAmount;
    }

    private static ConferenceBookingDto MapBooking(ConferenceBooking booking)
    {
        return new ConferenceBookingDto
        {
            Id = booking.Id,
            BookingNo = booking.BookingNo,
            VenueId = booking.VenueId,
            VenueName = booking.Venue?.Name ?? string.Empty,
            GuestId = booking.GuestId,
            ConferenceCompanyId = booking.ConferenceCompanyId,
            EventTypeId = booking.EventTypeId,
            ConferenceCompanyName = booking.ConferenceCompany?.Name ?? booking.CompanyName,
            BookingDate = booking.BookingDate,
            EventName = booking.EventName,
            EventType = booking.EventTypeLookup?.Name ?? booking.EventType,
            OrganizerType = booking.OrganizerType,
            OrganizerName = booking.OrganizerName,
            CompanyName = booking.CompanyName,
            ContactPerson = booking.ContactPerson,
            Phone = booking.Phone,
            Email = booking.Email,
            StartDateTime = booking.StartDateTime,
            EndDateTime = booking.EndDateTime,
            AttendeeCount = booking.AttendeeCount,
            PricingType = booking.PricingType,
            BaseAmount = booking.BaseAmount,
            AddOnAmount = booking.AddOnAmount,
            TotalAmount = booking.TotalAmount,
            DepositRequired = booking.DepositRequired,
            DepositPaid = booking.DepositPaid,
            SetupBufferMinutes = booking.SetupBufferMinutes,
            TeardownBufferMinutes = booking.TeardownBufferMinutes,
            Status = booking.Status,
            Notes = booking.Notes,
            SpecialRequests = booking.SpecialRequests,
            AddOns = booking.AddOns.Select(x => new ConferenceBookingAddOnDto
            {
                Id = x.Id,
                Name = x.Name,
                Quantity = x.Quantity,
                UnitPrice = x.UnitPrice,
                Amount = x.Amount,
            }).ToList(),
            Payments = booking.Payments.Select(x => new ConferenceBookingPaymentDto
            {
                Id = x.Id,
                PaymentMethodId = x.PaymentMethodId,
                PaymentMethodName = x.PaymentMethod?.Name ?? string.Empty,
                Amount = x.Amount,
                PaidDate = x.PaidDate,
                ReferenceNo = x.ReferenceNo,
            }).OrderByDescending(x => x.PaidDate).ToList(),
        };
    }

    private static ConferenceBookingListDto MapBookingList(ConferenceBooking booking)
    {
        return new ConferenceBookingListDto
        {
            Id = booking.Id,
            BookingNo = booking.BookingNo,
            VenueId = booking.VenueId,
            VenueName = booking.Venue?.Name ?? string.Empty,
            ConferenceCompanyId = booking.ConferenceCompanyId,
            EventTypeId = booking.EventTypeId,
            ConferenceCompanyName = booking.ConferenceCompany?.Name ?? booking.CompanyName,
            EventName = booking.EventName,
            EventType = booking.EventTypeLookup?.Name ?? booking.EventType,
            OrganizerName = booking.OrganizerName,
            CompanyName = booking.CompanyName,
            StartDateTime = booking.StartDateTime,
            EndDateTime = booking.EndDateTime,
            Status = booking.Status,
            TotalAmount = booking.TotalAmount,
            DepositRequired = booking.DepositRequired,
            DepositPaid = booking.DepositPaid,
            AttendeeCount = booking.AttendeeCount,
            CreationTime = booking.CreationTime,
        };
    }
}