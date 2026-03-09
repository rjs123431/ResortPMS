using Abp.Notifications;
using System;

namespace PMS.Notifications;

[Serializable]
public class ProgressBarNotificationData : MessageNotificationData
{
    public ProgressBarNotificationData(string message, int value, int max) : base(message)
    {
        Message = message;

        base.Properties.Add("Value", value);
        base.Properties.Add("Max", max);
    }
   
}

