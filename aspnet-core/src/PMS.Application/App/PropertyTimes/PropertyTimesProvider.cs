using Abp.Dependency;
using Abp.Domain.Repositories;
using Microsoft.EntityFrameworkCore;
using PMS.App;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace PMS.Application.App.PropertyTimes;

/// <summary>Provides property-wide check-in and check-out times from active RoomRatePlanGroup plans (default 2 PM / 12 noon).</summary>
public interface IPropertyTimesProvider : ITransientDependency
{
    Task<(TimeSpan checkIn, TimeSpan checkOut)> GetDefaultCheckInCheckOutTimesAsync();
}

public class PropertyTimesProvider(
    IRepository<RoomRatePlan, Guid> ratePlanRepository
) : IPropertyTimesProvider
{
    private const int DefaultCheckInHour = 14;
    private const int DefaultCheckOutHour = 12;
    private static readonly TimeSpan DefaultCheckIn = new(DefaultCheckInHour, 0, 0);
    private static readonly TimeSpan DefaultCheckOut = new(DefaultCheckOutHour, 0, 0);

    public async Task<(TimeSpan checkIn, TimeSpan checkOut)> GetDefaultCheckInCheckOutTimesAsync()
    {
        var plan = await ratePlanRepository.GetAll()
            .Include(rp => rp.RoomRatePlanGroup)
            .Where(rp => rp.RoomRatePlanGroup.IsActive)
            .OrderByDescending(rp => rp.RoomRatePlanGroup.IsDefault)
            .ThenBy(rp => rp.RoomRatePlanGroup.Priority)
            .FirstOrDefaultAsync();
        if (plan == null)
            return (DefaultCheckIn, DefaultCheckOut);
        return (plan.CheckInTime, plan.CheckOutTime);
    }
}
