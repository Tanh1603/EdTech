export interface ApiError {
  code: string;
  message: string;
  details?: string[];
}

export interface ApiPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiMeta {
  requestId: string;
  timestamp: string;
  pagination?: ApiPagination;
}

export interface ApiEnvelope<T> {
  success: boolean;
  data: T | null;
  meta: ApiMeta;
  error: ApiError | null;
}
