export const customersKeys = {
  customer360: (customerId: string) => ["customer360", customerId],
  search: (query: string, params?: { limit?: number; offset?: number }) =>
    ["customers", "search", query, params?.limit, params?.offset],
} as const;
