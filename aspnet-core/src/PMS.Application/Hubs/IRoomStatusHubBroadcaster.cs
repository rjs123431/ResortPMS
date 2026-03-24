using System;
using System.Threading.Tasks;

namespace PMS.Application.Hubs;

public interface IRoomStatusHubBroadcaster
{
    Task NotifyRoomStatusChangedAsync(Guid roomId, int status);
}
