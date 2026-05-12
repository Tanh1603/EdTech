import { Injectable, Logger } from '@nestjs/common';
import {
  AiRealtimeEventName,
  AssessmentRealtimeEventName,
  ChatRealtimeEventName,
  RealtimeEventEnvelope,
  RealtimeEventName,
  RealtimeEventVersion,
} from '@edtech/contracts';
import { Server } from 'socket.io';
import { RealtimePublishContext } from './realtime.types';

@Injectable()
export class RealtimePublisher {
  private readonly logger = new Logger(RealtimePublisher.name);
  private server?: Server;

  bindServer(server: Server): void {
    this.server = server;
  }

  publishChatEvent<TData>(
    room: string,
    event: ChatRealtimeEventName,
    data: TData,
    context: RealtimePublishContext = {},
  ): void {
    this.publish(room, event, data, context);
  }

  publishExamEvent<TData>(
    room: string,
    event: AssessmentRealtimeEventName,
    data: TData,
    context: RealtimePublishContext = {},
  ): void {
    this.publish(room, event, data, context);
  }

  publishQuestionEvent<TData>(
    room: string,
    event: AssessmentRealtimeEventName,
    data: TData,
    context: RealtimePublishContext = {},
  ): void {
    this.publish(room, event, data, context);
  }

  publishSubmissionEvent<TData>(
    room: string,
    event: AssessmentRealtimeEventName,
    data: TData,
    context: RealtimePublishContext = {},
  ): void {
    this.publish(room, event, data, context);
  }

  publishResultEvent<TData>(
    room: string,
    event: AssessmentRealtimeEventName,
    data: TData,
    context: RealtimePublishContext = {},
  ): void {
    this.publish(room, event, data, context);
  }

  publishAiEvent<TData>(
    room: string,
    event: AiRealtimeEventName,
    data: TData,
    context: RealtimePublishContext = {},
  ): void {
    this.publish(room, event, data, context);
  }

  private publish<TEvent extends RealtimeEventName, TData>(
    room: string,
    event: TEvent,
    data: TData,
    context: RealtimePublishContext,
  ): void {
    try {
      if (!this.server) {
        this.logger.warn(`Realtime server is not ready; skipped ${event}.`);
        return;
      }

      const envelope: RealtimeEventEnvelope<TEvent, TData> = {
        event,
        version: RealtimeEventVersion,
        requestId: context.requestId ?? 'unknown',
        correlationId: context.correlationId ?? context.requestId ?? 'unknown',
        occurredAt: new Date().toISOString(),
        data,
      };

      this.server.to(room).emit(event, envelope);
    } catch (error) {
      this.logger.warn(
        `Failed to publish realtime event ${event}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}

