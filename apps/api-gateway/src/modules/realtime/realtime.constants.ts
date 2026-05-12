export const RealtimeGatewayNamespace = '/realtime';

export const RealtimeSocketEvents = {
  connected: 'realtime.connected',
  subscribeChatSession: 'subscribe.chatSession',
  unsubscribeChatSession: 'unsubscribe.chatSession',
  subscribeClass: 'subscribe.class',
  unsubscribeClass: 'unsubscribe.class',
  subscribeExam: 'subscribe.exam',
  unsubscribeExam: 'unsubscribe.exam',
  subscribeSubmission: 'subscribe.submission',
  unsubscribeSubmission: 'unsubscribe.submission',
  subscribeAiJob: 'subscribe.aiJob',
  unsubscribeAiJob: 'unsubscribe.aiJob',
  subscribeAiChat: 'subscribe.aiChat',
  unsubscribeAiChat: 'unsubscribe.aiChat',
} as const;

export const NotificationSseStreamPath = '/api/notifications/stream';
export const NotificationSseHeartbeatIntervalMs = 30_000;
