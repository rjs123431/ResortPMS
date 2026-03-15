using Microsoft.AspNetCore.SignalR;

namespace PMS.Application.Hubs;

/// <summary>
/// SignalR hub for POS real-time notifications (orders, tables).
/// Clients receive "orderChanged" so all tabs/users can invalidate caches and refetch.
/// </summary>
public class PosHub : Hub
{
}
