using System;

namespace PMS.Common.Jobs
{
    [Serializable]
    public class SyncPhysicalCountJobArgs
    {
        public string PhysicalCountId { get; set; } = string.Empty;
        public bool ForceSync { get; set; } = false;
    }
}

