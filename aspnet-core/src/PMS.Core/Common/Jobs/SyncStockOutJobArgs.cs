using System;

namespace PMS.Common.Jobs
{
    [Serializable]
    public class SyncStockOutJobArgs
    {
        public string StockOutId { get; set; } = string.Empty;
        public bool ForceSync { get; set; } = false;
    }
}

