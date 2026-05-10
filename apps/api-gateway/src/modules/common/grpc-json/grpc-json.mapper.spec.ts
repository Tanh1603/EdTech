import { fromProtoStruct, toProtoStruct, unwrapPageResponse } from './grpc-json.mapper';

describe('grpc-json.mapper', () => {
  it('round trips JSON values through protobuf Struct shape', () => {
    const value = { title: 'Session', count: 2, items: ['a', 'b'] };

    expect(fromProtoStruct(toProtoStruct(value))).toEqual(value);
  });

  it('unwraps paginated Struct responses', () => {
    const response = {
      items: [toProtoStruct({ id: '1' })],
      pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
    };

    expect(unwrapPageResponse(response)).toEqual({
      items: [{ id: '1' }],
      pagination: response.pagination,
    });
  });
});
