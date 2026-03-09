using Abp.Application.Services.Dto;
using Abp.Notifications;
using System.Collections.Generic;

namespace PMS.Notifications.Dto
{
    public class GetNotificationsOutput : PagedResultDto<UserNotification>
    {
        public int UnreadCount { get; set; }
        public int TotalRecords { get; set; }

        public GetNotificationsOutput(int totalCount, int unreadCount, int totalRecords, List<UserNotification> notifications)
            : base(totalCount, notifications)
        {
            UnreadCount = unreadCount;
            TotalRecords = totalRecords;
        }
    }
}





