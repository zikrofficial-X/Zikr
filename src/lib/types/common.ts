export type SearchResult<T extends string = string, D = unknown> = {
  type: T;
  id: string;
  title: string;
  description: string;
  data: D;
};

export type PaginationMeta = {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

export class ServiceError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number,
  ) {
    super(message);
    this.name = 'ServiceError';
  }
}

export type ApiResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
};