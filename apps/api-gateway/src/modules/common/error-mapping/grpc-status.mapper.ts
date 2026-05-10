import { status } from '@grpc/grpc-js';
import { HttpStatus } from '@nestjs/common';

export function grpcCodeToHttpStatus(code: number | undefined): number {
  if (code === status.INVALID_ARGUMENT) return HttpStatus.BAD_REQUEST;
  if (code === status.UNAUTHENTICATED) return HttpStatus.UNAUTHORIZED;
  if (code === status.PERMISSION_DENIED) return HttpStatus.FORBIDDEN;
  if (code === status.NOT_FOUND) return HttpStatus.NOT_FOUND;
  if (code === status.ALREADY_EXISTS) return HttpStatus.CONFLICT;
  if (code === status.RESOURCE_EXHAUSTED) return HttpStatus.TOO_MANY_REQUESTS;
  return HttpStatus.INTERNAL_SERVER_ERROR;
}

export function grpcCodeToErrorCode(code: number | undefined): string {
  if (code === status.INVALID_ARGUMENT) return 'VALIDATION_ERROR';
  if (code === status.UNAUTHENTICATED) return 'UNAUTHORIZED';
  if (code === status.PERMISSION_DENIED) return 'FORBIDDEN';
  if (code === status.NOT_FOUND) return 'RESOURCE_NOT_FOUND';
  if (code === status.ALREADY_EXISTS) return 'CONFLICT';
  if (code === status.RESOURCE_EXHAUSTED) return 'RATE_LIMITED';
  return 'INTERNAL_ERROR';
}
