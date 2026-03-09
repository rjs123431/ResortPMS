using Abp;
using Abp.Domain.Repositories;
using Abp.Localization;
using Abp.Notifications;
using PMS.Authorization.Users;
using System.Threading.Tasks;

namespace PMS.Notifications;

public class AppNotifier : PMSDomainServiceBase, IAppNotifier
{
    private readonly INotificationPublisher _notificationPublisher;
    private readonly IRepository<User, long> _userRepository;

    public AppNotifier(
        INotificationPublisher notificationPublisher,
        IRepository<User, long> userRepository
        )
    {
        _notificationPublisher = notificationPublisher;
        _userRepository = userRepository;
    }

    public async Task SimpleMessagesToUsersAsync(UserIdentifier[] userIds, string message)
    {
        await _notificationPublisher.PublishAsync(
           AppNotificationNames.SimpleMessage,
           new MessageNotificationData(message),
           userIds: userIds
           );
    }

    public async Task SendMessageAsync(UserIdentifier user, string message, NotificationSeverity severity = NotificationSeverity.Info)
    {
        await _notificationPublisher.PublishAsync(
           AppNotificationNames.SimpleMessage,
           new MessageNotificationData(message),
           severity: severity,
           userIds: new[] { user }
           );
    }

    public async Task SomeItemsCouldntBeImported(UserIdentifier argsUser, string fileToken, string fileType, string fileName)
    {
        var notificationData = new LocalizableMessageNotificationData(
            new LocalizableString(
                "ImportItemsClickToSeeInvalidItems",
                PMSConsts.LocalizationSourceName
            )
        );

        notificationData["fileToken"] = fileToken;
        notificationData["fileType"] = fileType;
        notificationData["fileName"] = fileName;

        await _notificationPublisher.PublishAsync(AppNotificationNames.DownloadInvalidImportUsers, notificationData, userIds: new[] { argsUser });
    }

    public async Task SomeUsersCouldntBeImported(UserIdentifier argsUser, string fileToken, string fileType, string fileName)
    {
        var notificationData = new LocalizableMessageNotificationData(
            new LocalizableString(
                "ClickToSeeInvalidUsers",
                PMSConsts.LocalizationSourceName
            )
        );

        notificationData["fileToken"] = fileToken;
        notificationData["fileType"] = fileType;
        notificationData["fileName"] = fileName;

        await _notificationPublisher.PublishAsync(AppNotificationNames.DownloadInvalidImportUsers, notificationData, userIds: new[] { argsUser });
    }
}

