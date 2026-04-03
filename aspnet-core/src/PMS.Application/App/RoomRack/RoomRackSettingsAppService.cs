using Abp.Application.Services;
using Abp.Authorization;
using Microsoft.AspNetCore.Mvc;
using PMS.Application.App.RoomRack.Dto;
using PMS.Authorization;
using PMS.Configuration;
using System.Threading.Tasks;

namespace PMS.Application.App.RoomRack;

public interface IRoomRackSettingsAppService : IApplicationService
{
    Task<RoomRackSettingsDto> GetAsync();
    Task UpdateAsync([FromBody] RoomRackSettingsDto input);
}

[AbpAuthorize]
public class RoomRackSettingsAppService : PMSAppServiceBase, IRoomRackSettingsAppService
{
    public async Task<RoomRackSettingsDto> GetAsync()
    {
        var tenantId = AbpSession.TenantId ?? 1;
        var dateRangeStr = await SettingManager.GetSettingValueForTenantAsync(AppSettingNames.FrontDesk_RoomRack.DateRangeDays, tenantId);
        return new RoomRackSettingsDto
        {
            DateRangeDays = int.TryParse(dateRangeStr, out var days) ? days : 14,
            ColorInHouse = await SettingManager.GetSettingValueForTenantAsync(AppSettingNames.FrontDesk_RoomRack.ColorInHouse, tenantId) ?? "#DCFCE7",
            ColorInHouseDark = await SettingManager.GetSettingValueForTenantAsync(AppSettingNames.FrontDesk_RoomRack.ColorInHouseDark, tenantId) ?? "#166534",
            ColorPendingReservation = await SettingManager.GetSettingValueForTenantAsync(AppSettingNames.FrontDesk_RoomRack.ColorPendingReservation, tenantId) ?? "#DBEAFE",
            ColorPendingReservationDark = await SettingManager.GetSettingValueForTenantAsync(AppSettingNames.FrontDesk_RoomRack.ColorPendingReservationDark, tenantId) ?? "#1E40AF",
            ColorConfirmedReservation = await SettingManager.GetSettingValueForTenantAsync(AppSettingNames.FrontDesk_RoomRack.ColorConfirmedReservation, tenantId) ?? "#DCFCE7",
            ColorConfirmedReservationDark = await SettingManager.GetSettingValueForTenantAsync(AppSettingNames.FrontDesk_RoomRack.ColorConfirmedReservationDark, tenantId) ?? "#166534",
            ColorCheckoutToday = await SettingManager.GetSettingValueForTenantAsync(AppSettingNames.FrontDesk_RoomRack.ColorCheckoutToday, tenantId) ?? "#FFEDD5",
            ColorCheckoutTodayDark = await SettingManager.GetSettingValueForTenantAsync(AppSettingNames.FrontDesk_RoomRack.ColorCheckoutTodayDark, tenantId) ?? "#9A3412",
            ColorOnHoldRoom = await SettingManager.GetSettingValueForTenantAsync(AppSettingNames.FrontDesk_RoomRack.ColorOnHoldRoom, tenantId) ?? "#F3F4F6",
            ColorOnHoldRoomDark = await SettingManager.GetSettingValueForTenantAsync(AppSettingNames.FrontDesk_RoomRack.ColorOnHoldRoomDark, tenantId) ?? "#374151",
        };
    }

    public async Task UpdateAsync(RoomRackSettingsDto input)
    {
        var tenantId = AbpSession.TenantId ?? 1;
        await SettingManager.ChangeSettingForTenantAsync(tenantId, AppSettingNames.FrontDesk_RoomRack.DateRangeDays, input.DateRangeDays.ToString());
        await SettingManager.ChangeSettingForTenantAsync(tenantId, AppSettingNames.FrontDesk_RoomRack.ColorInHouse, input.ColorInHouse ?? "#DCFCE7");
        await SettingManager.ChangeSettingForTenantAsync(tenantId, AppSettingNames.FrontDesk_RoomRack.ColorInHouseDark, input.ColorInHouseDark ?? "#166534");
        await SettingManager.ChangeSettingForTenantAsync(tenantId, AppSettingNames.FrontDesk_RoomRack.ColorPendingReservation, input.ColorPendingReservation ?? "#DBEAFE");
        await SettingManager.ChangeSettingForTenantAsync(tenantId, AppSettingNames.FrontDesk_RoomRack.ColorPendingReservationDark, input.ColorPendingReservationDark ?? "#1E40AF");
        await SettingManager.ChangeSettingForTenantAsync(tenantId, AppSettingNames.FrontDesk_RoomRack.ColorConfirmedReservation, input.ColorConfirmedReservation ?? "#DCFCE7");
        await SettingManager.ChangeSettingForTenantAsync(tenantId, AppSettingNames.FrontDesk_RoomRack.ColorConfirmedReservationDark, input.ColorConfirmedReservationDark ?? "#166534");
        await SettingManager.ChangeSettingForTenantAsync(tenantId, AppSettingNames.FrontDesk_RoomRack.ColorCheckoutToday, input.ColorCheckoutToday ?? "#FFEDD5");
        await SettingManager.ChangeSettingForTenantAsync(tenantId, AppSettingNames.FrontDesk_RoomRack.ColorCheckoutTodayDark, input.ColorCheckoutTodayDark ?? "#9A3412");
        await SettingManager.ChangeSettingForTenantAsync(tenantId, AppSettingNames.FrontDesk_RoomRack.ColorOnHoldRoom, input.ColorOnHoldRoom ?? "#F3F4F6");
        await SettingManager.ChangeSettingForTenantAsync(tenantId, AppSettingNames.FrontDesk_RoomRack.ColorOnHoldRoomDark, input.ColorOnHoldRoomDark ?? "#374151");
    }
}
