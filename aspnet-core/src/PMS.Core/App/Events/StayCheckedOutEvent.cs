using Abp.Events.Bus;
using System;

namespace PMS.App.Events;

public class StayCheckedOutEvent : EventData
{
    public Guid StayId { get; set; }
    public string StayNo { get; set; } = string.Empty;
    public Guid? ReservationId { get; set; }
    public DateTime ActualCheckOutDateTime { get; set; }
    public decimal TotalCharged { get; set; }
}
