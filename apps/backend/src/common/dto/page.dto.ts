import { ApiPagination } from "../types/api-envelope.type";

export class PageDto<T> {
  items: T[];
  meta: ApiPagination;
}
