import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MainLayout } from '@components/layout/MainLayout';
import { LogoSpinner } from '@components/common/LogoSpinner';
import { notificationService } from '@/services/notification.service';
import { UserNotification, UserNotificationState } from '@/types/notification.types';
import { NotificationHelper } from '@/utils/notification.helper';
import {
  CheckIcon,
  TrashIcon,
  EnvelopeOpenIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline';
import { confirmAction, notifyError, notifySuccess } from '@/utils/alerts';

export const NotificationsPage = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const pageSize = 5;

  // Fetch notifications
  const { data, isLoading } = useQuery({
    queryKey: ['user-notifications', page],
    queryFn: ({ signal }) =>
      notificationService.getUserNotifications(
        undefined,
        undefined,
        undefined,
        pageSize,
        page * pageSize,
        signal
      ),
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => notificationService.setNotificationAsRead({ id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['header-notifications'] });
      notifySuccess('Notification marked as read.');
      // Trigger refresh event for header notifications
      if (typeof window !== 'undefined' && (window as any).abp?.event) {
        (window as any).abp.event.trigger('app.notifications.refresh');
      }
    },
    onError: (error: any) => {
      console.error('Error marking notification as read:', error);
      const message =
        error?.response?.data?.error?.message || 'Failed to mark notification as read.';
      notifyError(message);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => notificationService.deleteNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['header-notifications'] });
      notifySuccess('Notification deleted successfully.');
      // Trigger refresh event for header notifications
      if (typeof window !== 'undefined' && (window as any).abp?.event) {
        (window as any).abp.event.trigger('app.notifications.refresh');
      }
    },
    onError: (error: any) => {
      console.error('Error deleting notification:', error);
      const message = error?.response?.data?.error?.message || 'Failed to delete notification.';
      notifyError(message);
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationService.setAllNotificationsAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['header-notifications'] });
      notifySuccess('All notifications marked as read.');
      // Trigger refresh event for header notifications
      if (typeof window !== 'undefined' && (window as any).abp?.event) {
        (window as any).abp.event.trigger('app.notifications.refresh');
      }
    },
    onError: (error: any) => {
      console.error('Error marking all notifications as read:', error);
      const message =
        error?.response?.data?.error?.message || 'Failed to mark all notifications as read.';
      notifyError(message);
    },
  });

  // Delete all read mutation
  const deleteAllReadMutation = useMutation({
    mutationFn: () =>
      notificationService.deleteAllUserNotifications(
        UserNotificationState.Read,
        undefined,
        undefined
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['header-notifications'] });
      notifySuccess('All read notifications deleted successfully.');
      // Trigger refresh event for header notifications
      if (typeof window !== 'undefined' && (window as any).abp?.event) {
        (window as any).abp.event.trigger('app.notifications.refresh');
      }
    },
    onError: (error: any) => {
      console.error('Error deleting all read notifications:', error);
      const message =
        error?.response?.data?.error?.message || 'Failed to delete all read notifications.';
      notifyError(message);
    },
  });

  const handleMarkAsRead = (notification: UserNotification) => {
    if (notification.state === UserNotificationState.Unread) {
      markAsReadMutation.mutate(notification.id);
    }
  };

  const handleDelete = async (notification: UserNotification) => {
    const result = await confirmAction('Are you sure you want to delete this notification?');
    if (result.isConfirmed) {
      deleteMutation.mutate(notification.id);
    }
  };

  const handleMarkAllAsRead = async () => {
    const result = await confirmAction('Are you sure you want to mark all notifications as read?');
    if (result.isConfirmed) {
      markAllAsReadMutation.mutate();
    }
  };

  const handleDeleteAllRead = async () => {
    const result = await confirmAction(
      'Are you sure you want to delete all read notifications?'
    );
    if (result.isConfirmed) {
      deleteAllReadMutation.mutate();
    }
  };

  const truncateText = (text: string, maxLength: number = 120): string => {
    return NotificationHelper.truncateStringWithPostfix(text, maxLength);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const totalPages = data ? Math.ceil(data.totalCount / pageSize) : 0;

  return (
    <MainLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            Notifications
          </h1>
          <div className="flex items-center gap-2">
            <button
              onClick={handleMarkAllAsRead}
              disabled={markAllAsReadMutation.isPending || !data?.unreadCount}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckIcon className="w-4 h-4" />
              Mark All as Read
            </button>
            <button
              onClick={handleDeleteAllRead}
              disabled={deleteAllReadMutation.isPending}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <TrashIcon className="w-4 h-4" />
              Delete All Read
            </button>
          </div>
        </div>

        {/* Stats */}
        {data && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Notifications
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {data.totalRecords}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Unread
                  </p>
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {data.unreadCount}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Read
                  </p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {data.totalRecords - data.unreadCount}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <LogoSpinner spinnerClassName="border-b-2 border-blue-500" />
          </div>
        ) : (
          <>
            {/* Table for larger screens */}
            <div className="hidden sm:block bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Message
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-48">
                        Date
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-32">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {data?.items && data.items.length > 0 ? (
                      data.items.map((notification) => {
                        const formatted = NotificationHelper.format(notification, false);
                        const isUnread = notification.state === UserNotificationState.Unread;
                        return (
                          <tr
                            key={notification.id}
                            className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${
                              isUnread ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                            }`}
                          >
                            <td
                              className={`px-6 py-4 text-sm ${
                                isUnread
                                  ? 'font-semibold text-gray-900 dark:text-white'
                                  : 'text-gray-600 dark:text-gray-400'
                              }`}
                            >
                              {formatted.url ? (
                                <a
                                  href={formatted.url}
                                  className="text-blue-600 dark:text-blue-400 hover:underline"
                                  title={formatted.text}
                                >
                                  {truncateText(formatted.text)}
                                </a>
                              ) : (
                                <span title={formatted.text}>{truncateText(formatted.text)}</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {formatDate(notification.notification.creationTime)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => handleMarkAsRead(notification)}
                                  disabled={!isUnread || markAsReadMutation.isPending}
                                  className={`inline-flex items-center p-1.5 rounded ${
                                    isUnread
                                      ? 'text-yellow-600 hover:text-yellow-700 dark:text-yellow-400 dark:hover:text-yellow-300 hover:bg-yellow-50 dark:hover:bg-yellow-900/20'
                                      : 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                                  }`}
                                  title={isUnread ? 'Mark as read' : 'Already read'}
                                >
                                  {isUnread ? (
                                    <EnvelopeIcon className="w-5 h-5" />
                                  ) : (
                                    <EnvelopeOpenIcon className="w-5 h-5" />
                                  )}
                                </button>
                                <button
                                  onClick={() => handleDelete(notification)}
                                  disabled={deleteMutation.isPending}
                                  className="inline-flex items-center p-1.5 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                                  title="Delete"
                                >
                                  <TrashIcon className="w-5 h-5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td
                          colSpan={3}
                          className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400"
                        >
                          No notifications found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Cards for mobile */}
            <div className="sm:hidden space-y-3">
              {data?.items && data.items.length > 0 ? (
                data.items.map((notification) => {
                  const formatted = NotificationHelper.format(notification, false);
                  const isUnread = notification.state === UserNotificationState.Unread;
                  return (
                    <div
                      key={notification.id}
                      className={`bg-white dark:bg-gray-800 rounded-lg shadow p-4 space-y-3 ${
                        isUnread ? 'border-l-4 border-blue-500' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p
                            className={`text-sm ${
                              isUnread
                                ? 'font-semibold text-gray-900 dark:text-white'
                                : 'text-gray-600 dark:text-gray-400'
                            }`}
                          >
                            {formatted.url ? (
                              <a
                                href={formatted.url}
                                className="text-blue-600 dark:text-blue-400 hover:underline"
                              >
                                {truncateText(formatted.text, 80)}
                              </a>
                            ) : (
                              truncateText(formatted.text, 80)
                            )}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {formatDate(notification.notification.creationTime)}
                          </p>
                        </div>
                        {isUnread && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                            New
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                        {isUnread && (
                          <button
                            onClick={() => handleMarkAsRead(notification)}
                            disabled={markAsReadMutation.isPending}
                            className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-yellow-600 bg-yellow-50 rounded-md hover:bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400 dark:hover:bg-yellow-900/30"
                          >
                            <EnvelopeOpenIcon className="w-4 h-4" />
                            Mark as Read
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(notification)}
                          disabled={deleteMutation.isPending}
                          className={`${
                            isUnread ? 'flex-1' : 'w-full'
                          } inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30`}
                        >
                          <TrashIcon className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center text-sm text-gray-500 dark:text-gray-400">
                  No notifications found.
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg shadow px-4 py-3">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                    className="relative ml-3 inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Showing{' '}
                      <span className="font-medium">{page * pageSize + 1}</span> to{' '}
                      <span className="font-medium">
                        {Math.min((page + 1) * pageSize, data?.totalCount || 0)}
                      </span>{' '}
                      of <span className="font-medium">{data?.totalCount || 0}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => setPage((p) => Math.max(0, p - 1))}
                        disabled={page === 0}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                        let pageNum: number;
                        if (totalPages <= 5) {
                          pageNum = i;
                        } else if (page < 3) {
                          pageNum = i;
                        } else if (page >= totalPages - 3) {
                          pageNum = totalPages - 5 + i;
                        } else {
                          pageNum = page - 2 + i;
                        }

                        return (
                          <button
                            key={pageNum}
                            onClick={() => setPage(pageNum)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              page === pageNum
                                ? 'z-10 bg-blue-50 border-blue-500 text-blue-600 dark:bg-blue-900/30 dark:border-blue-500 dark:text-blue-400'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-600'
                            }`}
                          >
                            {pageNum + 1}
                          </button>
                        );
                      })}
                      <button
                        onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                        disabled={page >= totalPages - 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </MainLayout>
  );
};
