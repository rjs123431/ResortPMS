using System;

namespace PMS.Common.Jobs
{
    [Serializable]
    public class SyncStockAdjustmentJobArgs
    {
        public string StockAdjustmentId { get; set; } = string.Empty;
        public bool ForceSync { get; set; } = false;
    }
}

