using Abp.Application.Services;
using System;
using Abp.Application.Services.Dto;
using Abp.Authorization;
using Abp.Domain.Repositories;
using Abp.Linq.Extensions;
using Abp.UI;
using Microsoft.EntityFrameworkCore;
using PMS.App.Guests.Dto;
using PMS.Authorization;
using System.Linq;
using System.Linq.Dynamic.Core;
using System.Threading.Tasks;

namespace PMS.App.Guests;

public interface IGuestAppService : IApplicationService
{
    Task<GuestDto> GetAsync(Guid id);
    Task<PagedResultDto<GuestListDto>> GetAllAsync(GetGuestsInput input);
    Task<Guid> CreateAsync(CreateGuestDto input);
    Task UpdateAsync(GuestDto input);
    Task<GuestDto> GetByCodeAsync(string guestCode);
}

[AbpAuthorize(PermissionNames.Pages_Guests)]
public class GuestAppService(
    IRepository<Guest, Guid> guestRepository
) : PMSAppServiceBase, IGuestAppService
{
    [AbpAuthorize(PermissionNames.Pages_Guests_Create)]
    public async Task<Guid> CreateAsync(CreateGuestDto input)
    {
        // Check for duplicate code
        var exists = await guestRepository.GetAll()
            .AnyAsync(g => g.GuestCode == input.GuestCode.Trim().ToUpper());
        if (exists)
            throw new UserFriendlyException(L("GuestCodeAlreadyExists"));

        var guest = ObjectMapper.Map<Guest>(input);
        guest.GuestCode = input.GuestCode.Trim().ToUpper();

        var id = await guestRepository.InsertAndGetIdAsync(guest);
        return id;
    }

    public async Task<GuestDto> GetAsync(Guid id)
    {
        var guest = await guestRepository.GetAll()
            .Include(g => g.Identifications)
            .FirstOrDefaultAsync(g => g.Id == id);

        if (guest == null)
            throw new UserFriendlyException(L("GuestNotFound"));

        return ObjectMapper.Map<GuestDto>(guest);
    }

    public async Task<GuestDto> GetByCodeAsync(string guestCode)
    {
        var guest = await guestRepository.GetAll()
            .Include(g => g.Identifications)
            .FirstOrDefaultAsync(g => g.GuestCode == guestCode.Trim().ToUpper());

        if (guest == null)
            throw new UserFriendlyException(L("GuestNotFound"));

        return ObjectMapper.Map<GuestDto>(guest);
    }

    public async Task<PagedResultDto<GuestListDto>> GetAllAsync(GetGuestsInput input)
    {
        var query = guestRepository.GetAll()
            .WhereIf(!string.IsNullOrWhiteSpace(input.Filter),
                g => g.FirstName.Contains(input.Filter) ||
                     g.LastName.Contains(input.Filter) ||
                     g.GuestCode.Contains(input.Filter) ||
                     g.Email.Contains(input.Filter) ||
                     g.Phone.Contains(input.Filter))
            .WhereIf(input.IsActive.HasValue, g => g.IsActive == input.IsActive);

        var totalCount = await query.CountAsync();

        var guests = await query
            .OrderBy(input.Sorting)
            .PageBy(input)
            .ToListAsync();

        return new PagedResultDto<GuestListDto>(totalCount, ObjectMapper.Map<System.Collections.Generic.List<GuestListDto>>(guests));
    }

    [AbpAuthorize(PermissionNames.Pages_Guests_Edit)]
    public async Task UpdateAsync(GuestDto input)
    {
        var guest = await guestRepository.GetAsync(input.Id);
        ObjectMapper.Map(input, guest);
        await guestRepository.UpdateAsync(guest);
    }
}
