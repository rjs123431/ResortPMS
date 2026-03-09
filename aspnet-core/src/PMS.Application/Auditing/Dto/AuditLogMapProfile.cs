using Abp.Auditing;
using AutoMapper;

namespace PMS.Auditing.Dto;

public class AuditLogMapProfile : Profile
{
    public AuditLogMapProfile()
    {
        CreateMap<AuditLog, AuditLogDto>();
    }
}
