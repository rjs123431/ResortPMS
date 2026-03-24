using Microsoft.AspNetCore.SignalR;
using System;
using System.Threading.Tasks;

namespace PMS.Application.Hubs;

public class RoomStatusHubBroadcaster : IRoomStatusHubBroadcaster
{
    public const string RoomStatusChangedEvent = "roomStatusChanged";
    private readonly IHubContext<RoomStatusHub> _hubContext;

    public RoomStatusHubBroadcaster(IHubContext<RoomStatusHub> hubContext)
    {
        _hubContext = hubContext;
    }

    public async Task NotifyRoomStatusChangedAsync(Guid roomId, int status)
    {
        await _hubContext.Clients.All.SendAsync(RoomStatusChangedEvent, new
        {
            roomId = roomId,
            status = status,
        });
    }
}
