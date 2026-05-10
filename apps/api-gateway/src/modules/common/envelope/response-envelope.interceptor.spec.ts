import { of } from 'rxjs';
import { ResponseEnvelopeInterceptor } from './response-envelope.interceptor';

describe('ResponseEnvelopeInterceptor', () => {
  it('wraps paginated payloads in the public envelope', (done) => {
    const interceptor = new ResponseEnvelopeInterceptor();
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({ requestId: 'req_1' }),
      }),
    } as any;
    const next = {
      handle: () =>
        of({
          items: [{ id: '1' }],
          pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
        }),
    };

    interceptor.intercept(context, next).subscribe((result: any) => {
      expect(result.success).toBe(true);
      expect(result.data).toEqual([{ id: '1' }]);
      expect(result.meta.requestId).toBe('req_1');
      expect(result.meta.pagination.total).toBe(1);
      expect(result.error).toBeNull();
      done();
    });
  });
});
