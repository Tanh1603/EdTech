import { status } from '@grpc/grpc-js';
import {
  grpcCodeToErrorCode,
  grpcCodeToHttpStatus,
} from './grpc-status.mapper';

describe('grpc status mapper', () => {
  it('maps NOT_FOUND to HTTP 404 and resource error code', () => {
    expect(grpcCodeToHttpStatus(status.NOT_FOUND)).toBe(404);
    expect(grpcCodeToErrorCode(status.NOT_FOUND)).toBe('RESOURCE_NOT_FOUND');
  });
});
