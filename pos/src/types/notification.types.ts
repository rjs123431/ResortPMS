export enum UserNotificationState {
  Unread = 0,
  Read = 1
}

export enum NotificationSeverity {
  Info = 0,
  Success = 1,
  Warn = 2,
  Error = 3,
  Fatal = 4
}

export interface NotificationData {
  type: string;
  properties: Record<string, any>;
}

export interface Notification {
  notificationName: string;
  data: NotificationData;
  entityType: string | null;
  entityTypeName: string | null;
  entityId: any | null;
  severity: NotificationSeverity;
  creationTime: string;
  id: string;
}

export interface UserNotification {
  tenantId: number | null;
  userId: number;
  state: UserNotificationState;
  notification: Notification;
  id: string;
}

export interface IFormattedUserNotification {
  userNotificationId: string;
  text: string;
  time: string;
  creationTime: string;
  icon: string;
  state: string;
  data: NotificationData;
  url: string | null;
  isUnread: boolean;
}

export interface GetUserNotificationsInput {
  state?: UserNotificationState;
  startDate?: string;
  endDate?: string;
  maxResultCount: number;
  skipCount: number;
}

export interface GetNotificationsOutput {
  totalCount: number;
  unreadCount: number;
  totalRecords: number;
  items: UserNotification[];
}

export interface DeleteAllUserNotificationsInput {
  state?: UserNotificationState;
  startDate?: string;
  endDate?: string;
}

export interface GuidEntityDto {
  id: string;
}
