using Abp.Dependency;
using Abp.Events.Bus.Handlers;
using Microsoft.Extensions.Logging;
using PMS.App.Events;
using System.Threading.Tasks;

namespace PMS.Application.App.Events;

public class StayCheckedOutHandler
    : IAsyncEventHandler<StayCheckedOutEvent>, ITransientDependency
{
    private readonly ILogger<StayCheckedOutHandler> _logger;

    public StayCheckedOutHandler(ILogger<StayCheckedOutHandler> logger)
    {
        _logger = logger;
    }

    public Task HandleEventAsync(StayCheckedOutEvent eventData)
    {
        _logger.LogInformation(
            "Stay {StayNo} checked out at {CheckOutTime}, TotalCharged {TotalCharged:C}",
            eventData.StayNo,
            eventData.ActualCheckOutDateTime,
            eventData.TotalCharged);

        return Task.CompletedTask;
    }
}
