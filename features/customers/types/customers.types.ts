import type { CustomerListItem } from "@/types/api";

export interface Customer360Data {
  customer?: Record<string, unknown>;
  profile?: Record<string, unknown>;
  credit?: Record<string, unknown>;
  risk?: Record<string, unknown>;
  [key: string]: unknown;
}

/** Single customer as returned by GET /api/v1/customers/search/ */
export interface CustomerSearchItem {
  customer_id: string;
  full_name: string;
  phone_number?: string | null;
  email?: string | null;
  id_number?: string | null;
  date_of_birth?: string | null;
  gender?: string | null;
  marital_status?: string | null;
  monthly_income?: number | null;
  monthly_expenses?: number | null;
  monthly_debt?: number | null;
  savings_balance?: number | null;
  credit_score?: number | null;
  credit_limit?: number | null;
  credit_used?: number | null;
  credit_utilization?: number | null;
  employment_status?: string | null;
  employer_name?: string | null;
  employment_sector?: string | null;
  job_title?: string | null;
  employment_years?: number | null;
  current_job_months?: number | null;
  city?: string | null;
  region?: string | null;
  subcity?: string | null;
  woreda?: string | null;
  kebele?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

/** Raw response from gateway GET /api/v1/customers/search/ */
export interface CustomerSearchApiResponse {
  success: boolean;
  customers: CustomerSearchItem[];
  total: number;
  limit: number;
  offset: number;
  pagination?: {
    limit: number;
    offset: number;
    total: number;
    has_more: boolean;
  };
  correlation_id?: string;
  search_metadata?: {
    query: string;
    filters_applied?: Record<string, unknown>;
  };
}

export interface SearchCustomersParams {
  query: string;
  limit?: number;
  offset?: number;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

export interface SearchCustomersResult {
  results: CustomerSearchItem[];
  total: number;
  limit: number;
  offset: number;
}
