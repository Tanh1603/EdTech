import { ApiPagination } from './api-envelope.type';

export class PageDto<T> {
  items!: T[];
  meta!: ApiPagination;
}
