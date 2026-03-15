using System;
using System.Threading.Tasks;

namespace PMS.Application.Hubs;

/// <summary>
/// Broadcasts POS order changes to all connected clients (all tabs, all users)
/// so they can invalidate caches and show fresh data.
/// </summary>
public interface IPosHubBroadcaster
{
    Task NotifyOrderChangedAsync(Guid? orderId, Guid? outletId, Guid? tableId, string eventType);
}
