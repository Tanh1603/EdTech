import { status } from '@grpc/grpc-js';
import { Injectable, Logger } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { GrpcMetadataBuilder } from '../common/grpc-metadata/grpc-metadata.builder';
import { BeCoreGrpcClientService } from '../grpc-clients/be-core-grpc-client.service';
import { AuthenticatedRealtimeSocket } from './realtime.types';

export interface RealtimeAccessResult {
  ok: boolean;
  error?: 'FORBIDDEN' | 'NOT_IMPLEMENTED';
  message?: string;
}

@Injectable()
export class RealtimeAccessService {
  private readonly logger = new Logger(RealtimeAccessService.name);

  constructor(
    private readonly grpc: BeCoreGrpcClientService,
    private readonly metadataBuilder: GrpcMetadataBuilder,
  ) {}

  validateChatSession(socket: AuthenticatedRealtimeSocket, sessionId: string) {
    return this.validate(socket, 'chatSession', sessionId, () =>
      firstValueFrom(
        this.grpc.chatSessions.getSessionDetail(
          { sessionId },
          this.metadataForSocket(socket),
        ),
      ),
    );
  }

  validateClass(socket: AuthenticatedRealtimeSocket, classroomId: string) {
    return this.validate(socket, 'class', classroomId, () =>
      firstValueFrom(
        this.grpc.classrooms.getClassroomDetail(
          { classroomId },
          this.metadataForSocket(socket),
        ),
      ),
    );
  }

  validateExam(socket: AuthenticatedRealtimeSocket, examId: string) {
    return this.validate(socket, 'exam', examId, () =>
      firstValueFrom(
        this.grpc.assessmentExams.getExamDetail(
          { examId },
          this.metadataForSocket(socket),
        ),
      ),
    );
  }

  validateSubmission(socket: AuthenticatedRealtimeSocket, submissionId: string) {
    return this.validate(socket, 'submission', submissionId, () =>
      firstValueFrom(
        this.grpc.assessmentSubmissions.getSubmissionDetail(
          { submissionId },
          this.metadataForSocket(socket),
        ),
      ),
    );
  }

  validateAiChat(socket: AuthenticatedRealtimeSocket, sessionId: string) {
    return this.validateChatSession(socket, sessionId);
  }

  rejectAiJob(): RealtimeAccessResult {
    return {
      ok: false,
      error: 'NOT_IMPLEMENTED',
      message: 'This realtime channel is not available yet.',
    };
  }

  private async validate(
    socket: AuthenticatedRealtimeSocket,
    resource: string,
    resourceId: string,
    check: () => Promise<unknown>,
  ): Promise<RealtimeAccessResult> {
    try {
      await check();
      this.logger.log(
        `realtime.access.ok socketId=${socket.id} user=${socket.data.userId} resource=${resource} resourceId=${resourceId} requestId=${socket.data.requestId} correlationId=${socket.data.correlationId}`,
      );
      return { ok: true };
    } catch (error) {
      const code = this.getGrpcCode(error);
      this.logger.warn(
        `realtime.access.reject socketId=${socket.id} user=${socket.data.userId} resource=${resource} resourceId=${resourceId} code=${code ?? 'unknown'} message=${this.getErrorMessage(error)} requestId=${socket.data.requestId} correlationId=${socket.data.correlationId}`,
      );
      return {
        ok: false,
        error: 'FORBIDDEN',
        message: 'You do not have access to this resource.',
      };
    }
  }

  private metadataForSocket(socket: AuthenticatedRealtimeSocket) {
    return this.metadataBuilder.buildFromContext({
      userId: socket.data.userId,
      authorization: socket.data.authorization,
      requestId: socket.data.requestId,
      correlationId: socket.data.correlationId,
    });
  }

  private getGrpcCode(error: unknown): status | undefined {
    return typeof error === 'object' && error !== null && 'code' in error
      ? (error as { code?: status }).code
      : undefined;
  }

  private getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }
}
