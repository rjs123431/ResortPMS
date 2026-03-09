namespace PMS.Configuration.Dto
{
    public class CustomUserConfigurationDto
    {
        public bool IsSite { get; set; }
        public int? SiteId { get; set; }
        public string SiteCode { get; set; } = string.Empty;
        public string SiteName { get; set; } = string.Empty;
        public string CentralOfficeBaseUrl { get; set; } = string.Empty;
        public bool HasOngoingPhysicalCount { get; set; }
        public string OngoingPhysicalCountDocNo { get; set; } = string.Empty;
        public int? OngoingPhysicalCountWarehouseId { get; set; }
        public string OngoingPhysicalCountWarehouseName { get; set; } = string.Empty;
        public string PayrollDatabaseName { get; set; } = string.Empty;
    }
}

