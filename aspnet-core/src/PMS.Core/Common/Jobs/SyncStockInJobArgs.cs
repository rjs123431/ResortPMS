using System;

namespace PMS.Common.Jobs
{
    [Serializable]
    public class SyncStockInJobArgs
    {
        public string StockInId { get; set; } = string.Empty;
        public bool ForceSync { get; set; } = false;
    }
}

