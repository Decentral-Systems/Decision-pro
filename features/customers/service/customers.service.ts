import type {
  Customer360Data,
  SearchCustomersParams,
  SearchCustomersResult,
} from "../types/customers.types";

export async function searchCustomers(
  params: SearchCustomersParams
): Promise<SearchCustomersResult> {
  const { query, limit = 20, offset = 0, sort_by = "created_at", sort_order = "desc", accessToken } = params;
  const searchParams = new URLSearchParams();
  if (query.trim()) searchParams.set("query", query.trim());
  searchParams.set("limit", String(limit));
  searchParams.set("offset", String(offset));
  searchParams.set("sort_by", sort_by);
  searchParams.set("sort_order", sort_order);

  const headers: HeadersInit = { Accept: "application/json" };
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const res = await fetch(`/api/customers/search?${searchParams.toString()}`, {
    method: "GET",
    headers,
    credentials: "include",
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const message =
      typeof body?.error === "string"
        ? body.error
        : res.statusText || "Failed to search customers";
    throw new Error(message);
  }

  const data = await res.json();
  const results = Array.isArray(data?.results) ? data.results : [];
  return {
    results,
    total: typeof data?.total === "number" ? data.total : results.length,
    limit: typeof data?.limit === "number" ? data.limit : limit,
    offset: typeof data?.offset === "number" ? data.offset : offset,
  };
}

export async function getCustomer360(
  customerId: string
): Promise<Customer360Data | null> {
  const id = encodeURIComponent(customerId.trim());
  const res = await fetch(`/api/customers/${id}/360`, {
    method: "GET",
    headers: { Accept: "application/json" },
    credentials: "include",
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const message =
      typeof body?.error === "string"
        ? body.error
        : res.statusText || "Failed to fetch customer 360";
    throw new Error(message);
  }

  const data = await res.json();
  return data as Customer360Data | null;
}
