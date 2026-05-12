import { MessageEvent } from '@nestjs/common';
import { Injectable, Logger } from '@nestjs/common';
import {
  NotificationRealtimeEventName,
  NotificationRealtimeEvents,
  RealtimeEventEnvelope,
  RealtimeEventVersion,
} from '@edtech/contracts';
import { interval, merge, Observable, Subject } from 'rxjs';
import { finalize, map } from 'rxjs/operators';

interface NotificationStreamState {
  subject: Subject<MessageEvent>;
  subscribers: number;
}

interface NotificationPublishContext {
  requestId?: string;
  correlationId?: string;
}

@Injectable()
export class NotificationStreamService {
  private readonly logger = new Logger(NotificationStreamService.name);
  private readonly streams = new Map<string, NotificationStreamState>();

  stream(userId: string): Observable<MessageEvent> {
    const state = this.getOrCreateState(userId);
    state.subscribers += 1;

    const heartbeat$ = interval(30_000).pipe(
      map(() =>
        this.toMessageEvent(NotificationRealtimeEvents.heartbeat, {
          now: new Date().toISOString(),
        }),
      ),
    );

    return merge(state.subject.asObservable(), heartbeat$).pipe(
      finalize(() => this.release(userId)),
    );
  }

  publishToUser<TData>(
    userId: string | undefined,
    event: NotificationRealtimeEventName,
    data: TData,
    context: NotificationPublishContext = {},
  ): void {
    if (!userId) {
      return;
    }

    const state = this.streams.get(userId);
    if (!state) {
      return;
    }

    try {
      state.subject.next(this.toMessageEvent(event, data, context));
    } catch (error) {
      this.logger.warn(
        `Failed to publish notification SSE event ${event}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  private getOrCreateState(userId: string): NotificationStreamState {
    const existing = this.streams.get(userId);
    if (existing) {
      return existing;
    }

    const state: NotificationStreamState = {
      subject: new Subject<MessageEvent>(),
      subscribers: 0,
    };
    this.streams.set(userId, state);
    return state;
  }

  private release(userId: string): void {
    const state = this.streams.get(userId);
    if (!state) {
      return;
    }

    state.subscribers -= 1;
    if (state.subscribers <= 0) {
      state.subject.complete();
      this.streams.delete(userId);
    }
  }

  private toMessageEvent<TData>(
    event: NotificationRealtimeEventName,
    data: TData,
    context: NotificationPublishContext = {},
  ): MessageEvent {
    const envelope: RealtimeEventEnvelope<NotificationRealtimeEventName, TData> = {
      event,
      version: RealtimeEventVersion,
      requestId: context.requestId ?? 'unknown',
      correlationId: context.correlationId ?? context.requestId ?? 'unknown',
      occurredAt: new Date().toISOString(),
      data,
    };

    return {
      type: event,
      data: envelope,
    };
  }
}

