using Abp.Auditing;
using Abp.Domain.Repositories;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace PMS.DataAccess;

public interface IDynamicRepository : IRepository<AuditLog, long>
{
    Task<List<dynamic>> ExecuteSqlAsync(string sql);
}

