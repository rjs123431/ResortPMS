using Abp;
using Abp.Notifications;
using System.Threading.Tasks;

namespace PMS.Notifications;

public interface IAppNotifier
{
    Task SendMessageAsync(UserIdentifier user, string message,
        NotificationSeverity severity = NotificationSeverity.Info);

    Task SomeUsersCouldntBeImported(UserIdentifier argsUser, string fileToken, string fileType, string fileName);
    Task SomeItemsCouldntBeImported(UserIdentifier argsUser, string fileToken, string fileType, string fileName);
}



