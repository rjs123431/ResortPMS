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

public class RoomRackSettingsAppService : PMSAppServiceBase, IRoomRackSettingsAppService
{
    [AbpAuthorize]
    public async Task<RoomRackSettingsDto> GetAsync()
    {
        var tenantId = AbpSession.TenantId ?? 1;
        var dateRangeStr = await SettingManager.GetSettingValueForTenantAsync(AppSettingNames.FrontDesk_RoomRack.DateRangeDays, tenantId);
        return new RoomRackSettingsDto
        {
            DateRangeDays = int.TryParse(dateRangeStr, out var days) ? days : 14,
            ColorInHouse = await SettingManager.GetSettingValueForTenantAsync(AppSettingNames.FrontDesk_RoomRack.ColorInHouse, tenantId) ?? "#DBEAFE",
            ColorInHouseDark = await SettingManager.GetSettingValueForTenantAsync(AppSettingNames.FrontDesk_RoomRack.ColorInHouseDark, tenantId) ?? "#1E3A8A",
            ColorPendingReservation = await SettingManager.GetSettingValueForTenantAsync(AppSettingNames.FrontDesk_RoomRack.ColorPendingReservation, tenantId) ?? "#FEF3C7",
            ColorPendingReservationDark = await SettingManager.GetSettingValueForTenantAsync(AppSettingNames.FrontDesk_RoomRack.ColorPendingReservationDark, tenantId) ?? "#713F12",
            ColorConfirmedReservation = await SettingManager.GetSettingValueForTenantAsync(AppSettingNames.FrontDesk_RoomRack.ColorConfirmedReservation, tenantId) ?? "#D1FAE5",
            ColorConfirmedReservationDark = await SettingManager.GetSettingValueForTenantAsync(AppSettingNames.FrontDesk_RoomRack.ColorConfirmedReservationDark, tenantId) ?? "#14532D",
            ColorCheckoutToday = await SettingManager.GetSettingValueForTenantAsync(AppSettingNames.FrontDesk_RoomRack.ColorCheckoutToday, tenantId) ?? "#BFDBFE",
            ColorCheckoutTodayDark = await SettingManager.GetSettingValueForTenantAsync(AppSettingNames.FrontDesk_RoomRack.ColorCheckoutTodayDark, tenantId) ?? "#1E40AF",
            ColorOnHoldRoom = await SettingManager.GetSettingValueForTenantAsync(AppSettingNames.FrontDesk_RoomRack.ColorOnHoldRoom, tenantId) ?? "#E2E8F0",
            ColorOnHoldRoomDark = await SettingManager.GetSettingValueForTenantAsync(AppSettingNames.FrontDesk_RoomRack.ColorOnHoldRoomDark, tenantId) ?? "#475569",
        };
    }

    [AbpAuthorize(PermissionNames.Pages_Admin_Settings)]
    public async Task UpdateAsync(RoomRackSettingsDto input)
    {
        var tenantId = AbpSession.TenantId ?? 1;
        await SettingManager.ChangeSettingForTenantAsync(tenantId, AppSettingNames.FrontDesk_RoomRack.DateRangeDays, input.DateRangeDays.ToString());
        await SettingManager.ChangeSettingForTenantAsync(tenantId, AppSettingNames.FrontDesk_RoomRack.ColorInHouse, input.ColorInHouse ?? "#DBEAFE");
        await SettingManager.ChangeSettingForTenantAsync(tenantId, AppSettingNames.FrontDesk_RoomRack.ColorInHouseDark, input.ColorInHouseDark ?? "#1E3A8A");
        await SettingManager.ChangeSettingForTenantAsync(tenantId, AppSettingNames.FrontDesk_RoomRack.ColorPendingReservation, input.ColorPendingReservation ?? "#FEF3C7");
        await SettingManager.ChangeSettingForTenantAsync(tenantId, AppSettingNames.FrontDesk_RoomRack.ColorPendingReservationDark, input.ColorPendingReservationDark ?? "#713F12");
        await SettingManager.ChangeSettingForTenantAsync(tenantId, AppSettingNames.FrontDesk_RoomRack.ColorConfirmedReservation, input.ColorConfirmedReservation ?? "#D1FAE5");
        await SettingManager.ChangeSettingForTenantAsync(tenantId, AppSettingNames.FrontDesk_RoomRack.ColorConfirmedReservationDark, input.ColorConfirmedReservationDark ?? "#14532D");
        await SettingManager.ChangeSettingForTenantAsync(tenantId, AppSettingNames.FrontDesk_RoomRack.ColorCheckoutToday, input.ColorCheckoutToday ?? "#BFDBFE");
        await SettingManager.ChangeSettingForTenantAsync(tenantId, AppSettingNames.FrontDesk_RoomRack.ColorCheckoutTodayDark, input.ColorCheckoutTodayDark ?? "#1E40AF");
        await SettingManager.ChangeSettingForTenantAsync(tenantId, AppSettingNames.FrontDesk_RoomRack.ColorOnHoldRoom, input.ColorOnHoldRoom ?? "#E2E8F0");
        await SettingManager.ChangeSettingForTenantAsync(tenantId, AppSettingNames.FrontDesk_RoomRack.ColorOnHoldRoomDark, input.ColorOnHoldRoomDark ?? "#475569");
    }
}
