"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useFeatureImportance } from "@/lib/api/hooks/useFeatureImportance";
import { FeatureImportanceChart } from "@/components/charts/FeatureImportanceChart";
import { FeatureImportanceComparisonChart } from "@/components/charts/FeatureImportanceComparisonChart";
import { TrendingUp, Search } from "lucide-react";
import { useState, useMemo } from "react";
import { EmptyState } from "@/components/common/EmptyState";
import type { MLPerformanceMetrics } from "@/types/dashboard";

const MODEL_NAMES = [
  "ensemble",
  "xgboost",
  "lightgbm",
  "neural_network",
  "lstm",
  "transformer",
  "meta_learner",
];

interface FeatureImportanceWidgetProps {
  executiveMLData?: MLPerformanceMetrics;
}

export function FeatureImportanceWidget({ executiveMLData }: FeatureImportanceWidgetProps = {}) {
  const [selectedModel, setSelectedModel] = useState<string | undefined>(undefined);
  const [topN, setTopN] = useState<number>(20);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const { data: importanceData, isLoading, refetch } = useFeatureImportance(selectedModel, topN);
  
  // Use API data only - no fallback
  const finalImportanceData = importanceData as any;

  const filteredGlobalImportance = useMemo(() => {
    if (!finalImportanceData?.global_importance) return [];
    let filtered = finalImportanceData.global_importance;
    if (searchQuery) {
      filtered = filtered.filter((item: { feature_name?: string; feature?: string; importance?: number; importance_score?: number }) =>
        (item.feature_name || item.feature || "").toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return filtered;
  }, [finalImportanceData, searchQuery]);

  const comparisonData = useMemo(() => {
    if (!finalImportanceData?.model_importance || Object.keys(finalImportanceData.model_importance).length === 0) {
      // If no model_importance, try to create from global_importance
      if (finalImportanceData?.global_importance) {
        return finalImportanceData.global_importance.slice(0, 15).map((item: any) => ({
          feature_name: item.feature_name || item.feature,
          ensemble: item.importance || item.importance_score || 0
        }));
      }
      return [];
    }
    const features = Object.keys(finalImportanceData.model_importance).flatMap((model) =>
      finalImportanceData.model_importance[model].map((item: { feature_name: string; importance_score?: number }) => item.feature_name)
    );
    const uniqueFeatures = [...new Set(features)].slice(0, 15);

    return uniqueFeatures.map((feature) => {
      const result: any = { feature_name: feature };
      Object.keys(finalImportanceData.model_importance).forEach((model) => {
        const item = finalImportanceData.model_importance[model].find(
          (f: { feature_name: string; importance_score?: number }) => f.feature_name === feature
        );
        result[model] = item?.importance_score || 0;
      });
      return result;
    });
  }, [finalImportanceData]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Feature Importance
          </CardTitle>
          <CardDescription>Global and model-specific feature importance analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!finalImportanceData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Feature Importance
          </CardTitle>
          <CardDescription>Global and model-specific feature importance analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            title="No feature importance data available"
            description="Feature importance data is not available. Please check your data sources or try again."
            icon={<TrendingUp className="h-8 w-8 text-muted-foreground" />}
            action={{
              label: "Retry",
              onClick: () => refetch()
            }}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Feature Importance
        </CardTitle>
        <CardDescription>Global and model-specific feature importance analysis</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="global" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="global">Global Importance</TabsTrigger>
            <TabsTrigger value="comparison">Model Comparison</TabsTrigger>
          </TabsList>

          <TabsContent value="global" className="space-y-4 mt-4">
            <div className="flex gap-4 items-center">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search features..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select
                value={topN.toString()}
                onValueChange={(value) => setTopN(parseInt(value))}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">Top 10</SelectItem>
                  <SelectItem value="20">Top 20</SelectItem>
                  <SelectItem value="30">Top 30</SelectItem>
                  <SelectItem value="50">Top 50</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={selectedModel || "all"}
                onValueChange={(value) => setSelectedModel(value === "all" ? undefined : value)}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Models</SelectItem>
                  {MODEL_NAMES.map((model) => (
                    <SelectItem key={model} value={model}>
                      {model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {filteredGlobalImportance.length > 0 ? (
              <FeatureImportanceChart
                data={filteredGlobalImportance.map((item: { feature_name: string; importance_score?: number; rank?: number }) => ({
                  feature_name: item.feature_name,
                  importance_score: item.importance_score,
                  rank: item.rank,
                }))}
                maxItems={topN}
              />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No features found matching your search
              </div>
            )}

            {(finalImportanceData as any)?.shap_values && (finalImportanceData as any).shap_values.length > 0 && (
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-2">SHAP Values Available</h4>
                <p className="text-sm text-muted-foreground">
                  {(finalImportanceData as any).shap_values.length} features have SHAP-based importance scores
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="comparison" className="space-y-4 mt-4">
            {(finalImportanceData as any)?.model_importance && Object.keys((finalImportanceData as any).model_importance).length > 0 ? (
              <FeatureImportanceComparisonChart
                data={comparisonData}
                models={Object.keys((finalImportanceData as any).model_importance)}
                maxItems={15}
              />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No model comparison data available
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

