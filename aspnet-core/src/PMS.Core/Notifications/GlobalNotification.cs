using Abp.Domain.Entities;
using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PMS.Notifications;

[Table("ZzzGlobalNotifications")]
public class GlobalNotification : Entity
{
    [MaxLength(512)]
    public string Message { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
}





