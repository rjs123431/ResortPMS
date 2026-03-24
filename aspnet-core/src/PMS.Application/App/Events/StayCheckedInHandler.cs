using Abp.Dependency;
using Abp.Events.Bus.Handlers;
using Microsoft.Extensions.Logging;
using PMS.App.Events;
using System.Threading.Tasks;

namespace PMS.Application.App.Events;

public class StayCheckedInHandler
    : IAsyncEventHandler<StayCheckedInEvent>, ITransientDependency
{
    private readonly ILogger<StayCheckedInHandler> _logger;

    public StayCheckedInHandler(ILogger<StayCheckedInHandler> logger)
    {
        _logger = logger;
    }

    public Task HandleEventAsync(StayCheckedInEvent eventData)
    {
        _logger.LogInformation(
            "Stay {StayNo} checked in — Room {RoomNumber}, CheckIn {CheckInDateTime:yyyy-MM-dd}, CheckOut {ExpectedCheckOutDateTime:yyyy-MM-dd}",
            eventData.StayNo,
            eventData.RoomNumber,
            eventData.CheckInDateTime,
            eventData.ExpectedCheckOutDateTime);

        return Task.CompletedTask;
    }
}
