using Microsoft.AspNetCore.SignalR;
using System;
using System.Threading.Tasks;

namespace PMS.Application.Hubs;

public class PosHubBroadcaster : IPosHubBroadcaster
{
    public const string OrderChangedEvent = "orderChanged";
    private readonly IHubContext<PosHub> _hubContext;

    public PosHubBroadcaster(IHubContext<PosHub> hubContext)
    {
        _hubContext = hubContext;
    }

    public async Task NotifyOrderChangedAsync(Guid? orderId, Guid? outletId, Guid? tableId, string eventType)
    {
        await _hubContext.Clients.All.SendAsync(OrderChangedEvent, new
        {
            orderId = orderId,
            outletId = outletId,
            tableId = tableId,
            eventType = eventType,
        });
    }
}
