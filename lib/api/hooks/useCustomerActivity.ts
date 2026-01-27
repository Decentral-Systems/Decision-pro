/**
 * React Hook for Customer Activity
 * Fetches customer activity log data
 */

import { useQuery } from "@tanstack/react-query";
import { apiGatewayClient } from "@/lib/api/clients/api-gateway";

interface ActivityFilters {
  activityType?: string;
  search?: string;
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
}

interface CustomerActivity {
  id: string;
  timestamp: string;
  type: string;
  action: string;
  description?: string;
  user_id?: string;
  ip_address?: string;
  status?: "success" | "error" | "pending";
  metadata?: Record<string, any>;
}

interface CustomerActivityResponse {
  activities: CustomerActivity[];
  total: number;
  page: number;
  limit: number;
}

export function useCustomerActivity(
  customerId: string,
  filters: ActivityFilters = {}
) {
  return useQuery<CustomerActivityResponse>({
    queryKey: ["customer-activity", customerId, filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.activityType) params.append("activity_type", filters.activityType);
      if (filters.search) params.append("search", filters.search);
      if (filters.page) params.append("page", String(filters.page));
      if (filters.limit) params.append("limit", String(filters.limit));
      if (filters.startDate) params.append("start_date", filters.startDate);
      if (filters.endDate) params.append("end_date", filters.endDate);

      const response = await apiGatewayClient.get(
        `/api/customers/${customerId}/activity?${params.toString()}`
      );

      return response.data || { activities: [], total: 0, page: 1, limit: 50 };
    },
    enabled: !!customerId,
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: true,
  });
}
