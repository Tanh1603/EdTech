import { RealtimeEventName } from './realtime-events';

export const RealtimeEventVersion = '1.0' as const;

export interface RealtimeEventEnvelope<
  TEvent extends RealtimeEventName = RealtimeEventName,
  TData = unknown,
> {
  event: TEvent;
  version: typeof RealtimeEventVersion;
  requestId: string;
  correlationId: string;
  occurredAt: string;
  data: TData;
}

export type RealtimeChannel =
  | 'websocket'
  | 'sse'
  | 'chat'
  | 'assessment'
  | 'notification'
  | 'ai';

