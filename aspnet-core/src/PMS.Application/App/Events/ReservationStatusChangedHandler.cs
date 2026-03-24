using Abp.Dependency;
using Abp.Events.Bus.Handlers;
using Microsoft.Extensions.Logging;
using PMS.App.Events;
using System.Threading.Tasks;

namespace PMS.Application.App.Events;

public class ReservationStatusChangedHandler
    : IAsyncEventHandler<ReservationStatusChangedEvent>, ITransientDependency
{
    private readonly ILogger<ReservationStatusChangedHandler> _logger;

    public ReservationStatusChangedHandler(ILogger<ReservationStatusChangedHandler> logger)
    {
        _logger = logger;
    }

    public Task HandleEventAsync(ReservationStatusChangedEvent eventData)
    {
        _logger.LogInformation(
            "Reservation {ReservationNo} status changed from {PreviousStatus} to {NewStatus} at {ChangedAt}",
            eventData.ReservationNo,
            eventData.PreviousStatus,
            eventData.NewStatus,
            eventData.ChangedAt);

        return Task.CompletedTask;
    }
}
