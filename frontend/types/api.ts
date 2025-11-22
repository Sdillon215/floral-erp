export interface ApiResponse<T> {
  data: T;
}

export interface ApiError {
  detail: string;
}

export interface PaginationParams {
  skip?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total?: number;
  skip?: number;
  limit?: number;
}

