import { toGrpcPage } from './page.mapper';

describe('toGrpcPage', () => {
  it('maps PageDto into protobuf pagination shape', () => {
    const result = toGrpcPage(
      {
        items: [{ id: '1' }, { id: '2' }],
        meta: {
          page: 2,
          limit: 10,
          total: 25,
          totalPages: 3,
        },
      },
      (item) => ({ value: item.id }),
    );

    expect(result).toEqual({
      items: [{ value: '1' }, { value: '2' }],
      pagination: {
        page: 2,
        limit: 10,
        total: 25,
        totalPages: 3,
      },
    });
  });
});
