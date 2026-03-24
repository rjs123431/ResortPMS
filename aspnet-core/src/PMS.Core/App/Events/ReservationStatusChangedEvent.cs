using Abp.Events.Bus;
using System;

namespace PMS.App.Events;

public class ReservationStatusChangedEvent : EventData
{
    public Guid ReservationId { get; set; }
    public string ReservationNo { get; set; } = string.Empty;
    public ReservationStatus PreviousStatus { get; set; }
    public ReservationStatus NewStatus { get; set; }
    public DateTime ChangedAt { get; set; }
}
