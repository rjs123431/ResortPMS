using Abp.Events.Bus;
using System;

namespace PMS.App.Events;

public class StayCheckedInEvent : EventData
{
    public Guid StayId { get; set; }
    public string StayNo { get; set; } = string.Empty;
    public Guid? ReservationId { get; set; }
    public Guid RoomId { get; set; }
    public string RoomNumber { get; set; } = string.Empty;
    public DateTime CheckInDateTime { get; set; }
    public DateTime ExpectedCheckOutDateTime { get; set; }
}
