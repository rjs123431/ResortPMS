using System.Threading.Tasks;

namespace PMS.Auditing;

/// <summary>
/// Records full mutation trail for key entities (reservation, stay, folio, etc.).
/// Does not replace or change the existing ABP auditing store.
/// </summary>
public interface IMutationAuditService
{
    Task RecordAsync(
        string entityType,
        string entityId,
        string action,
        object? oldValue = null,
        object? newValue = null,
        string? methodName = null,
        string? extra = null);
}
