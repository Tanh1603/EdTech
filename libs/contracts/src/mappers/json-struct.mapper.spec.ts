import {
  fromProtoStruct,
  toProtoStruct,
  unwrapPageResponse,
} from './json-struct.mapper';

describe('json-struct.mapper', () => {
  it('round trips JSON values through protobuf Struct shape', () => {
    const value = {
      title: 'Session',
      count: 2,
      items: ['a', 'b'],
      nested: { ok: true },
      optional: null,
    };

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
