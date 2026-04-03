using Abp.Application.Services;
using Abp.Application.Services.Dto;
using Abp.Authorization;
using Abp.Domain.Repositories;
using Microsoft.EntityFrameworkCore;
using PMS.App.EventTypes.Dto;
using PMS.Authorization;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace PMS.App.EventTypes;

public interface IEventTypeAppService : IApplicationService
{
    Task<ListResultDto<EventTypeDto>> GetAllActiveAsync();
}

[AbpAuthorize(PermissionNames.Pages_ConferenceBookings)]
public class EventTypeAppService(IRepository<EventType, Guid> eventTypeRepository) : PMSAppServiceBase, IEventTypeAppService
{
    public async Task<ListResultDto<EventTypeDto>> GetAllActiveAsync()
    {
        var items = await eventTypeRepository.GetAll()
            .Where(x => x.IsActive)
            .OrderBy(x => x.SortOrder)
            .ThenBy(x => x.Name)
            .ToListAsync();

        return new ListResultDto<EventTypeDto>(ObjectMapper.Map<List<EventTypeDto>>(items));
    }
}