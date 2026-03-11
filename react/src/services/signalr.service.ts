import * as signalR from '@microsoft/signalr';
import { getBaseUrl } from '@/utils/baseUrl';
import { authService } from './auth.service';

/** AbpCommonHub endpoint; auth is via query string ss_enc_auth_token (encrypted token), not Bearer */
function getSignalRHubUrl(): string {
  return getSignalRUrl('/signalr');
}

function getPhysicalCountHubUrl(): string {
  return getSignalRUrl('/signalr-physicalcount');
}

function getSignalRUrl(path: string): string {
  const base = getBaseUrl(path);
  const encryptedToken = authService.getEncryptedToken();
  if (!encryptedToken) {
    return base;
  }
  const separator = base.includes('?') ? '&' : '?';
  return `${base}${separator}ss_enc_auth_token=${encodeURIComponent(encryptedToken)}`;
}

export class SignalRService {
  private connection: signalR.HubConnection | null = null;
  private dedicatedConnection: signalR.HubConnection | null = null;
  private isConnecting = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 5000; // 5 seconds
  private notificationCallback: ((notification: any) => void) | null = null;
  private housekeepingTaskStatusChangedCallback: ((payload: any) => void) | null = null;
  private connectionStateCallback: ((connected: boolean) => void) | null = null;

  async startConnection(): Promise<void> {
    if (this.connection?.state === signalR.HubConnectionState.Connected || this.isConnecting) {
      return;
    }

    const encryptedToken = authService.getEncryptedToken();
    if (!encryptedToken) {
      console.log('SignalR: No auth token found, skipping connection');
      return;
    }

    this.isConnecting = true;
    const hubUrl = getSignalRHubUrl();
    const physicalCountHubUrl = getPhysicalCountHubUrl();

    try {
      this.connection = new signalR.HubConnectionBuilder()
        .withUrl(hubUrl, {
          skipNegotiation: false,
          transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.ServerSentEvents | signalR.HttpTransportType.LongPolling
        })
        .withAutomaticReconnect({
          nextRetryDelayInMilliseconds: (retryContext) => {
            if (retryContext.previousRetryCount >= this.maxReconnectAttempts) {
              return null; // Stop reconnecting
            }
            return this.reconnectDelay;
          },
        })
        .configureLogging(signalR.LogLevel.Information)
        .build();

      this.dedicatedConnection = new signalR.HubConnectionBuilder()
        .withUrl(physicalCountHubUrl, {
          skipNegotiation: false,
          transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.ServerSentEvents | signalR.HttpTransportType.LongPolling,
        })
        .withAutomaticReconnect()
        .configureLogging(signalR.LogLevel.Information)
        .build();

      // Register event handlers BEFORE starting connection
      this.registerEventHandlers();

      // Connection event handlers
      this.connection.onreconnecting((error) => {
        console.log('SignalR: Reconnecting...', error);
        this.reconnectAttempts++;
        this.connectionStateCallback?.(false);
      });

      this.connection.onreconnected((connectionId) => {
        console.log('SignalR: Reconnected successfully', connectionId);
        this.reconnectAttempts = 0;
        this.registerEventHandlers();
        this.connectionStateCallback?.(true);
      });

      this.connection.onclose((error) => {
        console.log('SignalR: Connection closed', error);
        this.isConnecting = false;
        this.connectionStateCallback?.(false);
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          setTimeout(() => {
            this.startConnection().catch(console.error);
          }, this.reconnectDelay);
        }
      });

      await this.connection.start();
      await this.dedicatedConnection.start();
      console.log('SignalR: Connected successfully');
      this.reconnectAttempts = 0;
      this.connectionStateCallback?.(true);
    } catch (error) {
      console.error('SignalR: Failed to start connection', error);
      this.reconnectAttempts++;
      this.connectionStateCallback?.(false);
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        setTimeout(() => {
          this.startConnection().catch(console.error);
        }, this.reconnectDelay);
      }
    } finally {
      this.isConnecting = false;
    }
  }

  onConnectionStateChange(callback: (connected: boolean) => void): void {
    this.connectionStateCallback = callback;
    if (this.connection) {
      callback(this.connection.state === signalR.HubConnectionState.Connected);
    }
  }

  offConnectionStateChange(): void {
    this.connectionStateCallback = null;
  }

  async stopConnection(): Promise<void> {
    if (this.connection) {
      try {
        await this.connection.stop();
        if (this.dedicatedConnection) {
          await this.dedicatedConnection.stop();
        }
        console.log('SignalR: Connection stopped');
      } catch (error) {
        console.error('SignalR: Error stopping connection', error);
      }
      this.connection = null;
      this.dedicatedConnection = null;
      this.isConnecting = false;
      this.reconnectAttempts = 0;
      this.connectionStateCallback?.(false);
    }
  }

  private registerEventHandlers(): void {
    if (!this.connection) {
      return;
    }

    // Remove existing handlers to avoid duplicates
    this.connection.off('getNotification');
    this.dedicatedConnection?.off('housekeepingTaskStatusChanged');

    // Register notification handler if callback is set
    if (this.notificationCallback) {
      this.connection.on('getNotification', (notification) => {
        console.log('SignalR: Notification received', notification);
        this.notificationCallback?.(notification);
      });
    }

    if (this.dedicatedConnection && this.housekeepingTaskStatusChangedCallback) {
      this.dedicatedConnection.on('housekeepingTaskStatusChanged', (payload) => {
        this.housekeepingTaskStatusChangedCallback?.(payload);
      });
    }
  }

  onNotificationReceived(callback: (notification: any) => void): void {
    // Store the callback
    this.notificationCallback = callback;

    // If connection exists, register the handler immediately
    if (this.connection) {
      this.registerEventHandlers();
    }
  }

  offNotificationReceived(): void {
    // Clear the callback
    this.notificationCallback = null;

    // Remove the handler from connection
    if (this.connection) {
      this.connection.off('getNotification');
    }
  }

  onHousekeepingTaskStatusChanged(callback: (payload: any) => void): void {
    this.housekeepingTaskStatusChangedCallback = callback;
    if (this.dedicatedConnection) {
      this.registerEventHandlers();
    }
  }

  offHousekeepingTaskStatusChanged(): void {
    this.housekeepingTaskStatusChangedCallback = null;
    if (this.dedicatedConnection) {
      this.dedicatedConnection.off('housekeepingTaskStatusChanged');
    }
  }

  getConnectionState(): signalR.HubConnectionState | null {
    return this.connection?.state ?? null;
  }

  isConnected(): boolean {
    return this.connection?.state === signalR.HubConnectionState.Connected;
  }
}

// Singleton instance
export const signalRService = new SignalRService();
