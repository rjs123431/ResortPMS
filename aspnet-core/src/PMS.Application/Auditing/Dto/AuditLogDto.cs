using Abp.Application.Services.Dto;
using System;

namespace PMS.Auditing.Dto;

public class AuditLogDto : EntityDto<long>
{
    public virtual long? UserId { get; set; }
    public virtual string ServiceName { get; set; }
    public virtual string MethodName { get; set; }
    public virtual string Parameters { get; set; }
    public virtual string ReturnValue { get; set; }
    public virtual DateTime ExecutionTime { get; set; }
    public virtual int ExecutionDuration { get; set; }
    public virtual string ClientIpAddress { get; set; }
    public virtual string ClientName { get; set; }
    public virtual string BrowserInfo { get; set; }
    public virtual string ExceptionMessage { get; set; }
    public virtual string Exception { get; set; }
}

