using Abp.Auditing;
using Abp.Dependency;
using System.Threading.Tasks;

namespace PMS.Auditing
{
    /// <summary>
    /// Custom auditing store that only saves audit logs when there are exceptions/errors
    /// or when methods start with Create/Update
    /// </summary>
    public class ErrorOnlyAuditingStore : IAuditingStore, ITransientDependency
    {
        private readonly IAuditingStore _defaultStore;

        public ErrorOnlyAuditingStore(IAuditingStore defaultStore)
        {
            _defaultStore = defaultStore;
        }

        private bool ShouldSaveAudit(AuditInfo auditInfo)
        {
            // Save if there's an exception
            if (auditInfo.Exception != null)
            {
                return true;
            }

            // Save if method name starts with Create or Update
            if (auditInfo.MethodName != null &&
                (auditInfo.MethodName.StartsWith("Create", System.StringComparison.OrdinalIgnoreCase) ||
                auditInfo.MethodName.StartsWith("Delete", System.StringComparison.OrdinalIgnoreCase) ||
                auditInfo.MethodName.StartsWith("Update", System.StringComparison.OrdinalIgnoreCase))
                )
            {
                return true;
            }

            return false;
        }

        public void Save(AuditInfo auditInfo)
        {
            if (ShouldSaveAudit(auditInfo))
            {
                _defaultStore.Save(auditInfo);
            }
        }

        public Task SaveAsync(AuditInfo auditInfo)
        {
            if (ShouldSaveAudit(auditInfo))
            {
                return _defaultStore.SaveAsync(auditInfo);
            }

            // Don't save other operations
            return Task.CompletedTask;
        }
    }
}
