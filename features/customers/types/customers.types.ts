import type { CustomerListItem } from "@/types/api";

export interface Customer360Data {
  customer?: Record<string, unknown>;
  profile?: Record<string, unknown>;
  credit?: Record<string, unknown>;
  risk?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface SearchCustomersParams {
  query: string;
  limit?: number;
  offset?: number;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  /** Optional: pass token for API route auth (avoids cookie issues) */
  accessToken?: string | null;
}

export interface SearchCustomersResult {
  results: CustomerListItem[];
  total: number;
  limit: number;
  offset: number;
}
