using Abp.Domain.Entities.Auditing;
using Abp.Timing;
using System;
using System.Collections.Generic;

namespace PMS.App;

public class Folio : FullAuditedEntity<Guid>
{
    public string FolioNo { get; set; } = string.Empty;
    public Guid StayId { get; set; }
    public FolioStatus Status { get; set; } = FolioStatus.Open;
    public decimal Balance { get; set; }

    public virtual Stay Stay { get; set; }
    public virtual ICollection<FolioTransaction> Transactions { get; set; } = [];
    public virtual ICollection<FolioPayment> Payments { get; set; } = [];
}

public class FolioTransaction : FullAuditedEntity<Guid>
{
    public Guid FolioId { get; set; }
    public DateTime TransactionDate { get; set; } = Clock.Now;
    public FolioTransactionType TransactionType { get; set; }
    public Guid? ChargeTypeId { get; set; }
    public string Description { get; set; } = string.Empty;
    public decimal Quantity { get; set; } = 1;
    public decimal UnitPrice { get; set; }
    public decimal Amount { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal NetAmount { get; set; }
    public bool IsVoided { get; set; } = false;
    public string VoidReason { get; set; } = string.Empty;

    public virtual Folio Folio { get; set; }
    public virtual ChargeType ChargeType { get; set; }
}

public class FolioPayment : FullAuditedEntity<Guid>
{
    public Guid FolioId { get; set; }
    public Guid PaymentMethodId { get; set; }
    public decimal Amount { get; set; }
    public DateTime PaidDate { get; set; } = Clock.Now;
    public string ReferenceNo { get; set; } = string.Empty;
    public string Notes { get; set; } = string.Empty;
    public bool IsVoided { get; set; } = false;
    public string VoidReason { get; set; } = string.Empty;

    public virtual Folio Folio { get; set; }
    public virtual PaymentMethod PaymentMethod { get; set; }
}

public class FolioAdjustment : FullAuditedEntity<Guid>
{
    public Guid FolioId { get; set; }
    public string AdjustmentType { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Reason { get; set; } = string.Empty;

    public virtual Folio Folio { get; set; }
}
