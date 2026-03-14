import { useState, useRef, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { BellIcon } from '@heroicons/react/24/outline';
import { notificationService } from '@/services/notification.service';
import { NotificationHelper } from '@/utils/notification.helper';
import { UserNotificationState } from '@/types/notification.types';
import { useSignalR } from '@/contexts/SignalRContext';

export const HeaderNotifications = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { notifications: signalRNotifications } = useSignalR();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch recent notifications
  const { data, refetch } = useQuery({
    queryKey: ['header-notifications'],
    queryFn: ({ signal }) =>
      notificationService.getUserNotifications(
        undefined,
        undefined,
        undefined,
        5, // Limit to 5 recent notifications
        0,
        signal
      ),
    // refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Listen for real-time SignalR notifications
  useEffect(() => {
    if (signalRNotifications.length > 0) {
      // Invalidate and refetch so header list and counts stay in sync
      queryClient.invalidateQueries({ queryKey: ['header-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['user-notifications'] });
      // Approvers: refresh for-approval list and count when e.g. new leave is filed
      queryClient.invalidateQueries({ queryKey: ['approval-count'] });
      queryClient.invalidateQueries({ queryKey: ['for-approval'] });
      // Employees: refresh lists when requests are approved/declined
      queryClient.invalidateQueries({ queryKey: ['my-leaves'] });
      queryClient.invalidateQueries({ queryKey: ['my-overtimes'] });
      queryClient.invalidateQueries({ queryKey: ['my-missed-punches'] });
    }
  }, [signalRNotifications, queryClient]);

  // Also listen for ABP notification events for backward compatibility
  useEffect(() => {
    const handleNotificationReceived = () => {
      queryClient.invalidateQueries({ queryKey: ['header-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['user-notifications'] });
    };

    const handleNotificationRefresh = () => {
      refetch();
    };

    // Listen for ABP notification events
    if (typeof window !== 'undefined' && (window as any).abp?.event) {
      (window as any).abp.event.on('abp.notifications.received', handleNotificationReceived);
      (window as any).abp.event.on('app.notifications.refresh', handleNotificationRefresh);
    }

    return () => {
      if (typeof window !== 'undefined' && (window as any).abp?.event) {
        (window as any).abp.event.off('abp.notifications.received', handleNotificationReceived);
        (window as any).abp.event.off('app.notifications.refresh', handleNotificationRefresh);
      }
    };
  }, [refetch, queryClient]);

  const handleNotificationClick = async (notification: any, url: string | null) => {
    // Mark as read if unread (don't await to avoid blocking navigation)
    if (notification.state === UserNotificationState.Unread) {
      notificationService.setNotificationAsRead({ id: notification.id })
        .then(() => {
          // Invalidate queries to update the UI after successful API call
          queryClient.invalidateQueries({ queryKey: ['header-notifications'] });
          queryClient.invalidateQueries({ queryKey: ['user-notifications'] });
        })
        .catch((error) => {
          console.error('Failed to mark notification as read:', error);
        });
    }

    if (url) {
      // Check if it's an external URL
      if (url.startsWith('http://') || url.startsWith('https://')) {
        window.location.href = url;
      } else {
        navigate(url);
      }
    }
    setIsOpen(false);
  };

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const unreadCount = data?.unreadCount || 0;
  const notifications = data?.items || [];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-white hover:text-white/90 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white/50 rounded touch-manipulation"
        aria-label="Notifications"
      >
        <BellIcon className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-0 translate-y-0 bg-yellow-500 rounded-full min-w-[1.25rem]">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 max-h-[32rem] flex flex-col">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Notifications
            </h3>
          </div>

          {/* Notifications List */}
          <div className="overflow-y-hidden flex-1">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-sm text-center text-gray-500 dark:text-gray-400">
                No unread notifications
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {notifications.map((notification) => {
                  const formatted = NotificationHelper.format(notification, true);
                  const isUnread = notification.state === UserNotificationState.Unread;

                  return (
                    <button
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification, formatted.url)}
                      className={`w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                        isUnread ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          <BellIcon
                            className={`w-5 h-5 ${
                              isUnread
                                ? 'text-blue-600 dark:text-blue-400'
                                : 'text-gray-400 dark:text-gray-500'
                            }`}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm ${
                              isUnread
                                ? 'font-semibold text-gray-900 dark:text-white'
                                : 'text-gray-700 dark:text-gray-300'
                            }`}
                          >
                            {formatted.text}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {formatTimeAgo(notification.notification.creationTime)}
                          </p>
                        </div>
                        {isUnread && (
                          <div className="flex-shrink-0">
                            <span className="inline-block w-2 h-2 bg-blue-500 rounded-full"></span>
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {data && data.totalRecords > 0 && (
            <>
              <div className="border-t border-gray-200 dark:border-gray-700" />
              <Link
                to="/notifications"
                onClick={() => setIsOpen(false)}
                className="block px-4 py-3 text-sm text-center text-blue-600 dark:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 font-medium"
              >
                See All Notifications
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
};
