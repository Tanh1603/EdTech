import { status } from '@grpc/grpc-js';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { GrpcExceptionFilter, toRpcException } from './grpc-exception.filter';

describe('GrpcExceptionFilter', () => {
  it.each([
    [new BadRequestException('Bad'), status.INVALID_ARGUMENT, 'Bad'],
    [new ForbiddenException('No'), status.PERMISSION_DENIED, 'No'],
    [new NotFoundException('Missing'), status.NOT_FOUND, 'Missing'],
    [{ code: 'P2002' }, status.ALREADY_EXISTS, 'Resource already exists'],
    [{ code: 'P2025' }, status.NOT_FOUND, 'Resource not found'],
    [{ code: 'P2003' }, status.INVALID_ARGUMENT, 'Invalid reference data'],
    [new Error('boom'), status.INTERNAL, 'Internal server error'],
  ])('maps %p to gRPC error', (input, code, message) => {
    const error = toRpcException(input).getError() as {
      code: number;
      message: string;
    };

    expect(error).toEqual({ code, message });
  });

  it('emits the mapped gRPC error', async () => {
    const filter = new GrpcExceptionFilter();

    await expect(
      firstValueFrom(filter.catch(new NotFoundException('Missing'), {} as any)),
    ).rejects.toEqual({ code: status.NOT_FOUND, message: 'Missing' });
  });
});
