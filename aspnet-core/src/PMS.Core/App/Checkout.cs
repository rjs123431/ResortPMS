using Abp.Domain.Entities.Auditing;
using Abp.Timing;
using System;
using System.Collections.Generic;

namespace PMS.App;

public class CheckOutRecord : FullAuditedEntity<Guid>
{
    public Guid StayId { get; set; }
    public DateTime CheckOutDateTime { get; set; } = Clock.Now;
    public decimal TotalCharges { get; set; }
    public decimal TotalPayments { get; set; }
    public decimal TotalDiscounts { get; set; }
    public decimal BalanceDue { get; set; }
    public decimal SettledAmount { get; set; }

    public virtual Stay Stay { get; set; }
}

public class Receipt : FullAuditedEntity<Guid>
{
    public string ReceiptNo { get; set; } = string.Empty;
    public Guid StayId { get; set; }
    public decimal Amount { get; set; }
    public DateTime IssuedDate { get; set; } = Clock.Now;

    public virtual Stay Stay { get; set; }
    public virtual ICollection<ReceiptPayment> Payments { get; set; } = [];
}

public class ReceiptPayment : CreationAuditedEntity<Guid>
{
    public Guid ReceiptId { get; set; }
    public Guid PaymentMethodId { get; set; }
    public decimal Amount { get; set; }

    public virtual Receipt Receipt { get; set; }
    public virtual PaymentMethod PaymentMethod { get; set; }
}
