import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth/auth-context";
import { mlKeys } from "../../constants/ml.keys";
import { getModelVersions } from "../../service/ml.service";
import type { ModelVersion } from "../../types/ml.types";

interface UseGetModelVersionsProps {
  modelId: string;
}

export function useGetModelVersions({ modelId }: UseGetModelVersionsProps) {
  const { isAuthenticated, accessToken } = useAuth();

  const {
    data: versions,
    isLoading,
    error,
  } = useQuery<ModelVersion[]>({
    queryKey: mlKeys.modelVersions(modelId),
    queryFn: () => getModelVersions(modelId),
    enabled: isAuthenticated && !!accessToken && !!modelId?.trim(),
  });

  return { versions, isLoading, error };
}
