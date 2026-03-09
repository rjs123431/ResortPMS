using Abp.Events.Bus;
using PMS.App;
using System;

namespace PMS.App.Events;

public class TransactionCreatedEvent : EventData
{
    public TransactionTypeEnum TransactionType { get; set; }
    public string TransactionId { get; set; } = string.Empty;
    public string DocNo { get; set; } = string.Empty;
    public DateTime DocDate { get; set; }
    public int WarehouseId { get; set; }
    public string WarehouseName { get; set; } = string.Empty;
}

