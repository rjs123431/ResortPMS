using Abp.AutoMapper;
using System;

namespace PMS.Notifications.Dto
{
    [AutoMapFrom(typeof(GlobalNotification))]
    public class GlobalNotificationDto
    {
        public string Message { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
    }
}





