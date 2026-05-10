import { PageDto } from '../dto/page.dto';

export function toGrpcPage<T, R>(
  page: PageDto<T>,
  mapper: (item: T) => R,
): { items: R[]; pagination: { page: number; limit: number; total: number; totalPages: number } } {
  return {
    items: page.items.map(mapper),
    pagination: {
      page: page.meta.page,
      limit: page.meta.limit,
      total: page.meta.total,
      totalPages: page.meta.totalPages,
    },
  };
}
