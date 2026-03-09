using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Abp.Application.Services.Dto;
using Abp.Configuration;

namespace PMS.Timing
{
    public interface ITimeZoneService
    {
        Task<string> GetDefaultTimezoneAsync(SettingScopes scope, int? tenantId);

        TimeZoneInfo GetUserTimezone(int tenantId, long userId);

        TimeZoneInfo FindTimeZoneById(string timezoneId);

        List<NameValueDto> GetWindowsTimezones();
    }
}





