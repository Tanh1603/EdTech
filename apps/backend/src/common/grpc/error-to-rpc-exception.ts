import { status } from '@grpc/grpc-js';
import { HttpException, HttpStatus } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';

export function toRpcException(error: unknown): RpcException {
  if (error instanceof RpcException) {
    return error;
  }

  if (isPrismaKnownRequestError(error)) {
    return new RpcException({
      code: mapPrismaCode(error.code),
      message: mapPrismaMessage(error.code),
    });
  }

  if (error instanceof HttpException) {
    return new RpcException({
      code: mapHttpStatus(error.getStatus()),
      message: parseHttpMessage(error),
    });
  }

  return new RpcException({
    code: status.INTERNAL,
    message: 'Internal server error',
  });
}

function isPrismaKnownRequestError(
  error: unknown,
): error is { code: string } {
  return (
    !!error &&
    typeof error === 'object' &&
    typeof (error as { code?: unknown }).code === 'string' &&
    (error as { code: string }).code.startsWith('P')
  );
}

export async function runGrpc<T>(handler: () => Promise<T>): Promise<T> {
  try {
    return await handler();
  } catch (error) {
    throw toRpcException(error);
  }
}

function mapPrismaCode(code: string): status {
  if (code === 'P2002') return status.ALREADY_EXISTS;
  if (code === 'P2025') return status.NOT_FOUND;
  if (code === 'P2003') return status.INVALID_ARGUMENT;
  return status.INTERNAL;
}

function mapPrismaMessage(code: string): string {
  if (code === 'P2002') return 'Resource already exists';
  if (code === 'P2025') return 'Resource not found';
  if (code === 'P2003') return 'Invalid reference data';
  return 'Internal server error';
}

function mapHttpStatus(httpStatus: number): status {
  if (httpStatus === HttpStatus.BAD_REQUEST) return status.INVALID_ARGUMENT;
  if (httpStatus === HttpStatus.UNAUTHORIZED) return status.UNAUTHENTICATED;
  if (httpStatus === HttpStatus.FORBIDDEN) return status.PERMISSION_DENIED;
  if (httpStatus === HttpStatus.NOT_FOUND) return status.NOT_FOUND;
  if (httpStatus === HttpStatus.CONFLICT) return status.ALREADY_EXISTS;
  if (httpStatus === HttpStatus.TOO_MANY_REQUESTS) return status.RESOURCE_EXHAUSTED;
  return status.INTERNAL;
}

function parseHttpMessage(error: HttpException): string {
  const response = error.getResponse();

  if (typeof response === 'string') {
    return response;
  }

  if (response && typeof response === 'object') {
    const message = (response as { message?: string | string[] }).message;
    if (Array.isArray(message)) {
      return message.join(', ');
    }
    if (message) {
      return message;
    }
  }

  return error.message || 'Request failed';
}
