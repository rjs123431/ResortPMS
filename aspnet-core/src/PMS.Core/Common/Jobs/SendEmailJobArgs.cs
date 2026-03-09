using System;

namespace PMS.Common.Jobs
{
    [Serializable]
    public class SendEmailJobArgs
    {
        public string Recipient { get; set; }
        public string Cc { get; set; }
        public string Bcc { get; set; }
        public string Subject { get; set; }
        public string Body { get; set; }
        public long? SenderUserId { get; set; }
        public string SenderName { get; set; }
        public string SenderEmailAddress { get; set; }
    }
}

