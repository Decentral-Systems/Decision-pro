import type { Customer360Data } from "../types/customers.types";

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
