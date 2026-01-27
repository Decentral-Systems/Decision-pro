/**
 * React Query hooks for Customer Documents
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { networkAwareRetry, networkAwareRetryDelay } from "@/lib/utils/networkAwareRetry";
import { apiGatewayClient } from "../clients/api-gateway";
import { useAuth } from "@/lib/auth/auth-context";
import { useToast } from "@/hooks/use-toast";

export interface DocumentFilter {
  category?: string;
  type?: string;
  from_date?: string;
  to_date?: string;
}

export interface CustomerDocument {
  id: string;
  customer_id: string;
  name: string;
  file_name: string;
  file_type: string;
  file_size: number;
  category: string;
  document_type: string;
  upload_date: string;
  uploaded_by?: string;
  uploaded_by_name?: string;
  status: string;
  url?: string;
  description?: string;
  expiry_date?: string;
  metadata?: Record<string, any>;
}

export function useCustomerDocuments(
  customerId: string | undefined | null,
  filters?: DocumentFilter
) {
  const { isAuthenticated } = useAuth();

  return useQuery<CustomerDocument[]>({
    queryKey: ["customer-documents", customerId, filters],
    queryFn: async () => {
      if (!customerId) {
        return [];
      }
      try {
        const data = await apiGatewayClient.getCustomerDocuments(customerId, filters);
        return data?.documents || data?.items || (Array.isArray(data) ? data : []);
      } catch (error: any) {
        console.error("Failed to fetch customer documents:", error);
        if (error?.statusCode === 404 || error?.response?.status === 404) {
          return [];
        }
        throw error;
      }
    },
    enabled: isAuthenticated && !!customerId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: networkAwareRetry,
    retryDelay: networkAwareRetryDelay,
  });
}

export function useUploadDocument() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      customerId,
      file,
      category,
      documentType,
      description,
    }: {
      customerId: string;
      file: File;
      category: string;
      documentType: string;
      description?: string;
    }) => {
      return await apiGatewayClient.uploadCustomerDocument(customerId, file, {
        category,
        document_type: documentType,
        description,
      });
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["customer-documents", variables.customerId] });
      toast({
        title: "Document Uploaded",
        description: "Document has been uploaded successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload document",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ customerId, documentId }: { customerId: string; documentId: string }) => {
      return await apiGatewayClient.deleteCustomerDocument(customerId, documentId);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["customer-documents", variables.customerId] });
      toast({
        title: "Document Deleted",
        description: "Document has been deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete document",
        variant: "destructive",
      });
    },
  });
}

