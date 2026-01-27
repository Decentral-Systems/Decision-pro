/**
 * API request and response types
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  correlation_id?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

export interface CustomerListItem {
  customer_id: string;
  full_name: string;
  email?: string;
  phone_number?: string;
  region?: string;
  risk_score?: number;
  credit_score?: number;
  status?: string;
  created_at?: string;
  last_updated?: string;
}

export interface CustomersListResponse extends PaginatedResponse<CustomerListItem> {}

export interface ApiError {
  detail: string;
  status_code: number;
  correlation_id?: string;
}

export class APIServiceError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public correlationId?: string
  ) {
    super(message);
    this.name = "APIServiceError";
  }
}

export class APITimeoutError extends Error {
  constructor(message: string = "Request timeout") {
    super(message);
    this.name = "APITimeoutError";
  }
}

export class APINetworkError extends Error {
  constructor(message: string = "Network error") {
    super(message);
    this.name = "APINetworkError";
  }
}

