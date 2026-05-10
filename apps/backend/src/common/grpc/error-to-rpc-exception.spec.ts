import { status } from '@grpc/grpc-js';
import { NotFoundException } from '@nestjs/common';
import { toRpcException } from './error-to-rpc-exception';

describe('toRpcException', () => {
  it('maps not found HTTP errors to gRPC NOT_FOUND', () => {
    const exception = toRpcException(new NotFoundException('Missing'));
    const error = exception.getError() as { code: number; message: string };

    expect(error.code).toBe(status.NOT_FOUND);
    expect(error.message).toBe('Missing');
  });
});
