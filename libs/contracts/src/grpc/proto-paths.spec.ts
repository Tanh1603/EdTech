import { loadSync } from '@grpc/proto-loader';
import { getAllProtoPaths, getProtoRoot } from './proto-paths';

describe('proto paths', () => {
  it('loads all configured proto files', () => {
    expect(() =>
      loadSync(getAllProtoPaths(), {
        includeDirs: [getProtoRoot()],
        keepCase: false,
      }),
    ).not.toThrow();
  });
});
