import { NotificationRealtimeEvents } from './realtime-events';

export interface HeartbeatPayload {
  now: string;
}

export interface UnreadCountUpdatedPayload {
  count: number;
}

export interface NotificationRealtimePayloads {
  [NotificationRealtimeEvents.heartbeat]: HeartbeatPayload;
  [NotificationRealtimeEvents.notificationCreated]: unknown;
  [NotificationRealtimeEvents.notificationRead]: unknown;
  [NotificationRealtimeEvents.notificationReadAll]: unknown;
  [NotificationRealtimeEvents.unreadCountUpdated]: UnreadCountUpdatedPayload;
}

