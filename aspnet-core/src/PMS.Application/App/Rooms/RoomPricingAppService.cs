using Abp.Application.Services;
using Abp.Authorization;
using PMS.App.RoomRatePlans.Dto;
using PMS.Authorization;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace PMS.App.Rooms;

public interface IRoomPricingAppService : IApplicationService
{
    /// <summary>Returns all applicable rate plan options for a room type and stay period.</summary>
    Task<List<RoomTypeRatePlanOptionDto>> GetRatePlanOptionsAsync(GetRoomTypeRatePlanOptionsInput input);

    /// <summary>Returns the effective average rate per night for the best rate plan for the given stay.</summary>
    Task<decimal> GetEffectiveRatePerNightAsync(Guid roomTypeId, DateTime arrivalDate, DateTime departureDate, Guid? channelId = null);
}

[AbpAuthorize]
public class RoomPricingAppService(
    IRoomPricingManager roomPricingManager
) : PMSAppServiceBase, IRoomPricingAppService
{
    public async Task<List<RoomTypeRatePlanOptionDto>> GetRatePlanOptionsAsync(GetRoomTypeRatePlanOptionsInput input)
    {
        return await roomPricingManager.GetRatePlanOptionsAsync(
            input.RoomTypeId,
            input.ArrivalDate,
            input.DepartureDate,
            input.ChannelId);
    }

    public async Task<decimal> GetEffectiveRatePerNightAsync(
        Guid roomTypeId, DateTime arrivalDate, DateTime departureDate, Guid? channelId = null)
    {
        return await roomPricingManager.GetBestRatePerNightAsync(roomTypeId, arrivalDate, departureDate, channelId);
    }
}
