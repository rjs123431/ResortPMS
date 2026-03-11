import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { signalRService } from '@/services/signalr.service';
import { useAuth } from './AuthContext';
import { UserNotification } from '@/types/notification.types';

interface SignalRContextType {
  isConnected: boolean;
  notifications: UserNotification[];
  addNotification: (notification: UserNotification) => void;
  clearNotifications: () => void;
}

const SignalRContext = createContext<SignalRContextType | undefined>(undefined);

export const SignalRProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<UserNotification[]>([]);

  useEffect(() => {
    if (isAuthenticated) {
      // Keep React isConnected in sync with actual connection state
      signalRService.onConnectionStateChange(setIsConnected);

      // Register notification handler BEFORE starting connection
      signalRService.onNotificationReceived((notification: UserNotification) => {
        console.log('New notification received:', notification);
        setNotifications((prev) => [notification, ...prev]);

        // Trigger ABP event for compatibility
        if (typeof window !== 'undefined' && (window as any).abp?.event) {
          (window as any).abp.event.trigger('abp.notifications.received', notification);
        }
      });

      signalRService.onHousekeepingTaskStatusChanged(() => {
        void queryClient.invalidateQueries({ queryKey: ['housekeeping-tasks'] });
        void queryClient.invalidateQueries({ queryKey: ['resort-guest-requests'] });
        void queryClient.invalidateQueries({ queryKey: ['resort-guest-request-completion-context'] });
      });

      signalRService.startConnection().catch((error) => {
        console.error('Failed to start SignalR connection:', error);
        setIsConnected(false);
      });
    } else {
      signalRService.stopConnection().then(() => {
        setIsConnected(false);
        setNotifications([]);
      });
    }

    return () => {
      signalRService.offNotificationReceived();
      signalRService.offHousekeepingTaskStatusChanged();
      signalRService.offConnectionStateChange();
    };
  }, [isAuthenticated, queryClient]);

  const addNotification = (notification: UserNotification) => {
    setNotifications((prev) => [notification, ...prev]);
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  return (
    <SignalRContext.Provider
      value={{
        isConnected,
        notifications,
        addNotification,
        clearNotifications,
      }}
    >
      {children}
    </SignalRContext.Provider>
  );
};

export const useSignalR = () => {
  const context = useContext(SignalRContext);
  if (context === undefined) {
    throw new Error('useSignalR must be used within a SignalRProvider');
  }
  return context;
};
