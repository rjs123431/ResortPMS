import {
  UserNotification,
  IFormattedUserNotification,
  NotificationSeverity,
  UserNotificationState
} from '@/types/notification.types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:21021';

export class NotificationHelper {
  private static getUiIconBySeverity(severity: NotificationSeverity): string {
    switch (severity) {
      case NotificationSeverity.Success:
        return 'fas fa-check-circle';
      case NotificationSeverity.Warn:
        return 'fas fa-exclamation-triangle';
      case NotificationSeverity.Error:
        return 'fas fa-exclamation-circle';
      case NotificationSeverity.Fatal:
        return 'fas fa-bomb';
      case NotificationSeverity.Info:
      default:
        return 'fas fa-info-circle';
    }
  }

  private static getRequestId(data: { properties?: Record<string, unknown> }): number | null {
    const props = data?.properties ?? {};
    const id = props['requestId'] ?? props['RequestId'];
    if (id === undefined || id === null) return null;
    const n = Number(id);
    return Number.isFinite(n) && n > 0 ? n : null;
  }

  private static getStatus(data: { properties?: Record<string, unknown> }): string | null {
    const props = data?.properties ?? {};
    const s = props['status'] ?? props['Status'];
    return typeof s === 'string' ? s : null;
  }

  private static getUrl(userNotification: UserNotification): string | null {
    const notificationName = userNotification.notification.notificationName;
    const data = userNotification.notification.data;
    const requestId = this.getRequestId(data);
    const status = this.getStatus(data);

    switch (notificationName) {
      case 'App.NewLeaveRequest':
        return requestId != null ? `/for-approval/leave/${requestId}` : '/for-approval';
      case 'App.LeaveChangeStatus':
        return requestId != null ? `/leave-requests/${requestId}` : '/leave-requests';
      case 'App.NewOvertimeRequest':
        return requestId != null ? `/for-approval/overtime/${requestId}` : '/for-approval';
      case 'App.OvertimeRequestChangeStatus':
        if (requestId == null) return '/for-approval';
        return status === 'Pending' ? `/for-approval/overtime/${requestId}` : `/overtime-requests/${requestId}`;
      case 'App.MissedPunchRequestChangeStatus':
        if (requestId == null) return '/for-approval';
        return status === 'Pending' ? `/for-approval/missed-punch/${requestId}` : `/missed-punch-requests/${requestId}`;
      case 'App.NewTravelOrderRequest':
        return requestId != null ? `/for-approval/travel-order/${requestId}` : '/for-approval';
      case 'App.TravelOrderRequestChangeStatus':
        if (requestId == null) return '/for-approval';
        return status === 'Pending' ? `/for-approval/travel-order/${requestId}` : `/travel-order-requests/${requestId}`;
      case 'App.NewUserRegistered':
        return `/admin/users?filterText=${data.properties.emailAddress}`;
      case 'App.NewTenantRegistered':
        return `/admin/tenants?filterText=${data.properties.tenancyName}`;
      case 'App.GdprDataPrepared':
        return `${API_BASE_URL}/File/DownloadBinaryFile?id=${data.properties.binaryObjectId}&contentType=application/zip&fileName=collectedData.zip`;
      case 'App.DownloadInvalidImportUsers':
        return `${API_BASE_URL}/File/DownloadTempFile?fileToken=${data.properties.fileToken}&fileType=${data.properties.fileType}&fileName=${data.properties.fileName}`;
      default:
        return null;
    }
  }

  private static getFormattedMessageFromUserNotification(userNotification: UserNotification): string {
    const notification = userNotification.notification;
    // Handle both 'Message' (capital M from API) and 'message' (lowercase)
    let message = notification.data.properties?.Message || notification.data.properties?.message || '';

    // If no message in properties, construct from notification name
    if (!message) {
      message = notification.notificationName.replace(/\./g, ' ');
    }

    return message;
  }

  private static getUserNotificationStateAsString(state: UserNotificationState): string {
    return state === UserNotificationState.Unread ? 'UNREAD' : 'READ';
  }

  private static truncateString(text: string, maxLength: number): string {
    if (text.length <= maxLength) {
      return text;
    }
    return text.substring(0, maxLength) + '...';
  }

  static format(
    userNotification: UserNotification,
    truncateText: boolean = true
  ): IFormattedUserNotification {
    let text = this.getFormattedMessageFromUserNotification(userNotification);

    if (truncateText) {
      text = this.truncateString(text, 100);
    }

    const formatted: IFormattedUserNotification = {
      userNotificationId: userNotification.id,
      text: text,
      time: new Date(userNotification.notification.creationTime).toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }),
      creationTime: userNotification.notification.creationTime,
      icon: this.getUiIconBySeverity(userNotification.notification.severity),
      state: this.getUserNotificationStateAsString(userNotification.state),
      data: userNotification.notification.data,
      url: this.getUrl(userNotification),
      isUnread: userNotification.state === UserNotificationState.Unread
    };

    return formatted;
  }

  static truncateStringWithPostfix(text: string, maxLength: number): string {
    return this.truncateString(text, maxLength);
  }
}
